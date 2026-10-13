"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { api } from "../lib/api";
import type { Milestone } from "../types";

const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export function BrandDashboard() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["my-campaigns"], queryFn: api.myCampaigns });
  const [milestones, setMilestones] = useState<Milestone[]>([{ viewThreshold: 10_000, payout: 500 }]);
  const [error, setError] = useState("");
  const createCampaign = useMutation({
    mutationFn: api.createCampaign,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-campaigns"] });
      setMilestones([{ viewThreshold: 10_000, payout: 500 }]);
      setError("");
    },
    onError: (requestError) => setError(requestError instanceof Error ? requestError.message : "Could not create campaign"),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    createCampaign.mutate({
      name: String(values.get("name")),
      platform: String(values.get("platform")) as "instagram" | "youtube",
      totalBudget: Number(values.get("totalBudget")),
      milestones,
    });
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: number) => {
    setMilestones((current) => current.map((milestone, milestoneIndex) => milestoneIndex === index ? { ...milestone, [field]: value } : milestone));
  };

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Create a campaign</h2>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <input required name="name" placeholder="Campaign name" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
          <div className="grid grid-cols-2 gap-3">
            <select name="platform" className="rounded-xl border border-slate-200 px-3 py-2"><option value="instagram">Instagram</option><option value="youtube">YouTube</option></select>
            <input required name="totalBudget" type="number" min="1" placeholder="Budget (₹)" className="rounded-xl border border-slate-200 px-3 py-2" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Milestone ladder</p>
            {milestones.map((milestone, index) => (
              <div className="flex gap-2" key={index}>
                <input type="number" min="1" value={milestone.viewThreshold} onChange={(event) => updateMilestone(index, "viewThreshold", Number(event.target.value))} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2" aria-label="View threshold" />
                <input type="number" min="1" value={milestone.payout} onChange={(event) => updateMilestone(index, "payout", Number(event.target.value))} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2" aria-label="Payout" />
                {milestones.length > 1 && <button type="button" onClick={() => setMilestones((current) => current.filter((_, milestoneIndex) => milestoneIndex !== index))} className="rounded-xl px-2 text-red-600">×</button>}
              </div>
            ))}
            <button type="button" onClick={() => setMilestones((current) => [...current, { viewThreshold: 50_000, payout: 2_000 }])} className="text-sm font-semibold text-grape">+ Add milestone</button>
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button disabled={createCampaign.isPending} className="w-full rounded-xl bg-grape py-3 font-semibold text-white disabled:opacity-60">{createCampaign.isPending ? "Creating…" : "Create campaign"}</button>
        </form>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold">Your campaigns</h2>
        {isLoading ? <p>Loading campaigns…</p> : data?.campaigns.length === 0 ? <p className="rounded-2xl bg-white p-6 text-slate-600">No campaigns yet.</p> : <div className="space-y-4">
          {data?.campaigns.map((campaign) => <article key={campaign._id} className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4"><div><h3 className="font-bold">{campaign.name}</h3><p className="mt-1 text-sm capitalize text-slate-600">{campaign.platform}</p></div><span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-grape">{money(campaign.remainingBudget)} left</span></div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-grape" style={{ width: `${Math.min(100, (campaign.budgetSpent / campaign.totalBudget) * 100)}%` }} /></div>
            <p className="mt-2 text-sm text-slate-600">{money(campaign.budgetSpent)} spent of {money(campaign.totalBudget)}</p>
            <p className="mt-4 text-sm text-slate-700">{campaign.milestones.map((milestone) => `${milestone.viewThreshold.toLocaleString()} views · ${money(milestone.payout)}`).join("  /  ")}</p>
          </article>)}
        </div>}
      </section>
    </div>
  );
}
