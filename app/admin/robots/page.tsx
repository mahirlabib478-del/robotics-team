export const dynamic = "force-dynamic";

import Link from "next/link";
import { addRobotMedia, archiveRobot, createRobot, publishRobot, submitRobotForReview, updateRobot, updateRobotMedia } from "@/app/actions/admin-content";
import { requireAdmin, requireRole } from "@/lib/admin-auth";

interface RobotMediaRecord { id: string; robot_id: string; media_type: "image" | "video" | "cad"; source_url: string; alt_text: string; caption: string | null; sort_order: number; visibility: "public" | "internal" }

export default async function AdminRobotsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { supabase, profile } = await requireAdmin();
  requireRole("technical_lead", profile.role);
  const { data: robots } = await supabase.from("robots").select("id,name,slug,category,version,status,development_year,weight_kg,dimensions,summary,publish_status").order("updated_at", { ascending: false });
  let publicEngineeringById = new Map<string, Record<string, string>>();
  let publicEngineeringAvailable = true;
  if (robots?.length) {
    const { data: publicEngineeringRows, error: publicEngineeringError } = await supabase.from("robots").select("id,public_engineering").in("id", robots.map((robot) => robot.id));
    if (publicEngineeringError) { publicEngineeringAvailable = false; console.error("Public robot engineering fields could not be loaded. Apply the public engineering migration before editing these fields.", publicEngineeringError); }
    else publicEngineeringById = new Map((publicEngineeringRows ?? []).map((robot) => [robot.id, robot.public_engineering ?? {}] as const));
  }
  const mediaByRobot = new Map<string, RobotMediaRecord[]>();
  if (robots?.length) {
    const { data: mediaRows, error: mediaError } = await supabase.from("robot_media").select("id,robot_id,media_type,source_url,alt_text,caption,sort_order,visibility").in("robot_id", robots.map((robot) => robot.id)).order("sort_order", { ascending: true });
    if (mediaError) console.error("Robot media could not be loaded.", mediaError);
    else {
      for (const row of mediaRows ?? []) {
        const media = row as RobotMediaRecord;
        const items = mediaByRobot.get(media.robot_id) ?? [];
        items.push(media);
        mediaByRobot.set(media.robot_id, items);
      }
    }
  }
  const robotRecords = (robots ?? []).map((robot) => ({ ...robot, public_engineering: publicEngineeringById.get(robot.id) ?? {}, media: mediaByRobot.get(robot.id) ?? [] }));
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-10 text-[#f5f8fc] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm text-[#19d3ff]">← Admin</Link>
        <h1 className="mt-6 text-3xl font-black sm:text-4xl">Robot records</h1>
        {params.error ? <p role="alert" className="mt-5 rounded-xl border border-[#ff7a00]/30 p-4 text-sm text-[#ffbd85]">{params.error === "invalid-weight" ? "Weight must be a valid number greater than or equal to zero." : params.error === "invalid-media" ? "Media fields are invalid. Use a valid HTTPS URL, descriptive alt text, supported media type, and a non-negative sort order." : params.error === "media-save" ? "Media could not be saved. Check the source URL, database permissions, and required fields." : params.error === "media-approval-required" ? "Only a team lead or super admin can make robot media public. Save it as internal until leadership approves publication." : params.error === "not-found" ? "The selected robot or media record could not be found." : params.error === "archived" ? "Media cannot be added to an archived robot." : params.error === "missing" ? "Required fields are missing or invalid. Check the slug, status, year and summary." : "Could not save this record. Check for duplicate slugs and your permissions."}</p> : null}
        {params.saved ? <p role="status" className="mt-5 rounded-xl border border-emerald-400/20 p-4 text-sm text-emerald-300">{params.saved === "media" ? "Robot media saved successfully." : "Robot record saved successfully."}</p> : null}
        {!publicEngineeringAvailable ? <p role="status" className="mt-5 rounded-xl border border-[#ff7a00]/30 bg-[#ff7a00]/5 p-4 text-sm leading-6 text-[#ffbd85]">Public engineering summaries are temporarily unavailable because the database migration has not been applied. Basic robot edits still work, but these summary fields will not be saved until the migration is applied.</p> : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <form action={createRobot} className="grid min-w-0 gap-4 rounded-3xl border border-white/10 bg-[#0b1727] p-4 sm:p-7">
            <h2 className="text-xl font-bold">New robot draft</h2>
            {[
              ["name", "Official name", true], ["slug", "Slug", true], ["category", "Category", true],
              ["version", "Version", true], ["development_year", "Development year", true],
              ["weight_kg", "Weight (kg)", false], ["dimensions", "Dimensions", false],
            ].map(([name, label, required]) => (
              <label key={name as string} className="grid gap-2 text-sm text-slate-300">
                {label as string}
                <input name={name as string} type={name === "weight_kg" || name === "development_year" ? "number" : "text"} min={name === "weight_kg" ? 0 : name === "development_year" ? 1900 : undefined} max={name === "development_year" ? 2100 : undefined} step={name === "weight_kg" ? "0.01" : name === "development_year" ? "1" : undefined} required={required as boolean} className="min-w-0 rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 outline-none focus:border-[#19d3ff]/50" />
              </label>
            ))}
            <label className="grid gap-2 text-sm text-slate-300">Status<select name="status" required defaultValue="In Development" className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3"><option>Competition Ready</option><option>In Development</option><option>Retired</option><option>Prototype</option></select></label>
            <label className="grid gap-2 text-sm text-slate-300">Summary<textarea name="summary" required rows={5} className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 outline-none focus:border-[#19d3ff]/50" /></label>
            <fieldset className="grid gap-3 rounded-2xl border border-white/10 p-4"><legend className="px-2 text-sm font-semibold text-[#8deaff]">Public engineering summary</legend><p className="text-xs leading-5 text-slate-500">Only include approved public explanations. Never add source code, detailed CAD, firmware, sensitive strategy or confidential costs.</p>{[
              ["problem", "Problem solved"], ["mechanicalDesign", "Mechanical design"], ["electronicsArchitecture", "Electronics architecture"], ["controlLogic", "Control logic"], ["componentChoices", "Component choices"], ["limitations", "Limitations"], ["futureImprovements", "Future improvements"],
            ].map(([field, label]) => <label key={field} className="grid gap-2 text-sm text-slate-300">{label}<textarea name={`public_engineering_${field}`} rows={2} maxLength={2000} className="rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 outline-none focus:border-[#19d3ff]/50" /></label>)}</fieldset>
            <button className="rounded-full bg-[#1479ff] px-5 py-3 font-semibold">Create draft</button>
          </form>

          <div className="grid content-start gap-3">
            {robotRecords.map((robot) => (
              <article key={robot.id} className="min-w-0 rounded-2xl border border-white/10 bg-[#0b1727] p-4 sm:p-5">
                <div className="flex justify-between gap-4">
                  <div><h2 className="font-bold">{robot.name}</h2><p className="mt-1 text-xs text-slate-500">{robot.category} · {robot.version} · {robot.development_year}</p></div>
                  <span className="text-xs uppercase text-slate-600">{robot.publish_status}</span>
                </div>
                <p className="mt-3 text-sm text-slate-400">{robot.status}</p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-[#19d3ff]">Edit / workflow</summary>
                  <form action={updateRobot} className="mt-4 grid gap-3">
                    <input type="hidden" name="id" value={robot.id} />
                    <input name="name" defaultValue={robot.name} placeholder="Official name" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="slug" defaultValue={robot.slug} placeholder="Slug" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="category" defaultValue={robot.category} placeholder="Category" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="version" defaultValue={robot.version} placeholder="Version" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <select name="status" defaultValue={robot.status} required className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm"><option>Competition Ready</option><option>In Development</option><option>Retired</option><option>Prototype</option></select>
                    <input name="development_year" defaultValue={robot.development_year} placeholder="Development year" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="weight_kg" type="number" min="0" step="0.01" defaultValue={robot.weight_kg ?? ""} placeholder="Weight (kg)" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <input name="dimensions" defaultValue={robot.dimensions ?? ""} placeholder="Dimensions" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <textarea name="summary" required rows={3} defaultValue={robot.summary ?? ""} placeholder="Summary" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm" />
                    <fieldset className="grid gap-3 rounded-xl border border-white/10 p-3"><legend className="px-1 text-xs font-semibold text-[#8deaff]">Public engineering summary</legend><p className="text-xs leading-5 text-slate-500">Approved public-safe explanations only. Restricted design details remain in private engineering records.</p>{[
                      ["problem", "Problem solved"], ["mechanicalDesign", "Mechanical design"], ["electronicsArchitecture", "Electronics architecture"], ["controlLogic", "Control logic"], ["componentChoices", "Component choices"], ["limitations", "Limitations"], ["futureImprovements", "Future improvements"],
                    ].map(([field, label]) => <label key={field} className="grid gap-1 text-xs text-slate-400">{label}<textarea name={`public_engineering_${field}`} defaultValue={robot.public_engineering?.[field] ?? ""} rows={2} maxLength={2000} className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm text-slate-200" /></label>)}</fieldset>
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-full bg-[#1479ff] px-3 py-2 text-xs font-semibold">Save edits</button>
                      {robot.publish_status === "draft" ? <button formAction={submitRobotForReview} className="rounded-full border px-3 py-2 text-xs">Submit review</button> : null}
                      {robot.publish_status === "review" && (profile.role === "team_lead" || profile.role === "super_admin") ? <button formAction={publishRobot} className="rounded-full bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950">Publish</button> : null}
                      {robot.publish_status !== "archived" && (profile.role === "team_lead" || profile.role === "super_admin") ? <button formAction={archiveRobot} className="rounded-full border px-3 py-2 text-xs">Archive</button> : null}
                    </div>
                  </form>
                </details>
                <details className="mt-4 border-t border-white/10 pt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-[#8deaff]">Manage media ({robot.media.length})</summary>
                  <div className="mt-4 grid gap-4">
                    {robot.media.map((media) => (
                      <form key={media.id} action={updateRobotMedia} className="grid gap-3 rounded-xl border border-white/10 bg-[#07111f]/80 p-3 sm:p-4">
                        <input type="hidden" name="media_id" value={media.id} />
                        <input type="hidden" name="robot_id" value={robot.id} />
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{media.media_type} · order {media.sort_order}</p>
                        <label className="grid gap-1 text-xs text-slate-400">Source URL<input name="source_url" type="url" required defaultValue={media.source_url} className="min-w-0 rounded-lg border border-white/10 bg-[#0b1727] px-3 py-2 text-sm text-slate-200" /></label>
                        <label className="grid gap-1 text-xs text-slate-400">Media type<select name="media_type" defaultValue={media.media_type} className="rounded-lg border border-white/10 bg-[#0b1727] px-3 py-2 text-sm text-slate-200"><option value="image">Image</option><option value="video">Video</option><option value="cad">CAD / model</option></select></label>
                        <label className="grid gap-1 text-xs text-slate-400">Alt text / accessible description<input name="alt_text" required maxLength={300} defaultValue={media.alt_text} className="min-w-0 rounded-lg border border-white/10 bg-[#0b1727] px-3 py-2 text-sm text-slate-200" /></label>
                        <label className="grid gap-1 text-xs text-slate-400">Caption<input name="caption" maxLength={500} defaultValue={media.caption ?? ""} className="min-w-0 rounded-lg border border-white/10 bg-[#0b1727] px-3 py-2 text-sm text-slate-200" /></label>
                        <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs text-slate-400">Sort order<input name="sort_order" type="number" min="0" max="10000" step="1" required defaultValue={media.sort_order} className="rounded-lg border border-white/10 bg-[#0b1727] px-3 py-2 text-sm text-slate-200" /></label><label className="grid gap-1 text-xs text-slate-400">Visibility<select name="visibility" defaultValue={media.visibility} className="rounded-lg border border-white/10 bg-[#0b1727] px-3 py-2 text-sm text-slate-200"><option value="public" disabled={!["team_lead", "super_admin"].includes(profile.role)}>Public (leadership approval)</option><option value="internal">Internal only</option></select></label></div>
                        <button className="justify-self-start rounded-full border border-[#19d3ff]/30 px-4 py-2 text-xs font-semibold text-[#8deaff] hover:bg-[#19d3ff]/10">Save media</button>
                      </form>
                    ))}
                    <form action={addRobotMedia} className="grid gap-3 rounded-xl border border-dashed border-[#19d3ff]/30 bg-[#19d3ff]/[0.03] p-3 sm:p-4">
                      <input type="hidden" name="robot_id" value={robot.id} />
                      <p className="text-sm font-semibold text-slate-200">Add approved media URL</p>
                      <p className="text-xs leading-5 text-slate-500">Use an HTTPS URL to an approved image, video, or CAD/model preview. Public visibility is shown only when the parent robot is published.</p>
                      <label className="grid gap-1 text-xs text-slate-400">Source URL<input name="source_url" type="url" required placeholder="https://example.com/approved-media.jpg" className="min-w-0 rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm text-slate-200" /></label>
                      <label className="grid gap-1 text-xs text-slate-400">Media type<select name="media_type" defaultValue="image" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm text-slate-200"><option value="image">Image</option><option value="video">Video</option><option value="cad">CAD / model</option></select></label>
                      <label className="grid gap-1 text-xs text-slate-400">Alt text / accessible description<input name="alt_text" required maxLength={300} placeholder="Describe what the media shows" className="min-w-0 rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm text-slate-200" /></label>
                      <label className="grid gap-1 text-xs text-slate-400">Caption (optional)<input name="caption" maxLength={500} className="min-w-0 rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm text-slate-200" /></label>
                      <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs text-slate-400">Sort order<input name="sort_order" type="number" min="0" max="10000" step="1" defaultValue={robot.media.length} className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm text-slate-200" /></label><label className="grid gap-1 text-xs text-slate-400">Visibility<select name="visibility" defaultValue="internal" className="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2 text-sm text-slate-200"><option value="internal">Internal only</option><option value="public">Public (approved)</option></select></label></div>
                      <button className="justify-self-start rounded-full bg-[#1479ff] px-4 py-2 text-xs font-semibold text-white">Add media</button>
                    </form>
                  </div>
                </details>
              </article>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
