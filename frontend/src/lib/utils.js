/**
 * Utility class combiner for Tailwind CSS class strings.
 * Filters out falsy values and joins tokens cleanly.
 *
 * @param  {...(string|boolean|undefined|null)} classes
 * @returns {string}
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

/**
 * Formats monetary prize pool figures in Indian Rupee (INR) denomination.
 *
 * @param {number|string|null} amount - Numeric prize value
 * @returns {string} Formatted currency string
 */
export const formatPrize = (amount) => {
  if (amount === null || amount === undefined || amount === "" || Number(amount) === 0) {
    return "UNSPECIFIED / PERKS";
  }
  const numeric = Number(amount);
  if (isNaN(numeric)) return "UNSPECIFIED / PERKS";
  return `₹${numeric.toLocaleString("en-IN")}`;
};

/**
 * Formats hackathon registration fees.
 *
 * @param {number|string|null} fee - Numeric fee value
 * @returns {string} Formatted fee string or "FREE REGISTRATION"
 */
export const formatFee = (fee) => {
  if (fee === null || fee === undefined || fee === "" || Number(fee) === 0) {
    return "FREE REGISTRATION";
  }
  const numeric = Number(fee);
  if (isNaN(numeric)) return "FREE REGISTRATION";
  return `₹${numeric.toLocaleString("en-IN")}`;
};

/**
 * Formats ISO date strings or Date objects into standardized ERP date strings.
 *
 * @param {string|Date|null} dateInput - ISO string, timestamp, or Date object
 * @param {boolean} [includeTime=false] - Whether to include 24-hour timestamp
 * @returns {string} Formatted date string
 */
export const formatDate = (dateInput, includeTime = false) => {
  if (!dateInput) return "NO DEADLINE";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "INVALID DATE";

  const options = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
  };

  return date.toLocaleDateString("en-IN", options);
};

/**
 * Calculates remaining days until a given deadline.
 *
 * @param {string|Date|null} deadline - Target deadline
 * @returns {number|null} Days remaining (negative if expired, null if absent)
 */
export const getDaysRemaining = (deadline) => {
  if (!deadline) return null;
  const target = new Date(deadline);
  if (isNaN(target.getTime())) return null;

  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Evaluates operational lifecycle status based on an explicit status string or deadline date.
 *
 * @param {string} [status] - Explicit status string from DB
 * @param {string|Date} [deadline] - Submission deadline
 * @returns {"OPEN" | "CLOSING_SOON" | "EXPIRED" | "ACTIVE" | "ARCHIVED"}
 */
export const resolveStatus = (status, deadline) => {
  if (status) {
    const upper = status.trim().toUpperCase();
    if (["OPEN", "CLOSING_SOON", "EXPIRED", "ACTIVE", "ARCHIVED"].includes(upper)) {
      return upper;
    }
  }

  const days = getDaysRemaining(deadline);
  if (days === null) return "ACTIVE";
  if (days < 0) return "EXPIRED";
  if (days <= 3) return "CLOSING_SOON";
  return "OPEN";
};

/**
 * Standardizes team size constraints into a compact ERP badge format.
 *
 * @param {{ min?: number|null, max?: number|null }|null} teamSize
 * @returns {string} Formatted team size string
 */
export const formatTeamSize = (teamSize) => {
  if (!teamSize || (!teamSize.min && !teamSize.max)) {
    return "ANY / UNSPECIFIED";
  }
  const { min, max } = teamSize;
  if (min && max && min === max) return `${min} MEMBERS`;
  if (min && max) return `${min} - ${max} MEMBERS`;
  if (min) return `MIN ${min} MEMBERS`;
  if (max) return `UP TO ${max} MEMBERS`;
  return "ANY / UNSPECIFIED";
};

/**
 * Evaluates match score styling and tier categorization.
 *
 * @param {number} score - Match percentage (0 to 100)
 * @returns {{ label: string, colorClass: string, tier: string }}
 */
export const getScoreTier = (score) => {
  const numeric = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));

  if (numeric >= 75) {
    return {
      tier: "HIGH",
      label: "STRONG MATCH",
      colorClass: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    };
  }
  if (numeric >= 50) {
    return {
      tier: "MODERATE",
      label: "VIABLE",
      colorClass: "bg-blue-950/60 text-blue-400 border-blue-800/60",
    };
  }
  if (numeric >= 30) {
    return {
      tier: "LOW",
      label: "STRETCH",
      colorClass: "bg-amber-950/50 text-amber-400 border-amber-800/50",
    };
  }
  return {
    tier: "MINIMAL",
    label: "LOW RELEVANCE",
    colorClass: "bg-zinc-900 text-zinc-500 border-zinc-800",
  };
};

/**
 * Truncates text cleanly at word boundaries with an ellipsis.
 *
 * @param {string} text - Input text
 * @param {number} [maxLength=100] - Maximum character limit
 * @returns {string}
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || typeof text !== "string") return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
};