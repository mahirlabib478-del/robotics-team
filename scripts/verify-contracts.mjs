import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [operations, recruitmentPage, schema, statusMigration, publicData, adminClient] = await Promise.all([
  read("app/actions/admin-operations.ts"),
  read("app/admin/recruitment/page.tsx"),
  read("supabase/schema.sql"),
  read("supabase/migrations/20261009_recruitment_status_alignment.sql"),
  read("lib/public-data.ts"),
  read("lib/supabase/admin.ts"),
]);

function quotedValues(source, expression, label) {
  const match = source.match(expression);
  assert.ok(match, `Could not locate ${label}`);
  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]).sort();
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

console.log("Contract checks passed: recruitment statuses, service-role boundary, and public robot projection.");
