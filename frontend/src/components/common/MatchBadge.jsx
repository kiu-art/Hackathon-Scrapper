import React from "react";

/**
 * MatchBadge
 * Compact ERP indicator pill displaying algorithmic match score percentage.
 *
 * @param {number} score - Match score from 0 to 100
 * @param {string} [label="MATCH"] - Optional label text
 * @param {string} [className=""] - Additional custom classes
 */
export const MatchBadge = ({ score = 0, label = "MATCH", className = "" }) => {
  const numericScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));

  // Strict ERP tiering: muted backgrounds, 1px subtle borders, high contrast text
  const getTierStyles = (val) => {
    if (val >= 75) {
      return "bg-emerald-950/60 text-emerald-400 border-emerald-800/60";
    }
    if (val >= 50) {
      return "bg-blue-950/60 text-blue-400 border-blue-800/60";
    }
    if (val >= 30) {
      return "bg-amber-950/50 text-amber-400 border-amber-800/50";
    }
    return "bg-zinc-900 text-zinc-500 border-zinc-800";
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono text-[11px] font-semibold tracking-tight whitespace-nowrap select-none ${getTierStyles(
        numericScore
      )} ${className}`}
    >
      <span>{numericScore}%</span>
      {label && <span className="text-[9px] opacity-75 uppercase tracking-wide">{label}</span>}
    </span>
  );
};

export default MatchBadge;