export const dynamic = "force-dynamic";

import Link from "next/link";
import { createResearchPost, transitionContent } from "@/app/actions/admin-extended";
import { requireAdmin, requireAnyRole } from "@/lib/admin-auth";

export default async function AdminResearchPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead", "technical_lead", "media"], profile.role);
  const [{ data: items }, params] = await Promise.all([
    supabase.from("research_posts").select("id,title,category,publish_status").order("updated_at", { ascending: false }),
    searchParams,
  ]);

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-10 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm text-[#19d3ff]">← Admin</Link>
        <h1 className="mt-6 text-4xl font-black">Research</h1>
        {params.error ? <p role="alert" className="mt-5 rounded-xl border border-orange-300/20 p-4 text-sm text-orange-200">Could not complete this action ({params.error}). Check the fields and your permissions.</p> : null}
        {params.saved ? <p role="status" className="mt-5 rounded-xl border border-emerald-300/20 p-4 text-sm text-emerald-200">Saved successfully.</p> : null}
        <form action={createResearchPost} className="mt-8 grid gap-4 rounded-3xl border border-white/10 bg-[#0b1727] p-5 sm:p-7">
          <h2 className="text-xl font-bold">New research draft</h2>
          <input name="title" required maxLength={220} placeholder="Title" className="min-w-0 rounded-xl bg-[#07111f] p-3" />
          <input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" title="Use lowercase letters, numbers and single hyphens." maxLength={120} placeholder="Slug" className="min-w-0 rounded-xl bg-[#07111f] p-3" />
          <input name="category" required maxLength={120} placeholder="Category" className="min-w-0 rounded-xl bg-[#07111f] p-3" />
          <input name="excerpt" required maxLength={500} placeholder="Public excerpt" className="min-w-0 rounded-xl bg-[#07111f] p-3" />
          <textarea name="body" required maxLength={12000} rows={8} placeholder="Public-safe article body" className="min-w-0 rounded-xl bg-[#07111f] p-3" />
          <button className="w-fit rounded-full bg-[#1479ff] px-5 py-3 font-semibold">Create draft</button>
        </form>
        <div className="mt-8 grid gap-3">
          {(items ?? []).map((item) => (
            <article key={item.id} className="min-w-0 rounded-2xl border border-white/10 bg-[#0b1727] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><h2 className="break-words font-bold">{item.title}</h2><p className="mt-1 text-xs text-slate-500">{item.category} · {item.publish_status}</p></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.publish_status === "draft" ? <form action={transitionContent}><input type="hidden" name="table" value="research_posts" /><input type="hidden" name="target" value="review" /><input type="hidden" name="id" value={item.id} /><button className="rounded-full border border-white/10 px-3 py-2 text-xs">Submit review</button></form> : null}
                {item.publish_status === "review" && (profile.role === "team_lead" || profile.role === "super_admin") ? <form action={transitionContent}><input type="hidden" name="table" value="research_posts" /><input type="hidden" name="target" value="published" /><input type="hidden" name="id" value={item.id} /><button className="rounded-full bg-emerald-400 px-3 py-2 text-xs font-semibold text-black">Publish</button></form> : null}
                {item.publish_status !== "archived" && (profile.role === "team_lead" || profile.role === "super_admin") ? <form action={transitionContent}><input type="hidden" name="table" value="research_posts" /><input type="hidden" name="target" value="archived" /><input type="hidden" name="id" value={item.id} /><button className="rounded-full border border-white/10 px-3 py-2 text-xs">Archive</button></form> : null}
              </div>
            </article>
          ))}
          {!items?.length ? <div className="rounded-2xl border border-dashed border-white/10 p-8 text-sm text-slate-500">No research drafts yet. Create a draft above to begin the review workflow.</div> : null}
        </div>
      </div>
    </main>
  );
}
