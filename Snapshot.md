<<<<<<< HEAD
# Project Snapshot — NITER Clearance Portal

**Last updated:** 2026-08-23 · **Overall progress: ~69%**

Baseline: the full student flow works end-to-end (register → apply → per-office sections → document upload → notifications → public verification). Staff can approve/reject with remarks, bulk approve, escalation fires at 3 rejections, every decision is audit-logged. All roles get email notifications. Profile page live. Certificate page with PDF download + dynamic QR code + A4 scaling. **UCAM pink→blue gradient identity** — matching the visual language of the UCAM ERP login. Playfair Display + Inter typography. White headings on dark gradient banners. All WCAG contrast ≥4.5:1 AA. No registrar role anywhere — admin throughout. Admin panel built (S1–S5): user management, workflow config, batch reports, notices, audit log viewer.

**What's left:** Moinul at 14/14 (M1 + M2 + M3 + M4 + M5 + M6 + M7 + M8 + M9 + SP1 + SP2 + SP3 + SP4 + SP5 done). Fatin at 5/10 (F1 + F2 + F3 + F4 + F8 done). Shafin at 5/11 (S1 + S2 + S3 + S4 + S5 done).

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
| M4 | Security: admin route guard | Moinul | ✅ Done | `beforeLoad` role check on `/admin` layout route; redirect non-admins to / |
| M5 | Security: status-forgery patch | Moinul | ✅ Done | BEFORE UPDATE trigger rejects `status`/`cleared_at` changes by non-admins on `clearance_applications` and `documents` |
| M6 | Security: admin honesty pass | Moinul | ✅ Done | Replace 5 non-functional admin pages with "Coming soon" stubs |
| M7 | Security: head-ordering trigger | Moinul | ✅ Done | DB trigger blocks Department Head approval until other 7 offices approved |
| F1  | Certificate page `/certificate` | Fatin  | ✅ Done | Merged via PR #18; conditional link on dashboard (enabled when 8/8 approved) |
| F2  | PDF download + QR code          | Fatin  | ✅ Done | PR #26: jspdf + qrcode, dynamic QR, A4 scaling, signature image |
| F3  | Forgot password flow            | Fatin  | ✅ Done | `resetPasswordForEmail` + reset form          |
| F4  | Profile page (read-only)        | Fatin  | ✅ Done | Merged via PR #11; layout fixed by Moinul (PortalShell + back button + nav link) |
| F5  | Student timeline/history        | Fatin  | ⬜ Not started | Every past rejection/resubmission/approval in order |
| F6  | Printable certificate view      | Fatin  | ⬜ Not started | Print-friendly route/CSS for physical copy       |
| F7  | Deadline lock screen            | Fatin  | ⬜ Not started | Block new submissions after batch deadline       |
| F8  | Confirmation dialogs (student)  | Fatin  | ✅ Done | Confirm before deleting uploaded documents       |
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
- **Confirmation dialogs (student) (F8):** completed via PR #31.
- **Forgot password flow (F3):** completed via PR #36.
- **Staff → Registrar full rename (M8):** completed via PR #33.
- **Accounts Queue hard rule (M9):** completed via PR #32.
- **Security: admin route guard (M4):** completed via PR #34.
- **Security: status-forgery patch (M5):** completed via PR #34.
- **Security: admin honesty pass (M6):** completed via PR #34.
- **Security: head-ordering trigger (M7):** completed via PR #34.

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

- **Backlog: 35 tasks · 24 done · 11 remaining.** Moinul 14/14. Fatin 5/10. Shafin 5/11.
- **Moinul's work: 14/14 done** — all complete.
- **Fatin's work: 5/10 done** — remaining: F5, F6, F7, F9, F10. Next: Student timeline/history.
- **Shafin's work: 5/11 done** — remaining: S6, S7, S8, S9, S10, S11. Next: Override staff decision.
- **Order of attack:** Fatin → Student timeline/history; Shafin → Override staff decision.
- **Definition of done for v1:** student applies → staff approves/rejects with remarks → escalation works → admin route guard active → no status-forgery path → Head ordering enforced at DB level → certificate PDF downloads with scannable QR → admin manages users, overrides decisions (audited), reads batch reports, and manages notices that appear on the public home page.
## How to update this file

When you finish or start a task: change its Status cell, add a dated bullet under Work history, then commit both this file and your code together.
=======
# NITER Clearance Portal -- Snapshot & Assignment

> **Last updated:** 2026-08-27 -- **Overall progress: ~72%**
>
> Single source of truth: who owns what, plus current status. Replace Assignment.md (merged here).

---

### Legend

Done -- In progress -- Not started -- Blocked

---

## Team

| Member | Branch | Role |
|--------|--------|------|
| **Moinul** | `main` | Architect & core -- builds the system, now reviewing PRs |
| **Fatin** | `fatin/*` | Certificate pipeline & student-facing features |
| **Shafin** | `shafin/*` | Admin panel & staff queue upgrades |

> **Note:** Teammates are currently inactive. Branches need re-clone + recreation. Remaining tasks are documented here with file paths + implementation guidance for when work resumes.

### Ground Rules

1. **Never push directly to `main`.** Work on your personal branch.
2. **Do not edit files another member owns** -- ask instead.
3. **When done:** tick in this file, update progress + work history, open PR --> Moinul reviews.
4. **Before PR:** `npx tsc --noEmit` + `npx vite build` -- no broken builds.
5. **Stuck 30+ min?** Post in group chat.

---

## Moinul -- Core, Infrastructure, Security, Docs

> **All core tasks complete.** New security + review-feedback items (M13-M15) done 2026-08-27, pending live SQL apply.

### Core approval loop (PR #9)
- **M1** -- Staff queue -- approve/reject with remarks + document preview
- **M2** -- Escalation -- auto-escalates at 3 rejections --> Head + admins
- **M3** -- Audit trail -- every action logged with actor + timestamp

### Security patches (PR #34)
- **M4** -- Admin route guard -- `beforeLoad` role check
- **M5** -- Status-forgery patch -- DB trigger blocks tampering
- **M6** -- Admin honesty pass -- 5 broken pages --> stubs
- **M7** -- Head-ordering trigger -- blocks Head until 7/8 approved

### Identity & infrastructure (PRs #32/#33)
- **M8** -- Staff --> Registrar full rename
- **M9** -- Accounts Queue hard-rule

### Stretch pool (PRs #9/#10)
- **SP1** -- Bulk approve -- checkboxes + action bar
- **SP2** -- Email notifications -- Edge Function + Resend (still forwards to Moinul's Gmail -- deferred)
- **SP3** -- Notification pipeline -- 3 DB triggers
- **SP4** -- Settings page
- **SP5** -- Profile page fix

### New review feedback tasks
- **M10** -- Email data flow: personal email readonly in apply
- **M11** -- N/A remarks encoding: em-dash --> ASCII dash
- **M12** -- Verification workflow: `verify_clearance_status` RPC + `/verify` green/red verdict

### 2026-08-27 -- external review fixes (done/documented)
- **M13** -- Standardize label **"Academic year"** everywhere (was "Batch"/"Session"): dashboard, queue, certificate, verify, profile, reports, workflow, landing notice. Merged into Snapshot work.
- **M14** -- Restrict `audit_log` INSERT RLS to registrar/admin (was any authenticated user). Migration `20260827150000_restrict_audit_log_rls.sql` -- **needs SQL-Editor apply**.
- **M15** -- N/A rollback RPC `reopen_na_review` so a caught false N/A can be reverted to pending. Migration `20260827160000_na_rollback_rpc.sql` -- **needs SQL-Editor apply**.
- **Docs** -- Rewrite `SYSTEM_FLOW.md` (external/authority copy) to fix stale/wrong claims (#audit/notices stubs, guard fixed, admin dashboard real).

---

## Fatin -- Certificate Pipeline & Student Features

> **12/19 done (plus F19) -- 8 remaining**

### Completed
F4 Profile page (PR #11) · F1 Certificate page (PR #18) · F2 PDF + QR (PR #26) · F3 Forgot password (PRs #35/#36) · F6 Printable certificate (PR #29) · F8 Confirmation dialogs (PR #31) · F9 Global error states (PR #41) · F12 Profile cleanup · F15 Icon sizes · F17 Remarks in dashboard · F18 Notification badge · F19 Certificate QR + verify flow

### Remaining
- **F5** -- Student timeline -- every rejection/resubmission/approval in order
  > `src/routes/_authenticated/dashboard.tsx` -- Query `department_reviews` history (attempts, status changes, timestamps) as a vertical timeline under the progress card.
- **F7** -- Deadline lock -- block submissions after batch deadline
  > `src/routes/_authenticated/apply.tsx` -- Read deadline from `app_settings`/`departments`; disable submit + show "Deadline passed".
- **F10** -- Registrar queue -- "Ready for final processing" list
  > `src/routes/_authenticated/dashboard.tsx` -- Card for registrar showing students 8/8 approved but `status != 'cleared'`.
- **F11** -- Dashboard email: show `personal_email` in greeting header
  > `src/routes/_authenticated/dashboard.tsx`.
- **F13** -- Thesis/internship on profile: show collected fields
  > `profile.tsx` + `apply.tsx` (label already updated to "Thesis/Project title or Internship company name").
- **F14** -- Delete countdown popup: 3-second auto-close AlertDialog
  > `src/routes/_authenticated/section.$code.tsx`.
- **F16** -- "Uploaded" text on dashboard when docs submitted
  > `src/routes/_authenticated/dashboard.tsx`.
- **F20** -- **Resubmit comment field** (external review -- fixes the "Re-submit for final approval" loop)
  > `src/routes/_authenticated/section.$code.tsx` + `suppabase/migrations/20260824100500_na_and_reopen_rpcs.sql`
  > Add an optional student comment captured before flipping a rejected/Head review back to pending. Store on `department_reviews` (new `student_comment` column or pass through `reopen_rejected_review`). Surface the comment to the office in the queue card. This gives the student a way to address the office's objection instead of a blind "please look again" ping.

---

## Shafin -- Admin Panel & Queue Upgrades

> **5/11 done -- 9 remaining** (S6-S11 original + 3 new)

### Completed (merged PR #27, stubs via M6)
- **S1** -- Admin: user management -- stub
- **S2** -- Admin: workflow config -- stub
- **S3** -- Admin: batch reports -- hardcoded data
- **S4** -- Admin: notices -- stub (no table)
- **S5** -- Admin: audit log -- stub (wrong columns)

### Remaining (gap fixes)
- **S6** -- Override staff decision -- admin overturn + audit_log
  > `admin/index.tsx`, `queue.tsx` -- "Override" button on admin view; write to `audit_log`.
- **S7** -- Department config UI -- enable/disable offices per program
  > `admin/workflow.tsx`.
- **S8** -- Queue search/filter/pagination -- scale to 300+
  > `queue.tsx` -- search, status tabs, pagination (50/page) via `.range()`.
- **S9** -- Rejection history panel -- past rejections per student
  > `queue.tsx` -- mini-table of past rejections in the detail row.
- **S10** -- Bulk approve summary -- "X approved, Y skipped"
  > `queue.tsx` -- toast with counts after bulk approve.
- **S11** -- Notices rebuild (fixes S4/S5)
  > `admin/notices.tsx`, `index.tsx`, migration -- create `notices` table + CRUD admin page + wire home page.
- **S12** -- **Build the real Admin Audit Log page** (replaces S5 stub; external review)
  > `src/routes/_authenticated/admin/audit.tsx` -- read-only table over `audit_log` (correct columns: `actor_id`, `actor_name`, `action`, `entity`, `entity_id`, `details`, `created_at`). The table + trigger already exist and are populated; only the page is missing. This is the primary accountability record -- highest priority.
- **S13** -- **Wire Admin Reports to live data** (replaces S3 hardcoded)
  > `src/routes/_authenticated/admin/reports.tsx` -- replace the static array with a query over `clearance_applications` grouped by program + status. Currently fake numbers.
- **S14** -- **N/A review + revert UI** (external review; consumes M15 RPC)
  > `src/routes/_authenticated/admin/index.tsx` -- add an action on the N/A declarations table to call `reopen_na_review(review_id)` so admins can revert a caught false declaration back to pending (button appears for rows with a matching open application). Add a review-cadence note so the table is actually checked regularly.

---

## Order of Attack (next up)

| # | Who | Task | Why |
|---|-----|------|-----|
| 1 | Shafin | S12 -- Real audit log page | Accountability record -- highest priority |
| 2 | Fatin | F20 -- Resubmit comment field | Fixes the blind resubmit loop |
| 3 | Shafin | S14 -- N/A revert UI (uses M15) | Act on caught false N/A |
| 4 | Fatin | F16 -- "Uploaded" text | Dashboard clarity |
| 5 | Fatin | F11 -- Dashboard email | Show contact info |
| 6 | Fatin | F14 -- Delete countdown | Safety UX |
| 7 | Fatin | F13 -- Thesis/internship | Show collected data |
| 8 | Fatin | F5 -- Student timeline | Full history view |
| 9 | Fatin | F7 -- Deadline lock | Block late submissions |
| 10 | Fatin | F10 -- Registrar queue | Final processing |
| 11 | Shafin | S11 -- Notices rebuild | Fixes S4/S5 |
| 12 | Shafin | S6 -- Override decision | Admin power |
| 13 | Shafin | S8 -- Queue pagination | Scale to 300+ |
| 14 | Shafin | S9 -- Rejection history | Queue UX |
| 15 | Shafin | S10 -- Bulk summary | Queue UX |
| 16 | Shafin | S7 -- Department config | Workflow settings |
| 17 | Shafin | S13 -- Live reports | Real data |

---

## Definition of Done for v1

Student applies --> staff approves/rejects with remarks --> escalation works --> admin guard active --> no status-forgery --> Head ordering enforced --> certificate PDF with QR --> **verification confirms 8/8 or directs to portal** --> admin manages users + notices + sees real audit log.

---

## Progress

| Member | Done | Remaining | Total |
|--------|------|-----------|-------|
| Moinul | 20 (incl. M13-M15 + docs) | 0 | 20 |
| Fatin | 12 | 8 | 20 |
| Shafin | 5 | 9 | 14 |

---

## Deferred (go-live decisions)

| Finding | Priority | Notes |
|---------|----------|-------|
| Test data purge | Medium | Gibberish data before go-live |
| Password hardening | Medium | Client minLength 8 only |
| Certificate revocation | Medium | No revoke process |
| Escalation resolution | Medium | No resolve/reassign UI |
| Mobile/WCAG audit | Low | AA contrast done, no full audit |
| Resend custom domain | -- | Needs resend.dev sender only for now (personal recipients OK). Edge fn not called from frontend. |
| PDPA compliance | -- | No Bangladesh region in Supabase |

---

## Known Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Edge function hardcoded recipient + never invoked | Medium | `send-notification-email` sends to Moinul's Gmail; not wired from frontend. In-app SQL notifications work. Deferred. |
| Email pipeline not delivering to students | Medium | Needs DB webhook/edge-function wiring. In-app notifications are the working channel. |
| `/verify` "Certificate ID" shows raw UUID | Low | QR encoding is correct; label could be friendlier. Pending decision. |
| `admin/route.tsx` dead layout | Low | Placeholder string instead of `<Outlet />`; admin pages are independent file-routes |
| 27 unused shadcn/ui components | Low | Over half never imported |
| No storage bucket in migrations | Medium | `clearance-docs` only in `consolidated_setup.sql` |
| No seed file | Low | Test users/roles/assignments created manually |

---

## Work History

### 2026-08-27
- M13 -- Standardized "Academic year" label everywhere (was Batch/Session)
- M14 -- audit_log INSERT RLS restricted to registrar/admin (migration written, needs SQL-Editor apply)
- M15 -- `reopen_na_review` N/A rollback RPC (migration written, needs SQL-Editor apply)
- Docs -- consolidated Snapshot+Assignment; flagged external-review gaps; rewrote authority-facing SYSTEM_FLOW facts
- Distributed teammate scope: Fatin F20 (resubmit comment), Shafin S12/S13/S14 (audit page, live reports, N/A revert UI)

### 2026-08-25 (evening)
- Role-aware profile/settings, `idToEmail`, N/A remark + verify migrations, registrar email fix, snapshot rewrite

### Earlier
- See git history / prior snapshots for full log (certificate, admin panel, security patches, core loop).
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
