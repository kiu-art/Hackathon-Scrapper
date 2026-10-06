import { User } from "../models/user.models.js";
import Hackathons from "../models/hackathons.models.js";
import {
  parseResumeFromUrl,
  rankHackathons,
  generatePitchStrategy,
  checkAiServiceHealth,
} from "../services/ai.service.js";
import mongoose from "mongoose"


/**
 * GET /api/hackathons/matches
 * Compares candidate profile vector and skill inventory against active hackathons
 * using the hybrid scoring engine (cosine similarity + stack overlap + keyword relevance).
 */
export const getRecommendedHackathons = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.query.userId;
    const clerkId = req.user?.clerkId || req.auth?.userId;
    const topK = parseInt(req.query.limit, 10) || 200; // Default to 20 for frontend grid
    const category = req.query.category;

    if (!userId && !clerkId) {
      return res.status(400).json({
        success: false,
        error: "User identification is required.",
      });
    }

    // 1. Retrieve user profile (supports both Mongo _id and Clerk ID)
    const user = await User.findOne(
      userId ? { _id: userId } : { clerkId }
    ).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found.",
      });
    }

    // If no resume vector exists yet, return empty data gracefully (avoids red toast on first login)
    if (!user.profileEmbedding || user.profileEmbedding.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // 2. Query active hackathons (with optional category filter)
    const hackathonQuery = {
      embedding: { $exists: true,$ne: [] },
      currentDeadline: { $gte: new Date() },
    };

    if (category && category !== "ALL") {
      hackathonQuery.categories = category;
    }

    const activeHackathons = await Hackathons.find(hackathonQuery)
      .select("-__v")
      .lean();

    if (!activeHackathons.length) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // 3. Delegate ranking to FastAPI hybrid engine
    const rankedResults = await rankHackathons({
      userSkills: user.skills || [],
      userSummary: user.summary || "",
      userEmbedding: user.profileEmbedding,
      hackathons: activeHackathons,
      topK,
    });

    // 4. Return under `data` key expected by Zustand store
    return res.status(200).json({
      success: true,
      data: rankedResults,
    });
  } catch (error) {
    console.error("[getRecommendedHackathons] Error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/hackathons/:id/pitch
 * Synthesizes candidate skills, experience level, and hackathon problem statement
 * into an MVP architecture, pitch tagline, feature breakdown, and demo plan.
 */
export const getPitchForHackathon = async (req, res) => {
  try {
    // 1. Support both :id and :hackathonId params, and both track and preferredTrack body fields
    const hackathonId = req.params.hackathonId || req.params.id;
    const preferredTrack = req.body.track || req.body.preferredTrack;

    const userId = req.user?._id || req.user?.id || req.body.userId;
    const clerkId = req.user?.clerkId || req.auth?.userId;

    if (!userId && !clerkId) {
      return res.status(400).json({
        success: false,
        error: "User identification (userId) is required.",
      });
    }

    // 2. Fetch both records in parallel (supports Mongo _id or Clerk ID)
    const [user, hackathon] = await Promise.all([
      User.findOne(userId ? { _id: userId } : { clerkId }).lean(),
      Hackathons.findById(hackathonId).lean(),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    if (!hackathon) {
      return res.status(404).json({ success: false, error: "Hackathon not found." });
    }

    // 3. Generate customized strategy via Gemini Flash
    const pitch = await generatePitchStrategy({
      userSkills: user.skills || [],
      userExperience: user.experienceLevel || "INTERMEDIATE",
      userSummary: user.summary || "",
      preferredTrack: preferredTrack || hackathon.categories?.[0] || "General Track",
      hackathon,
    });

    console.log(pitch)


    // 4. Return under the `data` key expected by Zustand store
    return res.status(200).json({
      success: true,
      data: pitch,
    });
  } catch (error) {
    console.error("[aiController:getPitchForHackathon] Error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/hackathons
 * Fallback catalog endpoint returning active, unranked hackathons
 * when candidate vector embeddings are uninitialized or when browsing the global directory.
 */
export const getAllHackathons = async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    // 1. Build query: active deadlines only
    const query = {
      currentDeadline: { $gte: new Date() },
    };

    // 2. Filter by track/category if specified
    if (category && category !== "ALL") {
      query.categories = category;
    }

    // 3. Fetch hackathons sorted by earliest upcoming deadline
    // Exclude precomputed embeddings (-embedding) and internal version key (-__v)
    const rawHackathons = await Hackathons.find(query)
      .select("-embedding -__v")
      .sort({ currentDeadline: 1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean();

    // 4. Map frontend contract fields (explicit nulls for unranked telemetry)
    const hackathons = rawHackathons.map((hackathon) => ({
      ...hackathon,
      finalScore: null,
      matchBreakdown: null,
    }));

    return res.status(200).json({
      success: true,
      data: hackathons,
    });
  } catch (error) {
    console.error("[getAllHackathons Controller Error]:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve hackathon catalog.",
    });
  }
};


/**
 * GET /api/hackathons/:id
 * Retrieves granular dossier, tracks, prize allocations, and timeline data
 * for a specific hackathon record.
 */
export const getHackathonById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Guard against malformed MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid hackathon identifier format.",
      });
    }

    // 2. Fetch record while excluding heavy vector floats and mongoose version key
    const hackathon = await Hackathons.findById(id)
      .select("-embedding -__v")
      .lean();

    // 3. Return 404 if record doesn't exist
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        error: "Hackathon record not found.",
      });
    }

    console.log(hackathon);


    // 4. Return data payload expected by Zustand's fetchHackathonById
    return res.status(200).json({
      success: true,
      data: hackathon,
    });
  } catch (error) {
    console.error("[getHackathonById Controller Error]:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve hackathon dossier.",
    });
  }
};


/**
 * GET /api/hackathons/health
 * Verifies network connectivity and status of the FastAPI microservice.
 */
export const getAiServiceHealth = async (req, res) => {
  try {
    const isHealthy = await checkAiServiceHealth();
    return res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? "connected" : "disconnected",
      microservice: "FastAPI AI Engine",
    });
  } catch (error) {
    return res.status(503).json({
      status: "disconnected",
      error: error.message,
    });
  }
};