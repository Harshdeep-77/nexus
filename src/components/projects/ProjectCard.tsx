"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { Project } from "./types";
import { STATUS_LABEL, STATUS_STYLE, formatDate } from "./types";

type ProjectCardProps = {
  project: Project;
  /** Stagger delay (seconds) for the entrance animation — 0 for freshly-added projects. */
  revealDelay?: number;
  onEdit: () => void;
  onDelete: () => void;
};

export default function ProjectCard({
  project,
  revealDelay = 0,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const palette = STATUS_STYLE[project.status];

  const tasks = project.tasks ?? [];
  const done = tasks.filter((task) => task.status === "completed").length;
  const percent = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);

  // Close the menu on an outside click, and forget a half-made delete.
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmingDelete(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 22, scale: 0.95, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: -32, transition: { duration: 0.2 } }}
      whileHover={{ y: -3 }}
      transition={{
        duration: 0.5,
        delay: revealDelay,
        ease: [0.22, 1, 0.36, 1],
        layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
      }}
      className={`relative flex flex-col rounded-xl border-[1.5px] border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md hover:shadow-slate-200/60 ${
        menuOpen ? "z-40" : "z-0"
      }`}
    >
      {/* Stretched link: the whole card opens the board, while the menu below
          sits on a higher layer and keeps its own clicks. */}
      <Link
        href={`/dashboard/projects/${project.id}`}
        aria-label={`Open ${project.title}`}
        className="absolute inset-0 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
      />

      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold text-slate-800">
              {project.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-slate-500">
              {project.description}
            </p>
          </div>

          <div ref={menuRef} className="relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => {
                setMenuOpen((prev) => !prev);
                setConfirmingDelete(false);
              }}
              aria-label="Project options"
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="3.5" r="1.2" fill="currentColor" />
                <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                <circle cx="8" cy="12.5" r="1.2" fill="currentColor" />
              </svg>
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/50"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onEdit();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-slate-400">
                      <path d="M11.5 2.5l2 2-8 8H3.5v-2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9.5 4.5l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    Edit project
                  </button>

                  {/* Two-step delete — a project takes its tasks out of reach with it. */}
                  {confirmingDelete ? (
                    <div className="border-t border-slate-100 bg-rose-50/60 px-3 py-2.5">
                      <p className="text-[12px] font-medium text-rose-700">
                        Delete this project?
                      </p>
                      <p className="mt-0.5 text-[11px] text-rose-500">
                        {tasks.length > 0
                          ? `Its ${tasks.length} task${tasks.length === 1 ? "" : "s"} go with it.`
                          : "This cannot be undone from the app."}
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onDelete();
                            setMenuOpen(false);
                            setConfirmingDelete(false);
                          }}
                          className="rounded-md bg-rose-600 px-2.5 py-1 text-[12px] font-medium text-white transition-colors hover:bg-rose-700"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDelete(false)}
                          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(true)}
                      className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3 py-2.5 text-left text-[13px] font-medium text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-rose-400">
                        <path d="M2.5 4.5h11M6 4.5V3a1 1 0 011-1h2a1 1 0 011 1v1.5M4 4.5l.7 8.4a1 1 0 001 .9h4.6a1 1 0 001-.9L12 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Delete
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Progress across this project's tickets */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-slate-500">
              {tasks.length === 0
                ? "No tasks yet"
                : `${done} of ${tasks.length} done`}
            </span>
            <span className="font-semibold text-slate-400">{percent}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.5, delay: revealDelay + 0.15, ease: "easeOut" }}
              className={`h-full rounded-full ${palette.bar}`}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${palette.badge} ${palette.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} />
            {STATUS_LABEL[project.status]}
          </span>
          <span className="text-[10px] text-slate-400">
            {formatDate(project.created_at)}
          </span>
        </div>
      </div>
    </motion.li>
  );
}
