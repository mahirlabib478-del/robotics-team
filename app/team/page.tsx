import type { Metadata } from "next";
import Image from "next/image";
import { EmptyState } from "@/components/empty-state";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { divisions } from "@/lib/data";
import { getPublicTeamMembers } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Team",
  description: "Meet the publicly listed members and divisions of Team Stellar, the BRAC University Robotics Team.",
};

export default async function TeamPage() {
  const teamMembers = await getPublicTeamMembers();
  const leadership = teamMembers.filter((member) => /advisor|captain|lead/i.test(member.role));

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHeading level="h1" eyebrow="People & continuity" title="The Team" description="Leadership, technical divisions, active members and alumni are designed as a long-lived record of the team—not a temporary roster." />
        <section className="mt-12" aria-labelledby="team-leadership-heading">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="team-leadership-heading" className="text-2xl font-bold">Leadership</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Leadership profiles are shown only when a verified public member record has been approved.</p></div><span className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">{leadership.length} published profile{leadership.length === 1 ? "" : "s"}</span></div>
          {leadership.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{leadership.map((member) => <article key={member.slug} className="relative overflow-hidden rounded-2xl border border-[#19d3ff]/20 bg-[radial-gradient(circle_at_100%_0%,rgba(20,121,255,.18),transparent_55%),#0b1727] p-5 sm:p-6">{member.photo ? <Image src={member.photo} alt={`${member.name} profile`} width={80} height={80} unoptimized loading="lazy" className="h-20 w-20 rounded-2xl object-cover" /> : <div aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-[#07111f] text-2xl font-bold text-[#19d3ff]">{member.name.charAt(0).toUpperCase()}</div>}<h3 className="mt-4 text-lg font-bold">{member.name}</h3><p className="mt-1 text-sm text-[#8deaff]">{member.role}</p><p className="mt-2 text-xs text-slate-500">{member.division}</p></article>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-[#0b1727]/80 p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#19d3ff]">Verified directory</p><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">No leadership profile is currently published. Approved names, roles and photos will appear here when verified; no placeholder identities are displayed.</p></div>}
        </section>
        <section className="mt-14">
          <h2 className="text-2xl font-bold">Technical Divisions</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {divisions.map((division, index) => <article key={division} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1727] p-5 transition hover:border-[#19d3ff]/30 sm:p-6"><span aria-hidden="true" className="font-mono text-xs tracking-[0.2em] text-[#19d3ff]">DIVISION / {String(index + 1).padStart(2, "0")}</span><h3 className="mt-4 text-lg font-bold">{division}</h3><div aria-hidden="true" className="mt-5 h-px w-full bg-gradient-to-r from-[#19d3ff]/50 via-white/10 to-transparent" /><p className="mt-4 text-xs leading-5 text-slate-500">Approved member profiles and public project records appear in the directory below.</p></article>)}
          </div>
        </section>
        <section className="mt-14">
          {teamMembers.length ? (
            <div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">Verified Members</h2>
                  <p className="mt-2 text-sm text-slate-500">Published profiles are limited to information approved for public disclosure.</p>
                </div>
                <span className="text-xs uppercase tracking-[0.16em] text-slate-600">{teamMembers.filter((member) => !member.alumni).length} active · {teamMembers.filter((member) => member.alumni).length} alumni</span>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {teamMembers.map((member) => (
                  <article key={member.slug} className="rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-6">
                    {member.photo ? <Image src={member.photo} alt={`${member.name} profile`} width={64} height={64} unoptimized loading="lazy" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[#07111f] text-xl font-black text-[#19d3ff]">{member.name.charAt(0).toUpperCase()}</div>}
                    <h3 className="mt-4 text-xl font-bold">{member.name}</h3>
                    <p className="mt-1 text-sm text-[#8deaff]">{member.role}</p>
                    <p className="mt-1 text-xs text-slate-500">{member.division}{member.department ? ` · ${member.department}` : ""}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {member.skills.slice(0, 5).map((skill) => <span key={skill} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-400">{skill}</span>)}
                    </div>
                    <p className="mt-4 text-xs text-slate-600">{member.alumni ? "Alumni" : "Active member"} · {member.tenure}</p>
                    {member.links?.length ? <div className="mt-4 flex flex-wrap gap-3">{member.links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#19d3ff] hover:text-white">{link.label} ↗</a>)}</div> : null}
                    {member.projects.length ? <p className="mt-4 text-sm leading-6 text-slate-500"><span className="text-slate-400">Projects:</span> {member.projects.slice(0, 3).join(", ")}</p> : null}
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState title="Member directory is ready." description="Names, roles, departments, semesters, skills, projects, tenure and public profile links will be added only from verified team records. Alumni are retained for continuity." />
          )}
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}
