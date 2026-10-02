import express from "express";
import {
  getRecommendedHackathons,
  getAllHackathons,
  getHackathonById,
  getPitchForHackathon,
  getAiServiceHealth,
} from "../controllers/hackathon.controller.js";

import { protectRoute } from "../middleware/clerk.middleware.js";

const router = express.Router();

router.use(protectRoute);

// Specific routes first
router.get("/matches", getRecommendedHackathons);
router.get("/pitch/health", getAiServiceHealth);

// Catalog listing (fallback when no profile embedding exists)
router.get("/", getAllHackathons);

// Parameterized routes last
router.get("/:id", getHackathonById);
router.post("/:id/pitch", getPitchForHackathon);

export default router;