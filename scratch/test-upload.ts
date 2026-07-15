import { Client, Storage, ID } from "node-appwrite";
import fs from "fs";

async function testUpload() {
  const client = new Client()
    .setEndpoint("https://fra.cloud.appwrite.io/v1")
    .setProject("6a55033c0003c8088a1b")
    .setKey(process.env.APPWRITE_API_KEY || "");
    
  const storage = new Storage(client);
  
  const buffer = Buffer.from("hello world");
  // In Node 20+, File is available globally
  const file = new File([buffer], "test.txt", { type: "text/plain" });

  try {
    const res = await storage.createFile("6a55383200216be2dd16", ID.unique(), file as any);
    console.log("Success:", res.$id);
  } catch (err) {
    console.error("Error:", err);
  }
}

testUpload();
