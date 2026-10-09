export const dynamic = "force-dynamic";

import Link from "next/link";
import { signOutAdmin } from "@/app/actions/admin-auth";
import { requireAdmin } from "@/lib/admin-auth";
import type { UserRole } from "@/lib/types";

const modules: { title: string; description: string; owner: string; href: string; roles: UserRole[] }[] = [
  { title: "Robots", description: "Add and maintain approved robot specifications, development records and public media.", owner: "Technical Lead", href: "/admin/robots", roles: ["super_admin", "team_lead", "technical_lead"] },
  { title: "Competitions", description: "Create structured event records, results, evidence and competition reports.", owner: "Technical Lead", href: "/admin/competitions", roles: ["super_admin", "team_lead", "technical_lead"] },
  { title: "Achievements", description: "Publish verified result stories linked to official evidence.", owner: "Team Lead", href: "/admin/achievements", roles: ["super_admin", "team_lead"] },
  { title: "Team", description: "Manage active members, roles, public profiles and alumni continuity.", owner: "HR / Operations", href: "/admin/team", roles: ["super_admin", "team_lead", "hr_operations"] },
  { title: "Research", description: "Draft, review, publish and archive public-safe technical knowledge.", owner: "Technical / Media", href: "/admin/research", roles: ["super_admin", "team_lead", "technical_lead", "media"] },
  { title: "Gallery", description: "Manage images, YouTube embeds, captions and publication state.", owner: "Media", href: "/admin/gallery", roles: ["super_admin", "team_lead", "media"] },
  { title: "Sponsors", description: "Manage current partners, logos and approved partnership information.", owner: "Team Lead", href: "/admin/sponsors", roles: ["super_admin", "team_lead"] },
  { title: "Recruitment", description: "Control recruitment status and review submitted applications.", owner: "HR / Operations", href: "/admin/recruitment", roles: ["super_admin", "team_lead", "hr_operations"] },
  { title: "Messages", description: "Review contact enquiries and track handling status.", owner: "Operations / Media", href: "/admin/messages", roles: ["super_admin", "team_lead", "hr_operations", "media"] },
];

export default async function AdminPage() {
  const { profile } = await requireAdmin();
  const allowedModules = modules.filter((module) => module.roles.includes(profile.role));

  return (
    <main className="min-h-screen bg-[#07111f] text-[#f5f8fc]">
      <header className="border-b border-white/10 bg-[#07111f]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#19d3ff]">Private workspace</p><h1 className="mt-1 text-xl font-bold">Team Stellar Admin</h1></div>
          <form action={signOutAdmin}><button className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-white/25 hover:text-white">Sign out</button></form>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-3xl border border-[#19d3ff]/20 bg-[#19d3ff]/5 p-5 sm:p-7">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Authenticated as</p>
          <div className="mt-2 flex flex-wrap items-end gap-3"><h2 className="text-2xl font-bold">{profile.display_name ?? "Team member"}</h2><span className="rounded-full border border-[#19d3ff]/30 px-3 py-1 text-xs font-mono text-[#8deaff]">{profile.role}</span></div>
          <p className="mt-2 text-sm text-slate-500">{profile.university_email ?? "University account"}</p>
        </div>
        <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-2 lg:grid-cols-3">
          {allowedModules.map((module) => (
            <article key={module.title} className="min-w-0 rounded-2xl border border-white/10 bg-[#0b1727] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="text-lg font-bold">{module.title}</h2><span className="text-[10px] uppercase tracking-[0.15em] text-slate-600">{module.owner}</span></div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{module.description}</p>
              <Link href={module.href} className="mt-5 inline-block text-xs font-semibold text-[#19d3ff]">Open module →</Link>
            </article>
          ))}
          {!allowedModules.length ? <div className="rounded-2xl border border-dashed border-white/10 p-7 text-sm leading-6 text-slate-400">Your account has viewer-only access. Ask a team lead to assign the role required for an admin module.</div> : null}
        </div>
        <div className="mt-10 rounded-2xl border border-dashed border-white/10 p-5 sm:p-7"><p className="font-semibold">Security boundary</p><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Full CAD, source code, circuit diagrams, BOM/costs, competition strategy, testing logs and internal documents remain private.</p></div>
      </section>
    </main>
  );
}
