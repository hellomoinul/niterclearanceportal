# NITER Clearance Portal -- Snapshot & Assignment

> **Last updated:** 2026-08-28 (admin panel completion) -- **Overall progress: ~85%**
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

> **All core tasks complete.** New security + review-feedback items (M13-M17) done 2026-08-27.

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
- **M14** -- Restrict `audit_log` INSERT RLS to registrar/admin (was any authenticated user). Migration `20260827150000_restrict_audit_log_rls.sql`. **Applied to live** (verified: `registrar and admin write audit log` policy present).
- **M15** -- N/A rollback RPC `reopen_na_review` so a caught false N/A can be reverted to pending. Migration `20260827160000_na_rollback_rpc.sql`. **Applied to live** (verified: function present).
- **M16** -- **Fix Fatin's Final Queue returning "No students found".** Root cause was NOT RLS (registrar read access already correct on both `clearance_applications` + `profiles`): `clearance_applications.student_id` had an FK only to `auth.users`, not to `profiles`, so PostgREST could not resolve the `profiles!inner(...)` embedded join and the request errored. Added FK `clearance_applications.student_id -> profiles(id)` (kept the auth.users FK). Migration `20260827170000_clearance_student_profiles_fk.sql` -- **applied to live** (verified: `clearance_applications_student_profiles_fkey` present). Verify: PostgREST query returns HTTP 200 (was erroring).
- **M17** -- **Restore `portal-shell.tsx` after PR #51 regressions.** Fatin's `fatin/registrar-queue-v3` merge (based on an older main) overwrote the newer portal-shell, reverting the Guide nav link (back to dead `/faq`), the notification unread badge, the account dropdown, the "hide About when logged in" desktop filter, the mobile account menu, the calendar link, and nav animations. Restored all of that **while keeping** Fatin's new `Final Queue` nav item + updated footer address. No code was lost (fast-forward history intact; backups `backup/origin-main-328a120` + `backup/fatin-queue-merge`).
- **Docs** -- Rewrite `SYSTEM_FLOW.md` (external/authority copy) to fix stale/wrong claims (#audit/notices stubs, guard fixed, admin dashboard real).

---

## Fatin -- Certificate Pipeline & Student Features

> **13/19 done (plus F19) -- 7 remaining**

### Completed
F4 Profile page (PR #11) · F1 Certificate page (PR #18) · F2 PDF + QR (PR #26) · F3 Forgot password (PRs #35/#36) · F6 Printable certificate (PR #29) · F8 Confirmation dialogs (PR #31) · F9 Global error states (PR #41) · F12 Profile cleanup · F15 Icon sizes · F17 Remarks in dashboard · F18 Notification badge · F19 Certificate QR + verify flow · **F10 Registrar final queue (PR #51, fixed via M16)**

### Remaining
- **F5** -- Student timeline -- every rejection/resubmission/approval in order
  > `src/routes/_authenticated/dashboard.tsx` -- Query `department_reviews` history (attempts, status changes, timestamps) as a vertical timeline under the progress card.
- **F7** -- Deadline lock -- block submissions after batch deadline
  > `src/routes/_authenticated/apply.tsx` -- Read deadline from `app_settings`/`departments`; disable submit + show "Deadline passed".
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

**F10 note (done, spec deviation):** Built as a separate route `/registrar/queue` ("Final Queue") instead of the specified dashboard card. It lists **all** applications (not just "8/8 approved but `status != 'cleared'`"), with a Thesis Title column that was later removed. After the M16 FK fix it correctly returns all applicants for a registrar. Accepted as-is by Moinul (shows all applicants is OK); closing F10 counts as complete. If a stricter "ready to issue (8/8 approved, not cleared)" filter is wanted later it can be revisited.

---

## Shafin -- Admin Panel & Queue Upgrades

> **8/14 done -- 6 remaining** (S1-S11 original + S12-S14 new)

> **How Shafin's work reached main:** `shafin/admin-panel` was forked from an ancient main (193 commits behind; force-merging would have deleted `guide.tsx`, `registrar/queue.tsx`, `forgot-password.tsx`, `calendar.tsx`, `page-header.tsx`, `departments.ts`, `UI Guide.md`, re-added the gitignored `.env`). So his genuinely-new admin files were lifted onto fresh branches off modern `main` (PR #53, #54, #55). Original branch backed up as `backup/shafin-admin-panel`; PR #52 (stale) closed as obsolete.

### Done & working (real pages)
- **S2/S7** -- Workflow & deadline config -- `admin/workflow.tsx` (lifted, fixed UUID save, PR #54). Backed by `workflow_steps` table (migration `20260828000000`, live). Add/reorder/toggle/delete stages -> persists to DB.
- **S3/S13** -- Reports -- `admin/reports.tsx` rebuilt vs real schema (PR #54): per-department approved/pending/rejected from `department_reviews` + `departments`, status pie, total count. (Shafin's draft queried non-existent `department`/`batch` columns; rebuilt, batch dropped.)
- **S4/S11** -- Notices -- `admin/notices.tsx` (lifted, PR #54). Backed by `notices` table (migration `20260828000000`, live), admin-only RLS.
- **S5/S12** -- Audit log -- `admin/audit.tsx` (lifted, PR #53): paginated/searchable/filtered read-only table over `audit_log`.
- **Admin nav/layout** -- `admin/route.tsx` fixed to render `<Outlet />` + sub-nav bar (Dashboard / Workflow / Notices / Audit / Reports / Users), so all admin pages now display (PR #55).

### Not done (Shafin's remaining work)
- **S1** -- User management -- `/admin/users` is still a **stub** (no role management). Shafin's `users.tsx` was a non-persisting mock form; not lifted.
- **S6** -- Override staff decision -- add "Override" action + `audit_log` write (on admin view / `queue.tsx`).
- **S8** -- Queue search/filter/pagination -- `queue.tsx` search, status tabs, pagination (50/page via `.range()`).
- **S9** -- Rejection history panel -- `queue.tsx` mini-table of past rejections in detail row.
- **S10** -- Bulk approve summary toast -- "X approved, Y skipped" in `queue.tsx`.
- **S14** -- N/A revert UI -- `admin/index.tsx`: "Revert" button on the N/A declarations table calling `reopen_na_review(review_id)` (M15 RPC exists + is live); plus a review-cadence note.

> **Pending PR:** PR #55 (admin layout `<Outlet />` fix) is open on branch `fix/admin-layout-outlet` -- merge so the live Vercel site shows working admin pages.

---

## Order of Attack (next up)

| # | Who | Task | Why |
|---|-----|------|-----|
| 1 | Fatin | F20 -- Resubmit comment field | Fixes the blind resubmit loop |
| 2 | Shafin | S14 -- N/A revert UI (uses M15) | Act on caught false N/A |
| 3 | Fatin | F16 -- "Uploaded" text | Dashboard clarity |
| 4 | Fatin | F11 -- Dashboard email | Show contact info |
| 5 | Fatin | F14 -- Delete countdown | Safety UX |
| 6 | Fatin | F13 -- Thesis/internship | Show collected data |
| 7 | Fatin | F5 -- Student timeline | Full history view |
| 8 | Fatin | F7 -- Deadline lock | Block late submissions |
| 9 | Shafin | S1 -- Real users page (was stub) | Admin role mgmt |
| 10 | Shafin | S6 -- Override decision | Admin power |
| 11 | Shafin | S8 -- Queue pagination | Scale to 300+ |
| 12 | Shafin | S9 -- Rejection history | Queue UX |
| 13 | Shafin | S10 -- Bulk summary | Queue UX |

---

## Definition of Done for v1

Student applies --> staff approves/rejects with remarks --> escalation works --> admin guard active --> no status-forgery --> Head ordering enforced --> certificate PDF with QR --> **verification confirms 8/8 or directs to portal** --> admin manages users + notices + sees real audit log.

---

## Progress

| Member | Done | Remaining | Total |
|--------|------|-----------|-------|
| Moinul | 22 (incl. M13-M17 + docs) | 0 | 22 |
| Fatin | 13 | 7 | 20 |
| Shafin | 8 | 6 | 14 |

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
| 27 unused shadcn/ui components | Low | Over half never imported |
| No storage bucket in migrations | Medium | `clearance-docs` only in `consolidated_setup.sql` |
| No seed file | Low | Test users/roles/assignments created manually |

---

## Work History

### 2026-08-27
- M13 -- Standardized "Academic year" label everywhere (was Batch/Session)
- M14 -- audit_log INSERT RLS restricted to registrar/admin (written + **applied to live**)
- M15 -- `reopen_na_review` N/A rollback RPC (written + **applied to live**)
- Docs -- consolidated Snapshot+Assignment; flagged external-review gaps; rewrote authority-facing SYSTEM_FLOW facts
- Distributed teammate scope: Fatin F20 (resubmit comment), Shafin S12/S13/S14 (audit page, live reports, N/A revert UI)

### 2026-08-27 (build-mode session)
- **Fatin PR #51 merged** -- registrar Final Queue (`/registrar/queue`) + route-tree. Fatin's portal-shell edit clobbered Moinul's newer nav/UI work (Guide link back to dead `/faq`, lost notification badge/dropdown/calendar/mobile menu/animations).
- **M17** -- Restored `portal-shell.tsx`: re-applied all clobbered nav/UI work **and** kept Fatin's `Final Queue` nav item + footer address. (No code lost; fast-forward history intact; backups created.)
- **Fatin F10 final queue "No students found" diagnosed + fixed (M16):** confirmed registrar role + RLS were already correct; root cause was missing FK `clearance_applications.student_id -> profiles(id)` so PostgREST's `profiles!inner(...)` join errored. Applied FK to live + migration `20260827170000_clearance_student_profiles_fk.sql`. PostgREST now returns 200.
- Removed the unplanned **Thesis Title column** from the Final Queue table (type + select + header + cell + colSpan).
- Confirmed M14 + M15 verified applied on live (pg_proc + pg_policies checks).
- **Shafin admin salvage (S12):** `shafin/admin-panel` is 193 commits behind main and force-merging would clobber dozens of modern files (delete guide/registrar-queue/forgot-password/calendar/page-header/departments, re-add gitignored `.env`). Created `backup/shafin-admin-panel`, then lifted **only** Shafin's real admin work onto a fresh branch off current main (`shafin/admin-panel-lift`). Verified his admin files import only standard UI components (no deps on deleted modules). **Lifted `audit.tsx`** (S12; all `audit_log` columns verified against live schema; tsc + vite build pass; route registered at `/admin/audit`). **Not lifted:** `route.tsx` (drops admin guard), `index.tsx` (main's is richer), `users.tsx` (is a non-persisting workflow form), `workflow.tsx`/`notices.tsx` (backing tables `workflow_steps`/`notices` don't exist), `reports.tsx` (queries `department`/`batch` columns that don't exist — noted as S13 blocker). PR opened for review.

### 2026-08-28 (S7/S11/S13 admin panel completion)
- **PR #53 merged** -- Shafin audit page (S12) landed on main. **PR #52 (stale `shafin/admin-panel`) closed as obsolete** -- unsolvable 68-file conflict; nothing lost (backup + merged #53).
- **Migration `20260828000000_admin_notices_workflow.sql` created + applied to live:** new `notices` and `workflow_steps` tables with admin-only RLS (`admins manage notices`, `admins manage workflow_steps`). Verified live (pg_policies + columns match Shafin's page usage).
- **Lifted Shafin's `workflow.tsx` (S7) + `notices.tsx` (S11)** onto `shafin/admin-work-lift-3` and **rebuilt `reports.tsx` (S13)** against the real schema (`department_reviews` joined with `departments`, `review_status` enum, total from `clearance_applications`; dropped non-existent `batch` column). Fixed a UTF-16 encoding corruption from PowerShell redirect by using `git checkout` to preserve exact bytes. tsc + `vite build` pass; routes `/admin/workflow|notices|reports` registered. PR opened.
- **PR #54 merged** -- workflow/notices/reports landed on main.
- **Admin layout fix (PR #55, open):** `admin/route.tsx` was a placeholder printing `Hello "/_authenticated/admin"!` with no `<Outlet />`, so all admin sub-pages rendered blank. Replaced with a proper layout: auth + admin-role guard kept, `<Outlet />` renders child pages, sub-nav bar (Dashboard / Workflow / Notices / Audit / Reports / Users) with active-tab highlighting. Branch `fix/admin-layout-outlet`.

### 2026-08-25 (evening)
- Role-aware profile/settings, `idToEmail`, N/A remark + verify migrations, registrar email fix, snapshot rewrite

### Earlier
- See git history / prior snapshots for full log (certificate, admin panel, security patches, core loop).
