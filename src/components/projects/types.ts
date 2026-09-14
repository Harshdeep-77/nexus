/** Shared shapes for the projects feature — mirrors the API's SQLite rows. */

export type ProjectStatus = "pending" | "in-progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export type ProjectTask = {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: ProjectStatus;
  priority: TaskPriority;
  assigned_to: number | null;
  created_by: number;
  created_at: string;
  isActive: number;
};

export type Project = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  status: ProjectStatus;
  created_at: string;
  created_by: number;
  isActive: number;
  /** GET /api/project nests these; PUT does not, so treat it as possibly absent. */
  tasks?: ProjectTask[];
};

export type ProjectFormValues = {
  title: string;
  description: string;
  status: ProjectStatus;
};

/** Board vocabulary. The DB keeps the original three values; only the labels are Jira-ish. */
export const STATUS_ORDER: ProjectStatus[] = [
  "pending",
  "in-progress",
  "completed",
];

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  pending: "To Do",
  "in-progress": "In Progress",
  completed: "Done",
};

export const STATUS_STYLE: Record<
  ProjectStatus,
  { badge: string; text: string; dot: string; bar: string }
> = {
  pending: {
    badge: "bg-amber-100/80",
    text: "text-amber-700",
    dot: "bg-amber-400",
    bar: "bg-amber-400",
  },
  "in-progress": {
    badge: "bg-sky-100/80",
    text: "text-sky-700",
    dot: "bg-sky-500",
    bar: "bg-sky-500",
  },
  completed: {
    badge: "bg-emerald-100/80",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
  },
};

/** "2 Mar, 14:05" — SQLite hands back "YYYY-MM-DD HH:MM:SS" in UTC. */
export function formatDate(value?: string) {
  if (!value) return "just now";
  const parsed = new Date(
    value.includes("T") ? value : `${value.replace(" ", "T")}Z`,
  );
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Task-level vocabulary, used by the board ─────────────────────── */

export type AppUser = {
  id: number;
  name: string;
  email: string;
};

export const PRIORITY_ORDER: TaskPriority[] = ["high", "medium", "low"];

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const PRIORITY_STYLE: Record<
  TaskPriority,
  { pill: string; text: string }
> = {
  low: { pill: "bg-slate-100", text: "text-slate-600" },
  medium: { pill: "bg-amber-100", text: "text-amber-700" },
  high: { pill: "bg-rose-100", text: "text-rose-700" },
};

/** Sort key so High floats to the top of a column. */
export const PRIORITY_RANK: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * A short Jira-ish prefix from the project name: "Website Redesign" -> "WR",
 * "Nexus" -> "NEX". Display only — nothing is stored.
 */
export function projectKey(title: string) {
  const words = title
    .split(/\s+/)
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean);

  if (words.length === 0) return "PRJ";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/** "Harshdeep Singh" -> "HS" */
export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Stable per-user avatar colour — same person, same colour, every render. */
const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
];

export function avatarColor(userId: number) {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length];
}
