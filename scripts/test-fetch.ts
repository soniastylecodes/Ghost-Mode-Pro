import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.APPWRITE_API_KEY;
const projectIds = ["6a55033c0003c3088a1b", "fra-6a55033c0003c3088a1b"];
const endpoints = ["https://cloud.appwrite.io/v1", "https://fra.cloud.appwrite.io/v1"];

async function testService(endpoint: string, projectId: string, service: string) {
  if (!apiKey) return;
  try {
    const res = await fetch(`${endpoint}/${service}`, {
      method: "GET",
      headers: {
        "X-Appwrite-Project": projectId,
        "X-Appwrite-Key": apiKey,
        "Content-Type": "application/json"
      }
    });
    console.log(`[${service}] Project: ${projectId} on ${endpoint} -> Status: ${res.status} ${res.statusText}`);
    const body = await res.text();
    console.log(`Response: ${body.substring(0, 150)}`);
  } catch (e: any) {
    console.error(`[${service}] Error: ${e.message}`);
  }
}

async function run() {
  if (!apiKey) {
    console.error("No API key in .env");
    return;
  }

  for (const endpoint of endpoints) {
    for (const projectId of projectIds) {
      await testService(endpoint, projectId, "databases");
      await testService(endpoint, projectId, "teams");
      await testService(endpoint, projectId, "users");
    }
  }
}

run();
