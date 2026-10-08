"use server";

import { redirect } from "next/navigation";
import { requireAdmin, requireRole } from "@/lib/admin-auth";

function value(formData: FormData, name: string, max = 5000) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

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

  if (!name || !slug || !category || !version || !status || !Number.isInteger(year) || !summary) {
    redirect("/admin/robots?error=missing");
  }

  const { error } = await supabase.from("robots").insert({
    name, slug, category, version, status, development_year: year, summary,
    weight_kg: Number(value(formData, "weight_kg", 20)) || null,
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
