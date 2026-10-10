# Private Engineering Portal — Data and Access Design

**Status:** Design proposal only. This document does not create tables, grant access, or prove production security. Do not enable Phase 3 modules until the design is reviewed and tested against a clean staging Supabase project.

## Security boundary

The existing `profiles.role` and server-side `requireAdmin()` flow are the starting point, not a substitute for database authorization. The portal must enforce access at both the server route/action boundary and PostgreSQL RLS. Hiding a link or checking a role only in React is not authorization.

- Require an authenticated, email-confirmed university account; configure `ADMIN_EMAIL_DOMAIN` to the approved domain in the deployment environment.
- Require AAL2 for privileged access when `REQUIRE_ADMIN_MFA=true`; verify enrollment, recovery, and session behavior before turning that production gate on.
- Deny by default. A missing profile, unknown role, missing project membership, or unexpected query error must not grant access.
- Never expose the Supabase service-role key to a browser, client bundle, public API, or private document.
- Keep engineering files in a private storage bucket. Issue short-lived signed URLs only after checking authorization server-side; do not persist public URLs for private files.
- Keep private tables and files out of public queries, sitemap, metadata, analytics payloads, logs, and error messages.

## Proposed data model (not yet migrated)

Use UUID primary keys, `created_at` / `updated_at` timestamps, foreign keys, and indexes on ownership, membership, status, and parent IDs. Final column types and constraints must be reviewed against actual workflows before a migration is written.

| Entity | Purpose | Important controls |
| --- | --- | --- |
| `engineering_projects` | Project name, summary, division, status, owner and dates | Read only to project members and explicitly authorized leads; no public projection |
| `engineering_project_members` | Project-to-user membership and scoped capability | Unique (project, user); only authorized leads/admins manage membership; users cannot self-enroll |
| `engineering_tasks` | Task title, description, owner, priority, due date and status | Every task belongs to a project; access requires project permission; status changes are validated |
| `engineering_task_events` | Append-only task history | Server/database-generated actor and timestamp; users cannot rewrite or delete history |
| `engineering_documents` | Private document metadata, storage object key, project, version and archive state | Store object key, not public URL; every read/download checks project permission |
| `engineering_document_versions` | Immutable version records and file checksums | New version appends a row; never overwrite historical evidence silently |
| `engineering_parts` | BOM item, quantity, supplier reference, cost and purchase state | Cost and procurement fields limited to authorized technical/operations roles |
| `engineering_test_runs` | Robot/version, timestamp, test type, outcome, operator and notes | Append-only test evidence; corrections are additional events, not silent rewrites |
| `engineering_readiness_items` | Competition readiness checklist and evidence references | Scoped to project/competition; changes have actor/time history |

Do not put secrets, passwords, access tokens, private keys, or raw credentials into these records. Detailed CAD, firmware, circuits, weapon geometry, strategy, and cost data remain private unless explicitly approved for release.

## Capability model

Capabilities are scoped to the resource, not simply inherited from a role name. Existing application roles are `super_admin`, `team_lead`, `technical_lead`, `media`, `hr_operations`, and `viewer`; membership is an additional constraint for project data.

| Capability | Super Admin | Team Lead | Technical Lead | HR/Operations | Media | Viewer |
| --- | --- | --- | --- | --- | --- | --- |
| Manage portal access / project membership | Yes | Approved scope | No by default | No | No | No |
| Create projects and assign leads | Yes | Yes | Request/assigned scope | No | No | No |
| Manage engineering tasks | Yes | Assigned projects | Assigned projects | No | No | No |
| Read/edit engineering documents | Yes | Assigned projects | Assigned projects | Only explicitly granted operational docs | No by default | No by default |
| Read/edit BOM and procurement | Yes | Approved scope | Technical scope | Procurement scope | No | No |
| Append test runs/readiness evidence | Yes | Read/coordinate | Assigned projects | No | No | No |
| Read audit history | Yes | Assigned projects | Assigned projects | Own authorized scope | No | No |

This is a conservative starting matrix, not a grant to implement blindly. Confirm named owners and responsibilities with the team before finalizing. Media and HR must not inherit technical permissions merely because they are trusted team roles. Viewer must not imply access to private engineering records without explicit membership and approval.

## RLS and storage policy requirements

1. Enable RLS on every new table and ensure there is no permissive catch-all policy.
2. Use a reviewed, narrowly scoped helper for project membership checks; avoid recursive policy definitions and avoid trusting user-editable metadata for privileged roles.
3. Check both action and row scope for SELECT, INSERT, UPDATE and DELETE. Prefer no DELETE for audit, document-version, and test-history tables.
4. Validate role changes and project membership changes through trusted server-side paths. Do not let a user elevate their own profile role or add themselves to a project.
5. Apply private storage policies that join the object path to an authorized project/document record. Test list, read, upload, replace, move, and delete operations independently.
6. Treat signed URLs as bearer credentials: short expiry, never logged, and generated only after an authorization check.
7. Ensure error messages do not reveal whether an inaccessible project or document exists.
8. Keep public CMS policies separate; do not widen existing public content policies to make the engineering portal work.

## Required staging test matrix

Run these tests with distinct real staging identities and direct API calls, not only through the UI. Record the tested commit SHA and outcome.

- Anonymous and unconfirmed account: every portal route, server action, table, and storage operation denied.
- Confirmed account with no profile or an unknown role: denied.
- Viewer without project membership: cannot enumerate, read, mutate, or download private project data.
- Media and HR identities: cannot read technical tasks, detailed BOM/cost, CAD, firmware, or test records unless an explicitly approved scoped grant exists.
- Technical Lead: can operate only on assigned projects; cannot manage their own role or grant themselves membership.
- Team Lead: can manage only approved scope; cannot bypass RLS via direct REST calls.
- Super Admin: privileged access works with MFA at AAL2 when configured; denied at insufficient assurance.
- Cross-project ID substitution: replacing UUIDs in URLs, requests, filters, storage keys, and mutation payloads never crosses project scope.
- Storage: unauthorized list/read/upload/overwrite/move/delete attempts fail; expired signed URL no longer works.
- History: task/document/test events cannot be silently altered or deleted by ordinary roles.
- Regression: public routes, sitemap, robots, and anonymous CMS reads do not disclose private engineering metadata.

## Rollout sequence

1. Review this design with the team and confirm the role/capability matrix.
2. Inspect current migrations and schema on a clean staging database; resolve naming and FK choices before implementation.
3. Add a versioned migration for tables, constraints, indexes, RLS policies, and private storage policies. Include safe rollback notes where possible.
4. Add automated schema/policy checks and role-based direct-API tests; run lint and production build.
5. Apply migrations to staging, seed test identities, run the full matrix, and retain evidence tied to the tested commit.
6. Only then implement one module at a time (tasks, documents, BOM, test/readiness) behind role gates.
7. Keep each module marked **disabled** until its own end-to-end authorization and storage tests pass.

## Acceptance criteria

- No private engineering table, row, metadata field, or storage object is reachable by anonymous/public users.
- Access requires both an allowed capability and the correct resource scope.
- Unauthorized direct API access fails even if the UI is bypassed.
- Historical test and audit evidence cannot be silently overwritten.
- Public portfolio/CMS behavior remains unchanged.
- CI passing is necessary but does not replace staging identity, RLS, MFA, storage, backup/restore, and operational verification.
