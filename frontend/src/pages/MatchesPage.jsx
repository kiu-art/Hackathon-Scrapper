import React, { useEffect, useMemo } from "react";
import { HackathonTable } from "../components/hackathons/HackathonTable";
import { useHackathonStore } from "../store/useHackathonStore";
import { useUserStore } from "../store/useUserStore";

/**
 * MatchesPage
 * Main matchmaking dashboard displaying algorithmic telemetry,
 * candidate vector index alignment status, and the ranked hackathon catalog.
 *
 * @param {Function} onSelectHackathon - Callback invoked when navigating to a hackathon's dossier
 * @param {Function} [onNavigateToProfile] - Optional callback to redirect to candidate profile
 */
export const MatchesPage = ({ onSelectHackathon, onNavigateToProfile }) => {
  const {
    hackathons,
    loading,
    fetchHackathons,
    setSelectedHackathon,
  } = useHackathonStore();

  const { profile } = useUserStore();

  // Load recommendations on mount
  useEffect(() => {
    fetchHackathons();
  }, [fetchHackathons]);

  // Handle row click & update selected state
  const handleSelect = (hackathon) => {
    setSelectedHackathon(hackathon);
    if (onSelectHackathon) {
      onSelectHackathon(hackathon);
    }
  };

  // Telemetry statistics calculation
  const metrics = useMemo(() => {
    if (!hackathons || hackathons.length === 0) {
      return { total: 0, highMatch: 0, avgScore: 0, activeDeadlines: 0 };
    }

    let scoreSum = 0;
    let scoredCount = 0;
    let highMatchCount = 0;
    let activeDeadlinesCount = 0;

    const now = new Date();

    hackathons.forEach((h) => {
      if (typeof h.finalScore === "number") {
        scoreSum += h.finalScore;
        scoredCount++;
        if (h.finalScore >= 75) highMatchCount++;
      }
      if (h.currentDeadline && new Date(h.currentDeadline) > now) {
        activeDeadlinesCount++;
      }
    });

    return {
      total: hackathons.length,
      highMatch: highMatchCount,
      avgScore: scoredCount > 0 ? Math.round(scoreSum / scoredCount) : 0,
      activeDeadlines: activeDeadlinesCount,
    };
  }, [hackathons]);

  const hasVector = Boolean(
    profile?.profileEmbedding && profile.profileEmbedding.length > 0
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans text-xs">
      {/* Page Title & Operational Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500 uppercase tracking-widest">
            <span>MODULE-01</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400">VECTOR & BM25 PIPELINE</span>
          </div>
          <h1 className="text-base font-bold text-zinc-100 tracking-tight mt-0.5">
            Hackathon Matchmaking Matrix
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchHackathons()}
            disabled={loading.list}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-[11px] rounded border border-zinc-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className={loading.list ? "animate-spin" : ""}>↻</span>
            <span>{loading.list ? "QUERYING..." : "RE-INDEX CLUSTER"}</span>
          </button>
        </div>
      </div>

      {/* Vector Readiness Diagnostic Banner */}
      {!hasVector && (
        <div className="border border-amber-900/50 bg-amber-950/20 rounded p-4 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>CANDIDATE VECTOR PROFILE UNINITIALIZED</span>
            </div>
            <p className="text-zinc-400 text-[11px] font-sans">
              Personalized similarity scores and skill gap analyses require an indexed resume.
              Unranked general listings are shown below.
            </p>
          </div>

          {onNavigateToProfile && (
            <button
              type="button"
              onClick={onNavigateToProfile}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-[11px] rounded transition-colors whitespace-nowrap"
            >
              INGEST RESUME →
            </button>
          )}
        </div>
      )}

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-mono text-[11px]">
        <div className="p-3 bg-[#0c0c0e] border border-zinc-800 rounded">
          <span className="text-zinc-500 block uppercase text-[10px]">
            INDEXED HACKATHONS
          </span>
          <span className="text-zinc-100 font-semibold text-sm block mt-0.5">
            {metrics.total}
          </span>
        </div>

        <div className="p-3 bg-[#0c0c0e] border border-zinc-800 rounded">
          <span className="text-zinc-500 block uppercase text-[10px]">
            HIGH ALIGNMENT (≥75%)
          </span>
          <span className="text-emerald-400 font-semibold text-sm block mt-0.5">
            {metrics.highMatch}
          </span>
        </div>

        <div className="p-3 bg-[#0c0c0e] border border-zinc-800 rounded">
          <span className="text-zinc-500 block uppercase text-[10px]">
            AVERAGE MATCH SCORE
          </span>
          <span className="text-blue-400 font-semibold text-sm block mt-0.5">
            {metrics.avgScore > 0 ? `${metrics.avgScore}%` : "—"}
          </span>
        </div>

        <div className="p-3 bg-[#0c0c0e] border border-zinc-800 rounded">
          <span className="text-zinc-500 block uppercase text-[10px]">
            ACTIVE DEADLINES
          </span>
          <span className="text-zinc-200 font-semibold text-sm block mt-0.5">
            {metrics.activeDeadlines}
          </span>
        </div>
      </div>

      {/* Main Hackathon Table Stage */}
      <div className="space-y-2">
        <HackathonTable
          hackathons={hackathons}
          onSelectHackathon={handleSelect}
          isLoading={loading.list}
        />
      </div>
    </div>
  );
};

export default MatchesPage;