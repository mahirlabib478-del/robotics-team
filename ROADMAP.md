# Team Stellar Website Roadmap

This roadmap follows the agreed three-phase plan. Keep public portfolio work, content management, and private engineering operations separate.

## Phase 1 — Public portfolio

**Status: Core route structure implemented; production readiness depends on verified content and deployment checks.**

- [x] Home page and shared navigation/footer
- [x] About, robots, competitions, achievements, team, research, gallery, sponsors, join-us and contact routes
- [x] Public content reads only published, public-visible records
- [x] Robot and competition archive filters
- [x] Evidence-aware competition records and public-safe robot projection
- [ ] Add approved real robot photos, specifications and demo videos
- [ ] Add evidence-backed competition results, certificates and official source links
- [ ] Add approved member/alumni profiles and sponsor records
- [ ] Complete accessibility, responsive, metadata and production smoke tests

**Release gate:** Do not publish placeholder statistics, unverified awards, invented robot specifications, or unconfirmed competition targets.

## Phase 2 — Dynamic management

**Status: Core admin/CMS flows are present; validate in a real Supabase staging project before launch.**

- [x] Role-aware admin dashboard and authentication
- [x] Robot and competition record management
- [x] Draft → Review → Published content workflow
- [x] Research, gallery, sponsor, team, recruitment and contact management routes/actions
- [x] Public submission rate limiting and server-side validation
- [x] Database-level publishing workflow guards and audit attribution
- [ ] Apply all versioned migrations to a clean staging database
- [ ] Test row-level security with anonymous, viewer, media, HR, technical lead, team lead and super-admin identities
- [ ] Verify admin MFA enrollment and recovery before enforcing the production MFA gate
- [ ] Exercise every role's allowed and denied actions
- [ ] Test backup/restore, upload permissions, form abuse limits and error handling

**Release gate:** Never enable production publishing or anonymous form writes by bypassing the approved server actions and database policies.

## Phase 3 — Private engineering portal

**Status: Planned; do not treat the public portfolio or CMS as the engineering portal.**

Implement in this order:

1. **Private access boundary**
   - Require confirmed university accounts and role checks on every page and server action.
   - Keep private records out of public queries, metadata, sitemap, logs and client bundles.
   - Use private storage for internal files; do not expose service-role credentials.
2. **Project/task board**
   - Projects, task owners, division, priority, due date and status.
   - Track task changes and restrict updates by role.
3. **Engineering document repository**
   - Private document metadata and access-controlled file storage.
   - Support version history and archive; never store secrets in documents or source control.
4. **BOM and procurement**
   - Parts, quantities, supplier references, costs and purchasing status.
   - Access limited to authorized operations/technical roles.
5. **Testing logs and competition readiness**
   - Timestamped test runs, robot/version association, issue tracking and readiness checklist.
   - Preserve historical records rather than silently overwriting test outcomes.
6. **Release and security verification**
   - Add migration/RLS tests for each new table and storage bucket.
   - Verify unauthorized users cannot read or mutate records, including through direct API calls.

## Working rules

- Make small, reviewable commits that correspond to one roadmap item.
- Prefer versioned Supabase migrations over manual production schema edits.
- Add automated contract/security checks with every workflow or schema change.
- Use only verified Team Stellar information in public-facing copy.
- Keep sensitive CAD, firmware, source code, circuit diagrams, detailed BOM/costs and competition strategy private unless the team explicitly approves a public-safe summary.
- Update this file when a feature is implemented and tested; distinguish implemented from verified-in-staging.
