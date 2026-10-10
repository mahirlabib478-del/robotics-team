# Team Stellar Website Roadmap

This roadmap follows the agreed three-phase plan. Keep public portfolio work, content management, and private engineering operations separate. The full requirement checklist below is intentionally comprehensive: do not silently drop an item because it is deferred, depends on verified content, or requires staging credentials.

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

### Homepage and identity requirements
- [ ] Hero banner uses approved robot action photography or team video, clear team identity, concise engineering/competition tagline, and Explore Robots / Achievements / Partner CTAs.
- [ ] Use real footage rather than decorative/random animation; avoid performance-heavy motion.
- [ ] Add quick statistics only after each number is verified (robots built, national awards, international participation, members, years active).
- [ ] Feature the principal robot categories with image, name, category, weight class, control system, status and detail link.
- [ ] Show recent achievements with competition, year, location, category, position, robot and evidence.
- [ ] Show international competition targets only when confirmed; include country, expected date, robot/category and preparation status.
- [ ] Show sponsor/partner logos and partnership CTA; provide a sponsorship proposal download only when an approved document exists.

### Robots and technical archive
- [ ] Categories cover combat (BattleBot, Mini BattleBot, Sumo, Mini Sumo), sports (Soccer Bot, Mini Soccer Bot, Autonomous Soccer Bot), aerial/marine (Drone, Robotic Boat), and research prototypes (AI vision, line follower, rescue robot, robotic arm and future prototypes).
- [ ] Each robot has its own detail page.
- [ ] Robot basic information: official name, category, version, weight, dimensions, status, development year and team members.
- [ ] Technical specification fields: frame material, motor model/RPM, motor driver, battery type/voltage/capacity, microcontroller, communications, weapon mechanism when applicable, sensors, camera/vision, maximum speed, runtime, safety mechanism and manual/semi-autonomous/autonomous control type.
- [ ] Engineering explanation covers problem solved, mechanical design, electronics architecture, control logic, component-selection rationale, limitations and planned improvements.
- [ ] Development media supports photos, CAD renders, internal-component views, testing footage, competition footage and optional 360-degree models.
- [ ] Show the robot's competition history and results.
- [ ] Keep sensitive weapon geometry, custom control code, detailed CAD, firmware and competition strategy private unless explicitly approved for public release.

### Competitions and achievements
- [ ] Structured competition records include official name, organizer, year/date, city/country, national/international level, segment, robot, team members, result, evidence/certificate/official result link and short report.
- [ ] Filters cover national/international, year, robot category, award type, country, and champion/runner-up/participation.
- [ ] Major achievement detail pages explain challenge, preparation, robot used, match/mission result, problems and solutions, award, photos/videos and media coverage.
- [ ] Never publish unverified results or awards.

### Team, research and media
- [ ] Leadership roles: faculty advisor, team lead/captain, technical lead, operations lead and finance/sponsorship lead.
- [ ] Divisions: mechanical design, electronics/embedded, software/AI, control/automation, manufacturing, media/documentation, logistics/competition operations.
- [ ] Member profiles support approved photo, full name, role, department/semester, skills, projects/robots, LinkedIn/GitHub and active tenure.
- [ ] Preserve former members in an Alumni section rather than deleting team history.
- [ ] Research/knowledge supports technical articles, development reports, competition post-mortems, CAD/design summaries, embedded tutorials, AI-vision experiments, papers/posters and workshop materials.
- [ ] Gallery categories: robot development, workshop, testing, national competitions, international competitions, awards, team activities and media coverage.
- [ ] Prefer YouTube embeds for large videos rather than serving large video files directly.

### Sponsors, recruitment and contact
- [ ] Sponsor page covers team impact, past achievements, upcoming international targets, audience/reach, opportunities, benefits, current partners, approved proposal download and direct contact.
- [ ] Support partner types: Title, Platinum, Gold, Technology, Travel, Manufacturing and Media. Keep sponsor amounts private unless deliberately approved for publication.
- [ ] Recruitment fields: name, department, semester, student ID, preferred division, existing skills, prior projects, GitHub/portfolio, weekly availability and motivation.
- [ ] Recruitment status supports Applications Closed, Applications Open, Technical Screening, Interview and Final Selection.
- [ ] Contact page provides validated submission, useful success/error states and a clear team contact path.

**Phase 1 release gate:** Do not publish placeholder statistics, unverified awards, invented robot specifications, or unconfirmed competition targets.

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

### Admin capability checklist
- [ ] Add/edit robot records and update specifications.
- [ ] Create competition records and upload achievement evidence.
- [ ] Add, edit, archive and restore member records according to policy.
- [ ] Manage gallery uploads, upcoming events and sponsor logos.
- [ ] Review recruitment applications and contact messages.
- [ ] Enforce Draft → Review → Publish workflow and record audit attribution.
- [ ] Roles and permissions: Super Admin (all controls); Team Lead (approve/publish); Technical Lead (robot specs); Media Team (news/photos/videos); HR/Operations (members/recruitment); Viewer (read-only internal access).
- [ ] Confirm public and private data are separate; public routes must only expose approved public fields.
- [ ] Use university-email authentication, role-based access and admin MFA. Never put service-role credentials in client code.
- [ ] Use a dedicated secret manager for passwords/API credentials, never the portal or repository.

**Phase 2 release gate:** Never enable production publishing or anonymous form writes by bypassing approved server actions and database policies.

## Phase 3 — Private engineering portal

**Status: Planned; do not treat the public portfolio or CMS as the engineering portal.**

Implement in this order:

1. **Private access boundary**
   - [ ] Require confirmed university accounts and role checks on every page and server action.
   - [ ] Keep private records out of public queries, metadata, sitemap, logs and client bundles.
   - [ ] Use private storage for internal files; do not expose service-role credentials.
2. **Project/task board**
   - [ ] Projects, task owners, division, priority, due date and status.
   - [ ] Track task changes and restrict updates by role.
3. **Engineering document repository**
   - [ ] Private document metadata and access-controlled file storage.
   - [ ] Support version history and archive; never store secrets in documents or source control.
4. **BOM and procurement**
   - [ ] Parts, quantities, supplier references, costs and purchasing status.
   - [ ] Access limited to authorized operations/technical roles.
5. **Testing logs and competition readiness**
   - [ ] Timestamped test runs, robot/version association, issue tracking and readiness checklist.
   - [ ] Preserve historical records rather than silently overwriting test outcomes.
6. **Release and security verification**
   - [ ] Add migration/RLS tests for each new table and storage bucket.
   - [ ] Verify unauthorized users cannot read or mutate records, including through direct API calls.

## Content collection templates

### Every robot
- [ ] Official robot name, category, version, development year and team members.
- [ ] Dimensions, weight, motors, battery, controller, sensors, material and communications.
- [ ] Speed/runtime, unique mechanism, current status, competitions and achievements.
- [ ] Five to ten high-quality photos, one demo video, CAD render and future improvements.

### Every competition
- [ ] Official name, date, organizer, venue/country, category and participating robot.
- [ ] Team members, result, certificate, official result link, photos/videos and short report.

## Visual design direction
- [ ] Dark technology theme with Deep Space Navy #07111F, Stellar Blue #1479FF, Electric Cyan #19D3FF, Metallic Silver #B8C2CC, White #F5F8FC and restrained Accent Orange #FF7A00.
- [ ] Typography: Space Grotesk/Sora headings, Inter body, JetBrains Mono technical numbers.
- [ ] Subtle grid, clean technical diagrams, real robot photography, controlled glow, readable statistics and purposeful minimal animation.
- [ ] Avoid excessive neon, spinning 3D objects and constantly moving backgrounds.
- [ ] Verify mobile, tablet and desktop layouts, keyboard navigation, focus visibility, semantic headings, contrast, alt text, reduced-motion preference, metadata and production smoke paths.

## Technology and deployment requirements
- [ ] Keep the existing Next.js + TypeScript + Tailwind stack unless a documented decision changes it; use Framer Motion sparingly.
- [ ] Backend/CMS may use Next.js + Supabase or a documented CMS option such as Strapi/Sanity; PostgreSQL is the planned database.
- [ ] Use Cloudinary or approved media hosting for public media; YouTube for video embeds; Google Drive only for internal files when access is configured safely.
- [ ] Deployment: Vercel-ready, custom domain chosen after trademark and social-handle availability checks.
- [ ] Production environment uses a canonical HTTPS site URL, Supabase URL/publishable key, server-only service-role key, rate-limit secret, admin-domain restriction where appropriate and MFA gate only after enrollment/recovery is verified.
- [ ] Keep Supabase storage private for internal engineering files; public buckets/assets must be intentionally published.
- [ ] Run clean-install lint, contract checks and production build; retain staging security and role-test evidence tied to the tested commit.

## Working rules

- Make small, reviewable commits that correspond to one roadmap item.
- Prefer versioned Supabase migrations over manual production schema edits.
- Add automated contract/security checks with every workflow or schema change.
- Use only verified Team Stellar information in public-facing copy.
- Keep sensitive CAD, firmware, source code, circuit diagrams, detailed BOM/costs and competition strategy private unless the team explicitly approves a public-safe summary.
- Update this file when a feature is implemented and tested; distinguish implemented from verified-in-staging.
- A checklist item remains incomplete until evidence shows it is done; do not mark content-dependent or staging-dependent tasks complete without the relevant approved content or test record.
