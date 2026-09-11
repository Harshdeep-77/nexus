"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import TaskItem from "./TaskItem";

export type TaskStatus = "pending" | "completed" | "not_completed";

export type Task = {
  id: number;
  title: string;
  status: TaskStatus;
  created_at?: string;
};

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");

  // Ids present in the very first load, in order — drives the one-by-one
  // reveal. Tasks added afterwards aren't in here, so they pop in instantly
  // instead of waiting through the whole stagger.
  const [initialOrder, setInitialOrder] = useState<number[] | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTasks() {
      try {
        // no-store, otherwise a revisit can render the browser-cached list
        const res = await fetch("/api/todo", { cache: "no-store" });
        if (!active) return;

        if (res.status === 401) {
          setNeedsLogin(true);
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not load tasks");
          return;
        }

        const loaded: Task[] = data.todos ?? [];
        setInitialOrder(loaded.map((task) => task.id));
        setTasks(loaded);
      } catch {
        if (active) setError("Could not load tasks");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTasks();
    return () => {
      active = false;
    };
  }, []);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value || adding) return;

    setAdding(true);
    setError("");

    try {
      const res = await fetch("/api/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: value, status: "pending" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not add task");
        return;
      }

      setTasks((prev) => [
        { ...data.todo, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setTitle("");
    } catch {
      setError("Could not add task");
    } finally {
      setAdding(false);
    }
  }

  async function updateStatus(id: number, status: TaskStatus) {
    const previous = tasks;
    setError("");
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, status } : task)),
    );

    try {
      const res = await fetch(`/api/todo/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTasks(previous);
      setError("Could not update task");
    }
  }

  async function updateTitle(id: number, newTitle: string) {
    const previous = tasks;
    setError("");
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, title: newTitle } : task)),
    );

    try {
      const res = await fetch(`/api/todo/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTasks(previous);
      setError("Could not update task");
    }
  }

  async function deleteTask(id: number) {
    const previous = tasks;
    setError("");
    setTasks((prev) => prev.filter((task) => task.id !== id));

    try {
      const res = await fetch(`/api/todo/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setTasks(previous);
      setError("Could not delete task");
    }
  }

  const done = tasks.filter((task) => task.status === "completed").length;

  if (needsLogin) {
    return (
      <div className="glass rounded-2xl border border-white/50 p-8 text-center shadow-md">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <path d="M6.5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h2.5M12 12.5L15 9l-3-3.5M7 9h8" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-700">
          Your session has expired
        </p>
        <p className="mt-1 text-xs text-slate-500">Log in to see your tasks.</p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition-all hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <form
        onSubmit={addTask}
        className="glass flex flex-col gap-2 rounded-2xl border border-white/50 p-3 shadow-sm sm:flex-row sm:items-center"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          maxLength={200}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
        />
        <button
          type="submit"
          disabled={adding || !title.trim()}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition-all hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md"
        >
          {adding ? "Adding..." : "Add task"}
        </button>
      </form>

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

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Your tasks</h2>
        <p className="text-xs text-slate-500">
          {/* keyed on the count, so it re-mounts and pops on every change */}
          <motion.span
            key={done}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="inline-block font-bold text-indigo-600"
          >
            {done}
          </motion.span>{" "}
          of {tasks.length} done
        </p>
      </div>

      {loading ? (
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((row) => (
            <li
              key={row}
              className="h-[90px] animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </ul>
      ) : (
        <motion.ul layout className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {tasks.map((task) => {
              const revealIndex = initialOrder?.indexOf(task.id) ?? -1;
              const revealDelay =
                revealIndex >= 0 ? Math.min(revealIndex, 8) * 0.08 : 0;

              return (
                <TaskItem
                  key={task.id}
                  task={task}
                  revealDelay={revealDelay}
                  onStatus={(status) => updateStatus(task.id, status)}
                  onEdit={(newTitle) => updateTitle(task.id, newTitle)}
                  onDelete={() => deleteTask(task.id)}
                />
              );
            })}
          </AnimatePresence>

          {tasks.length === 0 && (
            <motion.li
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full rounded-2xl border border-dashed border-slate-300 px-4 py-14 text-center text-sm text-slate-500"
            >
              No tasks yet. Add your first one above.
            </motion.li>
          )}
        </motion.ul>
      )}
    </div>
  );
}
