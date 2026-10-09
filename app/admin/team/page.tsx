export const dynamic = "force-dynamic";

import Link from "next/link";
import { archiveTeamMember, createTeamMember, publishTeamMember, submitTeamMemberForReview, updateTeamMember } from "@/app/actions/admin-operations";
import { requireAdmin, requireAnyRole } from "@/lib/admin-auth";

export default async function AdminTeamPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead", "hr_operations"], profile.role);
  const { data: members } = await supabase.from("team_members").select("id,name,slug,role,division,department,semester,tenure,skills,projects,photo_url,alumni,publish_status").order("updated_at", { ascending: false });
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-12 text-[#f5f8fc]">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm text-[#19d3ff]">← Admin</Link>
        <h1 className="mt-6 text-4xl font-black">Team management</h1>
        <p className="mt-3 max-w-2xl text-slate-400">Create verified member records and archive former members without deleting team history.</p>
        {params.error ? <p className="mt-5 rounded-xl border border-orange-300/20 p-4 text-sm text-orange-200">Could not save this record.</p> : null}
        {params.saved ? <p className="mt-5 rounded-xl border border-emerald-300/20 p-4 text-sm text-emerald-200">Saved.</p> : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <form action={createTeamMember} className="grid gap-4 rounded-3xl border border-white/10 bg-[#0b1727] p-7">
            <h2 className="text-xl font-bold">New member draft</h2>
            {[
              ["name","Name",true],["slug","Slug",true],["role","Role",true],["division","Division",true],
              ["department","Department",false],["semester","Semester",false],["tenure","Active tenure",true],
              ["skills","Skills (comma separated)",false],["projects","Projects / robots (comma separated)",false],["photo_url","Photo URL",false]
            ].map(([name,label,required]) => (
              <label key={String(name)} className="grid gap-2 text-sm text-slate-300">{String(label)}
                <input name={String(name)} required={Boolean(required)} className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 outline-none focus:border-[#19d3ff]/50" />
              </label>
            ))}
            <label className="flex items-center gap-3 text-sm text-slate-300"><input type="checkbox" name="alumni" /> Alumni</label>
            <button className="rounded-full bg-[#1479ff] px-5 py-3 font-semibold">Create draft</button>
          </form>

          <div className="grid content-start gap-3">
            {(members ?? []).map((member) => (
              <article key={member.id} className="rounded-2xl border border-white/10 bg-[#0b1727] p-5">
                <div className="flex justify-between gap-4">
                  <div><h2 className="font-bold">{member.name}</h2><p className="mt-1 text-xs text-slate-500">{member.role} · {member.division} · {member.tenure}</p></div>
                  <span className="text-xs uppercase text-slate-500">{member.publish_status}</span>
                </div>
                <p className="mt-3 text-sm text-slate-400">{member.department ?? "—"} · {member.semester ?? "—"} {member.alumni ? "· Alumni" : ""}</p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-[#19d3ff]">Edit member</summary>
                  <form action={updateTeamMember} className="mt-4 grid gap-3">
                    <input type="hidden" name="id" value={member.id} />
                    <input name="name" defaultValue={member.name} placeholder="Name" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="slug" defaultValue={member.slug} placeholder="Slug" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="role" defaultValue={member.role} placeholder="Role" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="division" defaultValue={member.division} placeholder="Division" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="department" defaultValue={member.department ?? ""} placeholder="Department" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="semester" defaultValue={member.semester ?? ""} placeholder="Semester" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="tenure" defaultValue={member.tenure} placeholder="Tenure" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="skills" defaultValue={(member.skills ?? []).join(", ")} placeholder="Skills (comma separated)" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="projects" defaultValue={(member.projects ?? []).join(", ")} placeholder="Projects (comma separated)" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="photo_url" defaultValue={member.photo_url ?? ""} placeholder="Photo URL" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <label className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" name="alumni" defaultChecked={member.alumni} /> Alumni</label>
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-full bg-[#1479ff] px-3 py-2 text-xs font-semibold">Save edits</button>
                      {member.publish_status === "draft" ? <button formAction={submitTeamMemberForReview} className="rounded-full border px-3 py-2 text-xs">Submit review</button> : null}
                      {member.publish_status === "review" && (profile.role === "team_lead" || profile.role === "super_admin") ? <button formAction={publishTeamMember} className="rounded-full bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950">Publish</button> : null}
                      {member.publish_status !== "archived" && (profile.role === "team_lead" || profile.role === "super_admin" || profile.role === "hr_operations") ? <button formAction={archiveTeamMember} className="rounded-full border px-3 py-2 text-xs">Archive member</button> : null}
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
