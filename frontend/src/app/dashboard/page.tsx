"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandDashboard } from "../../components/BrandDashboard";
import { CreatorDashboard } from "../../components/CreatorDashboard";
import { clearAuth, readAuth } from "../../lib/auth";
import type { User } from "../../types";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = readAuth();
    if (!auth) router.replace("/auth");
    else setUser(auth.user);
  }, [router]);

  if (!user) return <main className="grid min-h-screen place-items-center">Loading workspace…</main>;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-8">
      <header className="mb-8 flex items-center justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-grape">Meme&apos;d</p><h1 className="text-2xl font-bold">Hi, {user.name}</h1><p className="capitalize text-slate-600">{user.role} workspace</p></div><button onClick={() => { clearAuth(); router.replace("/auth"); }} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Log out</button></header>
      {user.role === "brand" ? <BrandDashboard /> : <CreatorDashboard />}
    </main>
  );
}
