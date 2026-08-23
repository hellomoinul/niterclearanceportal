# Project Snapshot — NITER Clearance Portal

**Last updated:** 23 Aug 2026 · **Overall progress: ~80%** (brand refresh + Fatin progress + CI guard added 23 Aug)

Baseline: the full student flow works end-to-end (register → apply → per-office sections → document upload → notifications → public verification). Staff can approve/reject with remarks, bulk approve, escalation fires at 3 rejections, every decision is audit-logged. All roles get email notifications. Profile page live. **Brand design system applied** — NITER crest logo, navy/teal gradient identity, Playfair Display + Inter typography, PageHeader banners across all routes.

**What's left:** Fatin at 2/10 (F1 + F4 done). Shafin at 0/10 — no admin folder created yet. Moinul completed 8 bug fixes + brand refresh + CI guard. Email delivery workaround active — all notification emails forward to Moinul's Gmail until Resend custom domain is verified.

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
| F1  | Certificate page `/certificate` | Fatin  | ✅ Done | Merged via PR #18; conditional link on dashboard (enabled when 8/8 approved) |
| F2  | PDF download + QR code          | Fatin  | ⬜ Not started | `jspdf` + `qrcode`, QR → `/verify/$code`      |
| F3  | Forgot password flow            | Fatin  | ⬜ Not started | `resetPasswordForEmail` + reset form          |
| F4  | Profile page (read-only)        | Fatin  | ✅ Done | Merged via PR #11; layout fixed by Moinul (PortalShell + back button + nav link) |
| F5  | Student timeline/history        | Fatin  | ⬜ Not started | Every past rejection/resubmission/approval in order |
| F6  | Printable certificate view      | Fatin  | ⬜ Not started | Print-friendly route/CSS for physical copy       |
| F7  | Deadline lock screen            | Fatin  | ⬜ Not started | Block new submissions after batch deadline       |
| F8  | Confirmation dialogs (student)  | Fatin  | ⬜ Not started | Confirm before deleting uploaded documents       |
| F9  | Global error states             | Fatin  | ⬜ Not started | Network drop / upload fail / session expiry      |
| F10 | Registrar queue                 | Fatin  | ⬜ Not started | "Ready for final processing" — cleared students  |
| S1  | Admin: user management          | Shafin | ⬜ Not started | Roles + staff department assignment              |
| S2  | Admin: workflow config          | Shafin | ⬜ Not started | Departments per program, batch deadlines         |
| S3  | Admin: batch reports            | Shafin | ⬜ Not started | `recharts` installed                             |
| S4  | Admin: notices management       | Shafin | ⬜ Not started | Feeds Home page                                  |
| S5  | Admin: audit log viewer         | Shafin | ⬜ Not started | Read-only table                                  |
| S6  | Override staff decision         | Shafin | ⬜ Not started | Admin overturn + mandatory audit_log entry       |
| S7  | Department config UI            | Shafin | ⬜ Not started | Enable/disable offices per program, no code edit |
| S8  | Queue search/filter/pagination  | Shafin | ⬜ Not started | Scale to 300+ students (inside `queue.tsx`)      |
| S9  | Rejection history panel (staff) | Shafin | ⬜ Not started | Past rejections/remarks per student in queue     |
| S10 | Bulk approve summary modal      | Shafin | ⬜ Not started | "X approved, Y skipped (reason)" feedback        |

### Infrastructure (done by Moinul alongside the sprint)

| Task | Owner  | Status  | Notes                                                                    |
| ---- | ------ | ------- | ------------------------------------------------------------------------ |
| I1   | Own Supabase project | Moinul | ✅ Done | Old DB lived in inaccessible Lovable Cloud → new free project `jmpavfglhtmcraxfiock`, all migrations + fixes in `consolidated_setup.sql`, `.env` repointed |
| I2   | Deployed to Vercel | Moinul | ✅ Done | **https://niterclearanceportal.vercel.app/** · preset *Other* + env `NITRO_PRESET=vercel`; auto-redeploys every push to `main` |
| I3   | NITER branding | Moinul | ✅ Done | Favicon replaced, then full brand refresh applied |
| I4   | Brand design system | Moinul | ✅ Done | Navy/teal/mint/gold palette, Playfair Display + Inter, gradient buttons, crest logo, dark footer, PageHeader banners, 12px cards. PR #17 |
| I5   | Route tree guard | Moinul | ✅ Done | GitHub Action auto-warns when routeTree.gen.ts committed in PRs. Posts fix commands, auto-deletes when resolved. PR #19 |

### Stretch / deferred

| Task                        | Owner  | Status         | Notes                                                                                 |
| --------------------------- | ------ | -------------- | ------------------------------------------------------------------------------------- |
| Bulk approve in queue       | Moinul | ✅ Done    | Checkboxes + Select all + bottom action bar (PR #9) |
| Email notifications         | Moinul | ✅ Done    | Edge Function + Resend + Database Webhook live; triggers for admin/staff/student; settings page for email entry |
| Bangla/English toggle       | Moinul | ✅ Done    | i18n infrastructure + toggle in header (PR #10) |
| Notification pipeline       | Moinul | ✅ Done    | 3 triggers: admin on submission, staff on review creation, student on approve/reject. All fire emails via Resend. |
| Profile page fix            | Moinul | ✅ Done    | Wrapped in PortalShell, back button role-aware, user code links to /profile |

## Work history

### 2026-08-22

- Repo cloned locally to `P:\My projects\niterclearanceportal`.
- Plan (`niter_clearance_portal_plan.md`) cross-checked against codebase: ~60% complete.
- Task division agreed among Moinul / Fatin / Shafin (see `Assignment.md`).
- **Kicked Lovable:** replaced its private build-config package with our own `vite.config.ts`,
  switched team to npm, rewrote README/AGENTS docs, enforced LF line endings repo-wide.
  Build also exposed a pre-existing bug (broken imports in `src/lib/portal.ts`) — fixed.
  Verified: lint ✓ · production build ✓ · dev server ✓ · prod server boots ✓
- **Approval loop built (M1–M3):** staff queue page (`/queue`) with pending/rejected tabs,
  document preview and remarks-required rejection; escalation + audit SQL migration ready.
  tsc, eslint and vite build all green. Awaiting merge → then apply migration in Supabase
  dashboard → live testing.
- **Database moved to our own Supabase project:** discovered the old DB lived in Lovable
  Cloud (inaccessible to us). Created free project `jmpavfglhtmcraxfiock`, applied
  `consolidated_setup.sql` (all 5 migrations + creates the missing `clearance-docs`
  bucket + modern `owner_id` storage policies), disabled email confirmation, `.env`
  repointed via PR #3. Live DB verified: 8 departments seeded.
- **Live on Vercel:** https://niterclearanceportal.vercel.app/ — Framework preset *Other*
  + env `NITRO_PRESET=vercel`; every push to `main` auto-redeploys, PRs get preview URLs.
  Favicon swapped for the NITER logo (PR #5).
- **E2E verified (M1–M3):** staff approve/reject → student green card + notification fires;
  escalation at 3 rejections → admin bell icon gets alert; every decision audit-logged.
  Live on Vercel, tested with real accounts.

- **Bug fixes during E2E:** PostgREST embed in queue query returned 400 (profiles linked
  through auth.users, invisible to the API) — split into two queries, merged client-side
  (PR #7). AFTER triggers for notifications + audit_log were missing from the new DB —
  recreated (PR #8).

- **Stretch pool completed (SP1–SP3):** bulk approve in queue (checkboxes + Select all + bottom
  action bar), email notifications via Resend Edge Function + Database Webhook (PR #10 —
  code done, user setup pending), Bangla/English language toggle with i18n infrastructure
  and browser language detection. All lint + build green. PR #10 contains all three.

- **Full notification pipeline built:** admin notified on application submission
  (`trg_notify_admin_on_application`), department staff notified on review creation
  (`trg_notify_staff_on_review`), student notified on approve/reject (existing
  `trg_notify_review_change`). All notifications fire emails via Resend Edge Function
  (Database Webhook on `notifications` table → `send-notification-email` → Resend API).
  Settings page (`/settings`) added so admin/staff can enter their `personal_email`.
  Dashboard auto-redirects admin/staff to queue. All migrations applied, lint + build green.

- **Fatin's PR #11 merged (profile page):** profile page merged to main. Fixed layout
  (wrapped in PortalShell, back button routes correctly for staff/admin vs students),
  added clickable user code link in header to `/profile`.

- **Git sync resolved:** pulled Fatin's PR #11, regenerated route tree with both /settings and
  /profile routes, resolved conflicts, lint + build green, pushed to main.

### 2026-08-23

- **UI-gap audit completed:** checked every item in `P:\My projects\niter_clearance_portal_ui_gaps.md`
  against the codebase. Already built (not real gaps): empty/loading states on queue & dashboard,
  notification center (`/notifications`), escalation + attempts display on section pages,
  multi-department staff support (DB-level via `staff_departments`).
  Real gaps confirmed: no certificate/print view, no student timeline, no deadline lock,
  missing confirmation dialogs, thin error handling, no queue search/pagination, no rejection
  history, silent bulk approve, no registrar handoff, no override path, no department config UI.
- **Tasks redistributed evenly (10 / 10 / 10):** Moinul finished (support mode). Fatin +6 gap
  tasks (F5–F10), Shafin +5 (S6–S10). Queue upgrades in `queue.tsx` reassigned to Shafin
  (Moinul reviews those PRs). Backlog now 30 tasks · 11 done. See `Assignment.md`.

- **Firebase auth migration dropped permanently:** we already run our own free Supabase
  project (auth + Postgres together). Firebase would split identity onto a second platform
  with no free database at our scale. No reason to revisit.

- **Bug fixes (UI review, 23 Aug):** three issues found during UI review, plus a cosmetic
  fix — all resolved in PR #12 (`moinul/bug-fix-2026-08-23`):
  1. **Raw translation keys showing** (`nav.dashboard`, `nav.signOut`) — removed i18n
     entirely; English-only site. Deleted `src/i18n.ts`, `src/locales/`, LanguageToggle
     component; uninstalled `i18next`, `i18next-browser-languagedetector`, `react-i18next`.
  2. **Document status contradicted review status** — approve/reject now cascades to
     linked documents in `decide()` and `bulkApprove()`. New DB columns (`reviewed_by`,
     `reviewed_at`) on `documents` table. New RPC `reviewer_display_name()` (students can't
     read staff profiles via RLS). One-time data repair fixed existing contradictions
     (verified: 3 approved docs, 1 rejected doc, 0 mismatches).
  3. **Section page UX** — reviewer name + timestamp shown on approved docs; "Re-upload
     attempts used" hidden when approved; "Uploaded after approval" notice for late uploads;
     rejection reason shown on rejected docs.
  4. **Footer copyright** — dynamic year via `new Date().getFullYear()`.

- **Resubmit notifications (23 Aug):** `trg_notify_on_resubmit` trigger on
  `department_reviews` UPDATE — notifies dept staff + all admins when a rejected student
  re-uploads documents (review flips back to pending). First-time submission already covered
  by existing `trg_notify_admin_on_application` + `trg_notify_staff_on_review`. Live, ready
  for E2E test.

- **Resubmit loop E2E fixed and verified (PR #14):** `handleUpload()` in
  `section.$code.tsx` checked a *cached* `review.status` — so the rejected→pending flip
  silently skipped and the resubmit trigger never fired. Fix: fetch fresh DB status before
  flipping, toast on failure. Full loop verified live: reject → student email ✓ → re-upload →
  auto-flip → admin email ✓.

- **Email delivery limitation diagnosed:** Resend free tier only delivers to the account
  owner email (`akash.moinulhasan@gmail.com`). Admin/staff emails (`mhakash22@niter.edu.bd`,
  `moinulcse03.du.niter@gmail.com`) were silently dropped. Temporary workaround deployed in
  the Edge Function: all notification emails forward to the owner address with the intended
  recipient in subject (`[user_code] title`) and body ("Intended for:" line). Proper fix
  deferred — requires `niter.edu.bd` domain verification on Resend.

- **Footer + housekeeping (PR #15):** footer text updated, `supabase/.temp/` added to
  `.gitignore`.

- **NITER brand design system (PR #17):** complete visual rebrand across 19 files. Tokens
  remapped to NITER brand palette (navy `#1C364E`, teal `#146572`, mint `#66D4AD`,
  gold `#FFE342`). Typography swapped to Playfair Display (serif) + Inter (sans). Default
  button now navy→teal gradient. Header rebuilt: real NITER crest logo, serif wordmark,
  underline nav active state. Footer rebuilt on dark navy (`#07172B`) with institute name
  + address. New `PageHeader` component (gradient banner + breadcrumbs) applied to 11 pages.
  Cards bumped to 12px radius. Email template updated.

- **Fatin's certificate page (PR #18):** `certificate.tsx` created (117 lines). Dashboard
  certificate button conditionally enabled when all 8/8 offices approved. Merged with
  conflict resolution on `dashboard.tsx` (brand refresh + certificate button combined).

- **Route tree guard (PR #19):** GitHub Action that auto-warns when `routeTree.gen.ts`
  is committed in a PR. Posts a comment explaining the issue and giving fix commands.
  Warning auto-deletes when the file is removed from the PR. Tested end-to-end with
  throwaway PR #20.

## Remaining summary

- **Backlog: 30 tasks · 12 done · 18 remaining.** Moinul 10/10 + 8 bug fixes + brand refresh + CI. Fatin 2/10 (F1 + F4). Shafin 0/10.
- **Moinul's work: 100% complete + bug fixes + brand refresh + CI** — M1–M3, SP1–SP3, notification pipeline, infrastructure, profile fix all done. 8 bug fixes (PRs #12–#15): i18n removal, doc-status cascade, section page UX, footer copyright, resubmit email delivery, upload-flip fix. Brand design system applied (PR #17). Route tree guard GitHub Action (PR #19). Email delivery workaround active (Resend free tier → forward to owner Gmail). Support mode.
- **Fatin's work: 2 of 10 done** — Profile page (F4) + Certificate page (F1) merged. Remaining: PDF/QR (F2), forgot password (F3), then gap fixes F5–F10.
- **Shafin's work: 0 of 10 done** — No admin folder created yet. Remaining: originals S1–S5 first (entire admin panel), then gap fixes S6–S10.
- **Order of attack:** Fatin/Shafin finish their original tasks before starting the new gap fixes.
- **Definition of done for v1:** student applies → staff approves/rejects with remarks → escalation works → certificate PDF downloads with scannable QR → registrar sees cleared students ready for pickup → admin manages users, overrides decisions (audited), and reads batch reports.

## How to update this file

When you finish or start a task: change its Status cell, add a dated bullet under Work history, then commit both this file and your code together.
