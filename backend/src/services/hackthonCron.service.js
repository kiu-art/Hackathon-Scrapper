import cron from "node-cron";
import Hackathons from "../models/hackathons.models.js";
import {
  scrapeAllUnstop,
  scrapeHackathonDetails,
} from "../webScrapper/unstop.js";
import { generateHackathonEmbedding } from "./ai.service.js";

const TWENTY_MINUTES_MS = 20 * 60 * 1000;

let lastSyncTime = null;
let isSyncing = false;

/**
 * Executes the sync pipeline with concurrency protection
 * and timestamps the last successful run.
 */
const executeSync = async (source = "UNKNOWN") => {
  if (isSyncing) {
    console.log(`[PIPELINE] Sync already in progress. Skipping trigger from: ${source}`);
    return;
  }

  isSyncing = true;
  try {
    console.log(`[PIPELINE] Starting hackathon sync (Source: ${source})...`);
    await runDailyHackathonSync();
    lastSyncTime = new Date();
    console.log(`[PIPELINE] Sync finished at ${lastSyncTime.toLocaleTimeString()}`);
  } catch (error) {
    console.error(`[PIPELINE] Error during hackathon sync (${source}):`, error);
  } finally {
    isSyncing = false;
  }
};


/**
 * Executes full end-to-end sync:
 * 1. Scrapes listing cards from Unstop
 * 2. Deep scrapes context/stack/deadlines for each link
 * 3. Vectorizes into 3072-dim embeddings via FastAPI
 * 4. Saves enriched & vectorized documents to MongoDB
 */
export const runDailyHackathonSync = async () => {
  const startTime = new Date();
  console.log(`\n==================================================`);
  console.log(`[CRON] Starting Daily Hackathon Pipeline at ${startTime.toISOString()}`);
  console.log(`==================================================`);

  try {
    // -------------------------------------------------------------
    // Step 1: Scrape listing cards
    // -------------------------------------------------------------
    console.log("[CRON] Fetching hackathons from Unstop...");
    const result = await scrapeAllUnstop(100);
    const hackathons = result?.hackathons || [];
    
    if (!Array.isArray(hackathons) || hackathons.length === 0) {
      console.log("[CRON] No hackathons returned by scraper.");
      return;
    }

    console.log(`[CRON] Found ${hackathons.length} hackathon cards. Bulk upserting...`);

    // Initial bulk upsert of basic card listings
    const operations = hackathons.map((hackathon) => ({
      updateOne: {
        filter: { link: hackathon.link },
        update: {
          $set: {
            title: hackathon.title,
            organizer: hackathon.organizer,
            link: hackathon.link,
            fee: hackathon.fee,
            teamSize: hackathon.teamSize,
            location: hackathon.location,
            categories: hackathon.categories,
            eligibility: hackathon.eligibility,
            prize: hackathon.prize,
            status: hackathon.status,
            postedDate: hackathon.postedDate,
          },
        },
        upsert: true,
      },
    }));

    const bulkResult = await Hackathons.bulkWrite(operations);
    console.log(`[CRON] Base cards saved (Inserted: ${bulkResult.upsertedCount}, Updated: ${bulkResult.modifiedCount})`);

    // -------------------------------------------------------------
    // Step 2 & 3: Deep scrape details + generate 3072-dim vector
    // -------------------------------------------------------------
    console.log("\n[CRON] Beginning deep scraping and vector embedding generation...");
    
    let enrichedCount = 0;
    let embeddedCount = 0;

    for (let i = 0; i < hackathons.length; i++) {
      const hackathon = hackathons[i];
      console.log(`\n[${i + 1}/${hackathons.length}] Processing: "${hackathon.title}"`);

      try {
        // Deep scrape detailed page
        const details = await scrapeHackathonDetails(hackathon.link);
        if (!details) {
          console.warn(`   No detailed info returned for: ${hackathon.link}`);
          continue;
        }
        
        enrichedCount++;
        
        const updateFields = {
          currentDeadline: details.currentDeadline,
          techStack: details.techStack || [],
          contextText: details.contextText || "",
        };
        
        if (details.prize !== null && details.prize !== undefined) {
          updateFields.prize = details.prize;
        }

        // Prepare structured doc for FastAPI / Gemini embedding
        const docForEmbedding = {
          title: hackathon.title,
          organizer: hackathon.organizer,
          link: hackathon.link,
          location: hackathon.location,
          categories: hackathon.categories || [],
          techStack: details.techStack || [],
          eligibility: hackathon.eligibility || [],
          fee: hackathon.fee,
          prize: updateFields.prize ?? hackathon.prize,
          teamSize: hackathon.teamSize,
          currentDeadline: details.currentDeadline,
          contextText: details.contextText || "",
        };

        // Generate 3072-dimensional vector via FastAPI microservice
        try {
          const vector = await generateHackathonEmbedding(docForEmbedding);
          if (Array.isArray(vector) && vector.length > 0) {
            updateFields.embedding = vector;
            embeddedCount++;
            console.log(`   Generated 3072-dim vector (${vector.length} dims)`);
          }
        } catch (embedError) {
          console.error(`   Vector generation failed for "${hackathon.title}":`, embedError.message);
        }

        // Persist enriched metadata and vector simultaneously
        await Hackathons.updateOne(
          { link: hackathon.link },
          { $set: updateFields }
        );

        console.log(`   Saved details & vector in MongoDB`);

        // 600ms delay to avoid rate-limiting against Google AI and Unstop
        await new Promise((resolve) => setTimeout(resolve, 600));
      } catch (itemError) {
        console.error(`   Error processing ${hackathon.link}:`, itemError.message);
      }
    }

    // -------------------------------------------------------------
    // Step 4: Backfill any existing active hackathons missing embeddings
    // -------------------------------------------------------------
    const pendingEmbeddings = await Hackathons.find({
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } },
        { embedding: null },
      ],
      currentDeadline: { $gte: new Date() },
    });
    
    if (pendingEmbeddings.length > 0) {
      console.log(`\n[CRON] Found ${pendingEmbeddings.length} active hackathons missing vectors. Backfilling...`);
      for (const pending of pendingEmbeddings) {
        try {
          const vector = await generateHackathonEmbedding(pending);
          await Hackathons.updateOne(
            { _id: pending._id },
            { $set: { embedding: vector } }
          );
          console.log(`   Backfilled vector for: "${pending.title}"`);
          await new Promise((resolve) => setTimeout(resolve, 600));
        } catch (backfillErr) {
          console.error(`   Backfill failed for "${pending.title}":`, backfillErr.message);
        }
      }
    }
    
    const duration = ((new Date() - startTime) / 1000).toFixed(1);
    console.log(`\n==================================================`);
    console.log(`[CRON] Daily Sync Completed in ${duration}s`);
    console.log(`[CRON] Total Cards: ${hackathons.length} | Enriched: ${enrichedCount} | Vectorized: ${embeddedCount}`);
    console.log(`==================================================\n`);
  } catch (error) {
    console.error("[CRON] Fatal pipeline error:", error.message);
  }
};

/**
 * Initializes the cron scheduler.
 * "0 0 * * *" = Runs every day at 00:00 (Midnight).
*/
// export const initHackathonCron = () => {
//   // 1. Run immediately on server boot
//   (async () => {
//     console.log("🚀 [SERVER_BOOT] Running initial hackathon scraper...");
//     await executeSync("SERVER_STARTUP");
//   })();

//   // 2. Daily midnight cron job (00:00)
//   cron.schedule("0 0 * * *", async () => {
//     console.log("[CRON] Midnight trigger fired.");

//     // Check if a sync happened less than 20 minutes ago
//     if (lastSyncTime && Date.now() - lastSyncTime.getTime() < TWENTY_MINUTES_MS) {
//       const elapsedMinutes = Math.round((Date.now() - lastSyncTime.getTime()) / 60000);
//       console.log(
//         `[CRON] Skipped midnight sync: Last sync occurred only ${elapsedMinutes} minute(s) ago (< 20 min threshold).`
//       );
//       return;
//     }

//     await executeSync("MIDNIGHT_CRON");
//   });

//   console.log("⏰ Daily Hackathon Pipeline scheduled (00:00 nightly + server boot trigger, 20-min cooldown).");
// };
export const initHackathonCron = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Midnight trigger fired.");
    await runDailyHackathonSync();
  });

  console.log("⏰ Daily Hackathon Pipeline scheduled to run every night at 00:00.");
};