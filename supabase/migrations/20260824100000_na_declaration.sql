-- N/A self-declaration: students may declare a department not applicable to them
-- (e.g., never stayed in hostel, never borrowed library books) during application.
-- Those reviews are auto-approved with is_na = true so the certificate trigger counts them,
-- while admins retain visibility via the N/A declarations table.

ALTER TABLE public.department_reviews
ADD COLUMN IF NOT EXISTS is_na boolean NOT NULL DEFAULT false;
