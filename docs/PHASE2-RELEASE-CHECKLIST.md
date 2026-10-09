# Phase 2 Release Verification Checklist

This checklist defines the release checks for the dynamic-management phase. Repository CI validates source-level contracts and the production build; it does **not** prove that a live Supabase project has applied the migrations or that its deployed policies behave correctly.

## 1. Automated repository checks

Run from the repository root:

```sh
npm install --no-audit --no-fund
npm run lint
npm run verify:contracts
node scripts/verify-robot-archive.mjs
npm run build
```

All commands must pass on the exact commit proposed for release.

## 2. Database migration checks in staging

Use a disposable or staging Supabase project, never production, for the first pass.

- [ ] Take and verify a recoverable backup/snapshot before upgrading an existing environment.
- [ ] Apply pending migrations in timestamp/name order using the project's normal migration runner.
- [ ] Confirm the recruitment status constraint accepts exactly the statuses used by the admin action and rejects an unknown status.
- [ ] Confirm the six publishable content tables have the publishing-workflow trigger: `robots`, `competitions`, `team_members`, `research_posts`, `gallery_items`, and `sponsors`.
- [ ] Confirm the rate-limit table has RLS enabled, no direct client-role access, and the rate-limit function is executable only by `service_role`.
- [ ] Confirm audit logs reject updates and deletes, and inserts bind the actor to the authenticated user.
- [ ] Confirm creator/updater provenance columns exist once per relevant table.

## 3. Authorization and workflow smoke tests

Use test accounts representing a viewer, a non-lead privileged role, a team lead, and a super admin. Do not use real applicants or production content.

- [ ] An unauthenticated or viewer account cannot call privileged admin actions successfully.
- [ ] A non-leader cannot publish reviewed content, unpublish published content, or archive content.
- [ ] A leader can publish only content that has passed through review.
- [ ] Published-content edits require leadership and return the record to draft for another review.
- [ ] Review, published, and archived records cannot be deleted directly; archived records cannot be reopened or edited.
- [ ] Anonymous recruitment/contact submissions go through server actions, honor deadlines and rate limits, and cannot directly insert into private tables.
- [ ] A rate-limit backend error fails closed for public submissions.
- [ ] Public pages and sitemap expose only published, public-safe projections; private engineering fields and operational records remain absent.

## 4. Fresh-install and upgrade parity

- [ ] Validate `supabase/schema.sql` against a new disposable database.
- [ ] Separately validate the migration path against a database created from the previous released schema with representative test records.
- [ ] Compare trigger, constraint, RLS, grant, and provenance behavior between both paths.
- [ ] Record the tested commit SHA, migration versions, test-account roles, and results in the release record.

## Release decision

Do not mark Phase 2 database verification complete until both fresh-install and upgrade-path checks have been performed against a real staging database. Static contract checks and CI build success are necessary gates, but are not substitutes for this staging validation.
