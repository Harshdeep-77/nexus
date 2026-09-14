"use client";

import { useEffect, useRef, useState } from "react";
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
  PRIORITY_STYLE,
  STATUS_LABEL,
  STATUS_ORDER,
  STATUS_STYLE,
  avatarColor,
  formatDate,
  initials,
} from "./types";

/** The subset of a ticket this panel can change. */
export type TaskPatch = Partial<{
  title: string;
  description: string;
  status: ProjectStatus;
  priority: TaskPriority;
  assigned_to: number | null;
}>;

type TaskDrawerProps = {
  /**
   * The live task from the board's state. It stays set after `open` goes
   * false, so the panel still has content while it slides out.
   */
  task: ProjectTask | null;
  open: boolean;
  ticketPrefix: string;
  users: AppUser[];
  usersById: Map<number, AppUser>;
  onClose: () => void;
  onPatch: (patch: TaskPatch) => Promise<boolean>;
  onDelete: () => void;
};

export default function TaskDrawer({
  task,
  open,
  ticketPrefix,
  users,
  usersById,
  onClose,
  onPatch,
  onDelete,
}: TaskDrawerProps) {
  // The panel is always mounted and slides with a CSS transform, the same way
  // Sidebar does it. AnimatePresence was tried here first and wedged: on exit
  // it left the panel behind as a zero-size husk and the drawer never closed.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={task ? `Ticket ${ticketPrefix}-${task.id}` : "Ticket"}
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        {task && (
          // Keyed on open too, so every opening starts with clean editors.
          <DrawerBody
            key={`${task.id}-${open}`}
            task={task}
            open={open}
            ticketPrefix={ticketPrefix}
            users={users}
            usersById={usersById}
            onClose={onClose}
            onPatch={onPatch}
            onDelete={onDelete}
          />
        )}
      </aside>
    </>
  );
}

type DrawerBodyProps = {
  task: ProjectTask;
  /** False while the panel is sliding out. */
  open: boolean;
  ticketPrefix: string;
  users: AppUser[];
  usersById: Map<number, AppUser>;
  onClose: () => void;
  onPatch: (patch: TaskPatch) => Promise<boolean>;
  onDelete: () => void;
};

function DrawerBody({
  task,
  open,
  ticketPrefix,
  users,
  usersById,
  onClose,
  onPatch,
  onDelete,
}: DrawerBodyProps) {
  const [editing, setEditing] = useState<null | "title" | "description">(null);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [descriptionDraft, setDescriptionDraft] = useState(
    task.description ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Escape closes the drawer — but only when no inline editor has it first.
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (editing) return;
      onClose();
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, editing, onClose]);

  async function patch(values: TaskPatch) {
    setSaving(true);
    const ok = await onPatch(values);
    setSaving(false);
    return ok;
  }

  async function commitTitle() {
    const trimmed = titleDraft.trim();
    setEditing(null);

    // An empty title would be rejected by the API — fall back to what was there.
    if (!trimmed || trimmed === task.title) {
      setTitleDraft(task.title);
      return;
    }
    const ok = await patch({ title: trimmed });
    if (!ok) setTitleDraft(task.title);
  }

  async function commitDescription() {
    const trimmed = descriptionDraft.trim();
    setEditing(null);

    if (trimmed === (task.description ?? "")) return;
    const ok = await patch({ description: trimmed });
    if (!ok) setDescriptionDraft(task.description ?? "");
  }

  const priority = PRIORITY_STYLE[task.priority];
  const statusPalette = STATUS_STYLE[task.status];
  const reporter = usersById.get(task.created_by);
  const assignee =
    task.assigned_to == null ? undefined : usersById.get(task.assigned_to);

  return (
    <>
      <header className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <span className="font-mono text-[12px] font-semibold tracking-wide text-slate-500">
          {ticketPrefix}-{task.id}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold ${statusPalette.badge} ${statusPalette.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusPalette.dot}`} />
          {STATUS_LABEL[task.status]}
        </span>

        <AnimatePresence>
          {saving && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[11px] text-slate-400"
            >
              Saving...
            </motion.span>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close ticket"
          className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Title — click to edit */}
        {editing === "title" ? (
          <textarea
            ref={titleRef}
            autoFocus
            // Select the whole title on entry, the way TaskItem does — a title
            // is usually rewritten wholesale, not appended to.
            onFocus={(e) => e.currentTarget.select()}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitTitle();
              } else if (e.key === "Escape") {
                setTitleDraft(task.title);
                setEditing(null);
              }
            }}
            rows={2}
            maxLength={200}
            className="w-full resize-none rounded-lg border border-indigo-300 px-2.5 py-1.5 text-[15px] font-semibold text-slate-900 ring-2 ring-indigo-500/20 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setTitleDraft(task.title);
              setEditing("title");
            }}
            className="-mx-2 block w-[calc(100%+1rem)] rounded-lg px-2 py-1.5 text-left text-[15px] font-semibold leading-snug text-slate-900 transition-colors hover:bg-slate-50"
          >
            {task.title}
          </button>
        )}

        {/* Description — click to edit */}
        <div className="mt-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Description
          </h3>
          {editing === "description" ? (
            <textarea
              ref={descriptionRef}
              autoFocus
              // A description gets appended to more often than replaced, so
              // put the caret at the end rather than selecting everything.
              onFocus={(e) => {
                const end = e.currentTarget.value.length;
                e.currentTarget.setSelectionRange(end, end);
              }}
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              onBlur={commitDescription}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setDescriptionDraft(task.description ?? "");
                  setEditing(null);
                }
              }}
              rows={5}
              maxLength={1000}
              placeholder="Add a description..."
              className="mt-1.5 w-full resize-none rounded-lg border border-indigo-300 px-2.5 py-2 text-[13px] leading-relaxed text-slate-700 ring-2 ring-indigo-500/20 focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setDescriptionDraft(task.description ?? "");
                setEditing("description");
              }}
              className="-mx-2 mt-1.5 block w-[calc(100%+1rem)] rounded-lg px-2 py-2 text-left text-[13px] leading-relaxed transition-colors hover:bg-slate-50"
            >
              {task.description ? (
                <span className="whitespace-pre-wrap text-slate-700">
                  {task.description}
                </span>
              ) : (
                <span className="text-slate-400">Add a description...</span>
              )}
            </button>
          )}
          <p className="mt-1 text-[11px] text-slate-400">
            {editing === "description"
              ? "Click away to save, Escape to cancel"
              : "Click the text to edit"}
          </p>
        </div>

        {/* Details — each control saves on change */}
        <div className="mt-6 rounded-xl border border-slate-200">
          <h3 className="border-b border-slate-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Details
          </h3>

          <dl className="divide-y divide-slate-100">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <dt className="w-20 shrink-0 text-[12px] font-medium text-slate-500">
                Status
              </dt>
              <dd className="min-w-0 flex-1">
                <select
                  value={task.status}
                  onChange={(e) =>
                    patch({ status: e.target.value as ProjectStatus })
                  }
                  aria-label="Status"
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-800 transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  {STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABEL[status]}
                    </option>
                  ))}
                </select>
              </dd>
            </div>

            <div className="flex items-center gap-3 px-3 py-2.5">
              <dt className="w-20 shrink-0 text-[12px] font-medium text-slate-500">
                Priority
              </dt>
              <dd className="flex min-w-0 flex-1 items-center gap-2">
                <select
                  value={task.priority}
                  onChange={(e) =>
                    patch({ priority: e.target.value as TaskPriority })
                  }
                  aria-label="Priority"
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-800 transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  {PRIORITY_ORDER.map((value) => (
                    <option key={value} value={value}>
                      {PRIORITY_LABEL[value]}
                    </option>
                  ))}
                </select>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${priority.pill} ${priority.text}`}
                >
                  {PRIORITY_LABEL[task.priority]}
                </span>
              </dd>
            </div>

            <div className="flex items-center gap-3 px-3 py-2.5">
              <dt className="w-20 shrink-0 text-[12px] font-medium text-slate-500">
                Assignee
              </dt>
              <dd className="flex min-w-0 flex-1 items-center gap-2">
                <select
                  value={task.assigned_to == null ? "" : String(task.assigned_to)}
                  onChange={(e) =>
                    patch({
                      assigned_to:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  aria-label="Assignee"
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-800 transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                {task.assigned_to != null && (
                  <span
                    title={assignee?.name ?? `User #${task.assigned_to}`}
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white ${avatarColor(task.assigned_to)}`}
                  >
                    {assignee ? initials(assignee.name) : "…"}
                  </span>
                )}
              </dd>
            </div>

            <div className="flex items-center gap-3 px-3 py-2.5">
              <dt className="w-20 shrink-0 text-[12px] font-medium text-slate-500">
                Reporter
              </dt>
              <dd className="min-w-0 flex-1 truncate text-[13px] text-slate-700">
                {reporter?.name ?? `User #${task.created_by}`}
              </dd>
            </div>

            <div className="flex items-center gap-3 px-3 py-2.5">
              <dt className="w-20 shrink-0 text-[12px] font-medium text-slate-500">
                Created
              </dt>
              <dd className="min-w-0 flex-1 text-[13px] text-slate-700">
                {formatDate(task.created_at)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <footer className="border-t border-slate-200 px-4 py-3">
        {confirmingDelete ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
            <p className="text-[12px] font-medium text-rose-700">
              Delete {ticketPrefix}-{task.id}?
            </p>
            <div className="mt-2 flex gap-1.5">
              <button
                type="button"
                onClick={onDelete}
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
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-medium text-rose-600 transition-colors hover:border-rose-200 hover:bg-rose-50"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2.5 4.5h11M6 4.5V3a1 1 0 011-1h2a1 1 0 011 1v1.5M4 4.5l.7 8.4a1 1 0 001 .9h4.6a1 1 0 001-.9L12 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Delete ticket
          </button>
        )}
      </footer>
    </>
  );
}
