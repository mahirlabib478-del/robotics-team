# Supabase Staging Bootstrap — Phase 2

This runbook is for the first **staging** setup. It does not mean that a Supabase project already exists, and it is not evidence that production security has been verified.

## 0. Before starting

- Create a separate Supabase project for staging at https://supabase.com/.
- Use a strong database password and store it in a password manager.
- Do not use production applicant data or real private engineering files during testing.
- Never commit credentials, paste secret keys into chat/issues, or include them in screenshots.
- Keep the Supabase service-role key and `PUBLIC_FORM_RATE_LIMIT_SECRET` server-only.

## 1. Initialize a new, empty staging project

For a genuinely empty project, use the current complete schema snapshot:

1. Open the staging project's **SQL Editor**.
2. Review `supabase/schema.sql` from the exact commit you intend to test.
3. Run that snapshot against the empty staging database.
4. Save the tested commit SHA and the execution result in a staging verification record.

**Do not run every file in `supabase/migrations/` on top of this current schema snapshot.** The snapshot already contains the current schema state; replaying upgrade migrations over it is not the clean-install procedure.

## 2. Configure application environment variables

Use the repository's `.env.example` as the variable-name reference. Configure values in the local ignored `.env.local` or the deployment provider's environment settings:

- `NEXT_PUBLIC_SUPABASE_URL`: staging project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: staging publishable key.
- `SUPABASE_SERVICE_ROLE_KEY`: staging service-role secret; server-side only.
- `PUBLIC_FORM_RATE_LIMIT_SECRET`: independently generated random secret of at least 32 characters.
- `NEXT_PUBLIC_SITE_URL`: the correct local or staging HTTPS site URL.
- `ADMIN_EMAIL_DOMAIN`: optional approved university domain restriction.
- `REQUIRE_ADMIN_MFA`: leave disabled until all intended admin accounts have enrolled MFA and recovery has been tested.

Never prefix a secret with `NEXT_PUBLIC_`. Never place the service-role key in client components, browser bundles, source control, or public CI output.

## 3. Verify the fresh install

Against staging, using the same commit as the record:

1. Run `supabase/verify_staging_security.sql` and retain its PASS/FAIL output.
2. Confirm no check failed; investigate failures rather than waiving them.
3. Create disposable accounts for the roles used in `docs/PHASE2-RELEASE-CHECKLIST.md`.
4. Exercise both allowed and denied operations through the app and direct API/database requests.
5. Verify anonymous form submissions are rate-limited and fail closed if the rate-limit RPC or secret is unavailable.
6. Complete `docs/PHASE2-STAGING-RECORD-TEMPLATE.md`; leave the decision **BLOCKED / NOT VERIFIED** while any required check is pending.

The security SQL is a catalog/configuration check, not a replacement for role-based smoke tests or pgTAP tests.

## 4. Test upgrades separately

Upgrade testing is different from a fresh install:

- Start from a disposable database that represents the previous released schema, with synthetic test data.
- Run `supabase/preflight_data_integrity.sql` **before** adding data-integrity constraints; review and remediate every returned row.
- Apply only migrations not yet applied, in filename/timestamp order, using the project's controlled migration process.
- Re-run the security verification and role-based tests.
- Compare the result with the fresh-install schema path.

Do not test an upgrade by blindly applying old migrations to a database already initialized from the latest `schema.sql`. If no prior schema snapshot/database is available, record the upgrade path as **not yet tested** rather than marking it passed.

## 5. Required release gate

Phase 2 is not production-ready until all are true:

- Fresh-install schema path verified.
- Upgrade path verified against a real previous schema state.
- RLS and grants tested with anonymous and each required role.
- Admin MFA enrollment and recovery tested before enabling the MFA gate.
- Upload/storage permissions verified independently.
- Backup/restore and public-form abuse/error handling tested.
- Tested commit SHA, migration versions, evidence, and remediation recorded.

Creating the Supabase account/project is a human dashboard step. Repository code and CI cannot create that account or prove that a live database has been configured correctly.
