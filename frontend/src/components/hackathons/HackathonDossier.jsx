import React from "react";
import { MatchBadge } from "../common/MatchBadge";
import { SkillTag } from "../common/SkillTag";
import { StatusPill } from "../common/StatusPill";

export const HackathonDossier = ({ hackathon: rawInput }) => {
  // Unwrap document if wrapped under .data
  const hackathon =
    rawInput?.data?.title || rawInput?.data?._id
      ? rawInput.data
      : rawInput;

  if (!hackathon || !hackathon.title) {
    return (
      <div className="border border-zinc-800 rounded bg-[#0c0c0e] p-8 text-center font-mono text-xs text-zinc-500">
        NO HACKATHON RECORD LOADED
      </div>
    );
  }

  const formatTeamSize = (teamSize) => {
    if (!teamSize) return "ANY / UNSPECIFIED";
    if (typeof teamSize === "string") return teamSize.toUpperCase();
    if (typeof teamSize === "number") return `${teamSize} MEMBERS`;
    if (!teamSize.min && !teamSize.max) return "ANY / UNSPECIFIED";
    if (teamSize.min === teamSize.max) return `${teamSize.min} MEMBERS`;
    if (teamSize.min && teamSize.max) return `${teamSize.min} - ${teamSize.max} MEMBERS`;
    if (teamSize.min) return `MIN ${teamSize.min} MEMBERS`;
    return `UP TO ${teamSize.max} MEMBERS`;
  };

  const formatPrize = (prize) => {
    if (prize === null || prize === undefined || prize === 0) return "UNSPECIFIED / PERKS";
    return `₹${Number(prize).toLocaleString("en-IN")}`;
  };

  const formatFee = (fee) => {
    if (fee === null || fee === undefined || fee === 0) return "FREE REGISTRATION";
    return `₹${Number(fee).toLocaleString("en-IN")}`;
  };

  const categories = hackathon.categories || [];
  const techStack = hackathon.techStack || [];
  const eligibility = Array.isArray(hackathon.eligibility)
    ? hackathon.eligibility
    : hackathon.eligibility
    ? [hackathon.eligibility]
    : [];

  return (
    <div className="space-y-4 font-sans text-xs">
      <div className="border border-zinc-800 rounded bg-[#0c0c0e] p-5 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500 uppercase">
              <span>ORGANIZER:</span>
              <span className="text-zinc-300 font-semibold">{hackathon.organizer || "UNSPECIFIED"}</span>
              {hackathon.location && (
                <>
                  <span className="text-zinc-700">/</span>
                  <span className="text-zinc-400">{hackathon.location}</span>
                </>
              )}
            </div>
            <h1 className="text-base font-bold text-zinc-100 tracking-tight">
              {hackathon.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {hackathon.finalScore !== undefined && hackathon.finalScore !== null && (
              <MatchBadge score={hackathon.finalScore} />
            )}
            <StatusPill status={hackathon.status} deadline={hackathon.currentDeadline} />
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-mono text-[11px]">
          <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded">
            <span className="text-zinc-500 block uppercase text-[10px]">REWARD POOL</span>
            <span className="text-emerald-400 font-semibold block mt-0.5">
              {formatPrize(hackathon.prize)}
            </span>
          </div>

          <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded">
            <span className="text-zinc-500 block uppercase text-[10px]">REGISTRATION FEE</span>
            <span className="text-zinc-200 font-medium block mt-0.5">
              {formatFee(hackathon.fee)}
            </span>
          </div>

          <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded">
            <span className="text-zinc-500 block uppercase text-[10px]">TEAM CONSTRAINT</span>
            <span className="text-zinc-200 font-medium block mt-0.5">
              {formatTeamSize(hackathon.teamSize)}
            </span>
          </div>

          <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded">
            <span className="text-zinc-500 block uppercase text-[10px]">SUBMISSION DEADLINE</span>
            <span className="text-zinc-200 font-medium block mt-0.5">
              {hackathon.currentDeadline
                ? new Date(hackathon.currentDeadline).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "OPEN / TBD"}
            </span>
          </div>
        </div>

        {/* Categories & Link */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-wrap gap-1.5 items-center">
            {categories.map((cat, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[10px] rounded uppercase"
              >
                {cat}
              </span>
            ))}
          </div>

          {hackathon.link && (
            <a
              href={hackathon.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded font-mono text-[11px] transition-colors"
            >
              <span>PORTAL LISTING</span>
              <span>↗</span>
            </a>
          )}
        </div>
      </div>

      {/* Target Technologies & Eligibility */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-zinc-800 rounded bg-[#0c0c0e] p-4 space-y-2">
          <span className="font-mono text-[10px] text-zinc-500 uppercase block">
            Targeted Technologies
          </span>
          <div className="flex flex-wrap gap-1">
            {techStack.length > 0 ? (
              techStack.map((tech, idx) => (
                <SkillTag key={idx} skill={tech} variant="neutral" />
              ))
            ) : (
              <span className="text-zinc-600 font-mono text-[11px]">General / Unrestricted Stack</span>
            )}
          </div>
        </div>

        <div className="border border-zinc-800 rounded bg-[#0c0c0e] p-4 space-y-2">
          <span className="font-mono text-[10px] text-zinc-500 uppercase block">
            Eligibility Criteria
          </span>
          <div className="flex flex-wrap gap-1">
            {eligibility.length > 0 ? (
              eligibility.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded"
                >
                  {item}
                </span>
              ))
            ) : (
              <span className="text-zinc-600 font-mono text-[11px]">Open to all candidates</span>
            )}
          </div>
        </div>
      </div>

      {/* Scraped Problem Statement */}
      <div className="border border-zinc-800 rounded bg-[#0c0c0e] p-5 space-y-3">
        <span className="font-mono text-[11px] text-zinc-500 uppercase tracking-wider block border-b border-zinc-800/80 pb-2">
          Scraped Problem Statement & Operational Context
        </span>

        {hackathon.contextText ? (
          <div className="p-4 bg-zinc-950 border border-zinc-800/70 rounded max-h-80 overflow-y-auto">
            <p className="text-zinc-300 leading-relaxed text-xs whitespace-pre-line font-sans">
              {hackathon.contextText}
            </p>
          </div>
        ) : (
          <div className="py-8 text-center font-mono text-zinc-600 text-xs">
            No contextual brief was parsed for this hackathon listing.
          </div>
        )}
      </div>
    </div>
  );
};

export default HackathonDossier;