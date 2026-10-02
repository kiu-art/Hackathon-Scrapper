import React from "react";

/**
 * SkillTag
 * Monospace tag component for matched skills, missing skill gaps, or general inventory.
 *
 * @param {string} skill - Technology / skill name
 * @param {"matched" | "missing" | "neutral"} [variant="neutral"] - Display variant
 * @param {Function} [onRemove] - Optional callback when tag is dismissed
 * @param {string} [className=""] - Extra Tailwind utility classes
 */
export const SkillTag = ({
  skill,
  variant = "neutral",
  onRemove,
  className = "",
}) => {
  if (!skill) return null;

  const variantStyles = {
    matched: "bg-emerald-950/40 text-emerald-400 border-emerald-800/50",
    missing: "bg-red-950/40 text-red-400 border-red-900/40",
    neutral: "bg-zinc-900 text-zinc-300 border-zinc-800",
  };

  const currentStyle = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono text-[10px] leading-tight tracking-tight whitespace-nowrap select-none ${currentStyle} ${className}`}
    >
      <span>{skill}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(skill);
          }}
          className="ml-0.5 text-zinc-500 hover:text-zinc-200 leading-none focus:outline-none"
          aria-label={`Remove ${skill}`}
        >
          ×
        </button>
      )}
    </span>
  );
};

export default SkillTag;