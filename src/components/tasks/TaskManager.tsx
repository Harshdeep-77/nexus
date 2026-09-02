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
  const [openId, setOpenId] = useState<number | null>(null);
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

  async function deleteTask(id: number) {
    const previous = tasks;
    setError("");
    setTasks((prev) => prev.filter((task) => task.id !== id));
    if (openId === id) setOpenId(null);

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
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-600">
          Your session has expired. Log in to see your tasks.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          maxLength={200}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        />
        <button
          type="submit"
          disabled={adding || !title.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
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
        <h2 className="text-sm font-medium text-slate-700">Your tasks</h2>
        <p className="text-xs text-slate-500">
          {/* keyed on the count, so it re-mounts and pops on every change */}
          <motion.span
            key={done}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="inline-block font-semibold text-slate-700"
          >
            {done}
          </motion.span>{" "}
          of {tasks.length} done
        </p>
      </div>

      {loading ? (
        <ul className="mt-3 space-y-2.5">
          {[0, 1, 2].map((row) => (
            <li
              key={row}
              className="h-[50px] animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </ul>
      ) : (
        <motion.ul layout className="mt-3 space-y-2.5">
          <AnimatePresence>
            {tasks.map((task) => {
              const revealIndex = initialOrder?.indexOf(task.id) ?? -1;
              const revealDelay =
                revealIndex >= 0 ? Math.min(revealIndex, 8) * 0.08 : 0;

              return (
                <TaskItem
                  key={task.id}
                  task={task}
                  open={openId === task.id}
                  revealDelay={revealDelay}
                  onToggle={() =>
                    setOpenId((current) =>
                      current === task.id ? null : task.id,
                    )
                  }
                  onStatus={(status) => updateStatus(task.id, status)}
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
              className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500"
            >
              No tasks yet. Add your first one above.
            </motion.li>
          )}
        </motion.ul>
      )}
    </div>
  );
}
