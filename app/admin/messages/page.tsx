export const dynamic = "force-dynamic";

import Link from "next/link";
import { updateContactMessage } from "@/app/actions/admin-extended";
import { requireAdmin, requireAnyRole } from "@/lib/admin-auth";

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead", "hr_operations", "media"], profile.role);
  const [{ data: items }, params] = await Promise.all([
    supabase.from("contact_messages").select("id,name,email,organization,subject,message,status,created_at").order("created_at", { ascending: false }),
    searchParams,
  ]);

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-10 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm text-[#19d3ff]">← Admin</Link>
        <h1 className="mt-6 text-3xl font-black sm:text-4xl">Contact Messages</h1>
        {params.error ? <p role="alert" className="mt-5 rounded-xl border border-orange-300/20 p-4 text-sm text-orange-200">Could not update this message ({params.error}). Check its status and your permissions.</p> : null}
        {params.saved ? <p role="status" className="mt-5 rounded-xl border border-emerald-300/20 p-4 text-sm text-emerald-200">Message status updated.</p> : null}
        <div className="mt-8 grid gap-4">
          {(items ?? []).map((item) => (
            <article key={item.id} className="min-w-0 rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="break-words font-bold">{item.subject}</h2>
                  <p className="mt-1 break-words text-sm text-slate-400">{item.name} · {item.email}</p>
                  {item.organization ? <p className="mt-1 text-xs text-slate-500">{item.organization}</p> : null}
                  <p className="mt-1 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <form action={updateContactMessage} className="flex max-w-full flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={item.id} />
                  <label className="sr-only" htmlFor={`message-status-${item.id}`}>Message status</label>
                  <select id={`message-status-${item.id}`} name="status" defaultValue={item.status} className="max-w-full rounded-full border border-white/10 bg-[#07111f] px-3 py-2 text-xs">
                    <option>New</option><option>In Progress</option><option>Resolved</option>
                  </select>
                  <button className="rounded-full bg-[#1479ff] px-3 py-2 text-xs font-semibold">Update</button>
                </form>
              </div>
              <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">{item.message}</p>
            </article>
          ))}
          {!items?.length ? <div className="rounded-2xl border border-dashed border-white/10 p-8 text-sm text-slate-400">No contact messages have been received yet.</div> : null}
        </div>
      </div>
    </main>
  );
}
