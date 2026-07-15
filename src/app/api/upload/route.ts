import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { ID } from "node-appwrite";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const { storage } = createAdminClient();
    const bucketId = "6a55383200216be2dd16";
    
    const result = await storage.createFile(
      bucketId,
      ID.unique(),
      file
    );

    // Get the view URL
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "6a55033c0003c8088a1b";
    
    const fileUrl = `${endpoint}/storage/buckets/${bucketId}/files/${result.$id}/view?project=${projectId}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
