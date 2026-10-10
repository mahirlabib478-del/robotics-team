import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [design, roadmap, portal, auth] = await Promise.all([
  read("docs/engineering-portal-security-design.md"),
  read("ROADMAP.md"),
  read("app/engineering/page.tsx"),
  read("lib/admin-auth.ts"),
]);

for (const requirement of [
  "Security baseline and design reference",
  "PostgreSQL RLS",
  "Never expose the Supabase service-role key",
  "private storage bucket",
  "Deny by default",
  "project membership",
  "Cross-project ID substitution",
  "signed URL",
  "MFA at AAL2",
  "direct API calls",
  "tested commit SHA",
  "Keep each module marked **disabled**",
]) {
  assert.ok(design.includes(requirement), `Security design must preserve requirement: ${requirement}`);
}

for (const entity of [
  "engineering_projects",
  "engineering_project_members",
  "engineering_tasks",
  "engineering_task_events",
  "engineering_documents",
  "engineering_document_versions",
  "engineering_parts",
  "engineering_test_runs",
  "engineering_readiness_items",
]) {
  assert.ok(design.includes(entity), `Proposed data model must include: ${entity}`);
}

assert.match(roadmap, /Private Engineering Portal — Data and Access Design/, "Roadmap must link the security design");
assert.match(roadmap, /not a migration or proof of staging security/, "Roadmap must not overstate the design document as implementation evidence");
assert.match(portal, /status: "Not enabled"/, "Private modules must remain disabled until verified");
assert.match(auth, /REQUIRE_ADMIN_MFA/, "Portal entry continues to rely on the configured server-side MFA gate");
console.log("Private engineering portal design-contract checks passed.");
