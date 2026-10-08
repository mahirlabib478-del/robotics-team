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
5. Keep the service-role key server-only.
