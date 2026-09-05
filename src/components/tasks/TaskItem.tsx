"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Task, TaskStatus } from "./TaskManager";

const STATUSES: TaskStatus[] = ["pending", "completed", "not_completed"];

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  not_completed: "Not completed",
};

/* ── Status-based card colour palettes ──────────────────────────── */
const STATUS_CARD: Record<
  TaskStatus,
  {
    bg: string;
    border: string;
    badge: string;
    badgeText: string;
    badgeDot: string;
    hoverShadow: string;
    menuBg: string;
    menuBorder: string;
  }
> = {
  pending: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100/80",
    badgeText: "text-amber-700",
    badgeDot: "bg-amber-400",
    hoverShadow: "hover:shadow-amber-200/60",
    menuBg: "bg-amber-50",
    menuBorder: "border-amber-200",
  },
  completed: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-100/80",
    badgeText: "text-emerald-700",
    badgeDot: "bg-emerald-500",
    hoverShadow: "hover:shadow-emerald-200/60",
    menuBg: "bg-emerald-50",
    menuBorder: "border-emerald-200",
  },
  not_completed: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    badge: "bg-rose-100/80",
    badgeText: "text-rose-700",
    badgeDot: "bg-rose-400",
    hoverShadow: "hover:shadow-rose-200/60",
    menuBg: "bg-rose-50",
    menuBorder: "border-rose-200",
  },
};

/* ── Status icons (inline SVG paths) ────────────────────────────── */
function StatusIcon({ status }: { status: TaskStatus }) {
  const base = "w-3.5 h-3.5";
  if (status === "completed")
    return (
      <svg className={base} viewBox="0 0 16 16" fill="none">
        <path
          d="M3.5 8.5L6.5 11.5L12.5 4.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (status === "not_completed")
    return (
      <svg className={base} viewBox="0 0 16 16" fill="none">
        <path
          d="M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  // pending — clock icon
  return (
    <svg className={base} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 5v3.5l2.5 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatDate(value?: string) {
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

type TaskItemProps = {
  task: Task;
  /** Stagger delay (seconds) for the entrance animation — 0 for freshly-added tasks. */
  revealDelay?: number;
  onStatus: (status: TaskStatus) => void;
  onEdit: (title: string) => void;
  onDelete: () => void;
};

export default function TaskItem({
  task,
  revealDelay = 0,
  onStatus,
  onEdit,
  onDelete,
}: TaskItemProps) {
  const completed = task.status === "completed";
  const palette = STATUS_CARD[task.status];

  const [menuOpen, setMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);

  const menuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setStatusMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Auto-focus input when editing starts
  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editing]);

  function handleStartEdit() {
    setEditValue(task.title);
    setEditing(true);
    setMenuOpen(false);
    setStatusMenuOpen(false);
  }

  function handleSaveEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.title) {
      onEdit(trimmed);
    }
    setEditing(false);
  }

  function handleCancelEdit() {
    setEditValue(task.title);
    setEditing(false);
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  }

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
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        duration: 0.5,
        delay: revealDelay,
        ease: [0.22, 1, 0.36, 1],
        layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
      }}
      className={`relative rounded-xl border-[1.5px] shadow-sm transition-shadow duration-300
        ${palette.bg} ${palette.border} ${palette.hoverShadow} ${menuOpen ? "z-40" : "z-0"}`}
    >
      {/* ── Card body ──────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3">
        {/* Top row: title + three-dot menu */}
        <div className="flex items-start gap-2">
          {/* Title or inline edit */}
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  ref={editInputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={handleSaveEdit}
                  maxLength={200}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                />
              </div>
            ) : (
              <p
                className={`text-sm font-medium leading-snug sm:text-[15px] transition-colors ${completed
                  ? "text-slate-400 line-through"
                  : "text-slate-800"
                  }`}
              >
                {task.title}
              </p>
            )}
          </div>

          {/* Three-dot menu */}
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setMenuOpen((prev) => !prev);
                setStatusMenuOpen(false);
              }}
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/70 hover:text-slate-600"
              aria-label="Task options"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="3.5" r="1.2" fill="currentColor" />
                <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                <circle cx="8" cy="12.5" r="1.2" fill="currentColor" />
              </svg>
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/50"
                >
                  {/* Status submenu */}
                  <button
                    type="button"
                    onClick={() => setStatusMenuOpen((prev) => !prev)}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-slate-400">
                      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M5.5 8.2L7.2 10L10.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Change status
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      className={`ml-auto text-slate-400 transition-transform ${statusMenuOpen ? "rotate-180" : ""}`}
                    >
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* Status options */}
                  <AnimatePresence>
                    {statusMenuOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-slate-100 bg-slate-50/50 py-1">
                          {STATUSES.map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => {
                                onStatus(status);
                                setMenuOpen(false);
                                setStatusMenuOpen(false);
                              }}
                              className={`flex w-full items-center gap-2 px-4 py-2 text-left text-[12px] font-medium transition-colors hover:bg-slate-100 ${task.status === status
                                ? "text-indigo-600"
                                : "text-slate-600"
                                }`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${STATUS_CARD[status].badgeDot
                                  }`}
                              />
                              {STATUS_LABEL[status]}
                              {task.status === status && (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto text-indigo-500">
                                  <path d="M2.5 6.5L4.8 8.8L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Divider */}
                  <div className="border-t border-slate-100" />

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-slate-400">
                      <path d="M11.5 2.5l2 2-8 8H3.5v-2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9.5 4.5l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    Edit task
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => {
                      onDelete();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3 py-2.5 text-left text-[13px] font-medium text-rose-600 transition-colors hover:bg-rose-50"
                  >
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-rose-400">
                      <path d="M2.5 4.5h11M6 4.5V3a1 1 0 011-1h2a1 1 0 011 1v1.5M4 4.5l.7 8.4a1 1 0 001 .9h4.6a1 1 0 001-.9L12 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Status badge — improved with dot indicator and icon */}
        <div className="mt-3 flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold
              ${palette.badge} ${palette.badgeText}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${palette.badgeDot}`} />
            <StatusIcon status={task.status} />
            {STATUS_LABEL[task.status]}
          </span>

          <span className="text-[10px] text-slate-400">
            {formatDate(task.created_at)}
          </span>
        </div>
      </div>
    </motion.li>
  );
}
