export const dynamic = "force-dynamic";

import Link from "next/link";
import { archiveRobot, createRobot, publishRobot, submitRobotForReview } from "@/app/actions/admin-content";
import { requireAdmin, requireRole } from "@/lib/admin-auth";

export default async function AdminRobotsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { supabase, profile } = await requireAdmin();
  requireRole("technical_lead", profile.role);
  const { data: robots } = await supabase.from("robots").select("id,name,category,version,status,development_year,publish_status").order("updated_at", { ascending: false });
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-12 text-[#f5f8fc]">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm text-[#19d3ff]">← Admin</Link>
        <h1 className="mt-6 text-4xl font-black">Robot records</h1>
        {params.error ? <p className="mt-5 rounded-xl border border-[#ff7a00]/30 p-4 text-sm text-[#ffbd85]">Could not save this record.</p> : null}
        {params.saved ? <p className="mt-5 rounded-xl border border-emerald-400/20 p-4 text-sm text-emerald-300">Draft robot created.</p> : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <form action={createRobot} className="grid gap-4 rounded-3xl border border-white/10 bg-[#0b1727] p-7">
            <h2 className="text-xl font-bold">New robot draft</h2>
            {[
              ["name", "Official name", true], ["slug", "Slug", true], ["category", "Category", true],
              ["version", "Version", true], ["status", "Status", true], ["development_year", "Development year", true],
              ["weight_kg", "Weight (kg)", false], ["dimensions", "Dimensions", false],
            ].map(([name, label, required]) => (
              <label key={name as string} className="grid gap-2 text-sm text-slate-300">
                {label as string}
                <input name={name as string} required={required as boolean} className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 outline-none focus:border-[#19d3ff]/50" />
              </label>
            ))}
            <label className="grid gap-2 text-sm text-slate-300">Summary<textarea name="summary" required rows={5} className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 outline-none focus:border-[#19d3ff]/50" /></label>
            <button className="rounded-full bg-[#1479ff] px-5 py-3 font-semibold">Create draft</button>
          </form>

          <div className="grid content-start gap-3">
            {(robots ?? []).map((robot) => (
              <article key={robot.id} className="rounded-2xl border border-white/10 bg-[#0b1727] p-5">
                <div className="flex justify-between gap-4">
                  <div><h2 className="font-bold">{robot.name}</h2><p className="mt-1 text-xs text-slate-500">{robot.category} · {robot.version} · {robot.development_year}</p></div>
                  <span className="text-xs uppercase text-slate-600">{robot.publish_status}</span>
                </div>
                <p className="mt-3 text-sm text-slate-400">{robot.status}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {robot.publish_status === "draft" ? <form action={submitRobotForReview}><input type="hidden" name="id" value={robot.id} /><button className="rounded-full border px-3 py-2 text-xs">Submit for review</button></form> : null}
                  {robot.publish_status === "review" && (profile.role === "team_lead" || profile.role === "super_admin") ? <form action={publishRobot}><input type="hidden" name="id" value={robot.id} /><button className="rounded-full bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950">Publish</button></form> : null}
                  {robot.publish_status !== "archived" && (profile.role === "team_lead" || profile.role === "super_admin") ? <form action={archiveRobot}><input type="hidden" name="id" value={robot.id} /><button className="rounded-full border px-3 py-2 text-xs">Archive</button></form> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
