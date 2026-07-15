import dotenv from "dotenv";
import { Client, Storage, Permission, Role } from "node-appwrite";

dotenv.config();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!projectId || !apiKey) {
  console.error("Error: Missing env variables");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const storage = new Storage(client);
const bucketId = "images";

async function main() {
  try {
    await storage.createBucket(
      bucketId,
      "Images Bucket",
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      false, // fileSecurity
      true,  // enabled
      undefined, // maximumFileSize
      ["jpg", "jpeg", "png", "gif", "webp", "svg"] // allowedFileExtensions
    );
    console.log(`Created bucket: ${bucketId}`);
  } catch (err: any) {
    if (err.code === 409) {
      console.log(`Bucket ${bucketId} already exists. Skipping.`);
    } else {
      console.error(err);
      process.exit(1);
    }
  }
}

main();
