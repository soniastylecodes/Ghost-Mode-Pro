import dotenv from "dotenv";
import { Client, Databases } from "node-appwrite";

dotenv.config();

const apiKey = process.env.APPWRITE_API_KEY;

const configs = [
  { endpoint: "https://cloud.appwrite.io/v1", projectId: "6a55033c0003c3088a1b" },
  { endpoint: "https://cloud.appwrite.io/v1", projectId: "fra-6a55033c0003c3088a1b" },
  { endpoint: "https://fra.cloud.appwrite.io/v1", projectId: "6a55033c0003c3088a1b" },
  { endpoint: "https://fra.cloud.appwrite.io/v1", projectId: "fra-6a55033c0003c3088a1b" },
];

async function run() {
  console.log("Running Appwrite Connection Diagnostics...\n");
  if (!apiKey || apiKey.includes("your-api-key")) {
    console.error("Error: APPWRITE_API_KEY is not configured in .env");
    process.exit(1);
  }

  for (const config of configs) {
    console.log(`Testing -> Endpoint: ${config.endpoint} | Project ID: ${config.projectId}`);
    const client = new Client()
      .setEndpoint(config.endpoint)
      .setProject(config.projectId)
      .setKey(apiKey);

    const databases = new Databases(client);

    try {
      // Try to list databases to verify project credentials
      const res = await databases.list();
      console.log(`✅ SUCCESS! Found ${res.databases.length} databases.`);
      console.log(`👉 Update your .env to match these settings.\n`);
      return;
    } catch (err: any) {
      console.log(`❌ FAILED: ${err.message} (Code: ${err.code}, Type: ${err.type})\n`);
    }
  }

  console.log("None of the standard combinations succeeded. Please check that your API Key has been updated in the .env file and that it has 'Databases' permissions checked in the Appwrite Console.");
}

run();
