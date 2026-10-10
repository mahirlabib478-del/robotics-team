"use server";

import { redirect } from "next/navigation";
import { requireAdmin, requireAnyRole } from "@/lib/admin-auth";

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

export async function createEngineeringProject(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
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

  const { data: member, error: profileError } = await supabase.from("profiles").select("id").ilike("university_email", email).maybeSingle();
  if (profileError || !member) {
    console.error("Engineering project member lookup failed:", profileError);
    redirect("/engineering/projects?error=member-not-found");
  }
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
  if (!validId(projectId) || !title || !["low", "normal", "high", "urgent"].includes(priority) || !validDate(dueDate)) {
    redirect("/engineering/projects?error=invalid-task");
  }
  const { error } = await supabase.from("engineering_tasks").insert({
    project_id: projectId, title, description, priority, due_date: dueDate || null,
    status: "todo", created_by: profile.id, updated_by: profile.id,
  });
  if (error) {
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
  const { error } = await supabase.from("engineering_tasks").update({
    status, updated_by: profile.id, updated_at: new Date().toISOString(),
  }).eq("id", taskId);
  if (error) {
    console.error("Engineering task status update failed:", error);
    redirect("/engineering/projects?error=task-update");
  }
  redirect("/engineering/projects?saved=status");
}
