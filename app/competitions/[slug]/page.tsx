import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicCompetition } from "@/lib/public-data";

interface CompetitionDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CompetitionDetailPage({ params }: CompetitionDetailPageProps) {
  const { slug } = await params;
  const record = await getPublicCompetition(slug);
  if (!record) notFound();

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#19d3ff]">{record.level} · {record.segment}</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight">{record.competition}</h1>
        <p className="mt-4 text-lg text-slate-400">{record.organizer} · {record.location} · {record.year}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Robot", record.robot],
            ["Result", record.result],
            ["Location", record.location],
            ["Year", String(record.year)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-[#0b1727] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
              <p className="mt-2 font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        {record.report ? <section className="mt-12 rounded-2xl border border-white/10 bg-[#0b1727] p-7"><h2 className="text-2xl font-bold">Competition Report</h2><p className="mt-4 leading-8 text-slate-400">{record.report}</p></section> : null}

        <section className="mt-12 rounded-2xl border border-white/10 bg-[#0b1727] p-7">
          <h2 className="text-2xl font-bold">Team Members</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {record.teamMembers.map((member) => <span key={member} className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300">{member}</span>)}
          </div>
        </section>

        {record.evidence?.length ? (
          <section className="mt-12">
            <h2 className="text-2xl font-bold">Evidence</h2>
            <div className="mt-5 grid gap-3">
              {record.evidence.map((item) => <a key={item.href} href={item.href} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-[#0b1727] px-5 py-4 text-sm text-[#8deaff] hover:border-[#19d3ff]/40">{item.label} ↗</a>)}
            </div>
          </section>
        ) : null}
      </article>
      <SiteFooter />
    </main>
  );
}
