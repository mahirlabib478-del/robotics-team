import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [migration, schema, page, actions, overview, stagingSecurity] = await Promise.all([
  read("supabase/migrations/20261010_engineering_project_task_board.sql"),
  read("supabase/schema.sql"),
  read("app/engineering/projects/page.tsx"),
  read("app/actions/engineering.ts"),
  read("app/engineering/page.tsx"),
  read("supabase/verify_staging_security.sql"),
]);

for (const table of ["engineering_projects", "engineering_project_members", "engineering_tasks", "engineering_task_events"]) {
  assert.match(migration, new RegExp(`create table if not exists public\\.${table}`), `Migration must create ${table}`);
  assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`), `RLS must be enabled for ${table}`);
  assert.match(schema, new RegExp(`create table if not exists public\\.${table}`), `Fresh schema must include ${table}`);
}
assert.match(migration, /security definer[\s\S]*?set search_path = ""/, "Private project access helper must use a hardened search path");
assert.match(migration, /private\.can_access_engineering_project\(project_id, 'editor'\)/, "Task writes must require project editor capability");
assert.match(migration, /private\.can_access_engineering_project\(project_id, 'lead'\)/, "Membership management must require project-lead capability");
assert.match(migration, /user_id <> \(select auth\.uid\(\)\)/, "Project members must not self-enroll or alter their own capability");
assert.match(migration, /after insert on public\.engineering_projects[\s\S]*?private\.add_engineering_project_creator/, "Project creator must receive lead membership atomically");
assert.match(migration, /after insert or update on public\.engineering_tasks[\s\S]*?private\.record_engineering_task_event/, "Task creation and updates must be recorded by a database trigger");
assert.match(migration, /engineering_project_creator_immutable/, "Project creator attribution must be immutable");
assert.match(migration, /engineering_task_identity_immutable/, "Tasks cannot be moved between projects or have creator attribution rewritten");
assert.match(migration, /engineering_membership_identity_immutable/, "Membership identity and added-by attribution must be immutable");
assert.match(stagingSecurity, /Engineering immutable-attribution triggers are enabled/, "Staging checks must verify immutable-attribution triggers");
assert.match(migration, /revoke all on public\.engineering_projects,[\s\S]*?grant select on public\.engineering_task_events to authenticated/, "Task history must be read-only to authenticated clients");
assert.doesNotMatch(migration, /create policy engineering_tasks_delete/, "Tasks must not be silently deleted; preserve task history");
assert.match(page, /requireAdmin\(\)/, "Project board must require a confirmed authenticated session");
assert.match(page, /robots: \{ index: false, follow: false, noarchive: true \}/, "Project board must not be indexed");
assert.match(page, /Project permissions could not be verified/, "Project board must fail closed when membership/task queries fail");
assert.match(page, /addEngineeringProjectMember/, "Project leads must be able to grant explicit membership to existing accounts");
assert.match(page, /createSupabaseAdminClient\(\)[\s\S]*?select\("id,display_name"\)\.in\("id", assigneeIds\)/, "Service-role profile lookup must be limited to IDs of tasks already visible through RLS");
assert.match(actions, /assignee-not-member/, "Task assignment must reject users who are not project members");
assert.match(actions, /assignee_id: assigneeId/, "Task records must persist the validated project-member assignment");
assert.match(migration, /assignee_id is null or exists \([\s\S]*?m\.project_id = engineering_tasks\.project_id and m\.user_id = engineering_tasks\.assignee_id/, "Database policy must prevent assigning tasks to non-members");
assert.match(page, /No projects assigned yet/, "Users without membership must see an empty state, not other projects");
assert.match(actions, /requireAnyRole\(\["super_admin", "team_lead"\], profile\.role\)/, "Only approved leads can create projects and manage memberships");
assert.match(actions, /export async function createEngineeringTask/, "Authorized project members must be able to create tasks");
assert.match(actions, /export async function updateEngineeringTaskStatus/, "Authorized project members must be able to update task status");
assert.match(actions, /\.eq\("id", taskId\)\.select\("id"\)\.maybeSingle\(\)/, "Task status updates must confirm a row was changed before reporting success");
assert.match(actions, /\["backlog", "todo", "in_progress", "blocked", "done"\]/, "Task status updates must use an explicit allowlist");
assert.match(overview, /href: "\/engineering\/projects"/, "Engineering overview must link to the project/task module");
assert.match(stagingSecurity, /Engineering RLS enabled: /, "Staging verification must check RLS on the private engineering tables");
assert.match(stagingSecurity, /Engineering task history denies direct client writes/, "Staging verification must test task-history grants");
assert.match(stagingSecurity, /Engineering membership policy prevents self-enrollment/, "Staging verification must check project membership policy");
assert.match(page, /assigneeIds[\s\S]*?createSupabaseAdminClient\(\)[\s\S]*?in\("id", assigneeIds\)/, "Private profile names may only be resolved for task assignees already returned by RLS");
console.log("Engineering project/task board access-boundary checks passed.");
