"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function value(formData: FormData, name: string, maxLength = 5000) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim().slice(0, maxLength) : "";
}

export async function submitRecruitmentApplication(formData: FormData) {
  const name = value(formData, "name", 120);
  const department = value(formData, "department", 160);
  const semester = value(formData, "semester", 80);
  const studentId = value(formData, "student_id", 80);
  const preferredDivision = value(formData, "preferred_division", 120);
  const skills = value(formData, "skills");
  const previousProjects = value(formData, "previous_projects");
  const githubOrPortfolio = value(formData, "github_or_portfolio", 500);
  const weeklyAvailability = value(formData, "weekly_availability", 500);
  const whyJoin = value(formData, "why_join", 3000);

  if (!name || !department || !semester || !studentId || !preferredDivision || !whyJoin) {
    redirect("/join-us?error=missing");
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("recruitment_applications").insert({
      name,
      department,
      semester,
      student_id: studentId,
      preferred_division: preferredDivision,
      skills,
      previous_projects: previousProjects,
      github_or_portfolio: githubOrPortfolio,
      weekly_availability: weeklyAvailability,
      why_join: whyJoin,
    });

    if (error) {
      console.error("Recruitment application insert failed:", error);
      redirect("/join-us?error=submit");
    }
  } catch (error) {
    console.error("Recruitment submission failed:", error);
    redirect("/join-us?error=config");
  }

  redirect("/join-us?submitted=1");
}

export async function submitContactMessage(formData: FormData) {
  const name = value(formData, "name", 120);
  const email = value(formData, "email", 254);
  const organization = value(formData, "organization", 160);
  const subject = value(formData, "subject", 200);
  const message = value(formData, "message", 5000);

  if (!name || !email || !subject || !message || !email.includes("@")) {
    redirect("/contact?error=missing");
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      organization,
      subject,
      message,
    });

    if (error) {
      console.error("Contact message insert failed:", error);
      redirect("/contact?error=submit");
    }
  } catch (error) {
    console.error("Contact submission failed:", error);
    redirect("/contact?error=config");
  }

  redirect("/contact?submitted=1");
}
