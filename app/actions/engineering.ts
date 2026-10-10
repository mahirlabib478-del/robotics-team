"use server";

import { redirect } from "next/navigation";
import { requireAdmin, requireAnyRole } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function value(formData: FormData, name: string, max = 3000) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

function validId(value: string) {
  return /^[0-9a-f-]{36}$/i.test(value);
}

function validSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function validDate(value: string) {
  return !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)));
}

function requireEngineeringDomain(email?: string) {
  const domain = process.env.ADMIN_EMAIL_DOMAIN?.trim().toLowerCase();
  if (!domain || !email || !email.toLowerCase().endsWith(`@${domain}`)) redirect("/engineering/projects?error=domain-required");
}

export async function createEngineeringProject(formData: FormData) {
  const { supabase, profile, user } = await requireAdmin();
  requireEngineeringDomain(user.email);
  requireAnyRole(["super_admin", "team_lead"], profile.role);
  const name = value(formData, "name", 160);
  const slug = value(formData, "slug", 120).toLowerCase();
  const division = value(formData, "division", 120);
  const summary = value(formData, "summary", 2000);
  const dueDate = value(formData, "due_date", 10);
  if (!name || !validSlug(slug) || !division || !validDate(dueDate)) redirect("/engineering/projects?error=invalid-project");

  const { data, error } = await supabase.from("engineering_projects").insert({
    name, slug, division, summary, due_date: dueDate || null,
    owner_id: profile.id, created_by: profile.id, updated_by: profile.id,
  }).select("id").single();
  if (error || !data) {
    console.error("Engineering project creation failed:", error);
    redirect("/engineering/projects?error=project-save");
  }
  redirect("/engineering/projects?saved=project");
}

export async function addEngineeringProjectMember(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead"], profile.role);
  const projectId = value(formData, "project_id", 80);
  const email = value(formData, "university_email", 254).toLowerCase();
  const capability = value(formData, "capability", 20);
  if (!validId(projectId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["lead", "editor", "viewer"].includes(capability)) {
    redirect("/engineering/projects?error=invalid-member");
  }

  let member: { id: string; university_email: string | null; role: string } | null = null;
  try {
    const admin = createSupabaseAdminClient();
    const lookup = await admin.from("profiles").select("id,university_email,role").ilike("university_email", email).maybeSingle();
    if (!lookup.error) member = lookup.data;
    if (member) {
      const { data: authRecord, error: authError } = await admin.auth.admin.getUserById(member.id);
      const allowedDomain = process.env.ADMIN_EMAIL_DOMAIN?.trim().toLowerCase();
      const confirmedEmail = authRecord.user?.email?.toLowerCase();
      if (authError || !allowedDomain || !authRecord.user?.email_confirmed_at || !confirmedEmail || !confirmedEmail.endsWith(`@${allowedDomain}`) || !["super_admin", "team_lead", "technical_lead", "viewer"].includes(member.role)) {
        member = null;
      }
    }
  } catch (error) {
    console.error("Engineering project member lookup failed:", error);
    redirect("/engineering/projects?error=member-lookup");
  }
  if (!member?.university_email) redirect("/engineering/projects?error=member-not-found");
  const { error } = await supabase.from("engineering_project_members").insert({
    project_id: projectId, user_id: member.id, capability, added_by: profile.id,
  });
  if (error) {
    console.error("Engineering project membership update failed:", error);
    redirect("/engineering/projects?error=member-save");
  }
  redirect("/engineering/projects?saved=member");
}

export async function createEngineeringTask(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead", "technical_lead"], profile.role);
  const projectId = value(formData, "project_id", 80);
  const title = value(formData, "title", 200);
  const description = value(formData, "description", 3000);
  const priority = value(formData, "priority", 20);
  const dueDate = value(formData, "due_date", 10);
  const assigneeEmail = value(formData, "assignee_email", 254).toLowerCase();
  if (!validId(projectId) || !title || !["low", "normal", "high", "urgent"].includes(priority) || !validDate(dueDate) || (assigneeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assigneeEmail))) {
    redirect("/engineering/projects?error=invalid-task");
  }
  let assigneeId: string | null = null;
  if (assigneeEmail) {
    let targetProfile: { id: string } | null = null;
    try {
      const admin = createSupabaseAdminClient();
      const lookup = await admin.from("profiles").select("id").ilike("university_email", assigneeEmail).maybeSingle();
      if (!lookup.error) targetProfile = lookup.data;
    } catch (error) {
      console.error("Engineering task assignee lookup failed:", error);
      redirect("/engineering/projects?error=assignee-lookup");
    }
    if (!targetProfile) redirect("/engineering/projects?error=assignee-not-found");
    const { data: membership, error: membershipError } = await supabase.from("engineering_project_members").select("user_id").eq("project_id", projectId).eq("user_id", targetProfile.id).maybeSingle();
    if (membershipError || !membership) redirect("/engineering/projects?error=assignee-not-member");
    assigneeId = targetProfile.id;
  }
  const { data: created, error } = await supabase.from("engineering_tasks").insert({
    project_id: projectId, title, description, priority, due_date: dueDate || null, assignee_id: assigneeId,
    status: "todo", created_by: profile.id, updated_by: profile.id,
  }).select("id").single();
  if (error || !created) {
    console.error("Engineering task creation failed:", error);
    redirect("/engineering/projects?error=task-save");
  }
  redirect("/engineering/projects?saved=task");
}

export async function updateEngineeringTaskStatus(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  requireAnyRole(["super_admin", "team_lead", "technical_lead"], profile.role);
  const taskId = value(formData, "task_id", 80);
  const status = value(formData, "status", 20);
  if (!validId(taskId) || !["backlog", "todo", "in_progress", "blocked", "done"].includes(status)) {
    redirect("/engineering/projects?error=invalid-task");
  }
  const { data: updated, error } = await supabase.from("engineering_tasks").update({
    status, updated_by: profile.id, updated_at: new Date().toISOString(),
  }).eq("id", taskId).select("id").maybeSingle();
  if (error || !updated) {
    console.error("Engineering task status update failed:", error);
    redirect("/engineering/projects?error=task-update");
  }
  redirect("/engineering/projects?saved=status");
}
