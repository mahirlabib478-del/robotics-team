"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminSession } from "@/lib/admin-auth";

function field(formData: FormData, name: string, max = 254) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function signInAdmin(formData: FormData) {
  const email = field(formData, "email");
  const password = field(formData, "password", 200);
  const allowedDomain = process.env.ADMIN_EMAIL_DOMAIN?.trim().toLowerCase();

  if (!email || !password) redirect("/admin/login?error=missing");
  if (allowedDomain && !email.toLowerCase().endsWith(`@${allowedDomain}`)) redirect("/admin/login?error=domain");

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    redirect("/admin/login?error=config");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=invalid");

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/admin/login?error=invalid");

  if (allowedDomain && (!userData.user.email || !userData.user.email.toLowerCase().endsWith(`@${allowedDomain}`))) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=domain");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Admin profile lookup failed:", {
      code: profileError.code,
      message: profileError.message,
    });
    await supabase.auth.signOut();
    redirect("/admin/login?error=profile_lookup");
  }

  if (!profile) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }

  if (process.env.REQUIRE_ADMIN_MFA === "true") {
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance?.currentLevel !== "aal2") redirect("/admin/mfa");
  }

  redirect("/admin");
}

export async function signOutAdmin() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function verifyAdminMfa(formData: FormData) {
  const code = field(formData, "code", 12);
  if (!/^\d{6}$/.test(code)) redirect("/admin/mfa?error=invalid");

  const { supabase } = await requireAdminSession();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp?.find((item) => item.status === "verified");
  if (!factor) redirect("/admin/login?error=mfa");

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
  if (challengeError || !challenge) redirect("/admin/mfa?error=challenge");

  const { error } = await supabase.auth.mfa.verify({
    factorId: factor.id,
    challengeId: challenge.id,
    code,
  });
  if (error) redirect("/admin/mfa?error=invalid");

  redirect("/admin");
}
