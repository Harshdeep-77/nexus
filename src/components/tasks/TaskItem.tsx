"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Task, TaskStatus } from "./TaskManager";

const STATUSES: TaskStatus[] = ["pending", "completed", "not_completed"];

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  not_completed: "Not completed",
};

const STATUS_BADGE: Record<TaskStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  not_completed: "bg-rose-50 text-rose-700 ring-rose-200",
};

function formatDate(value?: string) {
  if (!value) return "just now";
  // SQLite stores "YYYY-MM-DD HH:MM:SS" in UTC.
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

type TaskItemProps = {
  task: Task;
  open: boolean;
  /** Stagger delay (seconds) for the entrance animation — 0 for freshly-added tasks. */
  revealDelay?: number;
  onToggle: () => void;
  onStatus: (status: TaskStatus) => void;
  onDelete: () => void;
};

export default function TaskItem({
  task,
  open,
  revealDelay = 0,
  onToggle,
  onStatus,
  onDelete,
}: TaskItemProps) {
  const completed = task.status === "completed";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 22, scale: 0.95, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{
        opacity: 0,
        x: -32,
        transition: { duration: 0.2, delay: 0 },
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{
        duration: 0.5,
        delay: revealDelay,
        ease: [0.22, 1, 0.36, 1],
        layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
      }}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md"
    >
      <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
        <button
          type="button"
          role="checkbox"
          aria-checked={completed}
          aria-label={completed ? "Mark as pending" : "Mark as completed"}
          onClick={() => onStatus(completed ? "pending" : "completed")}
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
            completed
              ? "border-emerald-500 bg-emerald-500"
              : "border-slate-300 hover:border-slate-400"
          }`}
        >
          <AnimatePresence initial={false}>
            {completed && (
              <motion.svg
                key="tick"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 600, damping: 22 }}
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2 6.2L4.7 9L10 3.2"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span
            className={`min-w-0 flex-1 truncate text-sm transition-colors sm:text-[15px] ${
              completed ? "text-slate-400 line-through" : "text-slate-800"
            }`}
          >
            {task.title}
          </span>

          <span
            className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset sm:inline ${STATUS_BADGE[task.status]}`}
          >
            {STATUS_LABEL[task.status]}
          </span>

          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="shrink-0 text-slate-400"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 5.5L7 9.5L11 5.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.span>
        </button>
      </div>

      {/* opening a task expands its detail panel */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="border-t border-slate-100 px-3 py-3 sm:px-4"
            >
              <p className="text-xs text-slate-500">
                Created {formatDate(task.created_at)}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onStatus(status)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      task.status === status
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {STATUS_LABEL[status]}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={onDelete}
                  className="ml-auto rounded-full px-3 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
