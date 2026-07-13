import dotenv from "dotenv";
dotenv.config();

console.log("PROJECT_ID:", JSON.stringify(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID));
console.log("API_KEY (first 30 chars):", JSON.stringify(process.env.APPWRITE_API_KEY?.substring(0, 30)));
console.log("ENDPOINT:", JSON.stringify(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT));
