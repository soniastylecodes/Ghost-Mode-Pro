import { PrismaClient } from "@prisma/client";
import { prisma as appwritePrisma } from "./prisma-appwrite";

export const prisma = appwritePrisma as unknown as PrismaClient;
