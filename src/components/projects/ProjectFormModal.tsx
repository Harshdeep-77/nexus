"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Project, ProjectFormValues, ProjectStatus } from "./types";
import { STATUS_LABEL, STATUS_ORDER } from "./types";

type ProjectFormModalProps = {
  open: boolean;
  /** Passed when editing; null when creating. */
  initial: Project | null;
  /**
   * Bumped by the parent every time the modal is opened. Used as the key on the
   * form below, so each opening remounts with fresh state seeded from `initial`
   * — no reset-on-open effect needed.
   */
  formKey: number;
  onClose: () => void;
  /** Resolve true to let the modal close, false to keep it open on error. */
  onSubmit: (values: ProjectFormValues) => Promise<boolean>;
};

export default function ProjectFormModal({
  open,
  initial,
  formKey,
  onClose,
  onSubmit,
}: ProjectFormModalProps) {
  // Escape closes; the page behind stays put while we are open.
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
            aria-label={initial ? "Edit project" : "New project"}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            // max-h + scroll so a short phone, or one with the keyboard up,
            // can still reach the buttons at the bottom of the sheet
            className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
          >
            <ProjectForm
              key={formKey}
              initial={initial}
              onClose={onClose}
              onSubmit={onSubmit}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

type ProjectFormProps = {
  initial: Project | null;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<boolean>;
};

function ProjectForm({ initial, onClose, onSubmit }: ProjectFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(
    initial?.status ?? "pending",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const titleRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    // The API rejects either as empty, so catch it here instead of round-tripping.
    if (!trimmedTitle) {
      setError("Project title is required");
      return;
    }
    if (!trimmedDescription) {
      setError("Project description is required");
      return;
    }

    setSubmitting(true);
    setError("");

    const ok = await onSubmit({
      title: trimmedTitle,
      description: trimmedDescription,
      status,
    });

    if (ok) {
      onClose();
    } else {
      setError(
        initial ? "Could not save the project" : "Could not create the project",
      );
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {initial ? "Edit project" : "New project"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {initial
              ? "Update the details of this project."
              : "Give the project a name and a short description."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 3L13 13M13 3L3 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="project-title"
            className="block text-[13px] font-medium text-slate-700"
          >
            Title
          </label>
          <input
            id="project-title"
            ref={titleRef}
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Website redesign"
            maxLength={120}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="project-description"
            className="block text-[13px] font-medium text-slate-700"
          >
            Description
          </label>
          <textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            rows={3}
            maxLength={500}
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </div>

        <div>
          <span className="block text-[13px] font-medium text-slate-700">
            Status
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
                : "Create project"}
          </button>
        </div>
      </form>
    </>
  );
}
