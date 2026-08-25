# NITER Clearance Portal -- Team Assignment

> **Blueprint** for who builds what. Every line maps to a deliverable. Update `Snapshot.md` as work progresses. Only edit this file if scope changes.

---

## Team

| Member | Branch | Role |
|--------|--------|------|
| **Moinul** | `main` | Architect & core -- built the full system, now reviewing PRs |
| **Fatin** | `fatin/*` | Certificate pipeline & student-facing features |
| **Shafin** | `shafin/*` | Admin panel & staff queue upgrades |

> **Note:** Teammates are currently inactive. Branches need re-clone + recreation. All remaining tasks are documented here with file paths and implementation guidance for when work resumes.

---

## Ground Rules

1. **Never push directly to `main`.** Work on your personal branch.
2. **Do not edit files another member owns** -- ask instead.
3. **When done:** tick in this file, update `Snapshot.md`, open PR --> Moinul reviews.
4. **Before PR:** `npx tsc --noEmit` + `npx vite build` -- no broken builds.
5. **Stuck 30+ min?** Post in group chat.

---

## Moinul -- Core, Infrastructure, Stretch

> **All core tasks complete** -- 3 review feedback tasks done (PR #47)

### Core approval loop (PR #9)

- **M1** -- Staff queue -- approve/reject with remarks + document preview
- **M2** -- Escalation -- auto-escalates at 3 rejections --> Head + admins
- **M3** -- Audit trail -- every action logged with actor + timestamp

### Security patches (PR #34)

- **M4** -- Admin route guard -- `beforeLoad` role check
- **M5** -- Status-forgery patch -- DB trigger blocks tampering
- **M6** -- Admin honesty pass -- 5 broken pages --> stubs
- **M7** -- Head-ordering trigger -- blocks until 7/8 approved

### Identity & infrastructure (PRs #32/#33)

- **M8** -- Staff --> Registrar full rename
- **M9** -- Accounts Queue hard-rule

### Stretch pool (PRs #9/#10)

- **SP1** -- Bulk approve -- checkboxes + action bar
- **SP2** -- Email notifications -- Edge Function + Resend
- **SP3** -- Notification pipeline -- 3 DB triggers
- **SP4** -- Settings page
- **SP5** -- Profile page fix

### Extra work

- Own Supabase project + Vercel deployment
- NITER branding -- favicon, gradient, typography
- Auth email upgrade + hotfix
- UI polish rounds x 3
- N/A self-declaration + RPCs (PR #42)
- Admin N/A audit table (PR #42)
- Login redirect, mobile profile, register overhaul (PR #43)
- Approved-doc delete guard (PR #43)
- Hide About, section text (PR #44)
- Doc-sync workflow fix (PR #44)
- Role-aware settings page (PR #47)
- .env purge from git history
- 14+ bug fixes
- Profile page: role-aware labels, Account ID removal
- Settings page: synthetic email via `idToEmail`, label refinements
- DB: applied `normalize_na_remarks` + `verify_clearance_status` migrations
- DB: fixed registrar auth email `staff@niter.portal` --> `700001@niter.portal`

### New review feedback tasks (PR #47)

- **M10** -- Email data flow: personal email readonly in apply, removed from form submit
- **M11** -- N/A remarks encoding: em-dash --> ASCII dash in RPC + migration
- **M12** -- Verification workflow: `verify_clearance_status` RPC + `/verify` page green/red verdict

---

## Fatin -- Certificate Pipeline & Student Features

> **12/19 done** -- 7 remaining

### Completed

- **F4** -- Profile page (PR #11)
- **F1** -- Certificate page (PR #18)
- **F2** -- PDF + QR code (PR #26)
- **F3** -- Forgot password (PRs #35/#36)
- **F6** -- Printable certificate (PR #29)
- **F8** -- Confirmation dialogs (PR #31)
- **F9** -- Global error states (PR #41)
- **F12** -- Profile cleanup: readonly inputs replaced with plain text, Account ID removed
- **F15** -- Icon sizes: all status badge icons standardized at `size-3.5`
- **F17** -- Remarks in dashboard: feedback shows for all statuses under review cards
- **F18** -- Notification badge: unread count on bell icon with pulse animation, 30s polling
- **F19** -- Certificate QR + verify flow: QR encodes correct URL, verify page calls RPC, green/red verdict

### Remaining

- **F5** -- Student timeline -- every rejection/resubmission/approval in order

  > **File:** `src/routes/_authenticated/dashboard.tsx`
  > **How:** Query `department_reviews` history (attempts, status changes, timestamps) and display as a vertical timeline under the progress card.

- **F7** -- Deadline lock -- block submissions after batch deadline

  > **File:** `src/routes/_authenticated/apply.tsx`
  > **How:** Read batch deadline from `app_settings` or `departments` table. Disable submit button + show "Deadline passed" message if current date > deadline.

- **F10** -- Registrar queue -- "Ready for final processing" list

  > **File:** `src/routes/_authenticated/dashboard.tsx`
  > **How:** Add a card/section for registrar role showing students where all 8/8 approved but `status != 'cleared'` -- these need final sign-off.

- **F11** -- Dashboard email: add `personal_email` to greeting header

  > **File:** `src/routes/_authenticated/dashboard.tsx`
  > **How:** Add `profile.personal_email` to the PageHeader description. E.g. "CS 2103021 -- CSE -- Batch 2021 -- you@email.com"

- **F13** -- Thesis/internship on profile: show collected fields

  > **Files:** `src/routes/_authenticated/profile.tsx`, `src/routes/_authenticated/apply.tsx`
  > **How:** Add `thesis_title`, `supervisor_name`, `expected_graduation` to profile display (only if non-null). Update apply label: "Thesis / project title" --> "Thesis / Project / Internship title".

- **F14** -- Delete countdown popup: 3-second auto-close AlertDialog

  > **File:** `src/routes/_authenticated/section.$code.tsx`
  > **How:** AlertDialog already exists for document delete. Add `useEffect` countdown that auto-closes after 3 seconds. Pattern: `notifications.tsx` soft-delete.

- **F16** -- "Uploaded" text: show on dashboard when docs submitted

  > **File:** `src/routes/_authenticated/dashboard.tsx`
  > **How:** In the review card loop, after StatusBadge, check if any documents exist for that review. If yes, show small "Uploaded" text below the badge.

---

## Shafin -- Admin Panel & Queue Upgrades

> **5/11 done** -- 6 remaining

### Completed (merged PR #27, stubs via M6)

- **S1** -- Admin: user management -- stub
- **S2** -- Admin: workflow config -- stub
- **S3** -- Admin: batch reports -- hardcoded
- **S4** -- Admin: notices -- stub (no table)
- **S5** -- Admin: audit log -- stub (wrong columns)

### Remaining (gap fixes)

- **S6** -- Override staff decision -- admin overturn + audit_log

  > **Files:** `src/routes/_authenticated/admin/index.tsx`, `src/routes/_authenticated/queue.tsx`
  > **How:** Add "Override" button on admin view for any review. Calls a new RPC or direct update (admin RLS allows). Must write to `audit_log` with `entity = 'department_reviews'` and reason field.

- **S7** -- Department config UI -- enable/disable offices per program

  > **File:** `src/routes/_authenticated/admin/workflow.tsx`
  > **How:** Read from `departments` table. Add toggle to enable/disable each department per program. Store in a new `program_departments` junction table or a JSONB column on `departments`.

- **S8** -- Queue search/filter/pagination -- scale to 300+

  > **File:** `src/routes/_authenticated/queue.tsx`
  > **How:** Add search input (filter by student name/ID). Add status filter tabs (pending/rejected). Add pagination (50 per page). Use Supabase `.range()` for server-side pagination.

- **S9** -- Rejection history panel -- past rejections per student

  > **File:** `src/routes/_authenticated/queue.tsx`
  > **How:** In the student detail expandable row, show a mini-table of past rejections: date, department, remarks, attempt number. Query `department_reviews` where `status = 'rejected'` for that student.

- **S10** -- Bulk approve summary -- "X approved, Y skipped"

  > **File:** `src/routes/_authenticated/queue.tsx`
  > **How:** After bulk approve action completes, show a toast or modal with counts: how many approved, how many skipped (with reason -- e.g. "already approved", "has pending docs"). Update the review list.

- **S11** -- Notices rebuild (fixes S4/S5)

  > **Files:** `src/routes/_authenticated/admin/notices.tsx`, `src/routes/index.tsx`, `supabase/migrations/*notices*`
  > **How:** Create `notices` table with RLS (admin INSERT, public SELECT). Build CRUD admin page. Wire home page `/` to fetch and display active notices. Fixes S4 (broken notices) and S5 (wrong audit columns).

---

## Order of Attack

| # | Who | Task | Why |
|---|-----|------|-----|
| 1 | Fatin | F16 -- "Uploaded" text | Dashboard clarity |
| 2 | Fatin | F11 -- Dashboard email | Show contact info |
| 3 | Fatin | F14 -- Delete countdown | Safety UX |
| 4 | Fatin | F13 -- Thesis/internship | Show collected data |
| 5 | Fatin | F5 -- Student timeline | Full history view |
| 6 | Fatin | F7 -- Deadline lock | Block late submissions |
| 7 | Fatin | F10 -- Registrar queue | Final processing |
| 8 | Shafin | S11 -- Notices rebuild | Fixes S4/S5 |
| 9 | Shafin | S6 -- Override decision | Admin power |
| 10 | Shafin | S8 -- Queue pagination | Scale to 300+ |
| 11 | Shafin | S9 -- Rejection history | Queue UX |
| 12 | Shafin | S10 -- Bulk summary | Queue UX |
| 13 | Shafin | S7 -- Department config | Workflow settings |

---

## Definition of Done for v1

Student applies --> staff approves/rejects with remarks --> escalation works --> admin guard active --> no status-forgery --> Head ordering enforced --> certificate PDF with QR --> **verification confirms 8/8 or directs to portal** --> admin manages users + notices.

---

## Progress

| Member | Done | Remaining | Total |
|--------|------|-----------|-------|
| Moinul | 17 -- core + stretch + infra + 3 review fixes | 0 | 17 |
| Fatin | 12 -- 7 original + 5 new review | 7 | 19 |
| Shafin | 5 -- 5 original stubs/hardcoded | 6 | 11 |
| **Total** | **34** | **13** | **47** |
