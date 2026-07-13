import dotenv from "dotenv";
dotenv.config();

const key = process.env.APPWRITE_API_KEY || "";
console.log("API Key loaded from .env:");
console.log("Length:", key.length);
console.log("Starts with:", key.substring(0, 15));
console.log("Ends with:", key.substring(key.length - 15));
