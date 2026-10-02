/**
 * Navigation Modules & ERP Routing
 */
export const NAV_MODULES = [
  {
    id: "matches",
    label: "MATCHMAKING",
    code: "MOD-01",
    description: "Ranked hackathons & gap analysis",
    path: "/matches",
  },
  {
    id: "profile",
    label: "CANDIDATE & VECTOR",
    code: "MOD-02",
    description: "Profile metadata & resume sync",
    path: "/profile",
  },
];

/**
 * User Schema Enums & Select Options
 */
export const GENDER_OPTIONS = [
  { value: "MALE", label: "MALE" },
  { value: "FEMALE", label: "FEMALE" },
  { value: "NON_BINARY", label: "NON-BINARY" },
  { value: "OTHER", label: "OTHER" },
  { value: "PREFER_NOT_TO_SAY", label: "PREFER NOT TO SAY" },
];

export const EXPERIENCE_LEVELS = [
  { value: "BEGINNER", label: "BEGINNER" },
  { value: "INTERMEDIATE", label: "INTERMEDIATE" },
  { value: "ADVANCED", label: "ADVANCED" },
];

/**
 * Pitch Synthesis Workstation Presets
 */
export const DEFAULT_PITCH_TRACKS = [
  "Open Innovation",
  "AI & Agentic Systems",
  "FinTech & Decentralized Systems",
  "HealthTech & Bio-Informatics",
  "Developer Tooling & Cloud Infra",
  "Cybersecurity & Defense Tech",
  "EdTech & Future of Work",
];

/**
 * Hackathon Table Sorting & Column Definitions
 */
export const TABLE_SORT_OPTIONS = [
  { value: "score", label: "Match Score" },
  { value: "deadline", label: "Submission Deadline" },
  { value: "prize", label: "Prize Pool" },
  { value: "title", label: "Alphabetical" },
];

export const DEFAULT_CATEGORIES = [
  "ALL",
  "AI/ML",
  "Web3",
  "Open Innovation",
  "Mobile",
  "DevOps",
  "Data Science",
  "Cybersecurity",
];

/**
 * Algorithmic Tier Thresholds & Styling
 */
export const MATCH_TIERS = {
  HIGH: {
    minScore: 75,
    label: "STRONG MATCH",
    badgeClass: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
  },
  MODERATE: {
    minScore: 50,
    label: "VIABLE",
    badgeClass: "bg-blue-950/60 text-blue-400 border-blue-800/60",
  },
  LOW: {
    minScore: 30,
    label: "STRETCH",
    badgeClass: "bg-amber-950/50 text-amber-400 border-amber-800/50",
  },
  MINIMAL: {
    minScore: 0,
    label: "LOW RELEVANCE",
    badgeClass: "bg-zinc-900 text-zinc-500 border-zinc-800",
  },
};

/**
 * System Diagnostics & Microservice Endpoints
 */
export const SYSTEM_METRICS = {
  CLUSTER_REGION: "AP-SOUTH-1",
  VECTOR_MODEL: "GEMINI-EMBED-001",
  VECTOR_DIMS: 3072,
  AI_MICROSERVICE_PORT: "8000",
  EMBEDDING_DTYPE: "FLOAT32",
};