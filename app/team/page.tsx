import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { divisions } from "@/lib/data";
import { getPublicTeamMembers } from "@/lib/public-data";

export default async function TeamPage() {
  const teamMembers = await getPublicTeamMembers();
  const leadership = ["Faculty Advisor", "Team Lead / Captain", "Technical Lead", "Operations Lead", "Finance / Sponsorship Lead"];

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHeading eyebrow="People & continuity" title="The Team" description="Leadership, technical divisions, active members and alumni are designed as a long-lived record of the team—not a temporary roster." />
        <section className="mt-12">
          <h2 className="text-2xl font-bold">Leadership</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {leadership.map((role) => <div key={role} className="rounded-2xl border border-white/10 bg-[#0b1727] p-5 text-sm font-semibold text-slate-300">{role}<span className="mt-2 block text-xs font-normal text-slate-600">Profile pending verification</span></div>)}
          </div>
        </section>
        <section className="mt-14">
          <h2 className="text-2xl font-bold">Technical Divisions</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {divisions.map((division) => <div key={division} className="rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-6"><h3 className="font-bold">{division}</h3><p className="mt-2 text-sm text-slate-500">Verified members and projects will be linked here.</p></div>)}
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
                    {member.photo ? <img src={member.photo} alt={`${member.name} profile`} className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[#07111f] text-xl font-black text-[#19d3ff]">{member.name.charAt(0).toUpperCase()}</div>}
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
