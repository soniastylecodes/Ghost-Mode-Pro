const projectIds = ["6a55033c0003c3088a1b", "fra-6a55033c0003c3088a1b", "console"];
const endpoints = ["https://cloud.appwrite.io/v1", "https://fra.cloud.appwrite.io/v1"];

async function run() {
  for (const endpoint of endpoints) {
    for (const projectId of projectIds) {
      console.log(`Testing Project ID: ${projectId} on Endpoint: ${endpoint}`);
      try {
        const res = await fetch(`${endpoint}/locale`, {
          method: "GET",
          headers: {
            "X-Appwrite-Project": projectId,
          }
        });
        console.log(`Status: ${res.status} ${res.statusText}`);
        const body = await res.text();
        console.log(`Body: ${body}\n`);
      } catch (e: any) {
        console.error(`Error: ${e.message}\n`);
      }
    }
  }
}

run();
