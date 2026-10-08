# Team Stellar Supabase foundation

The schema separates public portfolio content from internal operations.

## Public
Published rows only:
- Robots and approved media
- Competition records and evidence
- Team member profiles
- Research posts
- Gallery items
- Sponsor profiles

## Internal
RBAC-protected:
- Draft/review content
- Recruitment applications
- Contact messages
- User roles
- Audit logs

## Roles
- super_admin: unrestricted administration
- team_lead: approve/publish and manage core content
- technical_lead: robot/competition/research records
- media: gallery/media/research support
- hr_operations: members and recruitment
- viewer: internal read-only

Before production:
1. Apply the migration in a controlled Supabase environment.
2. Add pgTAP RLS tests for every table.
3. Configure Auth MFA for admin accounts.
4. Configure Storage/Cloudinary permissions separately from database permissions.
5. Set `PUBLIC_FORM_RATE_LIMIT_SECRET` in the production server environment to a random value of at least 32 characters. Never expose it as a `NEXT_PUBLIC_*` variable.
6. Keep the service-role key server-only.
7. Public recruitment/contact submissions use the `check_public_submission_rate_limit` database function and fail closed if the function or secret is unavailable.
8. Keep the Supabase schema in version control and apply schema changes through the controlled migration process; do not manually grant public INSERT access to `recruitment_applications` or `contact_messages`.
