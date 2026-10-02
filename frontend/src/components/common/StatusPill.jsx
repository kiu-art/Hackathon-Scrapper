import React from "react";

/**
 * StatusPill
 * ERP-styled status and deadline lifecycle indicator with visual dot signaling.
 *
 * @param {"OPEN" | "CLOSING_SOON" | "EXPIRED" | "ACTIVE" | "ARCHIVED" | string} [status] - Explicit status string
 * @param {string | Date} [deadline] - Optional deadline ISO string/Date to auto-evaluate status
 * @param {string} [className=""] - Extra Tailwind utility classes
 */
export const StatusPill = ({ status, deadline, className = "" }) => {
  // Determine effective status if deadline is provided
  const resolveStatus = () => {
    if (status) return status.toUpperCase();

    if (deadline) {
      const now = new Date();
      const target = new Date(deadline);
      const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return "EXPIRED";
      if (diffDays <= 3) return "CLOSING_SOON";
      return "OPEN";
    }

    return "ACTIVE";
  };

  const currentStatus = resolveStatus();

  // ERP palette mappings
  const config = {
    OPEN: {
      label: "OPEN",
      container: "bg-emerald-950/40 text-emerald-400 border-emerald-800/50",
      dot: "bg-emerald-500",
    },
    ACTIVE: {
      label: "ACTIVE",
      container: "bg-emerald-950/40 text-emerald-400 border-emerald-800/50",
      dot: "bg-emerald-500",
    },
    CLOSING_SOON: {
      label: "EXPIRING SOON",
      container: "bg-amber-950/40 text-amber-400 border-amber-800/50",
      dot: "bg-amber-400 animate-pulse",
    },
    EXPIRED: {
      label: "CLOSED",
      container: "bg-zinc-900 text-zinc-500 border-zinc-800",
      dot: "bg-zinc-600",
    },
    ARCHIVED: {
      label: "ARCHIVED",
      container: "bg-zinc-900 text-zinc-500 border-zinc-800",
      dot: "bg-zinc-600",
    },
  };

  const { label, container, dot } = config[currentStatus] || {
    label: currentStatus,
    container: "bg-zinc-900 text-zinc-400 border-zinc-800",
    dot: "bg-zinc-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[10px] font-medium tracking-tight whitespace-nowrap select-none ${container} ${className}`}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot}`} />
      <span>{label}</span>
    </span>
  );
};

export default StatusPill;