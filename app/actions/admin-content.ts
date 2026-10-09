"use server";

import { redirect } from "next/navigation";
import { requireAdmin, requireAnyRole, requireRole } from "@/lib/admin-auth";

function value(formData: FormData, name: string, max = 5000) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

function validSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

const robotStatuses = ["Competition Ready", "In Development", "Retired", "Prototype"] as const;
const competitionLevels = ["National", "International"] as const;
const competitionResults = ["Champion", "Runner-up", "Podium", "Finalist", "Participation"] as const;

export async function createRobot(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireRole("technical_lead", profile.role);

  const name = value(formData, "name", 160);
  const slug = value(formData, "slug", 120).toLowerCase();
  const category = value(formData, "category", 120);
  const version = value(formData, "version", 80);
  const status = value(formData, "status", 80);
  const year = Number(value(formData, "development_year", 10));
  const summary = value(formData, "summary", 2000);
  const weightInput = value(formData, "weight_kg", 20);
  const weight = weightInput === "" ? null : Number(weightInput);

  if (weight !== null && (!Number.isFinite(weight) || weight < 0)) redirect("/admin/robots?error=invalid-weight");
  if (!name || !slug || !validSlug(slug) || !category || !version || !robotStatuses.includes(status as (typeof robotStatuses)[number]) || !Number.isInteger(year) || year < 1900 || year > 2100 || !summary) {
    redirect("/admin/robots?error=missing");
  }

  const { error } = await supabase.from("robots").insert({
    name, slug, category, version, status, development_year: year, summary,
    weight_kg: weight,
    dimensions: value(formData, "dimensions", 160) || null,
    specifications: {}, engineering: {},
    sensitive_fields_hidden: ["weapon geometry", "custom control code", "sensitive CAD", "firmware", "competition strategy"],
    publish_status: "draft", visibility: "public",
    created_by: profile.id, updated_by: profile.id,
  });

  if (error) {
    console.error("Robot insert failed:", error);
    redirect("/admin/robots?error=save");
  }

  redirect("/admin/robots?saved=1");
}


export async function createCompetition(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireRole("technical_lead", profile.role);

  const officialName = value(formData, "official_name", 200);
  const slug = value(formData, "slug", 120).toLowerCase();
  const organizer = value(formData, "organizer", 180);
  const year = Number(value(formData, "year", 10));
  const segment = value(formData, "segment", 120);
  const robotName = value(formData, "robot_name", 160);
  const level = value(formData, "level", 30);
  const result = value(formData, "result", 40);

  if (!officialName || !slug || !validSlug(slug) || !organizer || !Number.isInteger(year) || year < 1900 || year > 2100 || !segment || !robotName || !competitionLevels.includes(level as (typeof competitionLevels)[number]) || !competitionResults.includes(result as (typeof competitionResults)[number])) {
    redirect("/admin/competitions?error=missing");
  }

  const { error } = await supabase.from("competitions").insert({
    official_name: officialName, slug, organizer, year, segment, robot_name: robotName, level, result,
    city: value(formData, "city", 100) || null,
    country: value(formData, "country", 100) || null,
    event_date: value(formData, "event_date", 20) || null,
    report: value(formData, "report", 4000) || null,
    publish_status: "draft", visibility: "public",
    created_by: profile.id, updated_by: profile.id,
  });

  if (error) {
    console.error("Competition insert failed:", error);
    redirect("/admin/competitions?error=save");
  }

  redirect("/admin/competitions?saved=1");
}

function entityId(formData: FormData) {
  const id = value(formData, "id", 80);
  return /^[0-9a-f-]{36}$/i.test(id) ? id : "";
}

async function transition(
  formData: FormData,
  table: "robots" | "competitions",
  target: "review" | "published" | "archived",
  allowedRoles: import("@/lib/types").UserRole[],
  action: string,
) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(allowedRoles, profile.role);

  const id = entityId(formData);
  if (!id) redirect(`/admin/${table}?error=invalid-id`);

  const { data: current, error: readError } = await supabase
    .from(table)
    .select("publish_status")
    .eq("id", id)
    .maybeSingle();

  if (readError || !current) redirect(`/admin/${table}?error=not-found`);

  const allowedTransition =
    (target === "review" && current.publish_status === "draft") ||
    (target === "published" && current.publish_status === "review") ||
    (target === "archived" && current.publish_status !== "archived");

  if (!allowedTransition) redirect(`/admin/${table}?error=invalid-transition`);

  const { error } = await supabase
    .from(table)
    .update({ publish_status: target, updated_by: profile.id, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error(`${table} transition failed:`, error);
    redirect(`/admin/${table}?error=transition`);
  }

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    action,
    entity_type: table === "robots" ? "robot" : "competition",
    entity_id: id,
    metadata: { publish_status: target },
  });

  redirect(`/admin/${table}?saved=1`);
}

export async function submitRobotForReview(formData: FormData) {
  return transition(formData, "robots", "review", ["super_admin", "team_lead", "technical_lead"], "submit_robot_for_review");
}

export async function publishRobot(formData: FormData) {
  return transition(formData, "robots", "published", ["super_admin", "team_lead"], "publish_robot");
}

export async function archiveRobot(formData: FormData) {
  return transition(formData, "robots", "archived", ["super_admin", "team_lead"], "archive_robot");
}

export async function submitCompetitionForReview(formData: FormData) {
  return transition(formData, "competitions", "review", ["super_admin", "team_lead", "technical_lead"], "submit_competition_for_review");
}

export async function publishCompetition(formData: FormData) {
  return transition(formData, "competitions", "published", ["super_admin", "team_lead"], "publish_competition");
}

export async function archiveCompetition(formData: FormData) {
  return transition(formData, "competitions", "archived", ["super_admin", "team_lead"], "archive_competition");
}


export async function updateRobot(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireRole("technical_lead", profile.role);
  const id = entityId(formData);
  const name = value(formData, "name", 160);
  const slug = value(formData, "slug", 120).toLowerCase();
  const category = value(formData, "category", 120);
  const version = value(formData, "version", 80);
  const status = value(formData, "status", 80);
  const year = Number(value(formData, "development_year", 10));
  const summary = value(formData, "summary", 2000);
  const weightInput = value(formData, "weight_kg", 20);
  const weight = weightInput === "" ? null : Number(weightInput);
  if (weight !== null && (!Number.isFinite(weight) || weight < 0)) redirect("/admin/robots?error=invalid-weight");
  if (!id || !name || !slug || !validSlug(slug) || !category || !version || !robotStatuses.includes(status as (typeof robotStatuses)[number]) || !Number.isInteger(year) || year < 1900 || year > 2100 || !summary) redirect("/admin/robots?error=missing");
  const { error } = await supabase.from("robots").update({
    name, slug, category, version, status, development_year: year, summary,
    weight_kg: weight,
    dimensions: value(formData, "dimensions", 160) || null,
    updated_by: profile.id, updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) redirect("/admin/robots?error=save");
  await supabase.from("audit_logs").insert({ actor_id: profile.id, action: "update_robot", entity_type: "robot", entity_id: id });
  redirect("/admin/robots?saved=1");
}

export async function updateCompetition(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireRole("technical_lead", profile.role);
  const id = entityId(formData);
  const officialName = value(formData, "official_name", 200);
  const slug = value(formData, "slug", 120).toLowerCase();
  const organizer = value(formData, "organizer", 180);
  const year = Number(value(formData, "year", 10));
  const segment = value(formData, "segment", 120);
  const robotName = value(formData, "robot_name", 160);
  const level = value(formData, "level", 30);
  const result = value(formData, "result", 40);
  if (!id || !officialName || !slug || !validSlug(slug) || !organizer || !Number.isInteger(year) || year < 1900 || year > 2100 || !segment || !robotName || !competitionLevels.includes(level as (typeof competitionLevels)[number]) || !competitionResults.includes(result as (typeof competitionResults)[number])) redirect("/admin/competitions?error=missing");
  const { error } = await supabase.from("competitions").update({
    official_name: officialName, slug, organizer, year, segment, robot_name: robotName, level, result,
    city: value(formData, "city", 100) || null, country: value(formData, "country", 100) || null,
    event_date: value(formData, "event_date", 20) || null, report: value(formData, "report", 4000) || null,
    updated_by: profile.id, updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) redirect("/admin/competitions?error=save");
  await supabase.from("audit_logs").insert({ actor_id: profile.id, action: "update_competition", entity_type: "competition", entity_id: id });
  redirect("/admin/competitions?saved=1");
}
