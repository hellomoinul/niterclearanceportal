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
