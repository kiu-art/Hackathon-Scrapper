import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000/api";
const INTERNAL_SECRET = process.env.AI_INTERNAL_SECRET || "";

// Axios client configured for long-running LLM and PDF tasks
const aiClient = axios.create({
  baseURL: AI_SERVICE_BASE_URL,
  timeout: 60000, // 60-second timeout for PDF extraction and model inference
  headers: {
    "Content-Type": "application/json",
    ...(INTERNAL_SECRET && { "x-internal-secret": INTERNAL_SECRET }),
  },
});

/**
 * 1. Parse Resume PDF
 * Sends a public PDF link (e.g., ImageKit) to FastAPI.
 * Extracts candidate details via Gemini Flash and returns a 3072-dim profile vector.
 *
 * @param {string} resumeUrl - Publicly accessible PDF URL
 * @returns {Promise<{ profile: Object, userEmbedding: number[] }>}
 */
export const parseResumeFromUrl = async (resumeUrl) => {
  try {
    const response = await aiClient.post("/parse-resume", {
      resumeUrl,
    });
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.detail || error.message;
    console.error("[aiService] Error in parseResumeFromUrl:", detail);
    throw new Error(`FastAPI Resume Parsing Error: ${detail}`);
  }
};

/**
 * 2. Generate Hackathon Embedding
 * Vectorizes hackathon title, context, tech stack, and metadata into a 3072-dim array.
 * Used during scraper ingests or backfill migrations.
 *
 * @param {Object} hackathonDoc - Raw or lean MongoDB Hackathon document
 * @returns {Promise<number[]>} - 3072-dimensional vector
 */
export const generateHackathonEmbedding = async (hackathonDoc) => {
  try {
    const payload = {
      link: hackathonDoc.link,
      hackathon: {
        title: hackathonDoc.title,
        organizer: hackathonDoc.organizer,
        link: hackathonDoc.link,
        location: hackathonDoc.location || null,
        categories: hackathonDoc.categories || [],
        techStack: hackathonDoc.techStack || [],
        eligibility: hackathonDoc.eligibility || [],
        fee: hackathonDoc.fee ?? null,
        prize: hackathonDoc.prize ?? null,
        teamSize: hackathonDoc.teamSize || { min: 1, max: 4 },
        currentDeadline: hackathonDoc.currentDeadline
          ? new Date(hackathonDoc.currentDeadline).toISOString()
          : null,
        contextText: hackathonDoc.contextText || "",
      },
    };

    const response = await aiClient.post("/embed-hackathon", payload);
    return response.data.embedding;
  } catch (error) {
    const detail = error.response?.data?.detail || error.message;
    console.error(`[aiService] Error in generateHackathonEmbedding for "${hackathonDoc.title}":`, detail);
    throw new Error(`FastAPI Embedding Error: ${detail}`);
  }
};

/**
 * 3. Match and Rank Hackathons
 * Combines cosine similarity (vector), skill overlap, and BM25 keywords
 * to produce personalized match scores and skill gap analyses.
 *
 * @param {Object} params
 * @param {string[]} params.userSkills - Array of user's technical skills
 * @param {string} params.userSummary - Brief professional summary from resume
 * @param {number[]} params.userEmbedding - 3072-dim user profile vector
 * @param {Array<Object>} params.hackathons - List of candidate hackathons with embeddings
 * @param {number} [params.topK=10] - Number of top results to return
 * @returns {Promise<Array<Object>>} - Ranked hackathon items with match analytics
 */
export const rankHackathons = async ({
  userSkills,
  userSummary,
  userEmbedding,
  hackathons,
  topK = 10,
}) => {
  try {
    const payload = {
      userSkills: userSkills || [],
      userSummary: userSummary || "",
      userEmbedding,
      topK,
      hackathons: hackathons.map((h) => ({
        id: h._id ? h._id.toString() : h.id,
        title: h.title,
        organizer: h.organizer,
        link: h.link,
        location: h.location || null,
        categories: h.categories || [],
        techStack: h.techStack || [],
        eligibility: h.eligibility || [],
        fee: h.fee ?? null,
        prize: h.prize ?? null,
        teamSize: h.teamSize || { min: 1, max: 4 },
        currentDeadline: h.currentDeadline
          ? new Date(h.currentDeadline).toISOString()
          : null,
        contextText: h.contextText || "",
        embedding: h.embedding,
      })),
    };

    const response = await aiClient.post("/match-hackathons", payload);
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.detail || error.message;
    console.error("[aiService] Error in rankHackathons:", detail);
    throw new Error(`FastAPI Matchmaking Error: ${detail}`);
  }
};

/**
 * 4. Generate Personalized Project Pitch
 * Generates an MVP architecture, pitch tagline, problem/solution breakdown,
 * judging demo strategy, and teammate recommendations tailored to user skills.
 *
 * @param {Object} params
 * @param {string[]} params.userSkills - Candidate skills
 * @param {string} params.userExperience - "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
 * @param {string} params.userSummary - Candidate summary
 * @param {string} [params.preferredTrack] - Targeted competition track
 * @param {Object} params.hackathon - The target hackathon document
 * @returns {Promise<Object>} - Tailored pitch strategy object
 */
export const generatePitchStrategy = async ({
  userSkills,
  userExperience,
  userSummary,
  preferredTrack,
  hackathon,
}) => {
  try {
    const payload = {
      userSkills: userSkills || [],
      userExperience: userExperience || "INTERMEDIATE",
      userSummary: userSummary || "",
      preferredTrack: preferredTrack || "General Track",
      hackathon: {
        id: hackathon._id ? hackathon._id.toString() : hackathon.id,
        title: hackathon.title,
        organizer: hackathon.organizer,
        link: hackathon.link,
        location: hackathon.location || null,
        categories: hackathon.categories || [],
        techStack: hackathon.techStack || [],
        eligibility: hackathon.eligibility || [],
        fee: hackathon.fee ?? null,
        prize: hackathon.prize ?? null,
        teamSize: hackathon.teamSize || { min: 1, max: 4 },
        currentDeadline: hackathon.currentDeadline
          ? new Date(hackathon.currentDeadline).toISOString()
          : null,
        contextText: hackathon.contextText || "",
      },
    };

    const response = await aiClient.post("/generate-pitch", payload);
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.detail || error.message;
    console.error("[aiService] Error in generatePitchStrategy:", detail);
    throw new Error(`FastAPI Pitch Generation Error: ${detail}`);
  }
};

/**
 * 5. Microservice Health Ping
 * @returns {Promise<boolean>}
 */
export const checkAiServiceHealth = async () => {
  try {
    const response = await aiClient.get("/health");
    return response.status === 200 && response.data.status === "ok";
  } catch (error) {
    console.warn("[aiService] Health check failed:", error.message);
    return false;
  }
};

export default {
  parseResumeFromUrl,
  generateHackathonEmbedding,
  rankHackathons,
  generatePitchStrategy,
  checkAiServiceHealth,
};