import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [page, auth, robots, sitemap] = await Promise.all([
  read("app/engineering/page.tsx"),
  read("lib/admin-auth.ts"),
  read("app/robots.ts"),
  read("app/sitemap.ts"),
]);

assert.match(page, /export const dynamic = "force-dynamic"/, "Private portal must render dynamically per request");
assert.match(page, /robots: \{ index: false, follow: false, noarchive: true \}/, "Private portal metadata must opt out of search indexing and archiving");
assert.match(page, /const \{ profile \} = await requireAdmin\(\)/, "Portal must require an authenticated, confirmed admin session");
assert.match(page, /requireAnyRole\(\["super_admin", "team_lead", "technical_lead"\], profile\.role\)/, "Portal entry must allow only the explicitly approved initial engineering roles");
assert.match(auth, /if \(process\.env\.REQUIRE_ADMIN_MFA === "true"\)[\s\S]*?assurance\?\.currentLevel !== "aal2"[\s\S]*?redirect\("\/admin\/mfa"\)/, "Portal must inherit the configured server-side MFA gate");
for (const moduleTitle of ["Projects and task board", "Engineering documents", "BOM and procurement", "Testing and readiness"]) {
  assert.ok(page.includes(moduleTitle), `Portal must preserve the planned Phase 3 module: ${moduleTitle}`);
}
assert.match(page, /status: "Not enabled"/, "Unimplemented engineering modules must be visibly marked as not enabled");
assert.match(page, /No project or private file data is loaded on this page/, "Portal shell must not imply that private records are already connected");
assert.doesNotMatch(page, /createSupabaseServerClient|\.from\(["'](projects|engineering_documents|bill_of_materials|test_runs)["']\)/, "Portal shell must not query nonexistent or unverified private engineering tables");
assert.doesNotMatch(sitemap, /\/engineering/, "Private engineering portal must not be enumerated in the public sitemap");
assert.match(robots, /disallow: \["\/admin", "\/api"\]/, "Crawler guidance must continue to exclude admin and API routes");
console.log("Private engineering portal access-boundary checks passed.");
