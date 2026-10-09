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
assert.match(publicSubmissions, /if \(!secret \|\| secret\.length < 32\)[\s\S]*?return null/, "Public forms must fail closed when the rate-limit secret is missing or weak");
assert.match(publicSubmissions, /if \(!key\) return false/, "Public forms must reject requests when fingerprint generation fails");
assert.match(publicSubmissions, /if \(error\)[\s\S]*?return false/, "Public forms must reject requests when the rate-limit RPC fails");
assert.match(publicSubmissions, /return data === true/, "Public forms must accept only an explicit true rate-limit result");
assert.match(publicSubmissions, /\.update\(formType\)\.update\(":"\)\.update\(normalizedIp\)/, "Rate-limit fingerprints must be separated by form type and never require storing raw IP addresses");
for (const [formType, limit, table] of [
  ["recruitment", 3, "recruitment_applications"],
  ["contact", 5, "contact_messages"],
]) {
  const limitCheck = publicSubmissions.indexOf(`if (!(await enforceRateLimit("${formType}", ${limit})))`);
  const insertCall = publicSubmissions.indexOf(`.from("${table}").insert(`);
  assert.ok(limitCheck >= 0 && insertCall > limitCheck, `${formType} inserts must happen only after a successful rate-limit check`);
}
assert.match(publicSubmissions, /const ip = realIp \\|\\| forwarded\\?\\.at\\(-1\\) \\|\\| "unknown"/, "Rate-limit fingerprint must not trust the requester-controlled leftmost forwarded address");
assert.ok(publicSubmissions.includes('requestHeaders.get("x-forwarded-for")?.split(",").map'), "Forwarded address chain must be parsed explicitly");
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

const publishGuardMigration = await read("supabase/migrations/20261009_database_publish_workflow_guard.sql");
assert.ok(publishGuardMigration.includes("security invoker") && publishGuardMigration.includes("set search_path = ''"), "Database publishing guard must use a constrained invoker context");
assert.ok(publishGuardMigration.includes("old.publish_status <> 'review' or not is_leader"), "Database must block publication without review and leadership approval");
assert.ok(publishGuardMigration.includes("old.publish_status <> 'published'") === false || publishGuardMigration.includes("Only leadership may unpublish content"), "Published-content transition guard must be present");
assert.ok(publishGuardMigration.includes("Published content edits require leadership and must return to draft"), "Published content edits must be returned to draft");
assert.ok(publishGuardMigration.includes("Archived content cannot be reopened through direct updates"), "Archived content must not be reopened by bypassing the admin workflow");
assert.ok(publishGuardMigration.includes("Archived content is immutable"), "Archived content fields must not be edited through direct database updates");
assert.ok(publishGuardMigration.includes("Review, published, or archived content cannot be deleted"), "Submitted, published, and archived content must not be deleted through direct database writes");
const deleteGuardStart = publishGuardMigration.indexOf("if tg_op = 'DELETE' then");
const deleteGuardEnd = publishGuardMigration.indexOf("if tg_op = 'INSERT' then");
const protectedDeleteCheck = publishGuardMigration.indexOf("old.publish_status in ('review', 'published', 'archived')", deleteGuardStart);
const deleteReturn = publishGuardMigration.indexOf("return old;", protectedDeleteCheck);
assert.ok(
  deleteGuardStart >= 0 && protectedDeleteCheck > deleteGuardStart &&
    deleteReturn > protectedDeleteCheck && deleteGuardEnd > deleteReturn,
  "Delete protection must run before insert/update-only checks and preserve draft-only deletion",
);

assert.equal((publishGuardMigration.match(/before insert or update or delete on public\./g) || []).length, 6, "Delete protection must cover every content table guarded by the publishing workflow");
assert.ok(schema.includes("create or replace function public.enforce_content_publish_workflow()"), "Fresh-install schema must include the publishing workflow trigger function");
for (const guard of [
  "Content must pass review before publication",
  "Only team leadership may publish reviewed content",
  "Archived content cannot be reopened through direct updates",
  "Archived content is immutable",
  "Review, published, or archived content cannot be deleted",
]) {
  assert.ok(schema.includes(guard), `Fresh-install schema must preserve workflow rule: ${guard}`);
}
assert.equal((schema.match(/before insert or update or delete on public\./g) || []).length, 6, "Fresh-install schema must guard deletes on all six publishable content tables");
for (const table of ["robots", "competitions", "team_members", "research_posts", "gallery_items", "sponsors"]) {
  assert.ok(schema.includes(`on public.${table}\nfor each row execute function public.enforce_content_publish_workflow();`), `Fresh-install schema must guard ${table}`);
}
assert.ok(publishGuardMigration.includes("to_jsonb(new) - 'updated_at' - 'updated_by' - 'publish_status'"), "Publishing state transitions must be evaluated separately from edits to published content");
for (const table of ["robots", "competitions", "team_members", "research_posts", "gallery_items", "sponsors"]) {
  assert.ok(publishGuardMigration.includes(`on public.${table}\nfor each row execute function public.enforce_content_publish_workflow();`), `Database publishing guard must cover ${table}`);
}


const provenanceMigration = await read("supabase/migrations/20261009_content_provenance.sql");
for (const table of ["team_members", "research_posts", "gallery_items", "sponsors"]) {
  const migrationDefinition = provenanceMigration.match(new RegExp("alter table public\\." + table + "([\\s\\S]*?);"));
  assert.ok(migrationDefinition, `Content provenance migration must update ${table}`);
  assert.match(migrationDefinition[1], /add column if not exists created_by uuid references public\.profiles\(id\)/, `Upgrade migration must add creator provenance for ${table}`);
  assert.match(migrationDefinition[1], /add column if not exists updated_by uuid references public\.profiles\(id\)/, `Upgrade migration must add updater provenance for ${table}`);
  const definition = schema.match(new RegExp("create table public\\." + table + " \\(([\\s\\S]*?)\\n\\);"));
  assert.ok(definition, `Fresh schema must define ${table}`);
  assert.match(definition[1], /created_by uuid references public\.profiles\(id\)/, `Fresh schema must define creator provenance for ${table}`);
  assert.match(definition[1], /updated_by uuid references public\.profiles\(id\)/, `Fresh schema must define updater provenance for ${table}`);
  const columns = [...definition[1].matchAll(/^\s*([a-z_]+)\s+/gm)].map((match) => match[1]);
  assert.equal(new Set(columns).size, columns.length, `Fresh schema must not duplicate columns in ${table}`);
}
for (const table of ["robots", "competitions", "team_members", "research_posts", "gallery_items", "sponsors"]) {
  const definition = schema.match(new RegExp("create table public\\." + table + " \\(([\\s\\S]*?)\\n\\);"));
  assert.ok(definition, `Fresh schema must define provenance table ${table}`);
  assert.match(definition[1], /created_by uuid references public\.profiles\(id\)/, `Fresh schema must include creator provenance for ${table}`);
  assert.match(definition[1], /updated_by uuid references public\.profiles\(id\)/, `Fresh schema must include updater provenance for ${table}`);
  const columns = [...definition[1].matchAll(/^\s*([a-z_]+)\s+/gm)].map((match) => match[1]);
  assert.equal(new Set(columns).size, columns.length, `Fresh schema must not duplicate columns in ${table}`);
}
assert.match(adminExtended, /created_by: profile\.id, updated_by: profile\.id/, "Extended content creation must record creator and updater");
assert.match(adminOperations, /created_by: profile\.id, updated_by: profile\.id/, "Team member creation must record creator and updater");

assert.match(adminAuth, /export async function requireAdminSession\([\s\S]*?auth\.getUser\(\)/, "Admin routes and actions must validate the current auth session");
assert.match(adminAuth, /if \(!user\.email_confirmed_at\)[\s\S]*?auth\.signOut\(\)/, "Unverified admin accounts must be signed out");
assert.match(adminAuth, /if \(!profile \|\| !privilegedRoles\.includes\(profile\.role as UserRole\)\)/, "Admin access must require an allowlisted profile role");
assert.match(adminAuth, /export function requireAnyRole\(roles: UserRole\[], actual: UserRole\)[\s\S]*?if \(!roles\.includes\(actual\)\)/, "Role-restricted admin actions must reject roles outside their allowlist");
assert.match(adminContent, /target === "published" && from === "review" && \["team_lead", "super_admin"\]\.includes\(profile\.role\)/, "Robots and competitions must require leadership approval to publish");
assert.match(adminContent, /target === "archived" && from !== "archived" && \["team_lead", "super_admin"\]\.includes\(profile\.role\)/, "Robots and competitions must restrict archive transitions to leadership");
assert.match(adminExtended, /target === "published" && current === "review" && \["super_admin", "team_lead"\]\.includes\(profile\.role\)/, "Research, gallery, and sponsor publishing must require leadership approval");
assert.match(adminExtended, /target === "archived" && current !== "archived" && \["super_admin", "team_lead"\]\.includes\(profile\.role\)/, "Research, gallery, and sponsor archiving must require leadership approval");
assert.match(adminOperations, /if \(target === "published"\) requireAnyRole\(\["super_admin", "team_lead"\]/, "Team member publishing must require leadership approval");
assert.match(adminOperations, /export async function archiveTeamMember\(formData: FormData\)[\s\S]*?requireAnyRole\(\["super_admin", "team_lead"\], profile\.role\)/, "Team member archiving must match the database leadership-only policy");
const teamPage = await read("app/admin/team/page.tsx");
assert.match(teamPage, /member\.publish_status !== "archived" && \(profile\.role === "team_lead" \|\| profile\.role === "super_admin"\) \? <button formAction=\{archiveTeamMember\}/, "Team archive button must only be shown to roles permitted by the server action and database guard");
const [robotsAdminPage, competitionsAdminPage, researchAdminPage, galleryAdminPage, sponsorsAdminPage] = await Promise.all([
  read("app/admin/robots/page.tsx"),
  read("app/admin/competitions/page.tsx"),
  read("app/admin/research/page.tsx"),
  read("app/admin/gallery/page.tsx"),
  read("app/admin/sponsors/page.tsx"),
]);
assert.match(robotsAdminPage, /robot\.publish_status !== "archived" && \(profile\.role === "team_lead" \|\| profile\.role === "super_admin"\) \? <button formAction=\{archiveRobot\}/, "Robot archive UI must match leadership-only server/database policy");
assert.match(competitionsAdminPage, /item\.publish_status !== "archived" && \(profile\.role === "team_lead" \|\| profile\.role === "super_admin"\) \? <button formAction=\{archiveCompetition\}/, "Competition archive UI must match leadership-only server/database policy");
assert.match(researchAdminPage, /item\.publish_status !== "archived" && \(profile\.role === "team_lead" \|\| profile\.role === "super_admin"\) \? <form action=\{transitionContent\}/, "Research archive UI must match leadership-only server/database policy");
assert.match(galleryAdminPage, /x\.publish_status!=="archived"&&\(profile\.role==="team_lead"\|\|profile\.role==="super_admin"\)&&<form action=\{transitionContent\}/, "Gallery archive UI must match leadership-only server/database policy");
assert.match(sponsorsAdminPage, /x\.publish_status!=="archived"&&<form action=\{transitionContent\}/, "Sponsor archive UI must remain on the leadership-only admin page");
assert.match(adminOperations, /if \(target === "review" && current\.publish_status !== "draft"\)/, "Team member review transition must only accept drafts");
assert.match(adminOperations, /if \(target === "published" && current\.publish_status !== "review"\)/, "Team member publishing must only accept reviewed records");
assert.match(publicData, /url\.protocol === "https:"/, "Public profile links and media must reject non-HTTPS URLs");
assert.ok(publicData.includes('hostname === "youtu.be" || hostname === "www.youtu.be"') && publicData.includes('hostname === "youtube.com" || hostname === "www.youtube.com"'), "Public YouTube embeds must use an allowlisted host");
assert.match(publicData, /A-Za-z0-9_-\]\{11\}/, "Public YouTube embeds must validate the video ID format");

assert.match(adminAuth, /const allowedDomain = process\.env\.ADMIN_EMAIL_DOMAIN/, "Admin email-domain restriction must remain configurable");
assert.match(adminAuth, /user\.email\.toLowerCase\(\)\.endsWith\(/, "Admin email-domain restriction must check a normalized email suffix");
assert.match(adminAuth, /if \(process\.env\.REQUIRE_ADMIN_MFA === "true"\)[\s\S]*?assurance\?\.currentLevel !== "aal2"[\s\S]*?redirect\("\/admin\/mfa"\)/, "Admin MFA enforcement must require aal2 when enabled");
assert.match(adminContent, /if \(current\.publish_status === "published" && !\["team_lead", "super_admin"\]\.includes\(profile\.role\)\)/, "Editing published robot and competition records must require leadership approval");
assert.match(adminExtended, /if \(current\.publish_status === "published" && !\["team_lead", "super_admin"\]\.includes\(profile\.role\)\)/, "Editing published research and gallery records must require leadership approval");
assert.match(adminOperations, /if \(current\.publish_status === "published" && !\["team_lead", "super_admin"\]\.includes\(profile\.role\)\)/, "Editing published team records must require leadership approval");
assert.match(publicSubmissions, /Public submission rate-limit check failed[\s\S]*?return false/, "Rate limiting must fail closed if the database check fails");
assert.match(publicSubmissions, /if \(!secret \|\| secret\.length < 32\)[\s\S]*?return null/, "Public submissions must fail closed without a sufficiently strong fingerprint secret");

assert.match(adminAuth, /user\.email\.toLowerCase\(\)\.endsWith\(`@\$\{allowedDomain\}`\)/, "Admin email-domain restriction must match the complete domain suffix");
assert.match(adminExtended, /function safeYouTube\([\s\S]*?new URL\(/, "Gallery YouTube links must be parsed as URLs before use");
assert.ok(adminExtended.includes('host==="youtu.be"||host==="www.youtu.be"') && adminExtended.includes('host==="youtube.com"||host==="www.youtube.com"'), "Gallery YouTube embeds must use an allowlisted host");
assert.ok(adminExtended.includes("A-Za-z0-9_-]{11}"), "Gallery YouTube embeds must validate the video ID format");
assert.match(adminExtended, /export async function transitionContent\([\s\S]*?const paths: Record<string, string> = \{[\s\S]*?research_posts:[\s\S]*?gallery_items:[\s\S]*?sponsors:/, "Generic publishing transitions must use an allowlisted content table");
assert.match(adminExtended, /target === "published" && current === "review" && \["super_admin", "team_lead"\]\.includes\(profile\.role\)/, "Extended content can only be published from review by leadership");
assert.match(adminExtended, /target === "archived" && current !== "archived" && \["super_admin", "team_lead"\]\.includes\(profile\.role\)/, "Extended content archiving must be restricted to leadership");
assert.match(adminExtended, /if \(current\.publish_status === "archived"\) go\("\/admin\/gallery", "archived"\)/, "Archived gallery items must not be edited");
assert.match(adminExtended, /if \(current\.publish_status === "archived"\) go\("\/admin\/sponsors", "archived"\)/, "Archived sponsors must not be edited");
assert.match(adminOperations, /if \(current\.publish_status === "archived"\) redirect\("\/admin\/team\?error=archived"\)/, "Archived team records must not be edited");

const siteHeader = await read("components/site-header.tsx");
assert.match(siteHeader, /aria-label="Primary navigation"/, "Desktop navigation must have an accessible name");
assert.match(siteHeader, /aria-label="Mobile navigation"/, "Mobile navigation must have an accessible name");
assert.match(siteHeader, /aria-label="Open site navigation menu"/, "Mobile menu trigger must have a descriptive accessible name");
assert.match(siteHeader, /max-h-\[min\(75vh,36rem\)\] overflow-y-auto/, "Mobile navigation must remain scrollable on short screens");
assert.match(siteHeader, /focus-visible:outline-2/, "Navigation controls must have visible keyboard focus styling");
assert.match(siteHeader, /xl:hidden/, "Compact navigation must remain available below the desktop breakpoint");

const [competitionArchive, competitionPage] = await Promise.all([
  read("components/competition-archive.tsx"),
  read("app/competitions/page.tsx"),
]);
assert.match(competitionPage, /<CompetitionArchive records=\{competitions\} \/>/, "Competition page must render the interactive archive from public records");
assert.match(competitionArchive, /record\.competition, record\.organizer, record\.location, record\.robot, record\.segment, record\.result, String\(record\.year\), record\.date, record\.report, \.\.\.record\.teamMembers/, "Competition search must cover event details, outcomes, dates, reports, and team members");
assert.match(competitionArchive, /record\.level === level/, "Competition archive must filter by national/international level");
assert.match(competitionArchive, /String\(record\.year\) === year/, "Competition archive must filter by event year");
assert.match(competitionArchive, /record\.result === result/, "Competition archive must filter by result");
assert.match(competitionArchive, /record\.segment === segment/, "Competition archive must filter by competition segment");
assert.match(competitionArchive, /aria-live="polite"/, "Filtered record count must be announced accessibly");
assert.match(competitionArchive, /No records match these filters/, "Empty filtered results must provide a useful recovery state");

const achievementPage = await read("app/achievements/page.tsx");
assert.match(achievementPage, /competitions\.filter\(\(item\) => item\.result !== "Participation"\)/, "Achievements must exclude participation-only results");
assert.match(achievementPage, /<CompetitionArchive records=\{achievements\} achievementsOnly \/>/, "Achievements must reuse the searchable, filterable archive in award-only mode");
assert.match(competitionArchive, /!achievementsOnly \|\| item !== "Participation"/, "Achievement result filters must not offer participation as an award");

const robotDetail = await read("app/robots/[slug]/page.tsx");
assert.match(robotDetail, /required = \["Drive \/ locomotion", "Motors", "Battery \/ power", "Controller \/ MCU", "Sensors", "Control type", "Speed", "Runtime", "Safety"\]/, "Robot detail must define the core public specification checklist");
assert.match(robotDetail, /core fields documented/, "Robot detail must expose a specification coverage count");
assert.match(robotDetail, /Only published values are shown; missing values are not inferred\./, "Robot detail must not imply missing specifications are verified");
assert.match(robotDetail, /Publication checklist:/, "Robot detail must explain how specification completeness is assessed");


const [siteFooter, homePage, sitemapSource, robotsSource] = await Promise.all([
  read("components/site-footer.tsx"),
  read("app/page.tsx"),
  read("app/sitemap.ts"),
  read("app/robots.ts"),
]);
assert.match(siteFooter, /nav aria-label="Explore Team Stellar"/, "Footer explore links must be exposed as a named navigation landmark");
assert.match(siteFooter, /nav aria-label="Connect with Team Stellar"/, "Footer contact links must be exposed as a named navigation landmark");
for (const route of ["/about", "/robots", "/competitions", "/achievements", "/team", "/research", "/gallery", "/sponsors", "/join-us", "/contact"]) {
  assert.ok(siteFooter.includes(`href="${route}"`), `Footer must link to the public route ${route}`);
  assert.ok(sitemapSource.includes(`path: "${route}"`), `Sitemap must include the public route ${route}`);
}
assert.match(homePage, /focus-visible:outline-2/, "Homepage calls to action must have visible keyboard focus styling");
assert.match(robotsSource, /disallow: \["\/admin", "\/api"\]/, "Crawler guidance must discourage indexing admin and API routes");


const auditIntegrityMigration = await read("supabase/migrations/20261009_audit_log_integrity.sql");
const dataIntegrityMigration = await read("supabase/migrations/20261008_data_integrity_hardening.sql");
assert.ok(auditIntegrityMigration.includes("actor_id = (select auth.uid())"), "Audit-log inserts must be attributed to the authenticated actor");
assert.ok(auditIntegrityMigration.includes("create or replace function public.prevent_audit_log_mutation()"), "Audit-log mutation guard function must exist");
assert.ok(auditIntegrityMigration.includes("before update or delete on public.audit_logs"), "Audit logs must reject both updates and deletes");
assert.ok(auditIntegrityMigration.includes("Audit logs are append-only"), "Audit-log mutation guard must fail explicitly");
assert.ok(auditIntegrityMigration.includes("revoke all on function public.prevent_audit_log_mutation() from public, anon, authenticated"), "Audit-log guard function must not be directly executable by client roles");
assert.ok(schema.includes("actor_id = (select auth.uid())"), "Fresh-install audit inserts must bind actor_id to auth.uid()");
assert.ok(schema.includes("create or replace function public.prevent_audit_log_mutation()"), "Fresh-install schema must include the append-only audit guard");
assert.ok(schema.includes("before update or delete on public.audit_logs"), "Fresh-install schema must guard audit-log updates and deletes");
for (const [label, source] of [
  ["data-integrity migration", dataIntegrityMigration],
  ["fresh-install schema", schema],
]) {
  assert.match(source, /create or replace function public\\.set_updated_at\\(\\)[\\s\\S]*?set search_path = ''/, `${label} updated-at trigger must use an empty search_path`);
  assert.match(source, /revoke all on function public\\.set_updated_at\\(\\) from public, anon, authenticated/, `${label} updated-at trigger must not be directly executable by client roles`);
}
for (const constraint of [
  "robots_weight_nonnegative", "robots_year_reasonable", "robots_slug_format",
  "competitions_year_reasonable", "competitions_slug_format", "team_members_slug_format",
  "team_members_photo_https", "research_posts_slug_format", "gallery_source_https",
  "gallery_thumbnail_https", "gallery_youtube_host", "sponsors_logo_https",
  "sponsors_website_https", "contact_status_valid", "robot_media_source_https",
  "competition_evidence_https",
]) {
  assert.ok(dataIntegrityMigration.includes(constraint), `Upgrade migration must enforce ${constraint}`);
  assert.ok(schema.includes(constraint), `Fresh-install schema must enforce ${constraint}`);
}
for (const [label, source] of [
  ["upgrade migration", auditIntegrityMigration],
  ["fresh-install schema", schema],
]) {
  assert.match(source, /create policy admin_audit_insert[\s\S]*?on public\.audit_logs[\s\S]*?for insert[\s\S]*?to authenticated[\s\S]*?with check \([\s\S]*?private\.has_any_role\(array\['super_admin','team_lead','technical_lead','media','hr_operations'\]::public\.user_role\[\]\)[\s\S]*?actor_id = \(select auth\.uid\(\)\)/, `${label} must restrict audit inserts to approved roles and bind actor_id to auth.uid()`);
  assert.match(source, /create or replace function public\.prevent_audit_log_mutation\(\)[\s\S]*?language plpgsql[\s\S]*?set search_path = ''/, `${label} audit guard must use an empty search_path`);
  assert.match(source, /revoke all on function public\.prevent_audit_log_mutation\(\) from public, anon, authenticated/, `${label} audit guard must not be directly executable by client roles`);
  assert.equal((source.match(/before update or delete on public\.audit_logs/g) || []).length, 1, `${label} must install exactly one append-only audit trigger`);
}


// SEO and public-indexing contracts: crawler rules are not access control, and
// the sitemap must be assembled exclusively from public-facing routes/data.
assert.match(robotsSource, /allow: "\/"/, "Public pages must remain crawlable");
assert.match(robotsSource, /disallow: \["\/admin", "\/api"\]/, "Admin and API routes must remain excluded from crawler guidance");
assert.match(sitemapSource, /if \(!base\) return \[\]/, "Sitemap generation must fail closed when the canonical site URL is missing");
assert.match(sitemapSource, /getPublicRobots\(\)[\s\S]*getPublicCompetitions\(\)[\s\S]*getPublicResearch\(\)/, "Dynamic sitemap entries must use public data accessors");
assert.doesNotMatch(sitemapSource, /\/admin|recruitment_applications|contact_messages|audit_logs|profiles/, "Sitemap must never enumerate private admin or operational records");
assert.match(sitemapSource, /encodeURIComponent\(item\.slug\)/, "Dynamic public detail slugs must be URL-encoded");
assert.match(sitemapSource, /url\.protocol === "https:" \|\| url\.hostname === "localhost"/, "Canonical site URL must reject insecure non-local HTTP URLs");
assert.match(siteHeader, /aria-label="Primary navigation"/, "Primary navigation landmark must remain accessible");
assert.match(siteHeader, /aria-label="Mobile navigation"/, "Mobile navigation landmark must remain accessible");



// Public SEO metadata contracts: each indexable route must have a route-specific
// title/description, and detail metadata must come from the same public-safe accessors.
const metadataPages = await Promise.all([
  read("app/about/page.tsx"),
  read("app/robots/page.tsx"),
  read("app/competitions/page.tsx"),
  read("app/achievements/page.tsx"),
  read("app/team/page.tsx"),
  read("app/research/page.tsx"),
  read("app/gallery/page.tsx"),
  read("app/sponsors/page.tsx"),
  read("app/join-us/page.tsx"),
  read("app/contact/page.tsx"),
]);
for (const [index, page] of metadataPages.entries()) {
  assert.match(page, /export const metadata: Metadata = \{[\s\S]*?title: "[^"]+"[\s\S]*?description: "[^"]+"/, `Public route metadata must define a title and description (page index ${index})`);
}
const [robotDetailMetadata, competitionDetailMetadata, researchDetailMetadata, rootLayout] = await Promise.all([
  read("app/robots/[slug]/page.tsx"),
  read("app/competitions/[slug]/page.tsx"),
  read("app/research/[slug]/page.tsx"),
  read("app/layout.tsx"),
]);
assert.match(robotDetailMetadata, /generateMetadata[\s\S]*getPublicRobot\(slug\)[\s\S]*title: robot\.name/, "Robot detail metadata must use its published public record");
assert.match(competitionDetailMetadata, /generateMetadata[\s\S]*getPublicCompetition\(slug\)[\s\S]*title: record\.competition/, "Competition detail metadata must use its published public record");
assert.match(researchDetailMetadata, /generateMetadata[\s\S]*getPublicResearchPost\(slug\)[\s\S]*title: post\.title/, "Research detail metadata must use its published public record");
assert.match(rootLayout, /title: \{ default: "[^"]+", template: "%s \| Team Stellar" \}/, "Root metadata must preserve a consistent title template");



// Phase 2 database-enforced workflow and privilege contracts. The migration and
// fresh-install schema must protect the same public content tables.
const [publishWorkflowMigration, rateLimitMigration, freshSchema, adminContentActions, adminExtendedActions, adminOperationsActions] = await Promise.all([
  read("supabase/migrations/20261009_database_publish_workflow_guard.sql"),
  read("supabase/migrations/20261008_public_form_security.sql"),
  read("supabase/schema.sql"),
  read("app/actions/admin-content.ts"),
  read("app/actions/admin-extended.ts"),
  read("app/actions/admin-operations.ts"),
]);
const guardedContentTables = ["robots", "competitions", "team_members", "research_posts", "gallery_items", "sponsors"];
for (const table of guardedContentTables) {
  assert.match(publishWorkflowMigration, new RegExp(`create trigger ${table}_publish_workflow_guard before insert or update or delete on public\\.${table}`), `Upgrade migration must guard ${table} publish workflow`);
  assert.match(freshSchema, new RegExp(`create trigger ${table}_publish_workflow_guard before insert or update or delete on public\\.${table}`), `Fresh-install schema must guard ${table} publish workflow`);
}
const teamMembersDefinition = freshSchema.match(/create table public\.team_members \(([\s\S]*?)\n\);/);
assert.ok(teamMembersDefinition, "Fresh-install schema must define the team_members table");
const teamMemberColumns = [...teamMembersDefinition[1].matchAll(/^\s*([a-z_]+)\s+/gm)].map((match) => match[1]);
assert.equal(new Set(teamMemberColumns).size, teamMemberColumns.length, "Fresh-install team_members schema must not declare duplicate columns");
for (const source of [publishWorkflowMigration, freshSchema]) {
  assert.match(source, /new\.publish_status = 'published'[\s\S]*old\.publish_status <> 'review' or not is_leader/, "Database must restrict publication to leadership and reviewed records");
  assert.match(source, /old\.publish_status = 'published'[\s\S]*new\.publish_status <> 'published'[\s\S]*not is_leader/, "Unpublishing must be leadership-controlled");
  assert.match(source, /old\.publish_status = 'archived'[\s\S]*Archived content is immutable/, "Archived content must be immutable");
}
assert.match(rateLimitMigration, /alter table public\.public_submission_rate_limits enable row level security/, "Submission rate-limit storage must have RLS enabled");
assert.match(rateLimitMigration, /revoke all on table public\.public_submission_rate_limits from public, anon, authenticated/, "Submission rate-limit storage must not be accessible to client roles");
assert.match(rateLimitMigration, /grant execute on function public\.check_public_submission_rate_limit\(text, integer, integer\) to service_role/, "Only the trusted service role should call the rate-limit function");
assert.match(rateLimitMigration, /create table if not exists public\.public_submission_rate_limits[\s\S]*?request_count integer not null default 0 check \(request_count >= 0\)/, "Rate-limit migration must constrain request counts to non-negative values");
assert.match(rateLimitMigration, /create or replace function public\.check_public_submission_rate_limit\([\s\S]*?security definer\s+set search_path = ''/, "Rate-limit migration RPC must use a hardened security-definer context");
assert.match(rateLimitMigration, /revoke all on function public\.check_public_submission_rate_limit\(text, integer, integer\) from public, anon, authenticated/, "Rate-limit migration must revoke RPC access from client roles");
assert.match(schema, /create table public\.public_submission_rate_limits[\s\S]*?request_count integer not null default 0 check \(request_count >= 0\)/, "Fresh schema must constrain request counts to non-negative values");
assert.match(adminContentActions, /requireRole\("technical_lead", profile\.role\)/, "Robot and competition creation must require the technical-lead role");
assert.match(adminContentActions, /created_by: profile\.id, updated_by: profile\.id/, "Robot and competition creation must stamp creator and updater provenance");
assert.match(adminExtendedActions, /requireAnyRole\(\["super_admin", "team_lead", "technical_lead", "media"\], profile\.role\)/, "Research creation must enforce server-side role authorization");
assert.match(adminOperationsActions, /requireAnyRole\(\["super_admin", "team_lead", "hr_operations"\], profile\.role\)/, "Team and recruitment operations must enforce server-side role authorization");

console.log("Contract checks passed: recruitment statuses/deadlines and competition archive filters, server-side validation, honeypots, rate limits, service-role boundaries, RLS, and public robot projection.");
