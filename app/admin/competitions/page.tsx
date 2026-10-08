import Link from "next/link";
import { createCompetition } from "@/app/actions/admin-content";
import { requireAdmin, requireRole } from "@/lib/admin-auth";

export default async function AdminCompetitionsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { supabase, profile } = await requireAdmin();
  requireRole("technical_lead", profile.role);
  const { data: items } = await supabase.from("competitions").select("id,official_name,year,city,country,level,segment,robot_name,result,publish_status").order("year", { ascending: false });
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-12 text-[#f5f8fc]">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm text-[#19d3ff]">← Admin</Link>
        <h1 className="mt-6 text-4xl font-black">Competition records</h1>
        {params.error ? <p className="mt-5 rounded-xl border border-[#ff7a00]/30 p-4 text-sm text-[#ffbd85]">Could not save this record.</p> : null}
        {params.saved ? <p className="mt-5 rounded-xl border border-emerald-400/20 p-4 text-sm text-emerald-300">Draft competition created.</p> : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <form action={createCompetition} className="grid gap-4 rounded-3xl border border-white/10 bg-[#0b1727] p-7">
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
              <article key={item.id} className="rounded-2xl border border-white/10 bg-[#0b1727] p-5">
                <div className="flex justify-between gap-4"><div><h2 className="font-bold">{item.official_name}</h2><p className="mt-1 text-xs text-slate-500">{item.year} · {item.city ?? "—"}, {item.country ?? "—"} · {item.level}</p></div><span className="text-xs uppercase text-slate-600">{item.publish_status}</span></div>
                <p className="mt-3 text-sm text-slate-400">{item.robot_name} · {item.result}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
