"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { api } from "../lib/api";
import type { Campaign } from "../types";

const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export function CreatorDashboard() {
  const queryClient = useQueryClient();
  const campaigns = useQuery({ queryKey: ["campaigns"], queryFn: api.campaigns });
  const submissions = useQuery({ queryKey: ["my-submissions"], queryFn: api.mySubmissions });
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [postUrl, setPostUrl] = useState("");
  const [error, setError] = useState("");
  const submitPost = useMutation({
    mutationFn: api.createSubmission,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
      setSelectedCampaign(null);
      setPostUrl("");
      setError("");
    },
    onError: (requestError) => setError(requestError instanceof Error ? requestError.message : "Could not submit post"),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCampaign) return;
    submitPost.mutate({ campaignId: selectedCampaign._id, postUrl });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-ink p-6 text-white"><p className="text-sm font-semibold text-violet-200">TOTAL EARNINGS</p><p className="mt-2 text-4xl font-bold">{money(submissions.data?.totalEarnings ?? 0)}</p></section>
      <section>
        <h2 className="mb-4 text-xl font-bold">Live campaigns</h2>
        {campaigns.isLoading ? <p>Loading campaigns…</p> : campaigns.data?.campaigns.length === 0 ? <p className="rounded-2xl bg-white p-6 text-slate-600">No live campaigns right now.</p> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.data?.campaigns.map((campaign) => <article key={campaign._id} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium capitalize text-grape">{campaign.platform}</p><h3 className="mt-1 font-bold">{campaign.name}</h3>
            <p className="mt-3 text-sm text-slate-600">Up to {money(Math.max(...campaign.milestones.map((milestone) => milestone.payout)))} per post</p>
            <button onClick={() => { setSelectedCampaign(campaign); setError(""); }} className="mt-5 rounded-xl bg-grape px-4 py-2 text-sm font-semibold text-white">Submit post</button>
          </article>)}
        </div>}
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold">Your posts</h2>
        {submissions.isLoading ? <p>Loading posts…</p> : submissions.data?.submissions.length === 0 ? <p className="rounded-2xl bg-white p-6 text-slate-600">Submit a post to start earning.</p> : <div className="space-y-3">
          {submissions.data?.submissions.map((submission) => {
            const campaign = typeof submission.campaign === "string" ? undefined : submission.campaign;
            return <article key={submission._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm"><div><h3 className="font-bold">{campaign?.name ?? "Campaign"}</h3><a href={submission.postUrl} target="_blank" rel="noreferrer" className="text-sm text-grape underline">View submitted post</a></div><div className="flex gap-6 text-sm"><p><span className="block text-slate-500">Views</span><b>{submission.views.toLocaleString()}</b></p><p><span className="block text-slate-500">Earned</span><b>{money(submission.payoutGranted)}</b></p></div></article>;
          })}
        </div>}
      </section>
      {selectedCampaign && <div className="fixed inset-0 grid place-items-center bg-slate-950/40 p-5"><form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-xl font-bold">Submit to {selectedCampaign.name}</h2><label className="mt-5 block text-sm font-medium">Post URL<input required type="url" value={postUrl} onChange={(event) => setPostUrl(event.target.value)} placeholder="https://…" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>{error && <p className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setSelectedCampaign(null)} className="rounded-xl px-4 py-2 font-semibold">Cancel</button><button disabled={submitPost.isPending} className="rounded-xl bg-grape px-4 py-2 font-semibold text-white">{submitPost.isPending ? "Submitting…" : "Submit post"}</button></div></form></div>}
    </div>
  );
}
