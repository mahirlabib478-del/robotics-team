"use server";
import { redirect } from "next/navigation";
import { requireAdmin, requireAnyRole } from "@/lib/admin-auth";
import type { UserRole } from "@/lib/types";
function v(f:FormData,n:string,m=5000){const x=f.get(n);return typeof x==="string"?x.trim().slice(0,m):""}
function validSlug(value:string){return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)}
function go(p:string,e?:string): never {redirect(e?p+"?error="+e:p+"?saved=1")}
function safeHttps(value:string){try{return new URL(value).protocol==="https:"}catch{return false}}
function safeYouTube(value:string){try{const u=new URL(value);if(u.protocol!=="https:")return false;const host=u.hostname.toLowerCase();let id="";if(host==="youtu.be"||host==="www.youtu.be")id=u.pathname.split("/").filter(Boolean)[0]??"";else if(host==="youtube.com"||host==="www.youtube.com"){if(u.pathname==="/watch")id=u.searchParams.get("v")??"";else if(/^\/(embed|shorts|live)\//.test(u.pathname))id=u.pathname.split("/").filter(Boolean)[1]??""}else return false;return /^[A-Za-z0-9_-]{11}$/.test(id)}catch{return false}}
export async function createResearchPost(f: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead", "technical_lead", "media"], profile.role);
  const title = v(f, "title", 220), slug = v(f, "slug", 120).toLowerCase(), excerpt = v(f, "excerpt", 500), body = v(f, "body", 12000), category = v(f, "category", 120), coverImageUrl = v(f, "cover_image_url", 1200);
  if (!title || !slug || !validSlug(slug) || !excerpt || !body || !category) go("/admin/research", "missing");
  if (coverImageUrl && !safeHttps(coverImageUrl)) go("/admin/research", "invalid-url");
  const postPayload = { title, slug, excerpt, body, category, publish_status: "draft" as const, visibility: "public" as const, created_by: profile.id, updated_by: profile.id };
  let createResult = await supabase.from("research_posts").insert({ ...postPayload, cover_image_url: coverImageUrl || null }).select("id").single();
  if (createResult.error?.message?.includes("cover_image_url")) {
    console.error("Research cover image migration is not available yet; apply it to enable article thumbnails.", createResult.error);
    createResult = await supabase.from("research_posts").insert(postPayload).select("id").single();
  }
  const { data: created, error } = createResult;
  if (error || !created) { console.error("Research post insert failed:", error); go("/admin/research", "save"); }
  const { error: auditError } = await supabase.from("audit_logs").insert({ actor_id: profile.id, action: "create_research_post", entity_type: "research_posts", entity_id: created.id, metadata: { slug } });
  if (auditError) console.error("Research creation audit write failed:", auditError);
  go("/admin/research");
}

export async function createGalleryItem(f: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead", "media"], profile.role);
  const title = v(f, "title", 220), category = v(f, "category", 120), source_type = v(f, "source_type", 20), source_url = v(f, "source_url", 1200), alt_text = v(f, "alt_text", 300);
  if (!title || !category || !source_url || !alt_text || !["image", "youtube"].includes(source_type)) go("/admin/gallery", "missing");
  if (source_type === "youtube" ? !safeYouTube(source_url) : !safeHttps(source_url)) go("/admin/gallery", "invalid-url");
  const { data: created, error } = await supabase.from("gallery_items").insert({ title, category, source_type, source_url, alt_text, publish_status: "draft", visibility: "public", created_by: profile.id, updated_by: profile.id }).select("id").single();
  if (error || !created) { console.error("Gallery item insert failed:", error); go("/admin/gallery", "save"); }
  const { error: auditError } = await supabase.from("audit_logs").insert({ actor_id: profile.id, action: "create_gallery_item", entity_type: "gallery_items", entity_id: created.id, metadata: { source_type } });
  if (auditError) console.error("Gallery creation audit write failed:", auditError);
  go("/admin/gallery");
}

export async function createSponsor(f: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead"], profile.role);
  const name = v(f, "name", 180), logoUrl = v(f, "logo_url", 1200), websiteUrl = v(f, "website_url", 1200);
  if (!name) go("/admin/sponsors", "missing");
  if (logoUrl && !safeHttps(logoUrl)) go("/admin/sponsors", "invalid-url");
  if (websiteUrl && !safeHttps(websiteUrl)) go("/admin/sponsors", "invalid-url");
  const { data: created, error } = await supabase.from("sponsors").insert({
    name, partnership_type: v(f, "partnership_type", 120) || null, logo_url: logoUrl || null,
    website_url: websiteUrl || null, description: v(f, "description", 1200) || null,
    publish_status: "draft", visibility: "public", created_by: profile.id, updated_by: profile.id,
  }).select("id").single();
  if (error || !created) { console.error("Sponsor insert failed:", error); go("/admin/sponsors", "save"); }
  const { error: auditError } = await supabase.from("audit_logs").insert({ actor_id: profile.id, action: "create_sponsor", entity_type: "sponsors", entity_id: created.id, metadata: { name } });
  if (auditError) console.error("Sponsor creation audit write failed:", auditError);
  go("/admin/sponsors");
}

export async function updateContactMessage(f:FormData){
  const {supabase,profile}=await requireAdmin();
  requireAnyRole(["super_admin","team_lead","hr_operations","media"],profile.role);
  const id=v(f,"id",80),status=v(f,"status",40);
  if(!/^[0-9a-f-]{36}$/i.test(id)||!["New","In Progress","Resolved"].includes(status))go("/admin/messages","invalid");
  const {data:current,error:readError}=await supabase.from("contact_messages").select("status").eq("id",id).maybeSingle();
  if(readError||!current){go("/admin/messages","not-found");return;}
  const {error}=await supabase.from("contact_messages").update({status,handled_by:status==="Resolved"?profile.id:null,handled_at:status==="Resolved"?new Date().toISOString():null}).eq("id",id);
  if(error)go("/admin/messages","save");
  const {error:auditError}=await supabase.from("audit_logs").insert({actor_id:profile.id,action:"update_contact_message",entity_type:"contact_message",entity_id:id,metadata:{from:current.status,to:status}});
  if(auditError)console.error("Contact-message audit write failed:",auditError);
  go("/admin/messages")
}


export async function transitionContent(f: FormData) {
  const { supabase, profile } = await requireAdmin();
  const table = v(f, "table", 40);
  const target = v(f, "target", 20);
  const id = v(f, "id", 80);
  const paths: Record<string, string> = {
    research_posts: "/admin/research",
    gallery_items: "/admin/gallery",
    sponsors: "/admin/sponsors",
  };
  const path = paths[table] ?? "/admin";
  if (!paths[table] || !/^[0-9a-f-]{36}$/i.test(id) || !["review", "published", "archived"].includes(target)) go(path, "invalid");

  const submitRoles: UserRole[] = table === "research_posts"
    ? ["super_admin", "team_lead", "technical_lead", "media"]
    : table === "gallery_items"
      ? ["super_admin", "team_lead", "media"]
      : ["super_admin", "team_lead"];
  requireAnyRole(submitRoles, profile.role);

  const { data, error: readError } = await supabase.from(table).select("publish_status").eq("id", id).maybeSingle();
  if (readError || !data) { go(path, "not-found"); return; }
  const current = data.publish_status as string;
  const allowed =
    (target === "review" && current === "draft") ||
    (target === "published" && current === "review" && ["super_admin", "team_lead"].includes(profile.role)) ||
    (target === "archived" && current !== "archived" && ["super_admin", "team_lead"].includes(profile.role));
  if (!allowed) go(path, "invalid-transition");

  const update: Record<string, unknown> = { publish_status: target, updated_by: profile.id };
  if (table !== "gallery_items") update.updated_at = new Date().toISOString();
  const { error } = await supabase.from(table).update(update).eq("id", id);
  if (error) { console.error(error); go(path, "transition"); }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    action: "transition_content",
    entity_type: table,
    entity_id: id,
    metadata: { from: current, to: target },
  });
  if (auditError) console.error(auditError);
  go(path);
}


export async function updateResearchPost(f: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead", "technical_lead", "media"], profile.role);
  const id = v(f, "id", 80), title = v(f, "title", 220), slug = v(f, "slug", 120).toLowerCase(), excerpt = v(f, "excerpt", 500), body = v(f, "body", 12000), category = v(f, "category", 120), coverImageUrl = v(f, "cover_image_url", 1200);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !title || !validSlug(slug) || !excerpt || !body || !category) go("/admin/research", "invalid");
  if (coverImageUrl && !safeHttps(coverImageUrl)) go("/admin/research", "invalid-url");
  const { data: current, error: readError } = await supabase.from("research_posts").select("publish_status").eq("id", id).maybeSingle();
  if (readError || !current) { go("/admin/research", "not-found"); return; }
  if (current.publish_status === "archived") go("/admin/research", "archived");
  if (current.publish_status === "published" && !["team_lead", "super_admin"].includes(profile.role)) go("/admin/research", "review-required");
  const postUpdates = { title, slug, excerpt, body, category, publish_status: "draft" as const, updated_by: profile.id, updated_at: new Date().toISOString() };
  let updateResult = await supabase.from("research_posts").update({ ...postUpdates, cover_image_url: coverImageUrl || null }).eq("id", id);
  if (updateResult.error?.message?.includes("cover_image_url")) {
    console.error("Research cover image migration is not available yet; apply it to enable article thumbnails.", updateResult.error);
    updateResult = await supabase.from("research_posts").update(postUpdates).eq("id", id);
  }
  if (updateResult.error) { console.error(updateResult.error); go("/admin/research", "save"); }
  const { error: auditError } = await supabase.from("audit_logs").insert({ actor_id: profile.id, action: "update_research_post", entity_type: "research_posts", entity_id: id, metadata: { slug, from: current.publish_status, to: "draft" } });
  if (auditError) console.error("Research audit write failed:", auditError);
  go("/admin/research");
}

export async function updateGalleryItem(f: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead", "media"], profile.role);
  const id = v(f, "id", 80), title = v(f, "title", 220), category = v(f, "category", 120), source_type = v(f, "source_type", 20), source_url = v(f, "source_url", 1200), alt_text = v(f, "alt_text", 300);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !title || !category || !alt_text || !["image", "youtube"].includes(source_type)) go("/admin/gallery", "invalid");
  if (source_type === "youtube" ? !safeYouTube(source_url) : !safeHttps(source_url)) go("/admin/gallery", "invalid-url");
  const { data: current, error: readError } = await supabase.from("gallery_items").select("publish_status").eq("id", id).maybeSingle();
  if (readError || !current) { go("/admin/gallery", "not-found"); return; }
  if (current.publish_status === "archived") go("/admin/gallery", "archived");
  if (current.publish_status === "published" && !["team_lead", "super_admin"].includes(profile.role)) go("/admin/gallery", "review-required");
  const { error } = await supabase.from("gallery_items").update({ title, category, source_type, source_url, alt_text, caption: v(f, "caption", 1000) || null, publish_status: "draft", updated_by: profile.id }).eq("id", id);
  if (error) { console.error(error); go("/admin/gallery", "save"); }
  const { error: auditError } = await supabase.from("audit_logs").insert({ actor_id: profile.id, action: "update_gallery_item", entity_type: "gallery_items", entity_id: id, metadata: { source_type, from: current.publish_status, to: "draft" } });
  if (auditError) console.error("Gallery audit write failed:", auditError);
  go("/admin/gallery");
}

export async function updateSponsor(f: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead"], profile.role);
  const id = v(f, "id", 80), name = v(f, "name", 180), logo_url = v(f, "logo_url", 1200), website_url = v(f, "website_url", 1200);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !name) go("/admin/sponsors", "invalid");
  if ((logo_url && !safeHttps(logo_url)) || (website_url && !safeHttps(website_url))) go("/admin/sponsors", "invalid-url");
  const { data: current, error: readError } = await supabase.from("sponsors").select("publish_status").eq("id", id).maybeSingle();
  if (readError || !current) { go("/admin/sponsors", "not-found"); return; }
  if (current.publish_status === "archived") go("/admin/sponsors", "archived");
  const { error } = await supabase.from("sponsors").update({ name, logo_url: logo_url || null, website_url: website_url || null, partnership_type: v(f, "partnership_type", 120) || null, description: v(f, "description", 1200) || null, publish_status: "draft", updated_by: profile.id, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) { console.error(error); go("/admin/sponsors", "save"); }
  const { error: auditError } = await supabase.from("audit_logs").insert({ actor_id: profile.id, action: "update_sponsor", entity_type: "sponsors", entity_id: id, metadata: { name, from: current.publish_status, to: "draft" } });
  if (auditError) console.error("Sponsor audit write failed:", auditError);
  go("/admin/sponsors");
}

