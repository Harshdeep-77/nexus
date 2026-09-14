"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { AppUser, ProjectStatus, ProjectTask } from "./types";
import {
  PRIORITY_LABEL,
  PRIORITY_STYLE,
  STATUS_LABEL,
  STATUS_ORDER,
  STATUS_STYLE,
  avatarColor,
  initials,
} from "./types";

type TaskCardProps = {
  task: ProjectTask;
  /** Ticket prefix for the whole board, e.g. "WR" -> WR-8. */
  ticketPrefix: string;
  /** Looked up for the assignee avatar; undefined while users are loading. */
  assignee?: AppUser;
  onMove: (status: ProjectStatus) => void;
  /** Opens the ticket drawer, where the full detail lives. */
  onOpen: () => void;
  onDelete: () => void;
};

export default function TaskCard({
  task,
  ticketPrefix,
  assignee,
  onMove,
  onOpen,
  onDelete,
}: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const priority = PRIORITY_STYLE[task.priority];

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setMoveOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{
        duration: 0.25,
        ease: [0.22, 1, 0.36, 1],
        layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
      }}
      className={`group relative rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md hover:shadow-slate-200/60 ${
        menuOpen ? "z-30" : "z-0"
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-[13px] font-medium leading-snug text-slate-800">
            {task.title}
          </p>
        </button>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((prev) => !prev);
              setMoveOpen(false);
            }}
            aria-label="Task options"
            className="grid h-6 w-6 place-items-center rounded-md text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600 group-hover:text-slate-400"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
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
                className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/50"
              >
                {/* Moving between columns is what drag-and-drop would do. */}
                <button
                  type="button"
                  onClick={() => setMoveOpen((prev) => !prev)}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-slate-400">
                    <path d="M2.5 8h11M10 4.5L13.5 8 10 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Move to
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className={`ml-auto text-slate-400 transition-transform ${moveOpen ? "rotate-180" : ""}`}
                  >
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>

                <AnimatePresence>
                  {moveOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-100 bg-slate-50/50 py-1">
                        {STATUS_ORDER.map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={status === task.status}
                            onClick={() => {
                              onMove(status);
                              setMenuOpen(false);
                              setMoveOpen(false);
                            }}
                            className={`flex w-full items-center gap-2 px-4 py-2 text-left text-[12px] font-medium transition-colors ${
                              status === task.status
                                ? "cursor-default text-indigo-600"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <span className={`h-2 w-2 rounded-full ${STATUS_STYLE[status].dot}`} />
                            {STATUS_LABEL[status]}
                            {status === task.status && (
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

                <button
                  type="button"
                  onClick={() => {
                    onOpen();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-slate-400">
                    <path d="M6.5 2.5H3.5v11h9v-3M9.5 2.5h4v4M13.5 2.5L7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Open ticket
                </button>

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

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-slate-500">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-[10px] font-semibold tracking-wide text-slate-400">
          {ticketPrefix}-{task.id}
        </span>

        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${priority.pill} ${priority.text}`}
        >
          {PRIORITY_LABEL[task.priority]}
        </span>

        <div className="ml-auto">
          {task.assigned_to == null ? (
            <span
              title="Unassigned"
              className="grid h-6 w-6 place-items-center rounded-full border border-dashed border-slate-300 text-[10px] text-slate-400"
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5.5" r="2.75" stroke="currentColor" strokeWidth="1.3" />
                <path d="M2.75 13.5c.6-2.4 2.7-3.75 5.25-3.75s4.65 1.35 5.25 3.75" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </span>
          ) : (
            <span
              title={assignee?.name ?? `User #${task.assigned_to}`}
              className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold text-white ${avatarColor(task.assigned_to)}`}
            >
              {assignee ? initials(assignee.name) : "…"}
            </span>
          )}
        </div>
      </div>
    </motion.li>
  );
}
