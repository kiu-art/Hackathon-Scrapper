import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { HackathonDossier } from "../components/hackathons/HackathonDossier";
import { useHackathonStore } from "../store/useHackathonStore";

export const HackathonDetailPage = ({ hackathonId: propId, hackathon, id, onBack }) => {
  // 1. Resolve router params if using React Router (/hackathons/:id)
  let routeParams = {};
  try {
    routeParams = useParams() || {};
  } catch (e) {}

  const {
    selectedHackathon,
    activePitch,
    loading,
    generatePitch,
    fetchHackathonById,
  } = useHackathonStore();

  const [copied, setCopied] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState("");

  // 2. Resolve target ID from all potential sources
  const targetId =
    (typeof propId === "string" ? propId : null) ||
    routeParams.id ||
    routeParams.hackathonId ||
    id ||
    selectedHackathon?._id ||
    selectedHackathon?.id;

  const targetHackathon = selectedHackathon?.data || selectedHackathon;

  // 3. UNBLOCKED FETCH: Always fetch full details if contextText is missing
  useEffect(() => {
    if (!targetId || !fetchHackathonById) return;

    // Check if the current record in state is just a shallow catalog card
    const isShallow = !targetHackathon || !targetHackathon.contextText;
    const isDifferentId = targetHackathon?._id !== targetId && targetHackathon?.id !== targetId;

    if (isShallow || isDifferentId) {
      console.log(`[DetailPage] Triggering live API fetch for ID: ${targetId}`);
      fetchHackathonById(targetId);
    }
  }, [targetId, targetHackathon?.contextText, fetchHackathonById]);

  // Set default track when record loads
  useEffect(() => {
    if (targetHackathon && !selectedTrack) {
      const defaultTrack =
        targetHackathon.tracks?.[0] ||
        targetHackathon.categories?.[0] ||
        "General Track";
      setSelectedTrack(defaultTrack);
    }
  }, [targetHackathon, selectedTrack]);

  const handleGeneratePitch = () => {
    if (!targetId) return;
    generatePitch(targetId, selectedTrack);
  };

  const handleCopyPitch = () => {
    if (!activePitch) return;
    const textToCopy = `
PROJECT: ${activePitch.project_title || activePitch.title}
TAGLINE: ${activePitch.tagline}

PROBLEM:
${activePitch.problem_statement}

SOLUTION:
${activePitch.solution_overview}

KEY FEATURES:
${(activePitch.key_features || []).map((f, i) => `${i + 1}.${f}`).join("\n")}

RECOMMENDED STACK:
${(activePitch.recommended_stack || []).map((s) => `- ${s}`).join("\n")}

DEMO STRATEGY:
${activePitch.demo_strategy}
    `.trim();

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading?.hackathon && !targetHackathon?.contextText) {
    return (
      <div className="py-24 text-center font-mono text-xs text-zinc-500 space-y-3">
        <div className="inline-block w-4 h-4 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
        <p>HYDRATING DEEP HACKATHON RECORD ({targetId})...</p>
      </div>
    );
  }

  if (!targetHackathon) {
    return (
      <div className="border border-zinc-800 rounded bg-[#0c0c0e] p-8 text-center space-y-4 font-mono text-xs">
        <p className="text-zinc-500">NO HACKATHON RECORD SELECTED OR FOUND.</p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded transition-colors"
          >
            ← RETURN TO MATCHES DIRECTORY
          </button>
        )}
      </div>
    );
  }

  const tracks = Array.from(
    new Set([
      ...(targetHackathon.tracks || []),
      ...(targetHackathon.categories || []),
    ])
  );

  return (
    <div className="space-y-6 max-w-6xl pb-20 font-sans text-xs">
      {/* Top ERP Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-[11px] rounded border border-zinc-800 transition-colors flex items-center gap-1.5"
            >
              <span>←</span>
              <span>INDEX</span>
            </button>
          )}

          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500 uppercase">
            <span>HACKATHONS</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400 truncate max-w-xs">{targetHackathon.title}</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-200 font-semibold">DOSSIER</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
          <span>RECORD ID:</span>
          <span className="bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded border border-zinc-800">
            {targetId ? String(targetId).slice(-8) : "N/A"}
          </span>
        </div>
      </div>

      {/* Section 01: Deep Hackathon Specifications */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 uppercase tracking-widest px-1">
          <span>01 // HACKATHON SPECIFICATIONS & OPERATIONAL CONTEXT</span>
        </div>
        <HackathonDossier hackathon={targetHackathon} hackathonId={targetId} />
      </section>

      {/* Section 02: Full MVP Pitch Strategy Deck */}
      <section className="space-y-3 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
            <span>02 // GENERATIVE MVP ARCHITECTURE & PITCH DESK</span>
            {activePitch && (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[9px] font-mono">
                SYNCHRONIZED
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {tracks.length > 0 && (
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-[11px] font-mono focus:outline-none focus:border-zinc-600"
              >
                {tracks.map((track) => (
                  <option key={track} value={track}>
                    Track: {track}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleGeneratePitch}
              disabled={loading?.pitch}
              className="px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-[11px] font-medium rounded border border-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading?.pitch ? (
                <>
                  <div className="w-3 h-3 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  <span>SYNTHESIZING...</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>{activePitch ? "RE-GENERATE PITCH" : "SYNTHESIZE STRATEGY"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {activePitch ? (
          <div className="border border-zinc-800 bg-[#0c0c0e] rounded-lg p-5 space-y-6">
            <div className="border-b border-zinc-800/80 pb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5 max-w-3xl">
                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono text-[9px] px-1.5 py-0.5 rounded uppercase">
                  AI Proposed MVP
                </span>
                <h2 className="text-base font-semibold text-zinc-100 font-mono tracking-tight">
                  {activePitch.project_title || activePitch.title}
                </h2>
                <p className="text-zinc-400 text-xs italic">"{activePitch.tagline}"</p>
              </div>

              <button
                type="button"
                onClick={handleCopyPitch}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-[10px] rounded border border-zinc-800 transition-colors flex items-center gap-1.5 self-start"
              >
                <span>{copied ? "✓ COPIED" : "📋 EXPORT FULL PITCH"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded p-4 space-y-2">
                <span className="font-mono text-[10px] text-rose-400 font-semibold uppercase tracking-wider block">
                  Problem Statement
                </span>
                <p className="text-zinc-300 text-xs leading-relaxed">{activePitch.problem_statement}</p>
              </div>

              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded p-4 space-y-2">
                <span className="font-mono text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">
                  Solution Overview
                </span>
                <p className="text-zinc-300 text-xs leading-relaxed">{activePitch.solution_overview}</p>
              </div>
            </div>

            {activePitch.key_features && activePitch.key_features.length > 0 && (
              <div className="space-y-2.5">
                <span className="font-mono text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                  Key Technical Features
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {activePitch.key_features.map((feature, idx) => {
                    const colonIndex = feature.indexOf(":");
                    const title = colonIndex !== -1 ? feature.slice(0, colonIndex) : `Feature ${idx + 1}`;
                    const desc = colonIndex !== -1 ? feature.slice(colonIndex + 1) : feature;

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-zinc-900/40 border border-zinc-800/70 rounded space-y-1.5"
                      >
                        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-200 font-medium">
                          <span className="bg-zinc-800 text-zinc-400 px-1 py-0.2 rounded text-[10px]">
                            0{idx + 1}
                          </span>
                          <span className="text-zinc-200 font-semibold">{title.trim()}</span>
                        </div>
                        <p className="text-zinc-400 text-[11px] leading-relaxed pl-6">{desc.trim()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activePitch.recommended_stack && activePitch.recommended_stack.length > 0 && (
              <div className="space-y-2.5">
                <span className="font-mono text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                  Recommended Architecture & Tech Stack
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {activePitch.recommended_stack.map((item, idx) => {
                    const colonIndex = item.indexOf(":");
                    const category = colonIndex !== -1 ? item.slice(0, colonIndex) : `Module ${idx + 1}`;
                    const details = colonIndex !== -1 ? item.slice(colonIndex + 1) : item;

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-zinc-950 border border-zinc-800/80 rounded space-y-1.5"
                      >
                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wide block">
                          {category.trim()}
                        </span>
                        <p className="text-[11px] text-zinc-300 leading-snug">{details.trim()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 bg-zinc-950/70 border border-purple-900/30 rounded space-y-2">
                <span className="font-mono text-[10px] text-purple-400 font-semibold uppercase tracking-wider block">
                  👥 Ideal Teammate Profile
                </span>
                <p className="text-zinc-300 text-xs leading-relaxed">{activePitch.teammate_recommendation}</p>
              </div>

              <div className="p-4 bg-zinc-950/70 border border-amber-900/30 rounded space-y-2">
                <span className="font-mono text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">
                  🎯 Live Judging & Demo Strategy
                </span>
                <p className="text-zinc-300 text-xs leading-relaxed">{activePitch.demo_strategy}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-zinc-800 rounded-lg p-8 text-center space-y-3 bg-[#0c0c0e]/50">
            <div className="text-zinc-500 font-mono text-xs">
              NO SYNTHESIZED PITCH STRATEGY YET
            </div>
            <p className="text-zinc-500 text-xs max-w-md mx-auto">
              Select a preferred track above and generate a complete MVP architecture, tech stack, and pitch strategy tailored to your profile.
            </p>
            <button
              type="button"
              onClick={handleGeneratePitch}
              disabled={loading?.pitch}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded font-mono text-xs transition-colors"
            >
              GENERATE INITIAL STRATEGY
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default HackathonDetailPage;