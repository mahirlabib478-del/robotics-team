export const dynamic = "force-dynamic";

import Link from "next/link";
import { archiveCompetition, createCompetition, publishCompetition, submitCompetitionForReview, updateCompetition } from "@/app/actions/admin-content";
import { requireAdmin, requireRole } from "@/lib/admin-auth";

export default async function AdminCompetitionsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { supabase, profile } = await requireAdmin();
  requireRole("technical_lead", profile.role);
  const { data: items } = await supabase.from("competitions").select("id,official_name,slug,organizer,year,city,country,level,segment,robot_name,result,event_date,report,publish_status").order("year", { ascending: false });
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-10 text-[#f5f8fc] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm text-[#19d3ff]">← Admin</Link>
        <h1 className="mt-6 text-3xl font-black sm:text-4xl">Competition records</h1>
        {params.error ? <p role="alert" className="mt-5 rounded-xl border border-[#ff7a00]/30 p-4 text-sm text-[#ffbd85]">{params.error === "archived" ? "Archived records cannot be edited." : params.error === "review-required" ? "Only team leads can edit a published record. The record must be reviewed again after editing." : params.error === "invalid-transition" ? "This workflow transition is not allowed from the current status." : "Could not save this record. Check required fields, duplicate slugs and permissions."}</p> : null}
        {params.saved ? <p role="status" className="mt-5 rounded-xl border border-emerald-400/20 p-4 text-sm text-emerald-300">Competition record saved. If edited from review or published, it is now a draft and must be reviewed again.</p> : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <form action={createCompetition} className="grid min-w-0 gap-4 rounded-3xl border border-white/10 bg-[#0b1727] p-4 sm:p-7">
            <h2 className="text-xl font-bold">New competition draft</h2>
            {[
              ["official_name", "Official competition name", true], ["slug", "Slug", true], ["organizer", "Organizer", true],
              ["year", "Year", true], ["city", "City", false], ["country", "Country", false],
              ["segment", "Segment", true], ["robot_name", "Participating robot", true], ["event_date", "Event date", false],
            ].map(([name, label, required]) => (
              <label key={name as string} className="grid gap-2 text-sm text-slate-300">
                {label as string}
                <input name={name as string} type={name === "event_date" ? "date" : "text"} required={required as boolean} className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 outline-none focus:border-[#19d3ff]/50" />
              </label>
            ))}
            <label className="grid gap-2 text-sm text-slate-300">Level<select name="level" defaultValue="National" className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3"><option>National</option><option>International</option></select></label>
            <label className="grid gap-2 text-sm text-slate-300">Result<select name="result" defaultValue="Participation" className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3">{["Champion","Runner-up","Podium","Finalist","Participation"].map(x => <option key={x}>{x}</option>)}</select></label>
            <label className="grid gap-2 text-sm text-slate-300">Report<textarea name="report" rows={4} className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3" /></label>
            <button className="rounded-full bg-[#1479ff] px-5 py-3 font-semibold">Create draft</button>
          </form>

          <div className="grid content-start gap-3">
            {(items ?? []).map((item) => (
              <article key={item.id} className="min-w-0 rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-5">
                <div className="flex justify-between gap-4"><div><h2 className="font-bold">{item.official_name}</h2><p className="mt-1 text-xs text-slate-500">{item.year} · {item.city ?? "—"}, {item.country ?? "—"} · {item.level}</p></div><span className="text-xs uppercase text-slate-600">{item.publish_status}</span></div>
                <p className="mt-3 text-sm text-slate-400">{item.robot_name} · {item.result}</p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-[#19d3ff]">Edit / workflow</summary>
                  <form action={updateCompetition} className="mt-4 grid gap-3">
                    <input type="hidden" name="id" value={item.id} />
                    <label className="grid gap-1 text-xs text-slate-400">Official name<input name="official_name" defaultValue={String(item.official_name ?? "")} className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" /></label>
                    <label className="grid gap-1 text-xs text-slate-400">Slug<input name="slug" defaultValue={String(item.slug ?? "")} className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" /></label>
                    <label className="grid gap-1 text-xs text-slate-400">Organizer<input name="organizer" defaultValue={String(item.organizer ?? "")} className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" /></label>
                    <label className="grid gap-1 text-xs text-slate-400">Year<input name="year" defaultValue={String(item.year ?? "")} className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" /></label>
                    <label className="grid gap-1 text-xs text-slate-400">City<input name="city" defaultValue={String(item.city ?? "")} className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" /></label>
                    <label className="grid gap-1 text-xs text-slate-400">Country<input name="country" defaultValue={String(item.country ?? "")} className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" /></label>
                    <label className="grid gap-1 text-xs text-slate-400">Segment<input name="segment" defaultValue={String(item.segment ?? "")} className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" /></label>
                    <label className="grid gap-1 text-xs text-slate-400">Robot<input name="robot_name" defaultValue={String(item.robot_name ?? "")} className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" /></label>
                    <label className="grid gap-1 text-xs text-slate-400">Event date<input name="event_date" defaultValue={String(item.event_date ?? "")} className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" /></label>
                    <label className="grid gap-1 text-xs text-slate-400">Report<input name="report" defaultValue={String(item.report ?? "")} className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" /></label>
                    <label className="grid gap-1 text-xs text-slate-400">Level<select name="level" defaultValue={item.level} className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm"><option>National</option><option>International</option></select></label>
                    <label className="grid gap-1 text-xs text-slate-400">Result<select name="result" defaultValue={item.result} className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm">{["Champion","Runner-up","Podium","Finalist","Participation"].map(x => <option key={x}>{x}</option>)}</select></label>
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-full bg-[#1479ff] px-3 py-2 text-xs font-semibold">Save edits</button>
                      {item.publish_status === "draft" ? <button formAction={submitCompetitionForReview} className="rounded-full border px-3 py-2 text-xs">Submit review</button> : null}
                      {item.publish_status === "review" && (profile.role === "team_lead" || profile.role === "super_admin") ? <button formAction={publishCompetition} className="rounded-full bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950">Publish</button> : null}
                      {item.publish_status !== "archived" && (profile.role === "team_lead" || profile.role === "super_admin") ? <button formAction={archiveCompetition} className="rounded-full border px-3 py-2 text-xs">Archive</button> : null}
                    </div>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
