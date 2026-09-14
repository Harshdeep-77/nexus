"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import BoardColumn from "./BoardColumn";
import TaskDrawer, { type TaskPatch } from "./TaskDrawer";
import TaskFormModal, { type TaskFormValues } from "./TaskFormModal";
import type { AppUser, Project, ProjectStatus, ProjectTask } from "./types";
import {
  PRIORITY_RANK,
  STATUS_LABEL,
  STATUS_ORDER,
  STATUS_STYLE,
  projectKey,
} from "./types";

type ProjectBoardProps = {
  projectId: string;
};

export default function ProjectBoard({ projectId }: ProjectBoardProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);

  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  // The modal only creates; the drawer handles viewing and editing.
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<ProjectStatus>("pending");
  const [formKey, setFormKey] = useState(0);

  /** Id rather than the task itself, so the drawer always reads live state. */
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  /**
   * Kept separate from activeTaskId: on close the id stays put so the panel
   * still has a ticket to show while it slides out.
   */
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        // One round trip for both — the board needs the assignee names as soon
        // as the first card paints.
        const [projectRes, usersRes] = await Promise.all([
          fetch(`/api/project/${projectId}`, { cache: "no-store" }),
          fetch("/api/users", { cache: "no-store" }),
        ]);
        if (!active) return;

        if (projectRes.status === 401) {
          setNeedsLogin(true);
          return;
        }
        if (projectRes.status === 404) {
          setNotFound(true);
          return;
        }

        const projectBody = await projectRes.json();
        if (!projectRes.ok) {
          setError(projectBody.error || "Could not load this project");
          return;
        }

        const loaded: Project = projectBody.data;
        setProject(loaded);
        setTasks(loaded.tasks ?? []);

        // A failed users call only costs us the avatars, so it must not
        // block the board from rendering.
        if (usersRes.ok) {
          const usersBody = await usersRes.json();
          if (active) setUsers(usersBody.data ?? []);
        }
      } catch {
        if (active) setError("Could not load this project");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [projectId]);

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  const ticketPrefix = useMemo(
    () => (project ? projectKey(project.title) : "PRJ"),
    [project],
  );

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? null,
    [tasks, activeTaskId],
  );

  // High priority first, then newest — the order a board is usually read in.
  const tasksByStatus = useMemo(() => {
    const grouped = new Map<ProjectStatus, ProjectTask[]>(
      STATUS_ORDER.map((status) => [status, []]),
    );
    for (const task of tasks) {
      grouped.get(task.status)?.push(task);
    }
    for (const list of grouped.values()) {
      list.sort(
        (a, b) =>
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.id - a.id,
      );
    }
    return grouped;
  }, [tasks]);

  function openCreate(status: ProjectStatus) {
    setCreateStatus(status);
    setFormKey((key) => key + 1);
    setCreateOpen(true);
  }

  async function createTask(values: TaskFormValues) {
    setError("");
    try {
      const res = await fetch(`/api/project/${projectId}/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          // the API stores an absent description as null; "" would store an
          // empty string instead, so drop it
          description: values.description || undefined,
        }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error || "Could not create ticket");
        return false;
      }

      setTasks((prev) => [body.data, ...prev]);
      return true;
    } catch {
      setError("Could not create ticket");
      return false;
    }
  }

  /**
   * Every edit funnels through here: the drawer's fields, and moving a card
   * between columns. Optimistic, with a rollback if the PUT fails.
   */
  async function patchTask(task: ProjectTask, patch: TaskPatch) {
    const previous = tasks;
    setError("");
    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? { ...item, ...patch } : item)),
    );

    try {
      const res = await fetch(`/api/project/${projectId}/task/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      return true;
    } catch {
      setTasks(previous);
      setError("Could not save ticket");
      return false;
    }
  }

  async function deleteTask(task: ProjectTask) {
    const previous = tasks;
    setError("");
    setTasks((prev) => prev.filter((item) => item.id !== task.id));
    // The drawer reads from state, so close it before its ticket disappears.
    if (activeTaskId === task.id) setDrawerOpen(false);

    try {
      const res = await fetch(`/api/project/${projectId}/task/${task.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
    } catch {
      setTasks(previous);
      setError("Could not delete ticket");
    }
  }

  if (needsLogin) {
    return (
      <EmptyState
        title="Your session has expired"
        body="Log in to see this board."
        actionHref="/login"
        actionLabel="Go to login"
      />
    );
  }

  if (notFound) {
    return (
      <EmptyState
        title="Project not found"
        body="It may have been deleted, or it belongs to another account."
        actionHref="/dashboard/projects"
        actionLabel="Back to projects"
      />
    );
  }

  if (loading) {
    return (
      <div>
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[0, 1, 2].map((column) => (
            <div
              key={column}
              className="h-64 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        title="Could not load this project"
        body={error || "Something went wrong."}
        actionHref="/dashboard/projects"
        actionLabel="Back to projects"
      />
    );
  }

  const done = tasks.filter((task) => task.status === "completed").length;
  const palette = STATUS_STYLE[project.status];

  return (
    <div>
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-800"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M10 3.5L5.5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All projects
      </Link>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              {project.title}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${palette.badge} ${palette.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} />
              {STATUS_LABEL[project.status]}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-[13px] text-slate-500">
            {project.description}
          </p>
          <p className="mt-1.5 text-[12px] font-medium text-slate-400">
            {tasks.length === 0
              ? "No tickets yet"
              : `${done} of ${tasks.length} done`}
            <span className="mx-1.5">·</span>
            <span className="font-mono">{ticketPrefix}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreate("pending")}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          New ticket
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Three columns side by side on desktop, stacked on a phone. */}
      <div className="mt-6 grid grid-cols-1 items-start gap-3 md:grid-cols-3">
        {STATUS_ORDER.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={tasksByStatus.get(status) ?? []}
            ticketPrefix={ticketPrefix}
            usersById={usersById}
            onAdd={() => openCreate(status)}
            onMove={(task, next) => patchTask(task, { status: next })}
            onOpen={(task) => {
              setActiveTaskId(task.id);
              setDrawerOpen(true);
            }}
            onDelete={deleteTask}
          />
        ))}
      </div>

      <TaskFormModal
        open={createOpen}
        initial={null}
        defaultStatus={createStatus}
        users={users}
        formKey={formKey}
        onClose={() => setCreateOpen(false)}
        onSubmit={createTask}
      />

      <TaskDrawer
        task={activeTask}
        open={drawerOpen}
        ticketPrefix={ticketPrefix}
        users={users}
        usersById={usersById}
        onClose={() => setDrawerOpen(false)}
        onPatch={(patch) =>
          activeTask ? patchTask(activeTask, patch) : Promise.resolve(false)
        }
        onDelete={() => {
          if (activeTask) deleteTask(activeTask);
        }}
      />
    </div>
  );
}

function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-md">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
        <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
          <path d="M9 6v4M9 12.5v.01M9 1.5L16.5 15h-15z" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{body}</p>
      <Link
        href={actionHref}
        className="mt-4 inline-block rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
