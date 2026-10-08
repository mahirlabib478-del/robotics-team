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
      <section className="mx-auto max-w-7xl px-6 py-20">
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
            {divisions.map((division) => <div key={division} className="rounded-2xl border border-white/10 bg-[#0b1727] p-6"><h3 className="font-bold">{division}</h3><p className="mt-2 text-sm text-slate-500">Verified members and projects will be linked here.</p></div>)}
          </div>
        </section>
        <section className="mt-14">
          {teamMembers.length ? <p className="text-sm text-slate-400">Verified member profiles are published below.</p> : <EmptyState title="Member directory is ready." description="Names, roles, departments, semesters, skills, projects, tenure and public profile links will be added only from verified team records. Alumni are retained for continuity." />}
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}
