import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [operations, recruitmentPage, schema, statusMigration, publicData, adminClient, publicSubmissions, joinPage, contactPage] = await Promise.all([
  read("app/actions/admin-operations.ts"),
  read("app/admin/recruitment/page.tsx"),
  read("supabase/schema.sql"),
  read("supabase/migrations/20261009_recruitment_status_alignment.sql"),
  read("lib/public-data.ts"),
  read("lib/supabase/admin.ts"),
  read("app/actions/public-submissions.ts"),
  read("app/join-us/page.tsx"),
  read("app/contact/page.tsx"),
]);

function quotedValues(source, expression, label) {
  const match = source.match(expression);
  assert.ok(match, `Could not locate ${label}`);
  return [...match[1].matchAll(/["']([^"']+)["']/g)].map((item) => item[1]).sort();
}

const actionStatuses = quotedValues(
  operations,
  /const allowedStatuses = \[([^\]]+)\]/s,
  "recruitment action statuses",
);
const pageStatuses = quotedValues(
  recruitmentPage,
  /const statuses = \[([^\]]+)\]/s,
  "recruitment page statuses",
);
const schemaStatuses = quotedValues(
  schema,
  /add constraint recruitment_status_valid check \(status in \(([^)]+)\)\)/s,
  "base schema recruitment status constraint",
);
const migrationStatuses = quotedValues(
  statusMigration,
  /add constraint recruitment_status_valid\s+check \(status in \(([^)]+)\)\)/s,
  "recruitment status migration",
);

assert.deepEqual(pageStatuses, actionStatuses, "Recruitment UI and server action statuses must match");
assert.deepEqual(schemaStatuses, actionStatuses, "Fresh-install schema must allow every server action status");
assert.deepEqual(migrationStatuses, actionStatuses, "Upgrade migration must allow every server action status");

assert.ok(
  adminClient.startsWith('import "server-only";'),
  "Supabase service-role client must be marked server-only",
);
const robotQuery = publicData.match(/from\("robots"\)\.select\("([^"]+)"\)/);
assert.ok(robotQuery, "Public robot query must be explicit");
assert.ok(
  !robotQuery[1].split(",").map((field) => field.trim()).includes("engineering"),
  "Public robot query must not select private engineering JSON",
);
assert.match(publicData, /engineering:\s*undefined/, "Public robot projection must omit engineering data");

assert.match(publicSubmissions, /await enforceRateLimit\("recruitment", 3\)/, "Recruitment submissions must be rate limited");
assert.match(publicSubmissions, /await enforceRateLimit\("contact", 5\)/, "Contact submissions must be rate limited");
assert.match(publicSubmissions, /createHmac\("sha256", secret\)/, "Rate-limit fingerprints must be keyed hashes");
assert.match(joinPage, /statusAvailable && settings\?\.applications_open === true && !deadlinePassed/, "Recruitment form must fail closed when status is unavailable or expired");
assert.match(publicSubmissions, /settings\.deadline && new Date\(settings\.deadline\)\.getTime\(\) <= Date\.now\(\)/, "Server action must enforce the recruitment deadline");
assert.match(publicSubmissions, /const website = value\(formData, "website", 120\)/, "Public submission actions must inspect the honeypot field");
assert.match(contactPage, /name="website" tabIndex=\{-1\} autoComplete="off"/, "Contact form must include a non-visible honeypot field");
assert.match(joinPage, /name="website" tabIndex=\{-1\} autoComplete="off"/, "Recruitment form must include a non-visible honeypot field");
assert.match(publicSubmissions, /!isSafeHttpsUrl\(githubOrPortfolio\)/, "Recruitment portfolio URLs must require HTTPS");
assert.match(publicSubmissions, /!\/\^\[\^\\s@\].*\.test\(email\)/, "Contact email must be validated server-side");

assert.match(schema, /create table public\.public_submission_rate_limits[\s\S]*?enable row level security/, "Rate-limit state must have RLS enabled");
assert.match(schema, /revoke all on table public\.public_submission_rate_limits from public, anon, authenticated/, "Rate-limit state must not be directly accessible to client roles");
assert.match(schema, /create or replace function public\.check_public_submission_rate_limit\([\s\S]*?security definer\s+set search_path = ''/, "Rate-limit RPC must use a hardened security-definer context");
assert.match(schema, /revoke all on function public\.check_public_submission_rate_limit\(text, integer, integer\) from public, anon, authenticated/, "Rate-limit RPC must be revoked from public client roles");
assert.match(schema, /grant execute on function public\.check_public_submission_rate_limit\(text, integer, integer\) to service_role/, "Only the server service role should execute the rate-limit RPC");
assert.doesNotMatch(schema, /create policy [^;]+ on public\.recruitment_applications for insert to anon/i, "Anonymous clients must not insert recruitment applications directly");
assert.doesNotMatch(schema, /create policy [^;]+ on public\.contact_messages for insert to anon/i, "Anonymous clients must not insert contact messages directly");


const [adminAuth, adminContent, adminExtended, adminOperations] = await Promise.all([
  read("lib/admin-auth.ts"),
  read("app/actions/admin-content.ts"),
  read("app/actions/admin-extended.ts"),
  read("app/actions/admin-operations.ts"),
]);

assert.match(adminAuth, /export async function requireAdminSession\([\s\S]*?auth\.getUser\(\)/, "Admin routes and actions must validate the current auth session");
assert.match(adminAuth, /if \(!user\.email_confirmed_at\)[\s\S]*?auth\.signOut\(\)/, "Unverified admin accounts must be signed out");
assert.match(adminAuth, /if \(!profile \|\| !privilegedRoles\.includes\(profile\.role as UserRole\)\)/, "Admin access must require an allowlisted profile role");
assert.match(adminAuth, /export function requireAnyRole\(roles: UserRole\[], actual: UserRole\)[\s\S]*?if \(!roles\.includes\(actual\)\)/, "Role-restricted admin actions must reject roles outside their allowlist");
assert.match(adminContent, /target === "published" && from === "review" && \["team_lead", "super_admin"\]\.includes\(profile\.role\)/, "Robots and competitions must require leadership approval to publish");
assert.match(adminContent, /target === "archived" && from !== "archived" && \["team_lead", "super_admin"\]\.includes\(profile\.role\)/, "Robots and competitions must restrict archive transitions to leadership");
assert.match(adminExtended, /target === "published" && current === "review" && \["super_admin", "team_lead"\]\.includes\(profile\.role\)/, "Research, gallery, and sponsor publishing must require leadership approval");
assert.match(adminExtended, /target === "archived" && current !== "archived" && \["super_admin", "team_lead"\]\.includes\(profile\.role\)/, "Research, gallery, and sponsor archiving must require leadership approval");
assert.match(adminOperations, /if \(target === "published"\) requireAnyRole\(\["super_admin", "team_lead"\]/, "Team member publishing must require leadership approval");
assert.match(adminOperations, /if \(target === "review" && current\.publish_status !== "draft"\)/, "Team member review transition must only accept drafts");
assert.match(adminOperations, /if \(target === "published" && current\.publish_status !== "review"\)/, "Team member publishing must only accept reviewed records");
assert.match(publicData, /url\.protocol === "https:"/, "Public profile links and media must reject non-HTTPS URLs");
assert.match(publicData, /hostname === "youtube\.com" \|\| hostname === "www\.youtube\.com" \|\| hostname === "youtu\.be"/, "Public YouTube embeds must use an allowlisted host");

assert.match(adminAuth, /const allowedDomain = process\.env\.ADMIN_EMAIL_DOMAIN/, "Admin email-domain restriction must remain configurable");
assert.match(adminAuth, /user\.email\.toLowerCase\(\)\.endsWith\(/, "Admin email-domain restriction must check a normalized email suffix");
assert.match(adminAuth, /if \(process\.env\.REQUIRE_ADMIN_MFA === "true"\)[\s\S]*?assurance\?\.currentLevel !== "aal2"[\s\S]*?redirect\("\/admin\/mfa"\)/, "Admin MFA enforcement must require aal2 when enabled");
assert.match(adminContent, /if \(current\.publish_status === "published" && !\["team_lead", "super_admin"\]\.includes\(profile\.role\)\)/, "Editing published robot and competition records must require leadership approval");
assert.match(adminExtended, /if \(current\.publish_status === "published" && !\["team_lead", "super_admin"\]\.includes\(profile\.role\)\)/, "Editing published research and gallery records must require leadership approval");
assert.match(adminOperations, /if \(current\.publish_status === "published" && !\["team_lead", "super_admin"\]\.includes\(profile\.role\)\)/, "Editing published team records must require leadership approval");
assert.match(publicSubmissions, /Public submission rate-limit check failed[\s\S]*?return false/, "Rate limiting must fail closed if the database check fails");
assert.match(publicSubmissions, /if \(!secret \|\| secret\.length < 32\)[\s\S]*?return null/, "Public submissions must fail closed without a sufficiently strong fingerprint secret");

console.log("Contract checks passed: recruitment statuses/deadlines, server-side validation, honeypots, rate limits, service-role boundaries, RLS, and public robot projection.");
