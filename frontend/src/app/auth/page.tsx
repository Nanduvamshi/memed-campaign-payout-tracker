"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { saveAuth } from "../../lib/auth";
import type { Role } from "../../types";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<Role>("creator");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setError("");
    setIsSubmitting(true);
    try {
      const result = mode === "signup"
        ? await api.signup({
          name: String(values.get("name")),
          email: String(values.get("email")),
          password: String(values.get("password")),
          role,
        })
        : await api.login({ email: String(values.get("email")), password: String(values.get("password")) });
      saveAuth(result);
      router.replace("/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to continue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5">
      <section className="w-full rounded-3xl bg-white p-8 shadow-xl shadow-violet-200/50">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-grape">Meme&apos;d</p>
        <h1 className="text-3xl font-bold">Campaign Payout Tracker</h1>
        <p className="mt-2 text-sm text-slate-600">{mode === "login" ? "Welcome back." : "Create your workspace."}</p>
        <form className="mt-7 space-y-4" onSubmit={submit}>
          {mode === "signup" && <label className="block text-sm font-medium">Name<input name="name" required minLength={2} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>}
          <label className="block text-sm font-medium">Email<input name="email" type="email" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
          <label className="block text-sm font-medium">Password<input name="password" type="password" required minLength={8} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
          {mode === "signup" && (
            <label className="block text-sm font-medium">I am a
              <select value={role} onChange={(event) => setRole(event.target.value as Role)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
                <option value="creator">Creator</option><option value="brand">Brand</option>
              </select>
            </label>
          )}
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={isSubmitting} className="w-full rounded-xl bg-grape px-4 py-3 font-semibold text-white disabled:opacity-60">
            {isSubmitting ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
        <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} className="mt-5 w-full text-sm font-semibold text-grape">
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>
      </section>
    </main>
  );
}
