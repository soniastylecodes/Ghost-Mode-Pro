import dotenv from "dotenv";
import { Client, Databases, Permission, Role, RelationshipType, RelationMutate } from "node-appwrite";

// Load environment variables
dotenv.config();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = "ghost_mode";

console.log("Appwrite Config Debug -> Endpoint:", endpoint, "Project ID:", projectId);

if (!projectId || !apiKey) {
  console.error("Error: NEXT_PUBLIC_APPWRITE_PROJECT_ID and APPWRITE_API_KEY must be defined in your environment.");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 5, delayMs = 3000): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isTimeout = err?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' || err?.message === 'fetch failed';
      if (isTimeout && attempt < retries) {
        console.log(`\nNetwork timeout, retrying (${attempt}/${retries})...`);
        await sleep(delayMs * attempt);
      } else {
        throw err;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

async function waitForAttributes(collectionId: string, expectedKeys: string[]) {
  process.stdout.write(`Waiting for attributes in ${collectionId} to process...`);
  while (true) {
    try {
      const collection = await withRetry(() => databases.getCollection(databaseId, collectionId));
      const attributes = collection.attributes;
      const allAvailable = expectedKeys.every((key) => {
        const attr = attributes.find((a: any) => a.key === key);
        return attr && attr.status === "available";
      });
      if (allAvailable) {
        console.log(" Done!");
        break;
      }
    } catch (err) {
      console.error(`\nError checking attributes status in ${collectionId}:`, err);
    }
    process.stdout.write(".");
    await sleep(1000);
  }
}

async function safeCreateCollection(collectionId: string, name: string) {
  try {
    await databases.createCollection(
      databaseId,
      collectionId,
      name,
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );
    console.log(`Created collection: ${name} (${collectionId})`);
  } catch (err: any) {
    if (err.code === 409) {
      console.log(`Collection ${name} already exists. Skipping creation.`);
    } else {
      throw err;
    }
  }
}

async function main() {
  console.log("Starting Appwrite Database provisioning...");

  // 1. Create Database
  try {
    await databases.create(databaseId, "Ghost Mode Database");
    console.log(`Created database: ${databaseId}`);
  } catch (err: any) {
    if (err.code === 409) {
      console.log(`Database ${databaseId} already exists.`);
    } else {
      console.error("Failed to create database:", err);
      process.exit(1);
    }
  }

  // 2. Create Collections
  const collections = [
    { id: "User", name: "User" },
    { id: "Streak", name: "Streak" },
    { id: "Goal", name: "Goal" },
    { id: "Vow", name: "Vow" },
    { id: "InterviewResponse", name: "InterviewResponse" },
    { id: "Roadmap", name: "Roadmap" },
    { id: "Mission", name: "Mission" },
    { id: "PrimaryTask", name: "PrimaryTask" },
    { id: "SecondaryTask", name: "SecondaryTask" },
    { id: "Proof", name: "Proof" },
    { id: "NotificationLog", name: "NotificationLog" },
    { id: "PushSchedule", name: "PushSchedule" },
    { id: "AppSettings", name: "AppSettings" },
    { id: "Reflection", name: "Reflection" },
    { id: "WeeklyReview", name: "WeeklyReview" },
    { id: "RoleModel", name: "RoleModel" },
    { id: "Lead", name: "Lead" },
    { id: "RevenueLog", name: "RevenueLog" },
  ];

  for (const col of collections) {
    await safeCreateCollection(col.id, col.name);
  }

  // 3. Create Attributes for each collection
  console.log("\nCreating attributes...");

  const attributeOperations = [
    // --- User ---
    async () => {
      const keys = ["email", "name", "pushoverUserKey", "role", "notificationPreferences", "wakeTime", "sleepTime", "napWindows", "pushoverApiToken", "baseCurrency"];
      try {
        await databases.createStringAttribute(databaseId, "User", "email", 255, true);
        await databases.createStringAttribute(databaseId, "User", "name", 255, false);
        await databases.createStringAttribute(databaseId, "User", "pushoverUserKey", 255, false);
        await databases.createStringAttribute(databaseId, "User", "role", 50, false, "user");
        await databases.createStringAttribute(databaseId, "User", "notificationPreferences", 1000, false);
        await databases.createStringAttribute(databaseId, "User", "wakeTime", 50, false);
        await databases.createStringAttribute(databaseId, "User", "sleepTime", 50, false);
        await databases.createStringAttribute(databaseId, "User", "napWindows", 1000, false);
        await databases.createStringAttribute(databaseId, "User", "pushoverApiToken", 255, false);
        await databases.createStringAttribute(databaseId, "User", "baseCurrency", 10, false, "NGN");
        await waitForAttributes("User", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },

    // --- Streak ---
    async () => {
      const keys = ["current", "longest", "lastActiveDate", "totalFocusMinutes", "calendarDays"];
      try {
        await databases.createIntegerAttribute(databaseId, "Streak", "current", false, 0, undefined, 0);
        await databases.createIntegerAttribute(databaseId, "Streak", "longest", false, 0, undefined, 0);
        await databases.createDatetimeAttribute(databaseId, "Streak", "lastActiveDate", false);
        await databases.createIntegerAttribute(databaseId, "Streak", "totalFocusMinutes", false, 0, undefined, 0);
        await databases.createStringAttribute(databaseId, "Streak", "calendarDays", 2000, false);
        await waitForAttributes("Streak", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },

    // --- Goal ---
    async () => {
      const keys = ["title", "description", "deadline", "status", "statement", "targetNumber", "reason", "definitionOfSuccess", "outcomeThreads"];
      try {
        await databases.createStringAttribute(databaseId, "Goal", "title", 255, true);
        await databases.createStringAttribute(databaseId, "Goal", "description", 2000, false);
        await databases.createDatetimeAttribute(databaseId, "Goal", "deadline", true);
        await databases.createStringAttribute(databaseId, "Goal", "status", 50, false, "active");
        await databases.createStringAttribute(databaseId, "Goal", "statement", 2000, false);
        await databases.createFloatAttribute(databaseId, "Goal", "targetNumber", false);
        await databases.createStringAttribute(databaseId, "Goal", "reason", 2000, false);
        await databases.createStringAttribute(databaseId, "Goal", "definitionOfSuccess", 2000, false);
        await databases.createStringAttribute(databaseId, "Goal", "outcomeThreads", 2000, false);
        await waitForAttributes("Goal", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },

    // --- Vow ---
    async () => {
      const keys = ["missionStatement", "whyItMatters"];
      try {
        await databases.createStringAttribute(databaseId, "Vow", "missionStatement", 4096, true);
        await databases.createStringAttribute(databaseId, "Vow", "whyItMatters", 4096, true);
        await waitForAttributes("Vow", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },

    // --- InterviewResponse ---
    async () => {
      const keys = ["income", "skills", "hoursAvailable", "commitments", "distractions"];
      try {
        await databases.createStringAttribute(databaseId, "InterviewResponse", "income", 2048, true);
        await databases.createStringAttribute(databaseId, "InterviewResponse", "skills", 2048, true);
        await databases.createFloatAttribute(databaseId, "InterviewResponse", "hoursAvailable", true);
        await databases.createStringAttribute(databaseId, "InterviewResponse", "commitments", 2048, true);
        await databases.createStringAttribute(databaseId, "InterviewResponse", "distractions", 2048, true);
        await waitForAttributes("InterviewResponse", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },

    // --- Roadmap ---
    async () => {
      const keys = ["phases", "currentPhase", "rawPlan"];
      try {
        await databases.createStringAttribute(databaseId, "Roadmap", "phases", 2000, true);
        await databases.createIntegerAttribute(databaseId, "Roadmap", "currentPhase", false, 0, undefined, 0);
        await databases.createStringAttribute(databaseId, "Roadmap", "rawPlan", 2000, false);
        await waitForAttributes("Roadmap", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },

    // --- Mission ---
    async () => {
      const keys = ["date", "phaseIndex", "status", "summary", "deadline"];
      try {
        await databases.createDatetimeAttribute(databaseId, "Mission", "date", true);
        await databases.createIntegerAttribute(databaseId, "Mission", "phaseIndex", false, 0, undefined, 0);
        await databases.createStringAttribute(databaseId, "Mission", "status", 50, false, "active");
        await databases.createStringAttribute(databaseId, "Mission", "summary", 4096, false);
        await databases.createDatetimeAttribute(databaseId, "Mission", "deadline", true);
        await waitForAttributes("Mission", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },

    // --- PrimaryTask ---
    async () => {
      const keys = ["objective", "priority", "estDuration", "expectedOutcome", "proofTypeRequired", "status", "commitmentWindowMinutes", "extensionRequested", "extensionGrantedMinutes"];
      try {
        await databases.createStringAttribute(databaseId, "PrimaryTask", "objective", 2048, true);
        await databases.createIntegerAttribute(databaseId, "PrimaryTask", "priority", true, 1, 3);
        await databases.createIntegerAttribute(databaseId, "PrimaryTask", "estDuration", true, 1, undefined);
        await databases.createStringAttribute(databaseId, "PrimaryTask", "expectedOutcome", 2048, true);
        await databases.createStringAttribute(databaseId, "PrimaryTask", "proofTypeRequired", 50, false, "text");
        await databases.createStringAttribute(databaseId, "PrimaryTask", "status", 50, false, "pending");
        await databases.createIntegerAttribute(databaseId, "PrimaryTask", "commitmentWindowMinutes", false);
        await databases.createBooleanAttribute(databaseId, "PrimaryTask", "extensionRequested", false, false);
        await databases.createIntegerAttribute(databaseId, "PrimaryTask", "extensionGrantedMinutes", false);
        await waitForAttributes("PrimaryTask", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },

    // --- SecondaryTask ---
    async () => {
      const keys = ["objective", "status"];
      try {
        await databases.createStringAttribute(databaseId, "SecondaryTask", "objective", 2048, true);
        await databases.createStringAttribute(databaseId, "SecondaryTask", "status", 50, false, "pending");
        await waitForAttributes("SecondaryTask", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },

    // --- Proof ---
    async () => {
      const keys = ["type", "content", "verdict", "reason"];
      try {
        await databases.createStringAttribute(databaseId, "Proof", "type", 50, true);
        await databases.createStringAttribute(databaseId, "Proof", "content", 2000, true);
        await databases.createStringAttribute(databaseId, "Proof", "verdict", 50, false);
        await databases.createStringAttribute(databaseId, "Proof", "reason", 1000, false);
        await waitForAttributes("Proof", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },

    // --- NotificationLog ---
    async () => {
      const keys = ["userId", "message", "title", "priority", "status"];
      try {
        await databases.createStringAttribute(databaseId, "NotificationLog", "userId", 255, true);
        await databases.createStringAttribute(databaseId, "NotificationLog", "message", 2048, true);
        await databases.createStringAttribute(databaseId, "NotificationLog", "title", 255, false);
        await databases.createIntegerAttribute(databaseId, "NotificationLog", "priority", false);
        await databases.createStringAttribute(databaseId, "NotificationLog", "status", 50, true);
        await waitForAttributes("NotificationLog", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },

    // --- PushSchedule ---
    async () => {
      const keys = ["userId", "missionId", "step", "scheduledTime", "status"];
      try {
        await databases.createStringAttribute(databaseId, "PushSchedule", "userId", 255, true);
        await databases.createStringAttribute(databaseId, "PushSchedule", "missionId", 255, true);
        await databases.createStringAttribute(databaseId, "PushSchedule", "step", 50, true);
        await databases.createDatetimeAttribute(databaseId, "PushSchedule", "scheduledTime", true);
        await databases.createStringAttribute(databaseId, "PushSchedule", "status", 50, true);
        await waitForAttributes("PushSchedule", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },

    // --- AppSettings ---
    async () => {
      const keys = ["missionDeadlineHour", "maxPrimaryTasks", "maxSecondaryTasks", "pushoverAppToken", "roadmapSystemPrompt", "missionSystemPrompt", "proofSystemPrompt", "decisionSystemPrompt"];
      try {
        await databases.createIntegerAttribute(databaseId, "AppSettings", "missionDeadlineHour", false, 0, 23, 22);
        await databases.createIntegerAttribute(databaseId, "AppSettings", "maxPrimaryTasks", false, 1, 10, 3);
        await databases.createIntegerAttribute(databaseId, "AppSettings", "maxSecondaryTasks", false, 1, 10, 4);
        await databases.createStringAttribute(databaseId, "AppSettings", "pushoverAppToken", 255, false);
        await databases.createStringAttribute(databaseId, "AppSettings", "roadmapSystemPrompt", 2000, false);
        await databases.createStringAttribute(databaseId, "AppSettings", "missionSystemPrompt", 2000, false);
        await databases.createStringAttribute(databaseId, "AppSettings", "proofSystemPrompt", 2000, false);
        await databases.createStringAttribute(databaseId, "AppSettings", "decisionSystemPrompt", 2000, false);
        await waitForAttributes("AppSettings", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },

    // --- Reflection ---
    async () => {
      const keys = ["whatGotDone", "whatSlowedYouDown", "whatYouLearned", "focusScore"];
      try {
        await databases.createStringAttribute(databaseId, "Reflection", "whatGotDone", 2000, true);
        await databases.createStringAttribute(databaseId, "Reflection", "whatSlowedYouDown", 2000, true);
        await databases.createStringAttribute(databaseId, "Reflection", "whatYouLearned", 2000, true);
        await databases.createIntegerAttribute(databaseId, "Reflection", "focusScore", true, 1, 10);
        await waitForAttributes("Reflection", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },

    // --- WeeklyReview ---
    async () => {
      const keys = ["weekNumber", "executionRate", "focusHours", "missionCompletionPct", "revenue", "momentumScore", "bottleneck", "recommendation", "incomeProgress", "leadsFollowedUpPct"];
      try {
        await databases.createIntegerAttribute(databaseId, "WeeklyReview", "weekNumber", true);
        await databases.createFloatAttribute(databaseId, "WeeklyReview", "executionRate", true);
        await databases.createFloatAttribute(databaseId, "WeeklyReview", "focusHours", true);
        await databases.createFloatAttribute(databaseId, "WeeklyReview", "missionCompletionPct", true);
        await databases.createFloatAttribute(databaseId, "WeeklyReview", "revenue", true);
        await databases.createIntegerAttribute(databaseId, "WeeklyReview", "momentumScore", true);
        await databases.createStringAttribute(databaseId, "WeeklyReview", "bottleneck", 2000, true);
        await databases.createStringAttribute(databaseId, "WeeklyReview", "recommendation", 2000, true);
        await databases.createFloatAttribute(databaseId, "WeeklyReview", "incomeProgress", true);
        await databases.createFloatAttribute(databaseId, "WeeklyReview", "leadsFollowedUpPct", true);
        await waitForAttributes("WeeklyReview", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },

    // --- RoleModel ---
    async () => {
      const keys = ["name", "principleToLearn", "notes", "imageUrl"];
      try {
        await databases.createStringAttribute(databaseId, "RoleModel", "name", 255, true);
        await databases.createStringAttribute(databaseId, "RoleModel", "principleToLearn", 1000, true);
        await databases.createStringAttribute(databaseId, "RoleModel", "notes", 2000, false);
        await databases.createStringAttribute(databaseId, "RoleModel", "imageUrl", 512, false);
        await waitForAttributes("RoleModel", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },

    // --- Lead ---
    async () => {
      const keys = ["name", "source", "status", "nextFollowUpDate", "notes"];
      try {
        await databases.createStringAttribute(databaseId, "Lead", "name", 255, true);
        await databases.createStringAttribute(databaseId, "Lead", "source", 255, false);
        await databases.createStringAttribute(databaseId, "Lead", "status", 50, false, "new");
        await databases.createDatetimeAttribute(databaseId, "Lead", "nextFollowUpDate", false);
        await databases.createStringAttribute(databaseId, "Lead", "notes", 2000, false);
        await waitForAttributes("Lead", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },

    // --- RevenueLog ---
    async () => {
      const keys = ["amount", "description", "source", "currency", "originalAmount", "date"];
      try {
        await databases.createFloatAttribute(databaseId, "RevenueLog", "amount", true);
        await databases.createStringAttribute(databaseId, "RevenueLog", "description", 1000, true);
        await databases.createStringAttribute(databaseId, "RevenueLog", "source", 255, false);
        await databases.createStringAttribute(databaseId, "RevenueLog", "currency", 10, false, "NGN");
        await databases.createFloatAttribute(databaseId, "RevenueLog", "originalAmount", false);
        await databases.createDatetimeAttribute(databaseId, "RevenueLog", "date", true);
        await waitForAttributes("RevenueLog", keys);
      } catch (err: any) { if (err.code !== 409) throw err; }
    },
  ];

  for (const op of attributeOperations) {
    await withRetry(() => op(), 5, 2000);
  }

  // 4. Create Relationships
  console.log("\nCreating relationship attributes...");

  const relationshipOperations = [
    // User <-> Streak (oneToOne)
    async () => {
      try {
        await databases.createRelationshipAttribute(databaseId, "Streak", "User", RelationshipType.OneToOne, true, "user", "streak", RelationMutate.Cascade);
        await waitForAttributes("Streak", ["user"]);
        await waitForAttributes("User", ["streak"]);
        console.log("Created relationship: User <-> Streak");
      } catch (err: any) { if (err.code !== 409) console.error("Streak-User relation error:", err.message); }
    },
    // User <-> Goal (manyToOne)
    async () => {
      try {
        await databases.createRelationshipAttribute(databaseId, "Goal", "User", RelationshipType.ManyToOne, true, "user", "goals", RelationMutate.Cascade);
        await waitForAttributes("Goal", ["user"]);
        await waitForAttributes("User", ["goals"]);
        console.log("Created relationship: User <-> Goal");
      } catch (err: any) { if (err.code !== 409) console.error("Goal-User relation error:", err.message); }
    },
    // User <-> RoleModel (manyToOne)
    async () => {
      try {
        await databases.createRelationshipAttribute(databaseId, "RoleModel", "User", RelationshipType.ManyToOne, true, "user", "roleModels", RelationMutate.Cascade);
        await waitForAttributes("RoleModel", ["user"]);
        await waitForAttributes("User", ["roleModels"]);
        console.log("Created relationship: User <-> RoleModel");
      } catch (err: any) { if (err.code !== 409) console.error("RoleModel-User relation error:", err.message); }
    },
    // User <-> Lead (manyToOne)
    async () => {
      try {
        await databases.createRelationshipAttribute(databaseId, "Lead", "User", RelationshipType.ManyToOne, true, "user", "leads", RelationMutate.Cascade);
        await waitForAttributes("Lead", ["user"]);
        await waitForAttributes("User", ["leads"]);
        console.log("Created relationship: User <-> Lead");
      } catch (err: any) { if (err.code !== 409) console.error("Lead-User relation error:", err.message); }
    },
    // User <-> RevenueLog (manyToOne)
    async () => {
      try {
        await databases.createRelationshipAttribute(databaseId, "RevenueLog", "User", RelationshipType.ManyToOne, true, "user", "revenueLogs", RelationMutate.Cascade);
        await waitForAttributes("RevenueLog", ["user"]);
        await waitForAttributes("User", ["revenueLogs"]);
        console.log("Created relationship: User <-> RevenueLog");
      } catch (err: any) { if (err.code !== 409) console.error("RevenueLog-User relation error:", err.message); }
    },
    // Goal <-> Vow (oneToOne)
    async () => {
      try {
        await databases.createRelationshipAttribute(databaseId, "Vow", "Goal", RelationshipType.OneToOne, true, "goal", "vow", RelationMutate.Cascade);
        await waitForAttributes("Vow", ["goal"]);
        await waitForAttributes("Goal", ["vow"]);
        console.log("Created relationship: Goal <-> Vow");
      } catch (err: any) { if (err.code !== 409) console.error("Vow-Goal relation error:", err.message); }
    },
    // Goal <-> InterviewResponse (oneToOne)
    async () => {
      try {
        await databases.createRelationshipAttribute(databaseId, "InterviewResponse", "Goal", RelationshipType.OneToOne, true, "goal", "interviewResponse", RelationMutate.Cascade);
        await waitForAttributes("InterviewResponse", ["goal"]);
        await waitForAttributes("Goal", ["interviewResponse"]);
        console.log("Created relationship: Goal <-> InterviewResponse");
      } catch (err: any) { if (err.code !== 409) console.error("InterviewResponse-Goal relation error:", err.message); }
    },
    // Goal <-> Roadmap (oneToOne)
    async () => {
      try {
        await databases.createRelationshipAttribute(databaseId, "Roadmap", "Goal", RelationshipType.OneToOne, true, "goal", "roadmap", RelationMutate.Cascade);
        await waitForAttributes("Roadmap", ["goal"]);
        await waitForAttributes("Goal", ["roadmap"]);
        console.log("Created relationship: Goal <-> Roadmap");
      } catch (err: any) { if (err.code !== 409) console.error("Roadmap-Goal relation error:", err.message); }
    },
    // Goal <-> Mission (manyToOne)
    async () => {
      try {
        await databases.createRelationshipAttribute(databaseId, "Mission", "Goal", RelationshipType.ManyToOne, true, "goal", "missions", RelationMutate.Cascade);
        await waitForAttributes("Mission", ["goal"]);
        await waitForAttributes("Goal", ["missions"]);
        console.log("Created relationship: Goal <-> Mission");
      } catch (err: any) { if (err.code !== 409) console.error("Mission-Goal relation error:", err.message); }
    },
    // Goal <-> WeeklyReview (manyToOne)
    async () => {
      try {
        await databases.createRelationshipAttribute(databaseId, "WeeklyReview", "Goal", RelationshipType.ManyToOne, true, "goal", "weeklyReviews", RelationMutate.Cascade);
        await waitForAttributes("WeeklyReview", ["goal"]);
        await waitForAttributes("Goal", ["weeklyReviews"]);
        console.log("Created relationship: Goal <-> WeeklyReview");
      } catch (err: any) { if (err.code !== 409) console.error("WeeklyReview-Goal relation error:", err.message); }
    },
    // Mission <-> PrimaryTask (manyToOne)
    async () => {
      try {
        await databases.createRelationshipAttribute(databaseId, "PrimaryTask", "Mission", RelationshipType.ManyToOne, true, "mission", "primaryTasks", RelationMutate.Cascade);
        await waitForAttributes("PrimaryTask", ["mission"]);
        await waitForAttributes("Mission", ["primaryTasks"]);
        console.log("Created relationship: Mission <-> PrimaryTask");
      } catch (err: any) { if (err.code !== 409) console.error("PrimaryTask-Mission relation error:", err.message); }
    },
    // Mission <-> SecondaryTask (manyToOne)
    async () => {
      try {
        await databases.createRelationshipAttribute(databaseId, "SecondaryTask", "Mission", RelationshipType.ManyToOne, true, "mission", "secondaryTasks", RelationMutate.Cascade);
        await waitForAttributes("SecondaryTask", ["mission"]);
        await waitForAttributes("Mission", ["secondaryTasks"]);
        console.log("Created relationship: Mission <-> SecondaryTask");
      } catch (err: any) { if (err.code !== 409) console.error("SecondaryTask-Mission relation error:", err.message); }
    },
    // Mission <-> Reflection (oneToOne)
    async () => {
      try {
        await databases.createRelationshipAttribute(databaseId, "Reflection", "Mission", RelationshipType.OneToOne, true, "mission", "reflection", RelationMutate.Cascade);
        await waitForAttributes("Reflection", ["mission"]);
        await waitForAttributes("Mission", ["reflection"]);
        console.log("Created relationship: Mission <-> Reflection");
      } catch (err: any) { if (err.code !== 409) console.error("Reflection-Mission relation error:", err.message); }
    },
    // PrimaryTask <-> Proof (manyToOne)
    async () => {
      try {
        await databases.createRelationshipAttribute(databaseId, "Proof", "PrimaryTask", RelationshipType.ManyToOne, true, "primaryTask", "proofs", RelationMutate.Cascade);
        await waitForAttributes("Proof", ["primaryTask"]);
        await waitForAttributes("PrimaryTask", ["proofs"]);
        console.log("Created relationship: PrimaryTask <-> Proof");
      } catch (err: any) { if (err.code !== 409) console.error("Proof-PrimaryTask relation error:", err.message); }
    },
  ];

  for (const op of relationshipOperations) {
    await withRetry(() => op(), 5, 2000);
  }

  console.log("\nAppwrite Database provisioning finished successfully!");
}

main().catch((err) => {
  console.error("An error occurred during database setup:", err);
  process.exit(1);
});
