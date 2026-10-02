import React, { useState } from "react";
import { useUserStore } from "../../store/useUserStore";
import { SkillTag } from "../common/SkillTag";
import toast from "react-hot-toast";

/**
 * SkillInventory
 * ERP diagnostics and inspection panel for candidate vector embeddings,
 * experience classification tiers, AI-generated summary, and extracted skills.
 *
 * @param {Object} [profileData] - Optional explicit profile override
 */
export const SkillInventory = ({ profileData }) => {
  const { profile: storeProfile, updateProfile, loading } = useUserStore();
  const profile = profileData || storeProfile;

  const [newSkillInput, setNewSkillInput] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const skills = profile?.skills || [];
  const experienceLevel = profile?.experienceLevel || "INTERMEDIATE";
  const summary = profile?.summary || "";
  const hasEmbedding = Boolean(
    profile?.profileEmbedding && profile.profileEmbedding.length > 0
  );

  // Filter skills by live query
  const filteredSkills = skills.filter((s) =>
    s.toLowerCase().includes(skillSearch.toLowerCase().trim())
  );

  // Experience level badge color mapping
  const getExperienceBadgeStyles = (level) => {
    switch (level?.toUpperCase()) {
      case "ADVANCED":
        return "bg-purple-950/50 text-purple-400 border-purple-800/60";
      case "INTERMEDIATE":
        return "bg-blue-950/50 text-blue-400 border-blue-800/60";
      case "BEGINNER":
        return "bg-emerald-950/50 text-emerald-400 border-emerald-800/60";
      default:
        return "bg-zinc-900 text-zinc-400 border-zinc-800";
    }
  };

  // Add custom skill to profile
  const handleAddSkill = async (e) => {
    e.preventDefault();
    const formatted = newSkillInput.trim();
    if (!formatted) return;

    if (skills.some((s) => s.toLowerCase() === formatted.toLowerCase())) {
      toast.error("Skill already registered in inventory");
      return;
    }

    const updatedSkills = [...skills, formatted];
    const formData = new FormData();
    updatedSkills.forEach((s) => formData.append("skills[]", s));

    try {
      await updateProfile(formData);
      setNewSkillInput("");
      setIsAdding(false);
      toast.success(`Registered skill: ${formatted}`);
    } catch {
      // Error handled in store
    }
  };

  // Remove skill from profile
  const handleRemoveSkill = async (skillToRemove) => {
    const updatedSkills = skills.filter((s) => s !== skillToRemove);
    const formData = new FormData();
    updatedSkills.forEach((s) => formData.append("skills[]", s));

    try {
      await updateProfile(formData);
      toast.success(`Removed skill: ${skillToRemove}`);
    } catch {
      // Error handled in store
    }
  };

  return (
    <div className="border border-zinc-800 rounded bg-[#0c0c0e] p-5 space-y-5 font-sans text-xs">
      {/* Module Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div>
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
            MODULE // VECTOR TELEMETRY & SKILLS
          </span>
          <h2 className="text-sm font-semibold text-zinc-100 mt-0.5">
            Extracted Intelligence & Semantic Schema
          </h2>
        </div>

        <span
          className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
            hasEmbedding
              ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
              : "bg-zinc-900 text-zinc-500 border-zinc-800"
          }`}
        >
          {hasEmbedding ? "VECTOR_SYNCHRONIZED" : "EMBEDDING_PENDING"}
        </span>
      </div>

      {/* Vector Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[11px]">
        <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded">
          <span className="text-zinc-500 block uppercase text-[10px]">
            EXPERIENCE TIER
          </span>
          <span
            className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold mt-1 ${getExperienceBadgeStyles(
              experienceLevel
            )}`}
          >
            {experienceLevel}
          </span>
        </div>

        <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded">
          <span className="text-zinc-500 block uppercase text-[10px]">
            VECTOR MODEL
          </span>
          <span className="text-zinc-200 font-medium block mt-1">
            GEMINI-EMBED-001
          </span>
        </div>

        <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded">
          <span className="text-zinc-500 block uppercase text-[10px]">
            DIMENSIONALITY
          </span>
          <span className="text-zinc-200 font-medium block mt-1">
            3072 FLOAT32
          </span>
        </div>

        <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded">
          <span className="text-zinc-500 block uppercase text-[10px]">
            INDEXED ENTITIES
          </span>
          <span className="text-emerald-400 font-medium block mt-1">
            {skills.length} SKILLS PARSED
          </span>
        </div>
      </div>

      {/* Candidate Executive Summary */}
      <div className="space-y-2">
        <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">
          Synthesized Candidate Abstract
        </span>

        {summary ? (
          <div className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded font-sans text-xs text-zinc-300 leading-relaxed">
            {summary}
          </div>
        ) : (
          <div className="py-6 text-center border border-dashed border-zinc-800/70 rounded bg-zinc-950/40 font-mono text-[11px] text-zinc-600">
            No summary generated. Ingest a PDF resume to extract profile brief.
          </div>
        )}
      </div>

      {/* Skill Inventory Workspace */}
      <div className="space-y-3 pt-2 border-t border-zinc-800/80">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">
            Indexed Skill Matrix ({skills.length})
          </span>

          <div className="flex items-center gap-2">
            {/* Inline search */}
            <input
              type="text"
              placeholder="Search skills..."
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-zinc-300 placeholder-zinc-700 font-mono text-[10px] focus:outline-none focus:border-zinc-700 w-28 sm:w-36"
            />

            {/* Toggle Add Skill */}
            <button
              type="button"
              onClick={() => setIsAdding((prev) => !prev)}
              className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-[10px] rounded border border-zinc-800 transition-colors"
            >
              {isAdding ? "CANCEL" : "+ ADD"}
            </button>
          </div>
        </div>

        {/* Add Skill Field */}
        {isAdding && (
          <form
            onSubmit={handleAddSkill}
            className="flex items-center gap-2 p-2 bg-zinc-950 border border-zinc-800 rounded"
          >
            <input
              type="text"
              placeholder="e.g. PyTorch, Kubernetes, Solidity"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              disabled={loading?.saving}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-zinc-200 placeholder-zinc-700 font-mono text-[11px] focus:outline-none focus:border-zinc-600"
            />
            <button
              type="submit"
              disabled={loading?.saving || !newSkillInput.trim()}
              className="px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-[10px] font-semibold rounded disabled:opacity-50 transition-colors"
            >
              COMMIT
            </button>
          </form>
        )}

        {/* Tags Container */}
        <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded min-h-[100px] max-h-56 overflow-y-auto">
          {skills.length === 0 ? (
            <div className="h-20 flex items-center justify-center font-mono text-[11px] text-zinc-600">
              No skills registered. Upload a resume or manually add tags.
            </div>
          ) : filteredSkills.length === 0 ? (
            <div className="h-20 flex items-center justify-center font-mono text-[11px] text-zinc-600">
              No skills matching "{skillSearch}"
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {filteredSkills.map((skill, idx) => (
                <SkillTag
                  key={`${skill}-${idx}`}
                  skill={skill}
                  variant="neutral"
                  onRemove={handleRemoveSkill}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Diagnostic Note */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-900 font-mono text-[10px] text-zinc-600">
        <span>ENGINE: COSINE SIMILARITY + BM25 TOKEN SCAN</span>
        <span>INDEX STATUS: READ_READY</span>
      </div>
    </div>
  );
};

export default SkillInventory;