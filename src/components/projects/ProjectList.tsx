"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import ProjectCard from "./ProjectCard";
import ProjectFormModal from "./ProjectFormModal";
import type { Project, ProjectFormValues } from "./types";

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  /** null = creating, a project = editing that one. */
  const [editing, setEditing] = useState<Project | null>(null);
  /** Bumped on every open so the modal's form remounts with fresh state. */
  const [formKey, setFormKey] = useState(0);

  // Ids present in the very first load, in order — drives the one-by-one
  // reveal. Projects added afterwards pop in instantly instead of waiting
  // through the whole stagger.
  const [initialOrder, setInitialOrder] = useState<number[] | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        // no-store, otherwise a revisit can render the browser-cached list
        const res = await fetch("/api/project", { cache: "no-store" });
        if (!active) return;

        if (res.status === 401) {
          setNeedsLogin(true);
          return;
        }

        const body = await res.json();
        if (!res.ok) {
          setError(body.error || "Could not load projects");
          return;
        }

        const loaded: Project[] = body.data ?? [];
        setInitialOrder(loaded.map((project) => project.id));
        setProjects(loaded);
      } catch {
        if (active) setError("Could not load projects");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProjects();
    return () => {
      active = false;
    };
  }, []);

  function openCreate() {
    setEditing(null);
    setFormKey((key) => key + 1);
    setModalOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setFormKey((key) => key + 1);
    setModalOpen(true);
  }

  async function createProject(values: ProjectFormValues) {
    setError("");
    try {
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error || "Could not create project");
        return false;
      }

      setProjects((prev) => [body.data, ...prev]);
      return true;
    } catch {
      setError("Could not create project");
      return false;
    }
  }

  async function saveProject(project: Project, values: ProjectFormValues) {
    const previous = projects;
    setError("");

    // Optimistic: show the new values straight away, roll back if the PUT fails.
    setProjects((prev) =>
      prev.map((item) =>
        item.id === project.id ? { ...item, ...values } : item,
      ),
    );

    try {
      const res = await fetch(`/api/project/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      return true;
    } catch {
      setProjects(previous);
      setError("Could not save project");
      return false;
    }
  }

  async function deleteProject(id: number) {
    const previous = projects;
    setError("");
    setProjects((prev) => prev.filter((project) => project.id !== id));

    try {
      const res = await fetch(`/api/project/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setProjects(previous);
      setError("Could not delete project");
    }
  }

  if (needsLogin) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-md">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <path d="M6.5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h2.5M12 12.5L15 9l-3-3.5M7 9h8" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-700">
          Your session has expired
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Log in to see your projects.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Projects
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            {loading
              ? "Loading your projects..."
              : projects.length === 0
                ? "Create a project, then add tickets to it."
                : `${projects.length} project${projects.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-1.5 self-start rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 sm:self-auto"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          New project
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

      {loading ? (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((row) => (
            <li
              key={row}
              className="h-[168px] animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </ul>
      ) : (
        <motion.ul
          layout
          className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {projects.map((project) => {
              const revealIndex = initialOrder?.indexOf(project.id) ?? -1;
              const revealDelay =
                revealIndex >= 0 ? Math.min(revealIndex, 8) * 0.08 : 0;

              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  revealDelay={revealDelay}
                  onEdit={() => openEdit(project)}
                  onDelete={() => deleteProject(project.id)}
                />
              );
            })}
          </AnimatePresence>

          {projects.length === 0 && (
            <motion.li
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full rounded-2xl border border-dashed border-slate-300 px-4 py-14 text-center"
            >
              <p className="text-sm text-slate-500">
                No projects yet. Create your first one to start adding tickets.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                New project
              </button>
            </motion.li>
          )}
        </motion.ul>
      )}

      <ProjectFormModal
        open={modalOpen}
        initial={editing}
        formKey={formKey}
        onClose={() => setModalOpen(false)}
        onSubmit={(values) =>
          editing ? saveProject(editing, values) : createProject(values)
        }
      />
    </div>
  );
}
