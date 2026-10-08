"use server";

import { redirect } from "next/navigation";
import { requireAdmin, requireAnyRole } from "@/lib/admin-auth";

function value(formData: FormData, name: string, max = 5000) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

function listValue(formData: FormData, name: string) {
  return value(formData, name, 2000).split(",").map((item) => item.trim()).filter(Boolean).slice(0, 30);
}

export async function createTeamMember(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead", "hr_operations"], profile.role);

  const name = value(formData, "name", 160);
  const slug = value(formData, "slug", 120).toLowerCase();
  const role = value(formData, "role", 160);
  const division = value(formData, "division", 160);
  const tenure = value(formData, "tenure", 120);

  if (!name || !slug || !role || !division || !tenure) redirect("/admin/team?error=missing");

  const { error } = await supabase.from("team_members").insert({
    name, slug, role, division, tenure,
    department: value(formData, "department", 160) || null,
    semester: value(formData, "semester", 80) || null,
    skills: listValue(formData, "skills"),
    projects: listValue(formData, "projects"),
    photo_url: value(formData, "photo_url", 1000) || null,
    public_links: [],
    alumni: formData.get("alumni") === "on",
    publish_status: "draft",
    visibility: "public",
  });

  if (error) {
    console.error("Team member insert failed:", error);
    redirect("/admin/team?error=save");
  }

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    action: "create_team_member",
    entity_type: "team_member",
    metadata: { slug },
  });

  redirect("/admin/team?saved=1");
}

export async function archiveTeamMember(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead", "hr_operations"], profile.role);

  const id = value(formData, "id", 80);
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/team?error=invalid-id");

  const { error } = await supabase.from("team_members").update({
    publish_status: "archived",
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) redirect("/admin/team?error=save");

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    action: "archive_team_member",
    entity_type: "team_member",
    entity_id: id,
  });

  redirect("/admin/team?saved=1");
}

export async function updateRecruitmentSettings(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead", "hr_operations"], profile.role);

  const open = formData.get("applications_open") === "on";
  const stage = value(formData, "stage", 120);
  const description = value(formData, "description", 2000);
  const deadline = value(formData, "deadline", 40) || null;

  const { error } = await supabase.from("recruitment_settings").upsert({
    id: true, applications_open: open, stage: stage || (open ? "Applications Open" : "Applications Closed"),
    deadline, description, updated_at: new Date().toISOString(),
  });

  if (error) redirect("/admin/recruitment?error=save");
  redirect("/admin/recruitment?saved=1");
}

export async function updateRecruitmentApplication(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead", "hr_operations"], profile.role);

  const id = value(formData, "id", 80);
  const status = value(formData, "status", 80);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !status) redirect("/admin/recruitment?error=invalid");

  const { error } = await supabase.from("recruitment_applications").update({
    status, reviewed_by: profile.id, reviewed_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) redirect("/admin/recruitment?error=save");

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    action: "update_recruitment_application",
    entity_type: "recruitment_application",
    entity_id: id,
    metadata: { status },
  });

  redirect("/admin/recruitment?saved=1");
}


export async function updateTeamMember(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead", "hr_operations"], profile.role);
  const id = value(formData, "id", 80);
  const name = value(formData, "name", 160);
  const slug = value(formData, "slug", 120).toLowerCase();
  const role = value(formData, "role", 160);
  const division = value(formData, "division", 160);
  const tenure = value(formData, "tenure", 120);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !name || !slug || !role || !division || !tenure) redirect("/admin/team?error=missing");
  const { error } = await supabase.from("team_members").update({
    name, slug, role, division, tenure,
    department: value(formData, "department", 160) || null,
    semester: value(formData, "semester", 80) || null,
    skills: listValue(formData, "skills"), projects: listValue(formData, "projects"),
    photo_url: value(formData, "photo_url", 1000) || null,
    alumni: formData.get("alumni") === "on", updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) redirect("/admin/team?error=save");
  await supabase.from("audit_logs").insert({ actor_id: profile.id, action: "update_team_member", entity_type: "team_member", entity_id: id });
  redirect("/admin/team?saved=1");
}


async function transitionTeamMember(formData: FormData, target: "review" | "published") {
  const { supabase, profile } = await requireAdmin();
  const id = value(formData, "id", 80);
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/team?error=invalid-id");
  if (target === "published") requireAnyRole(["super_admin", "team_lead"], profile.role);
  else requireAnyRole(["super_admin", "team_lead", "hr_operations"], profile.role);

  const { data: current, error: readError } = await supabase.from("team_members").select("publish_status").eq("id", id).maybeSingle();
  if (readError || !current) redirect("/admin/team?error=save");

  if (target === "review" && current.publish_status !== "draft") redirect("/admin/team?error=transition");
  if (target === "published" && current.publish_status !== "review") redirect("/admin/team?error=transition");

  const { error } = await supabase.from("team_members").update({ publish_status: target, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect("/admin/team?error=save");

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    action: target === "review" ? "submit_team_member_review" : "publish_team_member",
    entity_type: "team_member",
    entity_id: id,
  });

  redirect("/admin/team?saved=1");
}

export async function submitTeamMemberForReview(formData: FormData) {
  return transitionTeamMember(formData, "review");
}

export async function publishTeamMember(formData: FormData) {
  return transitionTeamMember(formData, "published");
}
