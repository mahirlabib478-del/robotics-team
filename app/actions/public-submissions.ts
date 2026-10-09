"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function value(formData: FormData, name: string, maxLength = 5000) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim().slice(0, maxLength) : "";
}

function isSafeHttpsUrl(value: string) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

function adminClientOrRedirect(target: string) {
  try {
    return createSupabaseAdminClient();
  } catch (error) {
    console.error("Public submission configuration error:", error);
    redirect(target);
  }
}

async function getRequesterFingerprint(formType: "recruitment" | "contact") {
  const secret = process.env.PUBLIC_FORM_RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32) {
    console.error("PUBLIC_FORM_RATE_LIMIT_SECRET must be configured with at least 32 characters.");
    return null;
  }

  const requestHeaders = await headers();
  // Prefer the proxy-provided single-address header. If only X-Forwarded-For is
  // available, use its rightmost address: trusted proxies append client addresses,
  // while the leftmost value may be supplied by the requester.
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean);
  const ip = realIp || forwarded?.at(-1) || "unknown";

  const normalizedIp = ip === "unknown" ? "unknown" : ip;
  return createHmac("sha256", secret).update(formType).update(":").update(normalizedIp).digest("hex");
}

async function enforceRateLimit(formType: "recruitment" | "contact", limit: number) {
  const key = await getRequesterFingerprint(formType);
  if (!key) return false;

  const supabase = adminClientOrRedirect(formType === "recruitment" ? "/join-us?error=config" : "/contact?error=config");
  const { data, error } = await supabase.rpc("check_public_submission_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: 3600,
  });

  if (error) {
    console.error("Public submission rate-limit check failed:", error);
    return false;
  }

  return data === true;
}

export async function submitRecruitmentApplication(formData: FormData) {
  const website = value(formData, "website", 120);
  if (website) redirect("/join-us?error=invalid");

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

  if (!name || !department || !semester || !studentId || !preferredDivision || !whyJoin) redirect("/join-us?error=missing");
  if (githubOrPortfolio && !isSafeHttpsUrl(githubOrPortfolio)) redirect("/join-us?error=invalid");

  const supabase = adminClientOrRedirect("/join-us?error=config");
  const { data: settings, error: settingsError } = await supabase
    .from("recruitment_settings")
    .select("applications_open,deadline")
    .eq("id", true)
    .maybeSingle();

  if (settingsError) {
    console.error("Recruitment settings lookup failed:", settingsError);
    redirect("/join-us?error=submit");
  }
  if (!settings?.applications_open || (settings.deadline && new Date(settings.deadline).getTime() <= Date.now())) redirect("/join-us?error=closed");

  if (!(await enforceRateLimit("recruitment", 3))) redirect("/join-us?error=rate");

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

  redirect("/join-us?submitted=1");
}

export async function submitContactMessage(formData: FormData) {
  const website = value(formData, "website", 120);
  if (website) redirect("/contact?error=invalid");

  const name = value(formData, "name", 120);
  const email = value(formData, "email", 254).toLowerCase();
  const organization = value(formData, "organization", 160);
  const subject = value(formData, "subject", 200);
  const message = value(formData, "message", 5000);

  if (!name || !email || !subject || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/contact?error=missing");

  if (!(await enforceRateLimit("contact", 5))) redirect("/contact?error=rate");

  const supabase = adminClientOrRedirect("/contact?error=config");
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

  redirect("/contact?submitted=1");
}
