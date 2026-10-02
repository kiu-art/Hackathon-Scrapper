import React, { useEffect } from "react";
import { ProfileForm } from "../components/profile/ProfileForm";
import { ResumeUploader } from "../components/profile/ResumeUploader";
import { SkillInventory } from "../components/profile/SkillInventory";
import { useUserStore } from "../store/useUserStore";

/**
 * ProfilePage
 * Candidate identity, resume ingestion, and vector semantic registry view.
 * Unites personal/academic metadata editing with PDF parsing and Gemini 3072-dim vector telemetry.
 */
export const ProfilePage = () => {
  const { profile, loading, fetchProfile } = useUserStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const isInitialLoading = loading?.fetching && !profile;
  const hasEmbedding = Boolean(
    profile?.profileEmbedding && profile.profileEmbedding.length > 0
  );

  if (isInitialLoading) {
    return (
      <div className="py-24 text-center font-mono text-xs text-zinc-500 space-y-3">
        <div className="inline-block w-4 h-4 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
        <p>SYNCHRONIZING CANDIDATE RECORD & VECTOR PARAMETERS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-xs">
      {/* Top ERP Breadcrumb & Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500 uppercase tracking-widest">
            <span>MODULE-02</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400">VECTOR & CANDIDATE REGISTRY</span>
          </div>
          <h1 className="text-base font-bold text-zinc-100 tracking-tight mt-0.5">
            Candidate Profile & Semantic Vector Hub
          </h1>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-zinc-500">STATE:</span>
          <span
            className={`px-2 py-0.5 rounded border text-[10px] ${
              hasEmbedding
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                : "bg-amber-950/50 text-amber-400 border-amber-800/50"
            }`}
          >
            {hasEmbedding ? "VECTOR_SYNCHRONIZED" : "INDEX_PENDING"}
          </span>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Metadata & Identity Editor */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 uppercase tracking-wider px-1">
            <span>SECTION 01 // METADATA & ACADEMICS</span>
          </div>
          <ProfileForm initialData={profile} />
        </div>

        {/* Right Column: PDF Ingestion & Semantic Vector Diagnostics */}
        <div className="lg:col-span-7 space-y-6">
          {/* Resume Upload Module */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 uppercase tracking-wider px-1">
              <span>SECTION 02 // RESUME PARSER & VECTOR PIPELINE</span>
            </div>
            <ResumeUploader />
          </div>

          {/* Extracted Skills, Summary, & Embedding Diagnostics */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 uppercase tracking-wider px-1">
              <span>SECTION 03 // EXTRACTED ENTITIES & TELEMETRY</span>
            </div>
            <SkillInventory profileData={profile} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;