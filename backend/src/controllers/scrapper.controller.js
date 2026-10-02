import Hackathons from "../models/hackathons.models.js";
import {
  scrapeAllUnstop,
  scrapeHackathonDetails,
} from "../webScrapper/unstop.js";

export const unstop = async (req, res) => {
  try {
    const result = await scrapeAllUnstop(100);

    const saveHackathons = async (data) => {
      const hackathons = data.hackathons;
      if (!Array.isArray(hackathons) || hackathons.length === 0) {
        console.log("No hackathons to save.");
        return;
      }

      // 1. Initial bulk save of card listings
      const operations = hackathons.map((hackathon) => ({
        updateOne: {
          filter: {
            link: hackathon.link,
          },
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
      console.log("Hackathons saved successfully.");
      console.log(`Inserted: ${bulkResult.upsertedCount}`);
      console.log(`Updated: ${bulkResult.modifiedCount}`);

      // 2. Deep scrape each link and update detail fields
      console.log("Starting detail scraping for each hackathon...");
      for (const hackathon of hackathons) {
        try {
          const details = await scrapeHackathonDetails(hackathon.link);
          if (details) {
            console.log("Scraped link:", hackathon.link);

            const updateFields = {
              currentDeadline: details.currentDeadline,
              techStack: details.techStack,
              contextText: details.contextText,
            };

            // Update prize if detailed scrape detected a cash prize
            if (details.prize !== null && details.prize !== undefined) {
              updateFields.prize = details.prize;
            }

            await Hackathons.updateOne(
              { link: hackathon.link },
              {
                $set: updateFields,
              }
            );
            console.log(`Updated details & prize (₹${details.prize}) for: ${hackathon.title}`);
          }
        } catch (detailError) {
          console.error(`Failed to scrape details for ${hackathon.link}:`, detailError.message);
        }
      }
      console.log("All detail scraping completed.");
    };

    // Run background enrichment without blocking HTTP response
    saveHackathons(result);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};