export const dynamic = "force-dynamic";

import Link from "next/link";
import { publishCompetition, submitCompetitionForReview } from "@/app/actions/admin-content";
import { requireAdmin, requireRole } from "@/lib/admin-auth";

export default async function AdminAchievementsPage() {
  const { supabase, profile } = await requireAdmin();
  requireRole("team_lead", profile.role);
  const { data: items } = await supabase
    .from("competitions")
    .select("id,official_name,slug,organizer,year,city,country,level,segment,robot_name,result,publish_status")
    .neq("result", "Participation")
    .order("year", { ascending: false });

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-12 text-[#f5f8fc]">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm text-[#19d3ff]">← Admin</Link>
        <h1 className="mt-6 text-4xl font-black">Achievements</h1>
        <p className="mt-3 max-w-3xl text-slate-400">Verified achievement records are derived from competition results. No separate duplicate achievement database is maintained.</p>
        <div className="mt-10 grid gap-4">
          {(items ?? []).map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-[#0b1727] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#19d3ff]">{item.result} · {item.year}</p>
                  <h2 className="mt-2 text-xl font-bold">{item.official_name}</h2>
                  <p className="mt-2 text-sm text-slate-400">{item.robot_name} · {item.city ?? "—"}, {item.country ?? "—"} · {item.level}</p>
                </div>
                <span className="text-xs uppercase text-slate-500">{item.publish_status}</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {item.publish_status === "draft" ? <form action={submitCompetitionForReview}><input type="hidden" name="id" value={item.id}/><button className="rounded-full border px-4 py-2 text-xs">Submit review</button></form> : null}
                {item.publish_status === "review" && (profile.role === "team_lead" || profile.role === "super_admin") ? <form action={publishCompetition}><input type="hidden" name="id" value={item.id}/><button className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950">Publish</button></form> : null}
                <Link href={`/competitions/${item.slug}`} className="rounded-full border border-[#19d3ff]/20 px-4 py-2 text-xs text-[#8deaff]">Public story →</Link>
              </div>
            </article>
          ))}
          {!items?.length ? <div className="rounded-2xl border border-dashed border-white/10 p-8 text-sm text-slate-500">No verified achievement records exist yet.</div> : null}
        </div>
      </div>
    </main>
  );
}
