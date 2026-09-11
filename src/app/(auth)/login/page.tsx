"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "govind@gmail.com",
    password: "123456",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* brand, only on small screens where the animation panel is hidden */}
      <div className="mb-8 flex items-center gap-2.5 lg:hidden">
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
        <span className="text-[17px] font-semibold tracking-tight text-slate-900">
          Nexus
        </span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Log in to pick up where your team left off.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-slate-700">Email</span>
          <input
            name="email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-slate-700">
            Password
          </span>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              minLength={6}
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-16 pl-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-[12px] font-medium text-slate-500 hover:text-slate-800"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
