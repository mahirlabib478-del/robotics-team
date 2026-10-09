# Team Stellar

Professional public website and future engineering platform for the BRAC University Robotics Team.

## Stack

- Next.js + TypeScript
- Tailwind CSS
- Framer Motion (controlled animation)
- Supabase/PostgreSQL-ready architecture
- Vercel-ready deployment

## Project documentation

- [Roadmap and phase release gates](ROADMAP.md)
- [Development and release workflow](docs/DEVELOPMENT.md)
- [Security and privacy boundaries](docs/SECURITY.md)

## Product phases

1. Public portfolio: Home, About, Robots, Competitions, Achievements, Team, Research, Gallery, Sponsors, Join Us, Contact.
2. Management: secure CMS/admin, robot and competition databases, recruitment and member management.
3. Internal engineering portal: projects, BOM, documents, version tracking, testing logs and competition readiness.

## Data policy

Only verified Team Stellar information should be published as fact. Sensitive CAD, source code, circuit diagrams, BOM/costs, credentials and competition strategy belong in the private portal, not the public website.


## Production deployment checklist

### Vercel
Set these server/client environment variables in the production project:
- `NEXT_PUBLIC_SITE_URL` — canonical HTTPS site URL.
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable key.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only; never expose to client code.
- `PUBLIC_FORM_RATE_LIMIT_SECRET` — random server-only secret, at least 32 characters.
- `ADMIN_EMAIL_DOMAIN` — recommended university domain restriction.
- `REQUIRE_ADMIN_MFA=true` — recommended for production after every admin account has a verified TOTP factor.

### Supabase
1. Apply the base schema to a new environment, or apply versioned migrations to an existing environment.
2. Do not grant public/anonymous INSERT access to recruitment applications or contact messages.
3. Keep Storage buckets private for internal engineering files; public media should use only intentionally published assets.
4. Enable MFA for every privileged admin account before enabling the application MFA gate.
5. Keep service-role credentials only in server-side environments.
6. Test RLS with anonymous, viewer, media, HR, technical lead, team lead, and super admin identities before launch.

### Publishing workflow
Public content follows Draft → Review → Published. Archive is terminal until an explicit administrative restore workflow is introduced.

### Verified-content rule
The repository intentionally contains no fabricated robot, competition, achievement, member, or sponsor records. Add only evidence-backed Team Stellar data before launch.
