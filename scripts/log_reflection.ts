import { Client, Databases, Query, ID } from "node-appwrite";
import * as dotenv from "dotenv";

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const db = new Databases(client);
const DATABASE_ID = "ghost_mode";

async function main() {
  // 1. Find active goal (get most recent)
  const goalsRes = await db.listDocuments(DATABASE_ID, "Goal", [
    Query.equal("status", "active"),
    Query.orderDesc("$createdAt"),
    Query.limit(1)
  ]);

  if (goalsRes.documents.length === 0) {
    console.error("No active goal found.");
    return;
  }
  const goal = goalsRes.documents[0];
  console.log("✓ Found goal:", goal.title);

  // 2. Find most recent mission for this goal
  const missionsRes = await db.listDocuments(DATABASE_ID, "Mission", [
    Query.equal("goal", goal.$id),
    Query.orderDesc("$createdAt"),
    Query.limit(1)
  ]);

  if (missionsRes.documents.length === 0) {
    console.error("No mission found.");
    return;
  }
  const mission = missionsRes.documents[0];
  console.log("✓ Found mission:", mission.$id);

  // 3. Check for existing reflection
  const reflectionsRes = await db.listDocuments(DATABASE_ID, "Reflection", [
    Query.equal("mission", mission.$id),
    Query.limit(1)
  ]);

  const reflectionData = {
    whatGotDone: "I did quite alot coming from someone who procastinates, i was able to clear some of my goals and i feel tommorow will be better.",
    whatSlowedYouDown: "Top issue was bad network, also since i didnt sleep early i couldnt wake up earliy so it affected my tasks.",
    focusScore: 3,
    whatYouLearned: "Learn proper communication and also learn to push my self to do the work no matter how it is going.",
    mission: mission.$id
  };

  if (reflectionsRes.documents.length > 0) {
    console.log("Reflection exists, updating...");
    await db.updateDocument(DATABASE_ID, "Reflection", reflectionsRes.documents[0].$id, {
      whatGotDone: reflectionData.whatGotDone,
      whatSlowedYouDown: reflectionData.whatSlowedYouDown,
      focusScore: reflectionData.focusScore,
      whatYouLearned: reflectionData.whatYouLearned,
      mission: mission.$id
    });
  } else {
    console.log("Creating new reflection...");
    await db.createDocument(DATABASE_ID, "Reflection", ID.unique(), reflectionData);
  }

  // 4. Update mission status to partial
  await db.updateDocument(DATABASE_ID, "Mission", mission.$id, {
    status: "partial"
  });

  console.log("✅ Day successfully ended! Reflection saved and mission marked as partial.");
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
