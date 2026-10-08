import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const privilegedRoles: UserRole[] = ["super_admin", "team_lead", "technical_lead", "media", "hr_operations", "viewer"];

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase.from("profiles").select("id, display_name, role, university_email").eq("id", user.id).maybeSingle();
  if (!profile || !privilegedRoles.includes(profile.role as UserRole)) redirect("/admin/login?error=unauthorized");

  if (process.env.REQUIRE_ADMIN_MFA === "true") {
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance?.currentLevel !== "aal2") redirect("/admin/login?error=mfa");
  }

  return { supabase, user, profile: profile as { id: string; display_name: string | null; role: UserRole; university_email: string | null } };
}

export function requireRole(role: UserRole, actual: UserRole) {
  const hierarchy: Record<UserRole, number> = {
    viewer: 10,
    media: 20,
    hr_operations: 20,
    technical_lead: 20,
    team_lead: 30,
    super_admin: 40,
  };
  if (hierarchy[actual] < hierarchy[role]) redirect("/admin?error=forbidden");
}
