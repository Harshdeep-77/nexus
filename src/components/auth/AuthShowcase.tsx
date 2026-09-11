"use client";

import { useEffect, useState } from "react";

type Task = { title: string; tag: string; tone: string };

const TASKS: Task[] = [
  { title: "Design landing page", tag: "Design", tone: "#8B5CF6" },
  { title: "Set up auth flow", tag: "Backend", tone: "#3B82F6" },
  { title: "Review pull request", tag: "Review", tone: "#10B981" },
];

const PROJECTS = [
  { name: "Nexus Web", tasks: "18 / 25", progress: 72, tone: "#3B82F6" },
  { name: "Mobile App", tasks: "9 / 20", progress: 45, tone: "#8B5CF6" },
  { name: "API Platform", tasks: "22 / 25", progress: 88, tone: "#10B981" },
];

/* The panel plays like a looping video: one frame counter drives every scene. */
const TICK = 90; // ms per frame
const LOOP = 200; // frames per loop (~18s)
const TYPE_AT = 6; // first keystroke
const TASK_STEP = 46; // frames between two tasks
const HOLD = 8; // frames the typed text rests before "Add" is pressed
const CHECK_AT = 138; // first task gets ticked off
const CHECK_STEP = 10;
const FADE_AT = 192; // window fades out just before the loop restarts

const typeStart = (i: number) => TYPE_AT + i * TASK_STEP;
const commitAt = (i: number) => typeStart(i) + TASKS[i].title.length + HOLD;
const checkAt = (i: number) => CHECK_AT + i * CHECK_STEP;

export default function AuthShowcase() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % LOOP), TICK);
    return () => clearInterval(id);
  }, []);

  let typed = "";
  let pressing = false;
  for (let i = 0; i < TASKS.length; i++) {
    if (frame >= typeStart(i) && frame < commitAt(i)) {
      typed = TASKS[i].title.slice(0, frame - typeStart(i));
      pressing = frame >= commitAt(i) - 3;
    }
  }

  const justAdded = TASKS.some((_, i) => {
    const age = frame - commitAt(i);
    return age >= 0 && age < 10;
  });
  const running = frame > 14 && frame < FADE_AT;
  const fading = frame >= FADE_AT;

  return (
    <div className="relative flex h-full w-full flex-col justify-center overflow-hidden bg-[#0B1120] px-10 py-12">
      {/* ambient background */}
      <div className="anim-blob pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-600/25 blur-3xl" />
      <div
        className="anim-blob pointer-events-none absolute -right-20 -bottom-24 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl"
        style={{ animationDelay: "-4s" }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.07) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto w-full max-w-md">
        {/* brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7L5.5 10.5L12 3.5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-white">
            Nexus
          </span>
        </div>

        <h2 className="mt-8 text-[26px] leading-tight font-semibold tracking-tight text-white">
          Capture every task.
          <br />
          Ship every project.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          One workspace for your tasks, your projects and the people moving them
          forward.
        </p>

        {/* mock app window */}
        <div
          className="anim-float relative mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#111A2E]/85 shadow-2xl backdrop-blur"
          style={{ opacity: fading ? 0 : 1, transition: "opacity 500ms ease" }}
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            <span className="ml-2 text-[11px] font-medium text-white/45">
              Today &middot; My tasks
            </span>
            <span
              className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400"
              style={{
                opacity: justAdded ? 1 : 0,
                transform: justAdded ? "translateY(0)" : "translateY(-4px)",
                transition: "all 300ms ease",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Task added
            </span>
          </div>

          <div className="p-4">
            {/* composer */}
            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-dashed border-white/25 text-[13px] leading-none text-white/40">
                +
              </span>
              <span className="flex-1 truncate text-[13px] text-white/85">
                {typed || <span className="text-white/30">Add a task...</span>}
                <span className="anim-caret ml-0.5 inline-block h-[13px] w-px translate-y-[2px] bg-blue-400 align-middle" />
              </span>
              <span
                className="rounded-lg px-3 py-1 text-[11px] font-medium text-white transition-transform duration-150"
                style={{
                  background: pressing ? "#2563EB" : "#3B82F6",
                  transform: pressing ? "scale(.9)" : "scale(1)",
                }}
              >
                Add
              </span>
            </div>

            {/* task list */}
            {TASKS.map((task, i) => {
              const age = frame - commitAt(i);
              const added = age >= 0;
              const fresh = added && age < 6;
              const checked = frame >= checkAt(i);
              return (
                <div
                  key={task.title}
                  className="overflow-hidden"
                  style={{
                    maxHeight: added ? 80 : 0,
                    marginTop: added ? 10 : 0,
                    transition:
                      "max-height 420ms cubic-bezier(.22,1,.36,1), margin-top 420ms cubic-bezier(.22,1,.36,1)",
                  }}
                >
                  <div
                    className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                    style={{
                      borderColor: fresh
                        ? "rgba(59,130,246,.55)"
                        : "rgba(255,255,255,.08)",
                      background: fresh
                        ? "rgba(59,130,246,.14)"
                        : "rgba(255,255,255,.03)",
                      opacity: added ? 1 : 0,
                      transform: added ? "translateY(0)" : "translateY(12px)",
                      transition:
                        "opacity 400ms ease, transform 450ms cubic-bezier(.22,1,.36,1), background 400ms ease, border-color 400ms ease",
                    }}
                  >
                    <span
                      className="grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border transition-colors duration-300"
                      style={{
                        borderColor: checked
                          ? "#22C55E"
                          : "rgba(255,255,255,.3)",
                        background: checked ? "#22C55E" : "transparent",
                      }}
                    >
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 12 12"
                        fill="none"
                        style={{
                          opacity: checked ? 1 : 0,
                          transition: "opacity 200ms ease",
                        }}
                      >
                        <path
                          d="M2 6.2L4.7 9L10 3.2"
                          stroke="#0B1120"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span
                      className="flex-1 truncate text-[13px] text-white/85 transition-opacity duration-300"
                      style={{
                        textDecoration: checked ? "line-through" : "none",
                        opacity: checked ? 0.45 : 1,
                      }}
                    >
                      {task.title}
                    </span>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ color: task.tone, background: task.tone + "24" }}
                    >
                      {task.tag}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* projects */}
            <div className="mt-5 flex items-center gap-3">
              <span className="text-[11px] font-medium tracking-wide text-white/40 uppercase">
                Projects
              </span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="mt-2.5 grid grid-cols-3 gap-2.5">
              {PROJECTS.map((project, i) => (
                <div
                  key={project.name}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-3"
                  style={{
                    opacity: running ? 1 : 0,
                    transform: running
                      ? "translateY(0) scale(1)"
                      : "translateY(10px) scale(.97)",
                    transition: `opacity 500ms ease ${i * 120}ms, transform 500ms cubic-bezier(.22,1,.36,1) ${i * 120}ms`,
                  }}
                >
                  <div
                    className="h-6 w-6 rounded-lg"
                    style={{
                      background: project.tone + "2E",
                      boxShadow: `inset 0 0 0 1px ${project.tone}55`,
                    }}
                  />
                  <p className="mt-2 truncate text-[11px] font-medium text-white/85">
                    {project.name}
                  </p>
                  <p className="text-[10px] text-white/40">
                    {project.tasks} tasks
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: running ? `${project.progress}%` : "0%",
                        background: project.tone,
                        transition: `width 2200ms ease ${400 + i * 150}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* playback scrubber */}
          <div className="h-0.5 w-full bg-white/5">
            <div
              className="h-full bg-blue-500/70"
              style={{
                width: `${(frame / LOOP) * 100}%`,
                transition: frame === 0 ? "none" : "width 90ms linear",
              }}
            />
          </div>
        </div>

        <div className="mt-8 flex items-center gap-6 text-[11px] text-slate-500">
          <span>
            <span className="font-semibold text-slate-300">12k+</span> tasks
            completed
          </span>
          <span>
            <span className="font-semibold text-slate-300">840</span> active
            projects
          </span>
        </div>
      </div>
    </div>
  );
}
