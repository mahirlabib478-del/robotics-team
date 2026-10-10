import type { Metadata } from "next";
import Link from "next/link";
import { signOutAdmin } from "@/app/actions/admin-auth";
import { requireAdmin, requireAnyRole } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private Engineering Portal",
  description: "Restricted Team Stellar engineering workspace.",
  robots: { index: false, follow: false, noarchive: true },
};

const modules = [
  {
    title: "Projects and task board",
    description: "Create scoped projects, assign verified university accounts, manage task priority and status, and retain append-only change history.",
    status: "Migration required",
    href: "/engineering/projects",
  },
  {
    title: "Engineering documents",
    description: "Access-controlled files, document versions and archive history for approved team members.",
    status: "Not enabled",
    href: undefined,
    href: undefined,
  },
  {
    title: "BOM and procurement",
    description: "Parts, quantities, supplier references, purchasing status and restricted cost records.",
    status: "Not enabled",
    href: undefined,
  },
  {
    title: "Testing and readiness",
    description: "Timestamped test runs, robot versions, issues and competition-readiness checks.",
    status: "Not enabled",
    href: undefined,
  },
] as const;

export default async function EngineeringPortalPage() {
  const { profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead", "technical_lead"], profile.role);

  return (
    <main className="min-h-screen bg-[#07111f] text-[#f5f8fc]">
      <header className="border-b border-white/10 bg-[#07111f]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#19d3ff]">Restricted workspace</p>
            <h1 className="mt-1 text-xl font-bold">Team Stellar Engineering</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 hover:border-white/30" href="/admin">
              Admin
            </Link>
            <form action={signOutAdmin}>
              <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-white/25 hover:text-white">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-3xl border border-[#19d3ff]/20 bg-[#19d3ff]/5 p-5 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#19d3ff]">Private by design</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Engineering workspace</h2>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">
            Signed in as {profile.display_name ?? "Team member"} · {profile.role.replaceAll("_", " ")}.
            This area is separate from the public portfolio and public CMS. Engineering records and files
            will remain unavailable until their database policies, private storage rules and staging access
            tests have been implemented and verified.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Phase 3 · Planned modules</p>
            <h3 className="mt-2 text-2xl font-bold">Engineering systems</h3>
          </div>
          <p className="text-sm text-slate-400">No project or private file data is loaded on this page.</p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {modules.map((module) => (
            <article key={module.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                {module.href ? <Link href={module.href} className="text-lg font-semibold text-[#b6f4ff] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19d3ff]">{module.title} →</Link> : <h4 className="text-lg font-semibold">{module.title}</h4>}
                <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-200">
                  {module.status}
                </span>
              </div>
              <p className="mt-3 leading-6 text-slate-400">{module.description}</p>
            </article>
          ))}
        </div>

        <p className="mt-8 rounded-2xl border border-white/10 p-4 text-sm leading-6 text-slate-400">
          Access is checked on the server for every request. Hiding this route from search engines is only
          crawler guidance; it is not a substitute for authentication, database row-level security or
          private object-storage policies.
        </p>
      </section>
    </main>
  );
}
