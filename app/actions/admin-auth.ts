"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
function field(formData: FormData, name: string, max = 254) { const value=formData.get(name); return typeof value==="string" ? value.trim().slice(0,max) : ""; }
export async function signInAdmin(formData: FormData) {
  const email=field(formData,"email"), password=field(formData,"password",200), allowedDomain=process.env.ADMIN_EMAIL_DOMAIN?.trim().toLowerCase();
  if(!email||!password) redirect("/admin/login?error=missing");
  if(allowedDomain&&!email.toLowerCase().endsWith(`@${allowedDomain}`)) redirect("/admin/login?error=domain");
  try {
    const supabase=await createSupabaseServerClient();
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error) redirect("/admin/login?error=invalid");
    const {data:userData}=await supabase.auth.getUser();
    const {data:profile}=await supabase.from("profiles").select("role").eq("id",userData.user?.id??"").maybeSingle();
    if(!profile){await supabase.auth.signOut();redirect("/admin/login?error=unauthorized");}
  } catch { redirect("/admin/login?error=config"); }
  redirect("/admin");
}
export async function signOutAdmin() { const supabase=await createSupabaseServerClient(); await supabase.auth.signOut(); redirect("/admin/login"); }
