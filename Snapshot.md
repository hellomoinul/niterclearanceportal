# 📋 NITER Clearance Portal — Snapshot

> **Last updated:** 2026-08-25 · **Overall progress: ~62%**

---

### Legend

✅ Done · 🚧 In progress · ⬜ Not started · 🔒 Blocked

---

## 👨‍💻 Moinul — Core + Infrastructure

> ✅ **17/17 done** · all core + stretch + infra complete

### ✅ Core approval loop (PR #9)

- ✅ **M1** — Staff queue — approve/reject with remarks + student notification
- ✅ **M2** — Escalation — auto-escalates at 3 rejections → notifies Head + admins
- ✅ **M3** — Audit trail — every action logged with actor + remark + timestamp

### ✅ Security patches (PR #34)

- ✅ **M4** — Admin route guard — `beforeLoad` role check, redirect non-admins
- ✅ **M5** — Status-forgery patch — DB trigger blocks student status tampering
- ✅ **M6** — Admin honesty pass — replaced 5 broken admin pages with stubs
- ✅ **M7** — Head-ordering trigger — blocks Head approval until 7/8 approved

### ✅ Identity & infrastructure (PRs #32/#33)

- ✅ **M8** — Staff → Registrar full rename — enum, table, RLS, all refs
- ✅ **M9** — Accounts Queue hard-rule — registrar always sees Accounts queue

### ✅ Stretch pool (PRs #9/#10)

- ✅ **SP1** — Bulk approve — checkboxes + Select all + bottom action bar
- ✅ **SP2** — Email notifications — Edge Function + Resend + Webhook
- ✅ **SP3** — Notification pipeline — 3 DB triggers + Edge Function
- ✅ **SP4** — Settings page — `/settings` route
- ✅ **SP5** — Profile page fix — PortalShell wrapper, role-aware nav

### ✅ Extra work (beyond backlog)

- ✅ Own Supabase project — old DB inaccessible
- ✅ Deployed to Vercel — auto-deploys `main`
- ✅ NITER branding — favicon, UCAM gradient, typography
- ✅ Auth email upgrade + hotfix (PRs #35/#36)
- ✅ UI polish rounds (PRs #37/#38/#39)
- ✅ N/A self-declaration + review-reopen RPCs (PR #42)
- ✅ Admin N/A audit table with search/filter/sort/CSV (PR #42)
- ✅ Login redirect, mobile profile, register form overhaul (PR #43)
- ✅ Approved-doc delete guard (PR #43)
- ✅ Hide About for logged-in users (PR #44)
- ✅ Doc-sync workflow fix (PR #44)
- ✅ Role-aware settings page (PR #47)
- ✅ .env purge from git history
- ✅ 14+ bug fixes across auth, queue, notifications, branding

### ✅ New review feedback tasks

- ✅ **M10** — Email data flow: personal email readonly in apply, removed from form submit (auth.tsx + apply.tsx)
- ✅ **M11** — N/A remarks encoding: em-dash → ASCII dash in RPC + migration for existing rows
- ✅ **M12** — Verification workflow: `verify_clearance_status` RPC + `/verify` page green/red verdict

---

## 🎨 Fatin — Certificate Pipeline & Student Features

> ✅ **7/10 done** · ⬜ 4 remaining + 8 new from review

### ✅ Completed

- ✅ **F4** — Profile page `/profile` (PR #11)
- ✅ **F1** — Certificate page `/certificate` (PR #18)
- ✅ **F2** — PDF download + QR code (PR #26)
- ✅ **F3** — Forgot password flow (PRs #35/#36)
- ✅ **F6** — Printable certificate view (PR #29)
- ✅ **F8** — Confirmation dialogs (PR #31)
- ✅ **F9** — Global error states (PR #41)

### ⬜ Remaining (original)

- ⬜ **F5** — Student timeline — every rejection/resubmission/approval in order
  > 📁 `src/routes/_authenticated/dashboard.tsx` · Query `department_reviews` history (attempts, status changes, timestamps) and display as a vertical timeline under the progress card.

- ⬜ **F7** — Deadline lock — block submissions after batch deadline
  > 📁 `src/routes/_authenticated/apply.tsx` · Read batch deadline from `app_settings` or `departments` table. Disable submit button + show "Deadline passed" message if current date > deadline.

- ⬜ **F10** — Registrar queue — "Ready for final processing" list
  > 📁 `src/routes/_authenticated/dashboard.tsx` · Add a card/section for registrar role showing students where all 8/8 approved but `status != 'cleared'` — these need final sign-off.

### ⬜ New review feedback tasks

- ⬜ **F11** — Dashboard email: show personal_email in greeting header
  > 📁 `src/routes/_authenticated/dashboard.tsx` · After M10 wires the data, add `profile.personal_email` to the PageHeader description. E.g. "CS 2103021 · CSE · Batch 2021 · you@email.com"

- ⬜ **F12** — Profile cleanup: remove readonly bg-muted clutter
  > 📁 `src/routes/_authenticated/profile.tsx` · Replace readonly `<Input readOnly className="bg-muted" />` with plain `<p>` text or `<span>`. Keep the label + value layout but remove the input styling.

- ⬜ **F13** — Thesis/internship on profile: show collected fields
  > 📁 `src/routes/_authenticated/profile.tsx` · Add a new section below "Academic" showing `thesis_title`, `supervisor_name`, `expected_graduation` only if non-null. Update apply.tsx label: "Thesis / project title" → "Thesis / Project / Internship title".

- ⬜ **F14** — Delete countdown popup: 3-second auto-close AlertDialog
  > 📁 `src/routes/_authenticated/section.$code.tsx` · When student clicks delete on uploaded doc, wrap confirmation in `<AlertDialog>`. Add `useEffect` countdown — auto-close after 3 seconds. See `notifications.tsx` soft-delete pattern.

- ⬜ **F15** — Icon sizes: standardize all status badge icons
  > 📁 `src/components/status-badge.tsx` · All icon wrappers should use the same `size-4` or `size-5` class. The pending clock icon is currently smaller — make it match.

- ⬜ **F16** — "Uploaded" text: show on dashboard when docs submitted
  > 📁 `src/routes/_authenticated/dashboard.tsx` · In the review card loop, after StatusBadge, check if any documents exist for that review. If yes, show small "Uploaded" text below the badge.

- ⬜ **F17** — Remarks in dashboard: show feedback without navigation
  > 📁 `src/routes/_authenticated/dashboard.tsx` · Already partially done (line 170-172). Verify remarks render correctly for all statuses — not just rejected. Add `text-muted-foreground` styling.

- ⬜ **F18** — Notification badge: unread count on bell icon
  > 📁 `src/components/portal-shell.tsx` · Query notifications where `read_at IS NULL`. Show red dot or count badge on the bell icon. Re-query when notifications change.

- ⬜ **F19** — Certificate QR + verify flow fix
  > 📁 `src/routes/_authenticated/certificate.tsx`, `src/routes/verify.$code.tsx`
  > The QR already encodes `/verify/{certificate_code}`. Confirm it works end-to-end: scan → `/verify/$code` page → calls `verify_clearance_status` RPC → shows green ✅ (8/8) or red ❌ with portal link. The RPC is deployed — just wire the frontend.

---

## 🔧 Shafin — Admin Panel & Queue Upgrades

> ✅ **5/11 done** · ⬜ S1-S3 stubs + 6 remaining

### ✅ Completed (merged via PR #27, stubs via M6)

- ✅ **S1** — Admin: user management — "Coming soon" stub
- ✅ **S2** — Admin: workflow config — "Coming soon" stub
- ✅ **S3** — Admin: batch reports — hardcoded data
- ✅ **S4** — Admin: notices management — **broken** (no table)
- ✅ **S5** — Admin: audit log viewer — **broken** (wrong columns)

### ⬜ Gap fixes

- ⬜ **S6** — Override staff decision — admin overturn + audit_log
  > 📁 `src/routes/_authenticated/admin/index.tsx`, `src/routes/_authenticated/queue.tsx`
  > Add "Override" button on admin view for any review. Calls a new RPC or direct update (admin RLS allows). Must write to `audit_log` with `entity = 'department_reviews'` and reason field.

- ⬜ **S7** — Department config UI — enable/disable offices per program
  > 📁 `src/routes/_authenticated/admin/workflow.tsx`
  > Read from `departments` table. Add toggle to enable/disable each department per program. Store in a new `program_departments` junction table or a JSONB column on `departments`.

- ⬜ **S8** — Queue search/filter/pagination — scale to 300+ students
  > 📁 `src/routes/_authenticated/queue.tsx`
  > Add search input (filter by student name/ID). Add status filter tabs (pending/rejected). Add pagination (50 per page). Use Supabase `.range()` for server-side pagination.

- ⬜ **S9** — Rejection history panel — past rejections per student
  > 📁 `src/routes/_authenticated/queue.tsx`
  > In the student detail expandable row, show a mini-table of past rejections: date, department, remarks, attempt number. Query `department_reviews` where `status = 'rejected'` for that student.

- ⬜ **S10** — Bulk approve summary — "X approved, Y skipped"
  > 📁 `src/routes/_authenticated/queue.tsx`
  > After bulk approve action completes, show a toast or modal with counts: how many approved, how many skipped (with reason — e.g. "already approved", "has pending docs"). Update the review list.

- ⬜ **S11** — Notices rebuild (fixes S4/S5)
  > 📁 `src/routes/_authenticated/admin/notices.tsx`, `src/routes/index.tsx`, `supabase/migrations/*notices*`
  > Create `notices` table with RLS (admin INSERT, public SELECT). Build CRUD admin page. Wire home page `/` to fetch and display active notices. Fix S4 (broken notices) and S5 (wrong audit columns).

---

## 📊 Progress

| Member | Done | Remaining | Total |
|--------|------|-----------|-------|
| Moinul | ✅ 17 | ⬜ 0 | 17 |
| Fatin | ✅ 7 | ⬜ 12 | 19 |
| Shafin | ✅ 5 | ⬜ 6 | 11 |
| **Total** | **✅ 29** | **⬜ 18** | **47** |

---

## 🎯 Order of Attack

| # | Who | Task | Why |
|---|-----|------|-----|
| 1 | Fatin | F19 — Certificate QR + verify | End-to-end verification |
| 2 | Fatin | F15 — Icon sizes | Quick UI win |
| 3 | Fatin | F16 — "Uploaded" text | Dashboard clarity |
| 4 | Fatin | F17 — Remarks display | Student feedback |
| 5 | Fatin | F18 — Notification badge | UX improvement |
| 6 | Fatin | F14 — Delete popup | Safety UX |
| 7 | Fatin | F11 — Dashboard email | After M10 |
| 8 | Fatin | F12 — Profile cleanup | Remove clutter |
| 9 | Fatin | F13 — Thesis/internship | Show collected data |
| 10 | Fatin | F5 — Student timeline | Full history view |
| 11 | Fatin | F7 — Deadline lock | Block late submissions |
| 12 | Fatin | F10 — Registrar queue | Final processing |
| 13 | Shafin | S11 — Notices rebuild | Fixes S4/S5 |
| 14 | Shafin | S6 — Override decision | Admin power |
| 15 | Shafin | S7-S10 | Queue UX |

---

## ✅ Definition of Done for v1

Student applies → staff approves/rejects with remarks → escalation works → admin guard active → no status-forgery → Head ordering enforced → certificate PDF with QR → **verification confirms 8/8 or directs to portal** → admin manages users + notices.

---

## ⏳ Deferred (go-live decisions)

| Finding | Priority | Notes |
|---------|----------|-------|
| Test data purge | 🟡 Medium | Gibberish data before go-live |
| Password hardening | 🟡 Medium | Client minLength 8 only |
| Certificate revocation | 🟡 Medium | No revoke process |
| Escalation resolution | 🟡 Medium | No resolve/reassign UI |
| Mobile/WCAG audit | 🟢 Low | AA contrast done, no full audit |
| Resend custom domain | ⚪ — | Needs `niter.edu.bd` verification |
| PDPA compliance | ⚪ — | No Bangladesh region in Supabase |

---

## 📅 Work History

### 2026-08-25

- ✅ Settings page: role-aware form (PR #47)
- ✅ .env purge from git history
- ✅ 11 new review feedback tasks distributed
- ✅ M10 — Email data flow: personal_email wired (PR #47)
- ✅ M11 — N/A remarks: em-dash → ASCII dash (PR #47)
- ✅ M12 — verify_clearance_status RPC + /verify page (PR #47)
- ✅ F19 — Certificate QR + verify flow task assigned to Fatin
- ✅ Doc-sync workflow fix: commit before pull-rebase

### 2026-08-24

- ✅ Global error states (F9) — PR #41
- ✅ N/A self-declaration + RPCs — PR #42
- ✅ Admin N/A audit table — PR #42
- ✅ Login redirect, mobile profile, auth form — PR #43
- ✅ Hide About, section text — PR #44
- ✅ Doc-sync workflow fix — PR #44

### 2026-08-23

- ✅ Certificate page (F1) — PR #18
- ✅ PDF + QR code (F2) — PR #26
- ✅ Admin panel (S1-S5) — PR #27
- ✅ Confirmation dialogs (F8) — PR #31
- ✅ Forgot password (F3) — PRs #35/#36
- ✅ Staff → Registrar rename (M8) — PRs #32/#33
- ✅ Security patches (M4-M7) — PR #34
- ✅ Printable certificate (F6) — PR #29
- ✅ Auth + home UI polish — PRs #37/#38/#39

### 2026-08-22

- ✅ Staff queue (M1) — PR #9
- ✅ Escalation logic (M2) — PR #9
- ✅ Audit trail (M3) — PR #9
- ✅ Profile page (F4) — PR #11
- ✅ Bulk approve (SP1) — PR #9
- ✅ Email notifications (SP2/SP3) — PR #10
- ✅ Settings page (SP4) — PR #10
- ✅ Profile page fix (SP5) — PR #10
