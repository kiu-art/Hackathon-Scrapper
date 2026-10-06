import React, { useEffect, useMemo, useState } from "react";
import { HackathonTable } from "../components/hackathons/HackathonTable";
import { useHackathonStore } from "../store/useHackathonStore";
import { useUserStore } from "../store/useUserStore";

/**
 * Normalizes scores from the AI microservice's ScoredHackathon schema:
 * handles `final_score` (0-100 float), `finalScore`, or vector similarities.
 */
const extractScore = (h) => {
  if (!h) return null;
  const raw =
    h.final_score ??
    h.finalScore ??
    h.score ??
    h.matchScore ??
    h.compatibilityScore;

  if (typeof raw !== "number" || isNaN(raw)) return null;

  // Scale decimal fractions (e.g., 0.85 -> 85) or round float percentages (e.g., 84.7 -> 85)
  return Math.round(raw <= 1 && raw > 0 ? raw * 100 : raw);
};

export const MatchesPage = ({ onSelectHackathon, onNavigateToProfile }) => {
  const {
    hackathons,
    loading,
    fetchHackathons,
    setSelectedHackathon,
  } = useHackathonStore();

  const { profile } = useUserStore();

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [prizeFilter, setPrizeFilter] = useState("all"); // "all" | "any" | "50k" | "100k"
  const [minScore, setMinScore] = useState(0); // 0 | 50 | 75
  const [activeDeadlineOnly, setActiveDeadlineOnly] = useState(false);

  // Load recommendations on mount
  useEffect(() => {
    fetchHackathons();
  }, [fetchHackathons]);

  const handleSelect = (hackathon) => {
    setSelectedHackathon(hackathon);
    if (onSelectHackathon) {
      onSelectHackathon(hackathon);
    }
  };

  // 1. Dual-casing Normalization Bridge:
  // Bridges FastAPI's snake_case schema to standard React camelCase while keeping both intact.
  const normalizedHackathons = useMemo(() => {
    if (!Array.isArray(hackathons)) return [];

    return hackathons.map((h) => {
      const score = extractScore(h);
      const deadline = h.current_deadline ?? h.currentDeadline ?? h.deadline ?? null;
      const matched = h.matched_skills ?? h.matchedSkills ?? [];
      const missing = h.missing_skills ?? h.missingSkills ?? [];
      const techStack =
        h.tech_stack ??
        h.techStack ??
        [...matched, ...missing];

      return {
        ...h,
        // Match Scores (both casing conventions)
        finalScore: score,
        final_score: score,
        score: score,

        // AI Engine Telemetry
        vectorSimilarity: h.vector_similarity ?? h.vectorSimilarity ?? 0,
        vector_similarity: h.vector_similarity ?? h.vectorSimilarity ?? 0,
        techMatchRatio: h.tech_match_ratio ?? h.techMatchRatio ?? 0,
        tech_match_ratio: h.tech_match_ratio ?? h.techMatchRatio ?? 0,
        matchedSkills: matched,
        matched_skills: matched,
        missingSkills: missing,
        missing_skills: missing,
        fitSummary: h.fit_summary ?? h.fitSummary ?? null,
        fit_summary: h.fit_summary ?? h.fitSummary ?? null,

        // Core Hackathon Metadata
        techStack,
        tech_stack: techStack,
        currentDeadline: deadline,
        current_deadline: deadline,
        prize: typeof h.prize === "number" ? h.prize : Number(h.prize) || 0,
        fee: h.fee ?? null,
      };
    });
  }, [hackathons]);

  // 2. Telemetry Statistics Calculation
  const metrics = useMemo(() => {
    if (normalizedHackathons.length === 0) {
      return { total: 0, highMatch: 0, avgScore: 0, activeDeadlines: 0 };
    }

    let scoreSum = 0;
    let scoredCount = 0;
    let highMatchCount = 0;
    let activeDeadlinesCount = 0;
    const now = new Date();

    normalizedHackathons.forEach((h) => {
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
      total: normalizedHackathons.length,
      highMatch: highMatchCount,
      avgScore: scoredCount > 0 ? Math.round(scoreSum / scoredCount) : 0,
      activeDeadlines: activeDeadlinesCount,
    };
  }, [normalizedHackathons]);

  // 3. Multi-Variable Filter Pipeline
  const filteredHackathons = useMemo(() => {
    const now = new Date();
    const q = searchQuery.toLowerCase().trim();

    return normalizedHackathons.filter((h) => {
      // Free Registration Filter
      if (freeOnly) {
        const isFree =
          h.fee === 0 ||
          h.fee === null ||
          h.fee === undefined ||
          String(h.fee).toLowerCase() === "free";
        if (!isFree) return false;
      }

      // Cash Prize Filter
      if (prizeFilter === "any") {
        if (!h.prize || h.prize <= 0) return false;
      } else if (prizeFilter === "50k") {
        if (!h.prize || h.prize < 50000) return false;
      } else if (prizeFilter === "100k") {
        if (!h.prize || h.prize < 100000) return false;
      }

      // Match Score Threshold Filter
      if (minScore > 0) {
        if (typeof h.finalScore !== "number" || h.finalScore < minScore) {
          return false;
        }
      }

      // Active Deadlines Only Filter
      if (activeDeadlineOnly) {
        if (!h.currentDeadline || new Date(h.currentDeadline) <= now) {
          return false;
        }
      }

      // Text Search Query (Title, Organizer, Tech Stack, or Skills)
      if (q) {
        const titleMatch = h.title?.toLowerCase().includes(q);
        const orgMatch = h.organizer?.toLowerCase().includes(q);
        const matchedSkillMatch = h.matchedSkills.some((s) =>
          s.toLowerCase().includes(q)
        );
        const techMatch = h.techStack.some((s) => s.toLowerCase().includes(q));

        if (!titleMatch && !orgMatch && !matchedSkillMatch && !techMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    normalizedHackathons,
    freeOnly,
    prizeFilter,
    minScore,
    activeDeadlineOnly,
    searchQuery,
  ]);

  const hasVector = Boolean(
    profile?.profileEmbedding && profile.profileEmbedding.length > 0
  );

  const isFiltered =
    freeOnly ||
    prizeFilter !== "all" ||
    minScore > 0 ||
    activeDeadlineOnly ||
    searchQuery !== "";

  const resetFilters = () => {
    setFreeOnly(false);
    setPrizeFilter("all");
    setMinScore(0);
    setActiveDeadlineOnly(false);
    setSearchQuery("");
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans text-xs">
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500 uppercase tracking-widest">
            <span>MODULE-01</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400">HYBRID MATCH ENGINE (VECTOR + BM25)</span>
          </div>
          <h1 className="text-base font-bold text-zinc-100 tracking-tight mt-0.5">
            Hackathon Matchmaking Matrix
          </h1>
        </div>

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

      {/* Vector Readiness Diagnostic Banner */}
      {!hasVector && (
        <div className="border border-amber-900/50 bg-amber-950/20 rounded p-4 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>CANDIDATE VECTOR PROFILE UNINITIALIZED</span>
            </div>
            <p className="text-zinc-400 text-[11px] font-sans">
              Similarity scores and skill gap telemetry require an ingested resume embedding.
              Showing default baseline rankings below.
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

      {/* Interactive Filter Toolbar */}
      <div className="p-3 bg-[#0c0c0e] border border-zinc-800 rounded space-y-3 font-mono text-[11px]">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Quick Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <input
              type="text"
              placeholder="Filter by title, skill, tech stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1.5 text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Free Registration Filter */}
            <button
              type="button"
              onClick={() => setFreeOnly(!freeOnly)}
              className={`px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${
                freeOnly
                  ? "bg-emerald-950/40 border-emerald-700 text-emerald-400 font-semibold"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span>{freeOnly ? "✓" : "+"}</span>
              <span>FREE ENTRY</span>
            </button>

            {/* Prize Filter */}
            <select
              value={prizeFilter}
              onChange={(e) => setPrizeFilter(e.target.value)}
              aria-label="Filter by prize pool"
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-700"
            >
              <option value="all">PRIZE: ALL</option>
              <option value="any">PRIZE: CASH ONLY (&gt; ₹0)</option>
              <option value="50k">PRIZE: ≥ ₹50,000</option>
              <option value="100k">PRIZE: ≥ ₹1,00,000</option>
            </select>

            {/* Match Score Threshold */}
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              aria-label="Filter by minimum match score"
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-700"
            >
              <option value={0}>SCORE: ALL</option>
              <option value={50}>SCORE: ≥ 50%</option>
              <option value={75}>SCORE: ≥ 75% (TOP MATCH)</option>
            </select>

            {/* Active Deadlines Only */}
            <button
              type="button"
              onClick={() => setActiveDeadlineOnly(!activeDeadlineOnly)}
              className={`px-2.5 py-1.5 rounded border transition-colors ${
                activeDeadlineOnly
                  ? "bg-blue-950/40 border-blue-700 text-blue-400 font-semibold"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {activeDeadlineOnly ? "✓ ACTIVE ONLY" : "ACTIVE ONLY"}
            </button>

            {/* Reset Filters */}
            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2 py-1.5 text-zinc-500 hover:text-red-400 transition-colors"
              >
                RESET
              </button>
            )}
          </div>
        </div>

        {/* Status Counter */}
        <div className="flex items-center justify-between text-zinc-500 border-t border-zinc-900 pt-2 text-[10px]">
          <span>
            DISPLAYING {filteredHackathons.length} OF {normalizedHackathons.length} CANDIDATES
          </span>
          {isFiltered && (
            <span className="text-zinc-400 font-semibold">ACTIVE FILTERS APPLIED</span>
          )}
        </div>
      </div>

      {/* Main Hackathon Table Stage */}
      <div className="space-y-2">
        <HackathonTable
          hackathons={filteredHackathons}
          onSelectHackathon={handleSelect}
          isLoading={loading.list}
        />
      </div>
    </div>
  );
};

export default MatchesPage;