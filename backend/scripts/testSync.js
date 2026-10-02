import { setServers } from "dns";
setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";
import dotenv from "dotenv";
import { runDailyHackathonSync } from "../src/services/hackthonCron.service.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const dryRun = async () => {
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI is missing from your .env file.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected.\n");

    console.log("Starting manual execution of runDailyHackathonSync()...\n");
    await runDailyHackathonSync();

    console.log("🎉 Manual sync run completed successfully.");
  } catch (error) {
    console.error("❌ Pipeline dry-run failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
};

dryRun();