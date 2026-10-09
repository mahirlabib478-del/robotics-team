import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const privilegedRoles: UserRole[] = ["super_admin", "team_lead", "technical_lead", "media", "hr_operations", "viewer"];

export async function requireAdminSession() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");
  if (!user.email_confirmed_at) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=email");
  }

  const allowedDomain = process.env.ADMIN_EMAIL_DOMAIN?.trim().toLowerCase();
  if (allowedDomain && (!user.email || !user.email.toLowerCase().endsWith(`@${allowedDomain}`))) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=domain");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role, university_email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !privilegedRoles.includes(profile.role as UserRole)) {
    redirect("/admin/login?error=unauthorized");
  }

  return {
    supabase,
    user,
    profile: profile as {
      id: string;
      display_name: string | null;
      role: UserRole;
      university_email: string | null;
    },
  };
}

export async function requireAdmin() {
  const session = await requireAdminSession();

  if (process.env.REQUIRE_ADMIN_MFA === "true") {
    const { data: assurance } = await session.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance?.currentLevel !== "aal2") redirect("/admin/mfa");
  }

  return session;
}

export function requireRole(role: UserRole, actual: UserRole) {
  // These are capability roles, not a flat seniority ladder: media and HR
  // must not inherit technical-lead access merely because they share a tier.
  const grants: Record<UserRole, UserRole[]> = {
    viewer: ["viewer", "media", "hr_operations", "technical_lead", "team_lead", "super_admin"],
    media: ["media", "team_lead", "super_admin"],
    hr_operations: ["hr_operations", "team_lead", "super_admin"],
    technical_lead: ["technical_lead", "team_lead", "super_admin"],
    team_lead: ["team_lead", "super_admin"],
    super_admin: ["super_admin"],
  };
  if (!grants[role].includes(actual)) redirect("/admin?error=forbidden");
}

export function requireAnyRole(roles: UserRole[], actual: UserRole) {
  if (!roles.includes(actual)) redirect("/admin?error=forbidden");
}
