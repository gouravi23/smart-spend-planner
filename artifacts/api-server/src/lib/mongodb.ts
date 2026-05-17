import mongoose from "mongoose";
import { logger } from "./logger";

let isConnected = false;

export async function connectMongoDB(): Promise<void> {
  if (isConnected) return;

  const uri = process.env["mongodb+srv://smartspend:smart123@cluster0.uo2oagn.mongodb.net/smartspend?retryWrites=true&w=majority&appName=Cluster0"];
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  await mongoose.connect(uri);
  isConnected = true;
  logger.info("Connected to MongoDB");
}
