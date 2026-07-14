import { Databases, Query, ID } from "node-appwrite";
import { createAdminClient, createSessionClient } from "./appwrite";

const databaseId = "ghost_mode";

function mapPrismaToAppwrite(doc: any) {
  if (!doc) return null;
  const mapped = { ...doc, id: doc.$id };

  // Map Appwrite relation properties (which are arrays or nested objects) to Prisma format
  for (const [key, val] of Object.entries(mapped)) {
    if (val && typeof val === "object") {
      if (Array.isArray(val)) {
        mapped[key] = val.map(mapPrismaToAppwrite);
      } else if ("$id" in val) {
        mapped[key] = mapPrismaToAppwrite(val);
      }
    }
  }

  // Map relationship documents back to foreign key IDs as expected by Prisma code
  if (doc.user) {
    mapped.userId = typeof doc.user === "object" ? doc.user.$id : doc.user;
  }
  if (doc.goal) {
    mapped.goalId = typeof doc.goal === "object" ? doc.goal.$id : doc.goal;
  }
  if (doc.mission) {
    mapped.missionId = typeof doc.mission === "object" ? doc.mission.$id : doc.mission;
  }
  if (doc.primaryTask) {
    mapped.primaryTaskId = typeof doc.primaryTask === "object" ? doc.primaryTask.$id : doc.primaryTask;
  }

  // Map createdAt / updatedAt datetimes
  if (doc.$createdAt) mapped.createdAt = new Date(doc.$createdAt);
  if (doc.$updatedAt) mapped.updatedAt = new Date(doc.$updatedAt);

  return mapped;
}

class CollectionAdapter {
  constructor(private collectionId: string) {}

  private getDB() {
    if (process.env.APPWRITE_API_KEY) {
      return createAdminClient().databases;
    }
    // Fallback: If the API key is missing in production environment variables,
    // use the user's browser session cookie to authenticate the Appwrite SDK.
    return createSessionClient().databases;
  }

  private mapWhere(where: any): string[] {
    const queries: string[] = [];
    if (!where) return queries;

    for (const [key, val] of Object.entries(where)) {
      if (val === undefined) continue;

      let queryKey = key;
      if (key === "id") queryKey = "$id";
      else if (key === "userId") queryKey = "user";
      else if (key === "goalId") queryKey = "goal";
      else if (key === "missionId") queryKey = "mission";
      else if (key === "primaryTaskId") queryKey = "primaryTask";

      if (val && typeof val === "object" && !(val instanceof Date)) {
        // Range operations
        for (const [op, opVal] of Object.entries(val)) {
          const formattedVal = opVal instanceof Date ? opVal.toISOString() : opVal;
          if (op === "gte") {
            queries.push(Query.greaterThanEqual(queryKey, formattedVal as any));
          } else if (op === "lte") {
            queries.push(Query.lessThanEqual(queryKey, formattedVal as any));
          } else if (op === "gt") {
            queries.push(Query.greaterThan(queryKey, formattedVal as any));
          } else if (op === "lt") {
            queries.push(Query.lessThan(queryKey, formattedVal as any));
          } else if (op === "not") {
            queries.push(Query.notEqual(queryKey, formattedVal as any));
          }
        }
      } else {
        // Equality operation
        const formattedVal = val instanceof Date ? val.toISOString() : val;
        queries.push(Query.equal(queryKey, formattedVal as any));
      }
    }
    return queries;
  }

  private mapOrderBy(orderBy: any): string[] {
    const queries: string[] = [];
    if (!orderBy) return queries;

    const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
    for (const entry of entries) {
      for (const [key, val] of Object.entries(entry)) {
        const queryKey = key === "createdAt" ? "$createdAt" : key === "updatedAt" ? "$updatedAt" : key;
        if (val === "desc") {
          queries.push(Query.orderDesc(queryKey));
        } else {
          queries.push(Query.orderAsc(queryKey));
        }
      }
    }
    return queries;
  }

  async findUnique(args: { where: any; select?: any; include?: any }) {
    const queries = this.mapWhere(args.where);
    const res = await this.getDB().listDocuments(databaseId, this.collectionId, [
      ...queries,
      Query.limit(1)
    ]);
    if (res.documents.length === 0) return null;
    return mapPrismaToAppwrite(res.documents[0]);
  }

  async findFirst(args: { where?: any; orderBy?: any; select?: any; include?: any }) {
    const queries = [
      ...this.mapWhere(args?.where),
      ...this.mapOrderBy(args?.orderBy),
      Query.limit(1)
    ];
    const res = await this.getDB().listDocuments(databaseId, this.collectionId, queries);
    if (res.documents.length === 0) return null;
    return mapPrismaToAppwrite(res.documents[0]);
  }

  async findMany(args?: { where?: any; orderBy?: any; take?: number; skip?: number; select?: any; include?: any }) {
    const queries = [
      ...(args?.where ? this.mapWhere(args.where) : []),
      ...(args?.orderBy ? this.mapOrderBy(args.orderBy) : []),
    ];
    if (args?.take !== undefined) {
      queries.push(Query.limit(args.take));
    } else {
      queries.push(Query.limit(1000)); // Default high limit to fetch all documents
    }
    if (args?.skip !== undefined) {
      queries.push(Query.offset(args.skip));
    }
    const res = await this.getDB().listDocuments(databaseId, this.collectionId, queries);
    return res.documents.map(mapPrismaToAppwrite);
  }

  async create(args: { data: any; select?: any; include?: any }) {
    const db = this.getDB();
    const data = { ...args.data };

    // Map foreign key IDs to relationship names
    if (data.userId !== undefined) { data.user = data.userId; delete data.userId; }
    if (data.goalId !== undefined) { data.goal = data.goalId; delete data.goalId; }
    if (data.missionId !== undefined) { data.mission = data.missionId; delete data.missionId; }
    if (data.primaryTaskId !== undefined) { data.primaryTask = data.primaryTaskId; delete data.primaryTaskId; }

    // Resolve nested create relations recursively
    for (const [key, val] of Object.entries(data)) {
      if (val && typeof val === "object" && !(val instanceof Date)) {
        if ("create" in val) {
          const relationCollection = key.charAt(0).toUpperCase() + key.slice(1, -1) + (key.endsWith('s') ? '' : 's');
          // Actually, let's derive collection name by singularizing: primaryTasks -> PrimaryTask
          const singularKey = key.endsWith('s') ? key.slice(0, -1) : key;
          const relationCollectionName = singularKey.charAt(0).toUpperCase() + singularKey.slice(1);
          
          if (Array.isArray((val as any).create)) {
            const ids = [];
            for (const item of (val as any).create) {
              const relatedDoc = await new CollectionAdapter(relationCollectionName).create({ data: item });
              ids.push(relatedDoc.id);
            }
            data[key] = ids;
          } else {
            const relatedDoc = await new CollectionAdapter(relationCollectionName).create({ data: (val as any).create });
            data[key] = relatedDoc.id;
          }
        } else if ("connect" in val) {
          data[key] = (val as any).connect.id;
        } else {
          data[key] = JSON.stringify(val);
        }
      } else if (val instanceof Date) {
        data[key] = val.toISOString();
      }
    }

    const docId = data.id || ID.unique();
    delete data.id;

    const res = await db.createDocument(databaseId, this.collectionId, docId, data);
    return mapPrismaToAppwrite(res);
  }

  async createMany(args: { data: any[] }) {
    let count = 0;
    for (const item of args.data) {
      await this.create({ data: item });
      count++;
    }
    return { count };
  }

  async update(args: { where: any; data: any; select?: any; include?: any }) {
    const db = this.getDB();
    const queries = this.mapWhere(args.where);
    const listRes = await db.listDocuments(databaseId, this.collectionId, [
      ...queries,
      Query.limit(1)
    ]);
    if (listRes.documents.length === 0) {
      throw new Error(`Record to update not found in ${this.collectionId}`);
    }
    const doc = listRes.documents[0];
    const updateData = { ...args.data };

    // Map foreign key IDs to relationship names
    if (updateData.userId !== undefined) { updateData.user = updateData.userId; delete updateData.userId; }
    if (updateData.goalId !== undefined) { updateData.goal = updateData.goalId; delete updateData.goalId; }
    if (updateData.missionId !== undefined) { updateData.mission = updateData.missionId; delete updateData.missionId; }
    if (updateData.primaryTaskId !== undefined) { updateData.primaryTask = updateData.primaryTaskId; delete updateData.primaryTaskId; }

    for (const [key, val] of Object.entries(updateData)) {
      if (val && typeof val === "object" && !(val instanceof Date)) {
        if ("increment" in val) {
          updateData[key] = (doc[key] || 0) + (val as any).increment;
        } else if ("decrement" in val) {
          updateData[key] = (doc[key] || 0) - (val as any).decrement;
        } else if ("connect" in val) {
          updateData[key] = (val as any).connect.id;
        } else {
          updateData[key] = JSON.stringify(val);
        }
      } else if (val instanceof Date) {
        updateData[key] = val.toISOString();
      }
    }

    const res = await db.updateDocument(databaseId, this.collectionId, doc.$id, updateData);
    return mapPrismaToAppwrite(res);
  }

  async upsert(args: { where: any; create: any; update: any; select?: any; include?: any }) {
    const existing = await this.findUnique({ where: args.where });
    if (existing) {
      if (Object.keys(args.update).length > 0) {
        return this.update({ where: args.where, data: args.update });
      }
      return existing;
    } else {
      const createData = { ...args.create };
      if (args.where.id) createData.id = args.where.id;
      if (args.where.userId) createData.userId = args.where.userId;
      if (args.where.email) createData.email = args.where.email;
      return this.create({ data: createData });
    }
  }

  async delete(args: { where: any; select?: any; include?: any }) {
    const db = this.getDB();
    const queries = this.mapWhere(args.where);
    const listRes = await db.listDocuments(databaseId, this.collectionId, [
      ...queries,
      Query.limit(1)
    ]);
    if (listRes.documents.length === 0) {
      throw new Error(`Record to delete not found in ${this.collectionId}`);
    }
    const doc = listRes.documents[0];
    await db.deleteDocument(databaseId, this.collectionId, doc.$id);
    return mapPrismaToAppwrite(doc);
  }

  async deleteMany(args: { where: any }) {
    const db = this.getDB();
    const documents = await this.findMany({ where: args.where });
    let count = 0;
    for (const doc of documents) {
      await db.deleteDocument(databaseId, this.collectionId, doc.id);
      count++;
    }
    return { count };
  }

  async count(args?: { where?: any }) {
    const queries = args?.where ? this.mapWhere(args.where) : [];
    const res = await this.getDB().listDocuments(databaseId, this.collectionId, [
      ...queries,
      Query.limit(1)
    ]);
    return res.total;
  }

  async groupBy(args: { by: string[]; where?: any }) {
    const documents = await this.findMany({ where: args.where });
    const groups: { [key: string]: number } = {};
    for (const doc of documents) {
      const key = doc.goalId || (doc.goal ? doc.goal.id : "");
      if (key) {
        groups[key] = (groups[key] || 0) + 1;
      }
    }
    return Object.entries(groups).map(([key, count]) => ({
      [args.by[0]]: key,
      _count: count,
    }));
  }
}

export const prisma = {
  user: new CollectionAdapter("User"),
  streak: new CollectionAdapter("Streak"),
  goal: new CollectionAdapter("Goal"),
  vow: new CollectionAdapter("Vow"),
  interviewResponse: new CollectionAdapter("InterviewResponse"),
  roadmap: new CollectionAdapter("Roadmap"),
  mission: new CollectionAdapter("Mission"),
  primaryTask: new CollectionAdapter("PrimaryTask"),
  secondaryTask: new CollectionAdapter("SecondaryTask"),
  proof: new CollectionAdapter("Proof"),
  notificationLog: new CollectionAdapter("NotificationLog"),
  pushSchedule: new CollectionAdapter("PushSchedule"),
  appSettings: new CollectionAdapter("AppSettings"),
  reflection: new CollectionAdapter("Reflection"),
  weeklyReview: new CollectionAdapter("WeeklyReview"),
  roleModel: new CollectionAdapter("RoleModel"),
  lead: new CollectionAdapter("Lead"),
  revenueLog: new CollectionAdapter("RevenueLog"),
};
