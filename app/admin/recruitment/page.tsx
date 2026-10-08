export const dynamic = "force-dynamic";

import Link from "next/link";
import { updateRecruitmentApplication, updateRecruitmentSettings } from "@/app/actions/admin-operations";
import { requireAdmin, requireAnyRole } from "@/lib/admin-auth";

const statuses = ["Submitted", "Screening", "Interview", "Selected", "Rejected"];

export default async function AdminRecruitmentPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead", "hr_operations"], profile.role);
  const [{ data: settings }, { data: applications }] = await Promise.all([
    supabase.from("recruitment_settings").select("applications_open,stage,deadline,description").eq("id", true).maybeSingle(),
    supabase.from("recruitment_applications").select("id,name,department,semester,preferred_division,skills,previous_projects,github_or_portfolio,weekly_availability,why_join,status,submitted_at").order("submitted_at", { ascending: false }),
  ]);
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-12 text-[#f5f8fc]">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm text-[#19d3ff]">← Admin</Link>
        <h1 className="mt-6 text-4xl font-black">Recruitment</h1>
        <p className="mt-3 max-w-2xl text-slate-400">Control the public recruitment stage and review applications inside the private portal.</p>
        {params.error ? <p className="mt-5 rounded-xl border border-orange-300/20 p-4 text-sm text-orange-200">Could not save the recruitment change.</p> : null}
        {params.saved ? <p className="mt-5 rounded-xl border border-emerald-300/20 p-4 text-sm text-emerald-200">Saved.</p> : null}

        <form action={updateRecruitmentSettings} className="mt-10 grid gap-4 rounded-3xl border border-white/10 bg-[#0b1727] p-7">
          <h2 className="text-xl font-bold">Recruitment status</h2>
          <label className="flex items-center gap-3 text-sm text-slate-300"><input type="checkbox" name="applications_open" defaultChecked={settings?.applications_open ?? false} /> Applications open</label>
          <label className="grid gap-2 text-sm text-slate-300">Stage<input name="stage" defaultValue={settings?.stage ?? "Applications Closed"} className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3" /></label>
          <label className="grid gap-2 text-sm text-slate-300">Deadline<input type="datetime-local" name="deadline" defaultValue={settings?.deadline ? new Date(settings.deadline).toISOString().slice(0,16) : ""} className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3" /></label>
          <label className="grid gap-2 text-sm text-slate-300">Public description<textarea name="description" defaultValue={settings?.description ?? ""} rows={4} className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3" /></label>
          <button className="w-fit rounded-full bg-[#1479ff] px-5 py-3 font-semibold">Save recruitment status</button>
        </form>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Applications</h2>
          <div className="mt-5 grid gap-4">
            {(applications ?? []).map((application) => (
              <article key={application.id} className="rounded-2xl border border-white/10 bg-[#0b1727] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">{application.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{application.department} · Semester {application.semester} · {application.preferred_division}</p>
                    <p className="mt-1 text-xs text-slate-500">Submitted {new Date(application.submitted_at).toLocaleString()}</p>
                  </div>
                  <form action={updateRecruitmentApplication} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={application.id} />
                    <select name="status" defaultValue={application.status} className="rounded-full border border-white/10 bg-[#07111f] px-3 py-2 text-xs">
                      {statuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <button className="rounded-full bg-[#1479ff] px-3 py-2 text-xs font-semibold">Update</button>
                  </form>
                </div>
                <div className="mt-5 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                  <p><strong>Skills:</strong> {application.skills || "—"}</p>
                  <p><strong>Availability:</strong> {application.weekly_availability || "—"}</p>
                  <p><strong>Projects:</strong> {application.previous_projects || "—"}</p>
                  <p><strong>Portfolio:</strong> {application.github_or_portfolio || "—"}</p>
                  <p className="md:col-span-2"><strong>Why join:</strong> {application.why_join}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
