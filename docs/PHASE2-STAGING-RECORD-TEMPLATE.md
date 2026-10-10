# Phase 2 Staging Verification Record

Copy this file into the release record for each staging verification attempt. Do not mark a check as passed without recording observed results.

## Build identity

- Tested commit SHA: REPLACE_WITH_FULL_SHA
- Staging environment/project reference (never include secrets): REPLACE_WITH_NON_SECRET_IDENTIFIER
- Verification date/time (UTC): YYYY-MM-DD HH:MM UTC
- Verifier: TEAM_MEMBER_OR_ROLE
- Migration versions applied: LIST_MIGRATION_FILENAMES

## Preflight and migration checks

- [ ] supabase/preflight_data_integrity.sql was run before applying constraints.
- Returned invalid rows: COUNT
- Remediation performed and independently reviewed: DETAILS_OR_NONE
- [ ] Upgrade migration path completed successfully.
- [ ] Fresh-install schema was applied successfully to a disposable database.
- [ ] supabase/verify_staging_security.sql was run after migrations.
- Verification output attached or recorded: LINK_OR_LOCATION
- Failed checks and remediation: DETAILS_OR_NONE

## Role-based smoke tests

Use disposable test accounts only. Record role and observed outcome without recording credentials or personal applicant data.

| Test | Role / context | Expected result | Observed result |
|---|---|---|---|
| Public visitor reads only published public content | Anonymous | No drafts or internal records returned | PENDING |
| Direct write to recruitment/contact tables | Anonymous | Rejected | PENDING |
| Read private profiles and audit logs | Viewer | Denied | PENDING |
| Edit or publish content | Technical lead | Cannot publish without leadership approval | PENDING |
| Publish reviewed content | Team lead / super admin | Allowed | PENDING |
| Change published content | Non-leader | Rejected | PENDING |
| Change published content | Team lead / super admin | Returns record to draft for review | PENDING |
| Reopen or mutate archived content | Any normal admin role | Rejected | PENDING |
| Submit public form with rate-limit backend failure | Anonymous | Fails closed | PENDING |
| Read engineering files from unauthorized account | Unauthorized user | Denied | PENDING |

## Release decision

- [ ] All automated CI checks passed for the tested SHA.
- [ ] Fresh-install and upgrade-path checks both passed.
- [ ] Database catalog verification passed.
- [ ] Role-based smoke tests passed.
- [ ] Any failed checks have documented remediation and a successful retest.
- [ ] Security reviewer approved the record.

**Decision:** NOT VERIFIED / APPROVED / BLOCKED

Do not select APPROVED while any required check is pending or failed. CI success alone is not proof of staging or production database verification.
