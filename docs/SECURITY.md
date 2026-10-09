# Security and Privacy Boundaries

This document records implementation expectations; it is not a substitute for a staging security review.

## Trust boundaries

### Public website
Only records explicitly marked both `published` and `public` may be exposed through public data accessors. Select explicit columns and maintain a public-safe projection. Never serialize private engineering JSON, internal member data, application records or audit logs into public responses.

### Public forms
Recruitment and contact forms must submit through validated server actions. Keep rate limiting enabled and fail closed when the rate-limit secret or database function is unavailable. The rate-limit secret must be a server-only environment variable with at least 32 characters; never use a `NEXT_PUBLIC_*` prefix.

### Admin and CMS
Authenticate users server-side, require confirmed email, apply role checks on every mutation, and enforce the review/publish/archive rules in the database as well as application code. A crawler disallow rule is not access control. Admin MFA should only be enforced after the intended accounts have enrolled and recovery has been tested.

### Engineering portal (Phase 3)
Engineering projects, source code, CAD, firmware, circuit diagrams, detailed BOM/costs, test logs and competition strategy are private by default. Use private storage and explicit access policies. Do not rely on obscure URLs, hidden UI controls or public bucket paths for confidentiality.

## Required staging checks

- [ ] Anonymous users cannot read drafts, private records, recruitment applications, contact messages, profiles or audit logs.
- [ ] Anonymous users cannot insert directly into recruitment/contact tables.
- [ ] A viewer cannot mutate records.
- [ ] Media and HR roles cannot inherit technical-lead capabilities accidentally.
- [ ] Technical leads cannot publish content without leadership approval.
- [ ] Published edits return to draft; archived content cannot be reopened or mutated.
- [ ] Audit events cannot be edited or deleted by ordinary application roles.
- [ ] Private storage denies unauthorized downloads and uploads.
- [ ] Rate limiting survives missing configuration by rejecting submissions.
- [ ] Backup restoration and account recovery have been exercised.
- [ ] No service-role key or other secret appears in client bundles, logs or repository history.

Report and fix any failed security check before enabling production workflows.
