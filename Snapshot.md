# Project Snapshot — NITER Clearance Portal

**Last updated:** 2026-08-23 · **Overall progress: ~48%**

Baseline: the full student flow works end-to-end (register → apply → per-office sections → document upload → notifications → public verification). Staff can approve/reject with remarks, bulk approve, escalation fires at 3 rejections, every decision is audit-logged. All roles get email notifications. Profile page live. Certificate page with PDF download + dynamic QR code + A4 scaling. **UCAM pink→blue gradient identity** — matching the visual language of the UCAM ERP login. Playfair Display + Inter typography. White headings on dark gradient banners. All WCAG contrast ≥4.5:1 AA. No registrar role anywhere — admin throughout. Admin panel built (S1–S5): user management, workflow config, batch reports, notices, audit log viewer.

**What's left:** Moinul at 8/12 (M1 + M2 + M3 + SP1 + SP2 + SP3 + SP4 + SP5 done). Fatin at 3/10 (F1 + F2 + F4 done). Shafin at 5/11 (S1 + S2 + S3 + S4 + S5 done).

## Status board

Legend: ✅ Done · 🚧 In progress · ⬜ Not started

### Foundation (done before division)

| Task                            | Owner   | Status  | Notes                                           |
| ------------------------------- | ------- | ------- | ----------------------------------------------- |
| Project scaffold                | Lovable | ✅ Done | TanStack Start, React 19, Tailwind 4, shadcn/ui |
| Database schema                 | Lovable | ✅ Done | All tables + RLS in `supabase/migrations/`      |
| DB automation triggers          | Lovable | ✅ Done | Fan-out reviews, auto-certificate, auto-notify  |
| Auth pages (sign-in / register) | Lovable | ✅ Done | NITER ID → email mapping                        |
| Apply form + student dashboard  | Lovable | ✅ Done | Progress %, per-office cards, remarks shown     |
| Section pages + doc upload      | Lovable | ✅ Done | Client validation, signed URLs, delete          |
| Notifications page (in-app)     | Lovable | ✅ Done | List + mark all read                            |
| Public pages (home/about/FAQ)   | Lovable | ✅ Done |                                                 |
| Certificate verify pages        | Lovable | ✅ Done | `/verify` + `/verify/$code`                     |

### Current sprint

| #   | Task                            | Owner  | Status         | Notes                                         |
| --- | ------------------------------- | ------ | -------------- | --------------------------------------------- |
| M1 | Staff queue `/queue` | Moinul | ✅ Done | Merged, deployed, E2E verified — staff approve/reject with remarks, student sees green card + notification |
| M2 | Escalation logic migration | Moinul | ✅ Done | E2E verified — auto-escalates at 3 rejections, notifies Head + admins via bell icon |
| M3 | Audit trail writes | Moinul | ✅ Done | E2E verified — every approve/reject logged to audit_log with actor + remark |
| M4 | Security: admin route guard | Moinul | ⬜ Not started | `beforeLoad` role check on `/admin` layout route; redirect non-admins to / |
| M5 | Security: status-forgery patch | Moinul | ⬜ Not started | BEFORE UPDATE trigger rejects `status`/`cleared_at` changes by non-admins on `clearance_applications` and `documents` |
| M6 | Security: admin honesty pass | Moinul | ⬜ Not started | Replace 5 non-functional admin pages with "Coming soon" stubs |
| M7 | Security: head-ordering trigger | Moinul | ⬜ Not started | DB trigger blocks Department Head approval until other 7 offices approved |
| F1  | Certificate page `/certificate` | Fatin  | ✅ Done | Merged via PR #18; conditional link on dashboard (enabled when 8/8 approved) |
| F2  | PDF download + QR code          | Fatin  | ✅ Done | PR #26: jspdf + qrcode, dynamic QR, A4 scaling, signature image |
| F3  | Forgot password flow            | Fatin  | ⬜ Not started | `resetPasswordForEmail` + reset form          |
| F4  | Profile page (read-only)        | Fatin  | ✅ Done | Merged via PR #11; layout fixed by Moinul (PortalShell + back button + nav link) |
| F5  | Student timeline/history        | Fatin  | ⬜ Not started | Every past rejection/resubmission/approval in order |
| F6  | Printable certificate view      | Fatin  | ⬜ Not started | Print-friendly route/CSS for physical copy       |
| F7  | Deadline lock screen            | Fatin  | ⬜ Not started | Block new submissions after batch deadline       |
| F8  | Confirmation dialogs (student)  | Fatin  | ⬜ Not started | Confirm before deleting uploaded documents       |
| F9  | Global error states             | Fatin  | ⬜ Not started | Network drop / upload fail / session expiry      |
| F10 | Registrar queue                 | Fatin  | ⬜ Not started | "Ready for final processing" — cleared students  |
| S1  | Admin: user management          | Shafin | ✅ Done | PR #27: `admin/users.tsx` — roles + staff department assignment |
| S2  | Admin: workflow config          | Shafin | ✅ Done | PR #27: `admin/workflow.tsx` — departments per program, batch deadlines |
| S3  | Admin: batch reports            | Shafin | ✅ Done | PR #27: `admin/reports.tsx` — `recharts` charts |
| S4  | Admin: notices management       | Shafin | ⚠️ Broken | PR #27 code queries `notices` table that doesn't exist — rebuild tracked as S11 |
| S5  | Admin: audit log viewer         | Shafin | ⚠️ Broken | PR #27: queries wrong columns (`timestamp`/`actor`/`remarks` don't exist in `audit_log`; real: `created_at`/`actor_name`/`details`) |
| S6  | Override staff decision         | Shafin | ⬜ Not started | Admin overturn + mandatory audit_log entry       |
| S7  | Department config UI            | Shafin | ⬜ Not started | Enable/disable offices per program, no code edit |
| S8  | Queue search/filter/pagination  | Shafin | ⬜ Not started | Scale to 300+ students (inside `queue.tsx`)      |
| S9  | Rejection history panel (staff) | Shafin | ⬜ Not started | Past rejections/remarks per student in queue     |
| S10 | Bulk approve summary modal      | Shafin | ⬜ Not started | "X approved, Y skipped (reason)" feedback        |
| S11 | Notices rebuild (S4 fix)        | Shafin | ⬜ Not started | Create `notices` table migration + RLS (admin INSERT, public SELECT) + wire home page to DB |

### Infrastructure (done by Moinul alongside the sprint)

| Task | Owner  | Status  | Notes                                                                    |
| ---- | ------ | ------- | ------------------------------------------------------------------------ |
| I1   | Own Supabase project | Moinul | ✅ Done | Old DB lived in inaccessible Lovable Cloud → new free project `jmpavfglhtmcraxfiock`, all migrations + fixes in `consolidated_setup.sql`, `.env` repointed |
| I2   | Deployed to Vercel | Moinul | ✅ Done | **https://niterclearanceportal.vercel.app/** · preset *Other* + env `NITRO_PRESET=vercel`; auto-redeploys every push to `main` |
| I3   | NITER branding | Moinul | ✅ Done | Favicon replaced, then full brand refresh applied |
| I4   | Brand design system | Moinul | ✅ Done | UCAM pink→blue gradient (#fbc1ff→#4e65ff), Playfair Display + Inter, crest logo, dark navy footer, PageHeader banners, 12px cards. PRs #17, #22, #23, #24 |
| I5   | Route tree guard | Moinul | ✅ Done | GitHub Action auto-warns when routeTree.gen.ts committed in PRs. Posts fix commands, auto-deletes when resolved. PR #19 |

### Stretch / deferred

| Task                        | Owner  | Status         | Notes                                                                                 |
| --------------------------- | ------ | -------------- | ------------------------------------------------------------------------------------- |
| Bulk approve in queue       | Moinul | ✅ Done    | Checkboxes + Select all + bottom action bar (PR #9) |
| Email notifications         | Moinul | ✅ Done    | Edge Function + Resend + Database Webhook live; triggers for admin/staff/student; settings page for email entry |
| Bangla/English toggle       | Moinul | ✅ Done    | i18n infrastructure + toggle in header (PR #10) |
| Notification pipeline       | Moinul | ✅ Done    | 3 triggers: admin on submission, staff on review creation, student on approve/reject. All fire emails via Resend. |
| Profile page fix            | Moinul | ✅ Done    | Wrapped in PortalShell, back button role-aware, user code links to /profile |

### Deferred findings (not assigned — go-live-time decisions)

| Finding | Priority | Notes |
|---------|----------|-------|
| Test data purge | Medium | Gibberish thesis titles still in DB before go-live |
| Password policy hardening | Medium | Client minLength 8 only; no forced change on provisioned staff accounts |
| Certificate revocation | Medium | No process exists to revoke issued certificates |
| Escalation resolution screen | Medium | Escalation sends notification but has no UI to resolve/reassign |
| Formal mobile/WCAG audit | Low | AA contrast pass done (PR #23), responsive layouts exist; no comprehensive audit |
| **User action items:** Resend custom domain verification + PDPA legal counsel review (Supabase has no Bangladesh region — confirm compliance with institution before go-live) | — | Non-code decisions |

## Work history

### 2026-08-23

- **Certificate page `/certificate` (F1):** completed via PR #18.
- **PDF download + QR code (F2):** completed via PR #26.
- **Admin: user management (S1):** completed via PR #27.
- **Admin: workflow config (S2):** completed via PR #27.
- **Admin: batch reports (S3):** completed via PR #27.
- **Admin: notices management (S4):** completed via PR #27.
- **Admin: audit log viewer (S5):** completed via PR #27.

### 2026-08-22

- **Staff queue `/queue` (M1):** completed via PR #9.
- **Escalation logic migration (M2):** completed via PR #9.
- **Audit trail writes (M3):** completed via PR #9.
- **Profile page (read-only) (F4):** completed via PR #11.
- **Bulk approve in queue (SP1):** completed via PR #9.
- **Email notifications (SP2):** completed via PR #10.
- **Notification pipeline (SP3):** completed via PR #10.
- **Settings page (SP4):** completed via PR #10.
- **Profile page fix (SP5):** completed via PR #10.

## Remaining summary

- **Backlog: 33 tasks · 16 done · 17 remaining.** Moinul 8/12. Fatin 3/10. Shafin 5/11.
- **Moinul's work: 8/12 done** — remaining: M4, M5, M6, M7. Next: Security: admin route guard.
- **Fatin's work: 3/10 done** — remaining: F3, F5, F6, F7, F8, F9, F10. Next: Forgot password flow.
- **Shafin's work: 5/11 done** — remaining: S6, S7, S8, S9, S10, S11. Next: Override staff decision.
- **Order of attack:** Moinul → Security: admin route guard; Fatin → Forgot password flow; Shafin → Override staff decision.
- **Definition of done for v1:** student applies → staff approves/rejects with remarks → escalation works → admin route guard active → no status-forgery path → Head ordering enforced at DB level → certificate PDF downloads with scannable QR → admin manages users, overrides decisions (audited), reads batch reports, and manages notices that appear on the public home page.
## How to update this file

When you finish or start a task: change its Status cell, add a dated bullet under Work history, then commit both this file and your code together.
