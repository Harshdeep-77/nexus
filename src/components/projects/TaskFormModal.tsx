"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type {
  AppUser,
  ProjectStatus,
  ProjectTask,
  TaskPriority,
} from "./types";
import {
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  STATUS_LABEL,
  STATUS_ORDER,
} from "./types";

export type TaskFormValues = {
  title: string;
  description: string;
  status: ProjectStatus;
  priority: TaskPriority;
  assigned_to: number | null;
};

type TaskFormModalProps = {
  open: boolean;
  /** Passed when editing; null when creating. */
  initial: ProjectTask | null;
  /** Column the "Add ticket" button belongs to — the default for a new ticket. */
  defaultStatus: ProjectStatus;
  users: AppUser[];
  /** Bumped by the parent on every open so the form remounts with fresh state. */
  formKey: number;
  onClose: () => void;
  /** Resolve true to let the modal close, false to keep it open on error. */
  onSubmit: (values: TaskFormValues) => Promise<boolean>;
};

export default function TaskFormModal({
  open,
  initial,
  defaultStatus,
  users,
  formKey,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={initial ? "Edit ticket" : "New ticket"}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
          >
            <TaskForm
              key={formKey}
              initial={initial}
              defaultStatus={defaultStatus}
              users={users}
              onClose={onClose}
              onSubmit={onSubmit}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

type TaskFormProps = {
  initial: ProjectTask | null;
  defaultStatus: ProjectStatus;
  users: AppUser[];
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<boolean>;
};

function TaskForm({
  initial,
  defaultStatus,
  users,
  onClose,
  onSubmit,
}: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(
    initial?.status ?? defaultStatus,
  );
  const [priority, setPriority] = useState<TaskPriority>(
    initial?.priority ?? "medium",
  );
  // "" in the <select> means unassigned, which the API takes as null.
  const [assignee, setAssignee] = useState<string>(
    initial?.assigned_to == null ? "" : String(initial.assigned_to),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Ticket title is required");
      return;
    }

    setSubmitting(true);
    setError("");

    const ok = await onSubmit({
      title: trimmedTitle,
      description: description.trim(),
      status,
      priority,
      assigned_to: assignee === "" ? null : Number(assignee),
    });

    if (ok) {
      onClose();
    } else {
      setError(
        initial ? "Could not save the ticket" : "Could not create the ticket",
      );
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {initial ? "Edit ticket" : "New ticket"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {initial
              ? "Update this ticket's details."
              : "Describe the work, then set who picks it up."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="task-title"
            className="block text-[13px] font-medium text-slate-700"
          >
            Title
          </label>
          <input
            id="task-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fix the login redirect"
            maxLength={200}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="task-description"
            className="block text-[13px] font-medium text-slate-700"
          >
            Description{" "}
            <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Steps to reproduce, acceptance criteria, links..."
            rows={3}
            maxLength={1000}
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </div>

        <div>
          <span className="block text-[13px] font-medium text-slate-700">
            Column
          </span>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {STATUS_ORDER.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={`rounded-xl border px-2 py-2 text-[12px] font-medium transition-all ${
                  status === value
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {STATUS_LABEL[value]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-[13px] font-medium text-slate-700">
            Priority
          </span>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {PRIORITY_ORDER.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPriority(value)}
                className={`rounded-xl border px-2 py-2 text-[12px] font-medium transition-all ${
                  priority === value
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {PRIORITY_LABEL[value]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="task-assignee"
            className="block text-[13px] font-medium text-slate-700"
          >
            Assignee
          </label>
          <select
            id="task-assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {submitting
              ? "Saving..."
              : initial
                ? "Save changes"
                : "Create ticket"}
          </button>
        </div>
      </form>
    </>
  );
}
