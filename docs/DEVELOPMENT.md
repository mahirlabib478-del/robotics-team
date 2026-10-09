# Development and Release Workflow

## Before changing code

1. Read `ROADMAP.md` and identify the phase and release gate the change belongs to.
2. Inspect the existing page, server action, data accessor, type and migration before introducing a parallel implementation.
3. Keep public portfolio data separate from internal engineering operations.
4. Never add real credentials, private keys, service-role secrets, recruitment submissions or private engineering files to Git.

## Local verification

Run the same checks used by CI before opening a pull request:

```bash
npm ci
npm run lint
npm run verify:contracts
npm run build
```

The build may require the same non-secret public configuration expected by the deployment environment. Do not paste production secrets into CI logs or issue comments.

## Database changes

- Add schema changes as ordered SQL migrations in `supabase/migrations/`.
- Keep `supabase/schema.sql` aligned with migrations for fresh installs.
- Add contract checks for security-sensitive behavior and workflow invariants.
- Test both a fresh database and an upgrade from the previous migration state.
- Verify RLS through direct database/API requests as anonymous and authenticated users; UI hiding is not an authorization control.
- Never grant anonymous direct writes to contact or recruitment tables as a shortcut around server actions and rate limiting.

## Content workflow

Public content must be evidence-backed and pass the database-enforced Draft → Review → Published process. Only authorized team leadership may publish reviewed content. Edits to published content must return to draft for review. Archived records are immutable.

## Pull request checklist

- [ ] Change maps to a roadmap item.
- [ ] No unverified awards, statistics, robot specifications or partner claims were added.
- [ ] Public queries select only fields intended for publication.
- [ ] Role checks exist in server actions as well as page rendering.
- [ ] Input validation, error states and accessible labels/focus states are covered.
- [ ] Relevant contract/regression tests were added or updated.
- [ ] Lint, contract checks and production build pass.
- [ ] Required migrations and deployment configuration are documented.
- [ ] No secrets, personal application data or private engineering artifacts are included.
