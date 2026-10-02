import { User } from "../models/user.models.js";
import { uploadResumePdf } from "../lib/imagekit.js";
import { parseResumeFromUrl } from "../services/ai.service.js";

export const saveUser = async (req, res) => {
  try {
    const {
      name,
      email,
      gender,
      college,
      graduationDate,
      githubUrl,
      linkedinUrl,
    } = req.body;

    // 1. Mandatory validation (checks request body OR existing user in DB)
    const finalName = (name || req.user?.name)?.trim();
    const finalEmail = (email || req.user?.email)?.toLowerCase().trim();
    const hasResume = req.file || req.user?.resumeFileUrl;

    if (!finalEmail || !finalName) {
      return res.status(400).json({ error: "Name and email are required." });
    }

    if (!hasResume) {
      return res.status(400).json({ error: "Resume file is required." });
    }

    // 2. Build update payload
    let updateData = {
      name: finalName,
      email: finalEmail,
      ...(gender !== undefined && { gender }),
      ...(college !== undefined && { college: college.trim() }),
      ...(graduationDate !== undefined && { graduationDate: graduationDate ? new Date(graduationDate) : null }),
      ...(githubUrl !== undefined && { githubUrl: githubUrl.trim() }),
      ...(linkedinUrl !== undefined && { linkedinUrl: linkedinUrl.trim() }),
      ...(req.user?.clerkId && { clerkId: req.user.clerkId }),
    };

    // 3. Process resume ONLY if a new file was uploaded
    if (req.file) {
      const resumeUrl = await uploadResumePdf(req.file);
      const { profile, userEmbedding } = await parseResumeFromUrl(resumeUrl);

      const combinedSkills = Array.from(
        new Set([
          ...(profile.primary_skills || []),
          ...(profile.secondary_skills || []),
        ])
      );

      updateData = {
        ...updateData,
        resumeFileUrl: resumeUrl,
        profileEmbedding: userEmbedding,
        parsedProfile: profile,
        skills: combinedSkills,
        experienceLevel: profile.experience_level || "INTERMEDIATE",
        summary: profile.summary || "",
      };
    }

    // 4. Handle manual skill updates from SkillInventory (if sent without a new file)
    const rawSkills = req.body.skills || req.body["skills[]"];
    if (rawSkills) {
      updateData.skills = Array.isArray(rawSkills) ? rawSkills : [rawSkills];
    }

    // 5. Atomic upsert anchored to existing user ID or email
    const updatedUser = await User.findOneAndUpdate(
      req.user?._id ? { _id: req.user._id } : { email: finalEmail },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    ).select("-__v"); // Kept profileEmbedding so the UI shows "VECTOR_SYNCHRONIZED"

    return res.status(200).json({
      success: true,
      message: "Profile saved successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("[saveUser Controller Error]:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Candidate profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("[getUser Controller Error]:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error while retrieving profile.",
    });
  }
};