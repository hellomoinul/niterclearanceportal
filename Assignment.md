# 📝 NITER Clearance Portal — Team Assignment

> **Blueprint** for who builds what. Every line maps to a deliverable. Update `Snapshot.md` as work progresses. Only edit this file if scope changes.

---

## 👥 Team

| Member | Branch | Role |
|--------|--------|------|
| **Moinul** | `main` | 🏗️ Architect & core — built the full system, now reviewing PRs |
| **Fatin** | `fatin/*` | 🎨 Certificate pipeline & student-facing features |
| **Shafin** | `shafin/*` | 🔧 Admin panel & staff queue upgrades |

---

## 📏 Ground Rules

1. **Never push directly to `main`.** Work on your personal branch.
2. **Do not edit files another member owns** — ask instead.
3. **When done:** tick in this file, update `Snapshot.md`, open PR → Moinul reviews.
4. **Before PR:** `npx tsc --noEmit` + `npx vite build` — no broken builds.
5. **Stuck 30+ min?** Post in group chat.

---

## 👨‍💻 Moinul — Core, Infrastructure, Stretch

> ✅ All core tasks complete · 3 review feedback tasks done (PR #47)

### ✅ Core approval loop (PR #9)

- ✅ **M1** — Staff queue — approve/reject with remarks + document preview
- ✅ **M2** — Escalation — auto-escalates at 3 rejections → Head + admins
- ✅ **M3** — Audit trail — every action logged with actor + timestamp

### ✅ Security patches (PR #34)

- ✅ **M4** — Admin route guard — `beforeLoad` role check
- ✅ **M5** — Status-forgery patch — DB trigger blocks tampering
- ✅ **M6** — Admin honesty pass — 5 broken pages → stubs
- ✅ **M7** — Head-ordering trigger — blocks until 7/8 approved

### ✅ Identity & infrastructure (PRs #32/#33)

- ✅ **M8** — Staff → Registrar full rename
- ✅ **M9** — Accounts Queue hard-rule

### ✅ Stretch pool (PRs #9/#10)

- ✅ **SP1** — Bulk approve — checkboxes + action bar
- ✅ **SP2** — Email notifications — Edge Function + Resend
- ✅ **SP3** — Notification pipeline — 3 DB triggers
- ✅ **SP4** — Settings page
- ✅ **SP5** — Profile page fix

### ✅ Extra work

- ✅ Own Supabase project + Vercel deployment
- ✅ NITER branding — favicon, gradient, typography
- ✅ Auth email upgrade + hotfix
- ✅ UI polish rounds × 3
- ✅ N/A self-declaration + RPCs (PR #42)
- ✅ Admin N/A audit table (PR #42)
- ✅ Login redirect, mobile profile, register overhaul (PR #43)
- ✅ Approved-doc delete guard (PR #43)
- ✅ Hide About, section text (PR #44)
- ✅ Doc-sync workflow fix (PR #44)
- ✅ Role-aware settings page (PR #47)
- ✅ .env purge from git history
- ✅ 14+ bug fixes

### ✅ New review feedback tasks (PR #47)

- ✅ **M10** — Email data flow: personal email readonly in apply, removed from form submit
- ✅ **M11** — N/A remarks encoding: em-dash → ASCII dash in RPC + migration
- ✅ **M12** — Verification workflow: `verify_clearance_status` RPC + `/verify` page green/red verdict

---

## 🎨 Fatin — Certificate Pipeline & Student Features

> ✅ **7/10 done** · ⬜ 3 remaining + 8 new

### ✅ Completed

- ✅ **F4** — Profile page (PR #11)
- ✅ **F1** — Certificate page (PR #18)
- ✅ **F2** — PDF + QR code (PR #26)
- ✅ **F3** — Forgot password (PRs #35/#36)
- ✅ **F6** — Printable certificate (PR #29)
- ✅ **F8** — Confirmation dialogs (PR #31)
- ✅ **F9** — Global error states (PR #41)

### ⬜ Remaining (original)

- ⬜ **F5** — Student timeline — every rejection/resubmission/approval in order
- ⬜ **F7** — Deadline lock — block submissions after batch deadline
- ⬜ **F10** — Registrar queue — "Ready for final processing" list

### ⬜ New review feedback tasks

- ⬜ **F11** — Dashboard email: add `personal_email` to greeting header

  > **File:** `src/routes/_authenticated/dashboard.tsx`
  > **How:** After M10 makes it available, show email next to user_code/program. E.g. "Hello, Moinul · CSE · Batch 2021 · moinul@niter.edu.bd"

- ⬜ **F12** — Profile cleanup: remove readonly bg-muted clutter

  > **File:** `src/routes/_authenticated/profile.tsx`
  > **How:** Replace readonly `bg-muted` inputs with clean text, or add "Edit" toggle. Users shouldn't see empty/readonly fields as clutter.

- ⬜ **F13** — Thesis/internship on profile: show collected fields

  > **Files:** `src/routes/_authenticated/profile.tsx`, `src/routes/_authenticated/apply.tsx`
  > **How:** Add `thesis_title`, `supervisor_name`, `expected_graduation` to profile display (only if non-null). Update apply label: "Thesis / project title" → "Thesis / Project / Internship title"

- ⬜ **F14** — Delete countdown popup: 3-second auto-close AlertDialog

  > **File:** `src/routes/_authenticated/section.$code.tsx`
  > **How:** When student clicks delete on uploaded doc, show AlertDialog with countdown. Auto-closes when info loads. Pattern: notifications.tsx soft-delete.

- ⬜ **F15** — Icon sizes: standardize all status badge icons

  > **File:** `src/components/status-badge.tsx`
  > **How:** Force consistent `width`/`height` on all icon wrappers (✓ × ⏳ 🔘). Pending clock currently smaller.

- ⬜ **F16** — "Uploaded" text: show on dashboard when docs submitted

  > **File:** `src/routes/_authenticated/dashboard.tsx`
  > **How:** When department has docs uploaded, show "Uploaded" below status badge. Section page unchanged. Admin accept unchanged.

- ⬜ **F17** — Remarks in dashboard: show feedback without navigation

  > **File:** `src/routes/_authenticated/dashboard.tsx`
  > **How:** Under status badge, add `{review.remarks && <p className="text-xs text-muted-foreground">{review.remarks}</p>}`

- ⬜ **F18** — Notification badge: unread count on bell icon

  > **File:** `src/components/portal-shell.tsx`
  > **How:** Add red numeric badge over bell icon using existing notifications query data. Position top-right.

- ⬜ **F19** — Certificate QR + verify flow: ensure QR encodes correct verify URL with certificate_code, verify page shows green/red verdict end-to-end

  > **Files:** `src/routes/_authenticated/certificate.tsx`, `src/routes/verify.$code.tsx`
  > **How:** Confirm QR encodes `/verify/{certificate_code}`. Verify page calls `verify_clearance_status` RPC → green ✅ "Verified — Clear to sign off from NITER" if 8/8, red ❌ "Not verified — go to NITER clearance portal" with clickable link.

---

## 🔧 Shafin — Admin Panel & Queue Upgrades

> ✅ **5/11 done** · ⬜ S1-S3 stubs + 6 remaining

### ✅ Completed (merged PR #27, stubs via M6)

- ✅ **S1** — Admin: user management — stub
- ✅ **S2** — Admin: workflow config — stub
- ✅ **S3** — Admin: batch reports — hardcoded
- ✅ **S4** — Admin: notices — **broken** (no table)
- ✅ **S5** — Admin: audit log — **broken** (wrong columns)

### ⬜ Gap fixes

- ⬜ **S6** — Override staff decision — admin overturn + audit_log

  > **Files:** `src/routes/_authenticated/admin/index.tsx`, `src/routes/_authenticated/queue.tsx`
  > **How:** Add "Override" button on admin view for any review. Calls a new RPC or direct update (admin RLS allows). Must write to `audit_log` with `entity = 'department_reviews'` and reason field.

- ⬜ **S7** — Department config UI — enable/disable offices per program

  > **File:** `src/routes/_authenticated/admin/workflow.tsx`
  > **How:** Read from `departments` table. Add toggle to enable/disable each department per program. Store in a new `program_departments` junction table or a JSONB column on `departments`.

- ⬜ **S8** — Queue search/filter/pagination — scale to 300+

  > **File:** `src/routes/_authenticated/queue.tsx`
  > **How:** Add search input (filter by student name/ID). Add status filter tabs (pending/rejected). Add pagination (50 per page). Use Supabase `.range()` for server-side pagination.

- ⬜ **S9** — Rejection history panel — past rejections per student

  > **File:** `src/routes/_authenticated/queue.tsx`
  > **How:** In the student detail expandable row, show a mini-table of past rejections: date, department, remarks, attempt number. Query `department_reviews` where `status = 'rejected'` for that student.

- ⬜ **S10** — Bulk approve summary — "X approved, Y skipped"

  > **File:** `src/routes/_authenticated/queue.tsx`
  > **How:** After bulk approve action completes, show a toast or modal with counts: how many approved, how many skipped (with reason — e.g. "already approved", "has pending docs"). Update the review list.

- ⬜ **S11** — Notices rebuild (fixes S4/S5) — `notices` table + RLS

  > **Files:** `src/routes/_authenticated/admin/notices.tsx`, `src/routes/index.tsx`, `supabase/migrations/*notices*`
  > **How:** Create `notices` table with RLS (admin INSERT, public SELECT). Build CRUD admin page. Wire home page `/` to fetch and display active notices. Fixes S4 (broken notices) and S5 (wrong audit columns).

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

## 📊 Progress

| Member | Done | Remaining | Total |
|--------|------|-----------|-------|
| Moinul | 17 — core + stretch + infra + 3 review fixes | 17/17 | 0 |
| Fatin | 19 — 4 original + 6 gap fixes + 9 new review | 7/19 | 12 |
| Shafin | 11 — 5 original + 5 gap fixes + 1 rebuild | 5/11 | 6 |
| **Total** | **✅ 29** | **⬜ 18** | **47** |
