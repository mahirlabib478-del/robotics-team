-- Align recruitment application status values across the form, server actions and database.
-- Drop/recreate so this migration safely upgrades databases with the older status check.
alter table public.recruitment_applications
  drop constraint if exists recruitment_status_valid;

alter table public.recruitment_applications
  add constraint recruitment_status_valid
  check (status in ('Submitted','Screening','Shortlisted','Interview','Selected','Rejected','Withdrawn'));
