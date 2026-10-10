export const dynamic = "force-dynamic";

import Link from "next/link";
import { archiveRobot, createRobot, publishRobot, submitRobotForReview, updateRobot } from "@/app/actions/admin-content";
import { requireAdmin, requireRole } from "@/lib/admin-auth";

export default async function AdminRobotsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { supabase, profile } = await requireAdmin();
  requireRole("technical_lead", profile.role);
  const { data: robots } = await supabase.from("robots").select("id,name,slug,category,version,status,development_year,weight_kg,dimensions,summary,publish_status").order("updated_at", { ascending: false });
  let publicEngineeringById = new Map<string, Record<string, string>>();
  if (robots?.length) {
    const { data: publicEngineeringRows, error: publicEngineeringError } = await supabase.from("robots").select("id,public_engineering").in("id", robots.map((robot) => robot.id));
    if (publicEngineeringError) console.error("Public robot engineering fields could not be loaded. Apply the public engineering migration before editing these fields.", publicEngineeringError);
    else publicEngineeringById = new Map((publicEngineeringRows ?? []).map((robot) => [robot.id, robot.public_engineering ?? {}] as const));
  }
  const robotRecords = (robots ?? []).map((robot) => ({ ...robot, public_engineering: publicEngineeringById.get(robot.id) ?? {} }));
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-10 text-[#f5f8fc] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm text-[#19d3ff]">← Admin</Link>
        <h1 className="mt-6 text-3xl font-black sm:text-4xl">Robot records</h1>
        {params.error ? <p role="alert" className="mt-5 rounded-xl border border-[#ff7a00]/30 p-4 text-sm text-[#ffbd85]">{params.error === "invalid-weight" ? "Weight must be a valid number greater than or equal to zero." : params.error === "missing" ? "Required fields are missing or invalid. Check the slug, status, year and summary." : "Could not save this record. Check for duplicate slugs and your permissions."}</p> : null}
        {params.saved ? <p role="status" className="mt-5 rounded-xl border border-emerald-400/20 p-4 text-sm text-emerald-300">Robot record saved successfully.</p> : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <form action={createRobot} className="grid min-w-0 gap-4 rounded-3xl border border-white/10 bg-[#0b1727] p-4 sm:p-7">
            <h2 className="text-xl font-bold">New robot draft</h2>
            {[
              ["name", "Official name", true], ["slug", "Slug", true], ["category", "Category", true],
              ["version", "Version", true], ["development_year", "Development year", true],
              ["weight_kg", "Weight (kg)", false], ["dimensions", "Dimensions", false],
            ].map(([name, label, required]) => (
              <label key={name as string} className="grid gap-2 text-sm text-slate-300">
                {label as string}
                <input name={name as string} type={name === "weight_kg" || name === "development_year" ? "number" : "text"} min={name === "weight_kg" ? 0 : name === "development_year" ? 1900 : undefined} max={name === "development_year" ? 2100 : undefined} step={name === "weight_kg" ? "0.01" : name === "development_year" ? "1" : undefined} required={required as boolean} className="min-w-0 rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 outline-none focus:border-[#19d3ff]/50" />
              </label>
            ))}
            <label className="grid gap-2 text-sm text-slate-300">Status<select name="status" required defaultValue="In Development" className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3"><option>Competition Ready</option><option>In Development</option><option>Retired</option><option>Prototype</option></select></label>
            <label className="grid gap-2 text-sm text-slate-300">Summary<textarea name="summary" required rows={5} className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 outline-none focus:border-[#19d3ff]/50" /></label>
            <fieldset className="grid gap-3 rounded-2xl border border-white/10 p-4"><legend className="px-2 text-sm font-semibold text-[#8deaff]">Public engineering summary</legend><p className="text-xs leading-5 text-slate-500">Only include approved public explanations. Never add source code, detailed CAD, firmware, sensitive strategy or confidential costs.</p>{[
              ["problem", "Problem solved"], ["mechanicalDesign", "Mechanical design"], ["electronicsArchitecture", "Electronics architecture"], ["controlLogic", "Control logic"], ["componentChoices", "Component choices"], ["limitations", "Limitations"], ["futureImprovements", "Future improvements"],
            ].map(([field, label]) => <label key={field} className="grid gap-2 text-sm text-slate-300">{label}<textarea name={`public_engineering_${field}`} rows={2} maxLength={2000} className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 outline-none focus:border-[#19d3ff]/50" /></label>)}</fieldset>
            <button className="rounded-full bg-[#1479ff] px-5 py-3 font-semibold">Create draft</button>
          </form>

          <div className="grid content-start gap-3">
            {robotRecords.map((robot) => (
              <article key={robot.id} className="min-w-0 rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-5">
                <div className="flex justify-between gap-4">
                  <div><h2 className="font-bold">{robot.name}</h2><p className="mt-1 text-xs text-slate-500">{robot.category} · {robot.version} · {robot.development_year}</p></div>
                  <span className="text-xs uppercase text-slate-600">{robot.publish_status}</span>
                </div>
                <p className="mt-3 text-sm text-slate-400">{robot.status}</p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-[#19d3ff]">Edit / workflow</summary>
                  <form action={updateRobot} className="mt-4 grid gap-3">
                    <input type="hidden" name="id" value={robot.id} />
                    <input name="name" defaultValue={robot.name} placeholder="Official name" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="slug" defaultValue={robot.slug} placeholder="Slug" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="category" defaultValue={robot.category} placeholder="Category" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="version" defaultValue={robot.version} placeholder="Version" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <select name="status" defaultValue={robot.status} required className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm"><option>Competition Ready</option><option>In Development</option><option>Retired</option><option>Prototype</option></select>
                    <input name="development_year" defaultValue={robot.development_year} placeholder="Development year" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="weight_kg" type="number" min="0" step="0.01" defaultValue={robot.weight_kg ?? ""} placeholder="Weight (kg)" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="dimensions" defaultValue={robot.dimensions ?? ""} placeholder="Dimensions" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <textarea name="summary" required rows={3} defaultValue={robot.summary ?? ""} placeholder="Summary" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <fieldset className="grid gap-3 rounded-xl border border-white/10 p-3"><legend className="px-1 text-xs font-semibold text-[#8deaff]">Public engineering summary</legend><p className="text-xs leading-5 text-slate-500">Approved public-safe explanations only. Restricted design details remain in private engineering records.</p>{[
                      ["problem", "Problem solved"], ["mechanicalDesign", "Mechanical design"], ["electronicsArchitecture", "Electronics architecture"], ["controlLogic", "Control logic"], ["componentChoices", "Component choices"], ["limitations", "Limitations"], ["futureImprovements", "Future improvements"],
                    ].map(([field, label]) => <label key={field} className="grid gap-1 text-xs text-slate-400">{label}<textarea name={`public_engineering_${field}`} defaultValue={robot.public_engineering?.[field] ?? ""} rows={2} maxLength={2000} className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm text-slate-200" /></label>)}</fieldset>
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-full bg-[#1479ff] px-3 py-2 text-xs font-semibold">Save edits</button>
                      {robot.publish_status === "draft" ? <button formAction={submitRobotForReview} className="rounded-full border px-3 py-2 text-xs">Submit review</button> : null}
                      {robot.publish_status === "review" && (profile.role === "team_lead" || profile.role === "super_admin") ? <button formAction={publishRobot} className="rounded-full bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950">Publish</button> : null}
                      {robot.publish_status !== "archived" && (profile.role === "team_lead" || profile.role === "super_admin") ? <button formAction={archiveRobot} className="rounded-full border px-3 py-2 text-xs">Archive</button> : null}
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
