"use client";

import { AnimatePresence, motion } from "motion/react";
import TaskCard from "./TaskCard";
import type { AppUser, ProjectStatus, ProjectTask } from "./types";
import { STATUS_LABEL, STATUS_STYLE } from "./types";

type BoardColumnProps = {
  status: ProjectStatus;
  tasks: ProjectTask[];
  ticketPrefix: string;
  /** id -> user, for assignee avatars. */
  usersById: Map<number, AppUser>;
  onAdd: () => void;
  onMove: (task: ProjectTask, status: ProjectStatus) => void;
  /** Opens the ticket drawer. */
  onOpen: (task: ProjectTask) => void;
  onDelete: (task: ProjectTask) => void;
};

export default function BoardColumn({
  status,
  tasks,
  ticketPrefix,
  usersById,
  onAdd,
  onMove,
  onOpen,
  onDelete,
}: BoardColumnProps) {
  const palette = STATUS_STYLE[status];

  return (
    <section className="flex min-w-0 flex-col rounded-xl bg-slate-100/70 p-2.5">
      <header className="flex items-center gap-2 px-1.5 pb-2.5 pt-1">
        <span className={`h-2 w-2 rounded-full ${palette.dot}`} />
        <h2 className="text-[13px] font-semibold text-slate-700">
          {STATUS_LABEL[status]}
        </h2>
        <span className="rounded-full bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
          {tasks.length}
        </span>
      </header>

      <motion.ul layout className="flex flex-1 flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              ticketPrefix={ticketPrefix}
              assignee={
                task.assigned_to == null
                  ? undefined
                  : usersById.get(task.assigned_to)
              }
              onMove={(next) => onMove(task, next)}
              onOpen={() => onOpen(task)}
              onDelete={() => onDelete(task)}
            />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-[12px] text-slate-400">
            Nothing here
          </li>
        )}
      </motion.ul>

      <button
        type="button"
        onClick={onAdd}
        className="mt-2 flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-[12px] font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Add ticket
      </button>
    </section>
  );
}
