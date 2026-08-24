# NITER Clearance Portal — Team Assignment

> This document is the **blueprint** for who builds what. Every line maps to a deliverable. Update `Snapshot.md` as work progresses. Only edit this file if scope changes.

---

## Team

| Member | Branch | Role |
|--------|--------|------|
| **Moinul** | `main` (support mode) | Architect & core engineer — built the full system, now reviewing PRs and unblocking teammates |
| **Fatin** | `fatin/*` | Certificate pipeline & student-facing features |
| **Shafin** | `shafin/*` | Admin panel & staff queue upgrades |

---

## Ground rules

1. **Never push directly to `main`.** Work on your personal branch.
2. **Do not edit files another member owns** — ask them instead. *(Exception: Shafin edits `queue.tsx` for queue upgrades — keep changes scoped, Moinul reviews those PRs.)*
3. **When a task is done:** tick it in this file, add a dated entry in `Snapshot.md`, open a PR. Moinul reviews and merges.
4. **Run `npx tsc --noEmit` and `npx vite build` before opening a PR.** No broken builds.
5. **Stuck more than 30 minutes?** Post in the group chat instead of struggling silently.

---

## Moinul — Core, Infrastructure, Stretch, Bug Fixes

**Status: All core tasks complete. In support mode + 3 new backend tasks.**

### Core approval loop (PR #9)

- [x] **M1** — Staff queue `/queue` — filtered to logged-in staff's department(s), approve/reject with required remarks, document preview
- [x] **M2** — Escalation logic — auto-escalates at 3 rejections, notifies Department Head + all admins
- [x] **M3** — Audit trail — every approve/reject logged to `audit_log` with actor, action, timestamp

### Security patches (PR #34)

- [x] **M4** — Admin route guard — `beforeLoad` role check on `/admin` layout, redirect non-admins
- [x] **M5** — Status-forgery patch — BEFORE UPDATE trigger rejects `status`/`cleared_at` changes by non-admins
- [x] **M6** — Admin honesty pass — replaced 5 non-functional admin pages with "Coming soon" stubs
- [x] **M7** — Head-ordering trigger — DB trigger blocks Head approval until all other 7 offices approved

### Identity & infrastructure (PRs #32/#33)

- [x] **M8** — Staff → Registrar full rename — enum value, table, function, RLS policies, all client references
- [x] **M9** — Accounts Queue hard-rule — registrar always sees "Accounts queue" (DB + client fallback)

### Stretch pool (PRs #9/#10)

- [x] **SP1** — Bulk approve in queue — checkboxes + Select all + bottom action bar
- [x] **SP2** — Email notifications — Edge Function + Resend + Database Webhook
- [x] **SP3** — Notification pipeline — 3 DB triggers + Edge Function + Webhook
- [x] **SP4** — Settings page — `/settings` route for email entry
- [x] **SP5** — Profile page fix — PortalShell wrapper, role-aware back button, nav link

### Extra work (beyond backlog)

- [x] Own Supabase project (`jmpavfglhtmcraxfiock`) — old DB inaccessible
- [x] Deployed to Vercel — auto-deploys `main`
- [x] NITER branding — favicon, UCAM gradient, Playfair Display + Inter typography
- [x] Auth email upgrade + hotfix (PRs #35/#36)
- [x] UI polish rounds (PRs #37/#38/#39)
- [x] N/A self-declaration + review-reopen RPCs (PR #42)
- [x] Admin N/A audit table with search/filter/sort/CSV (PR #42)
- [x] Login redirect to home, mobile profile link, register form overhaul (PR #43)
- [x] Approved-doc delete guard (PR #43)
- [x] About hidden for logged-in users, section "Office verifies:" text (PR #44)
- [x] Doc-sync workflow fix (PR #44)
- [x] Role-aware settings page — admin/registrar see simplified form (PR #47)
- [x] .env purge from git history + Vercel env vars via CLI
- [x] 14+ bug fixes across auth, queue, notifications, branding, security

### Review feedback tasks (assigned 2026-08-25)

- [ ] **M10** — Email data flow: ensure `personal_email` from registration flows through to dashboard profile query. The registration collects email via Supabase auth + `profiles.personal_email`. The dashboard must surface it without re-prompting. Files: `src/lib/auth.tsx` (profile query), `src/routes/_authenticated/dashboard.tsx` (display). Unblocks F11.

- [ ] **M11** — N/A remarks encoding: verify em-dash (`—`) in `remarks = 'N/A — student declared'` renders correctly everywhere. If it shows as `???` in any display context, fix the encoding. Check `dashboard.tsx` remarks display, `admin/index.tsx` N/A table, `section.$code.tsx` review details.

- [ ] **M12** — Verification workflow: (a) Create SECURITY DEFINER RPC `verify_clearance_status(p_user_code text)` that counts approved department_reviews for the user's latest application. Returns `{ verified: boolean, approved_count: number, total: number }`. (b) Build public `/verify` page (no auth required) with input field for user code + button. On submit: call RPC, show green "Verified — Clear to sign off from NITER" if 8/8, or red "Not verified — go to NITER clearance portal" with clickable link to `/` if not. (c) Ensure QR code on certificate encodes verification URL with user_code. (d) Ensure `user_code` is printed on certificate PDF.

---

## Fatin — Certificate Pipeline & Account Features

**Status: 7/10 done. 3 remaining + 8 new from review feedback.**

### Completed

- [x] **F4** — Profile page `/profile` (PR #11)
- [x] **F1** — Certificate page `/certificate` (PR #18)
- [x] **F2** — PDF download + QR code — jsPDF + qrcode, dynamic QR, A4 scaling (PR #26)
- [x] **F3** — Forgot password flow — Supabase `resetPasswordForEmail` + reset form (PRs #35/#36)
- [x] **F6** — Printable certificate view — unified print + download PDF (PR #29)
- [x] **F8** — Confirmation dialogs — confirm before deleting uploaded documents (PR #31)
- [x] **F9** — Global error states — settled by default (toasts + session persistence; confirmed by Fatin)

### Remaining (original)

- [ ] **F5** — Student timeline/history — every past rejection, resubmission, and approval in chronological order (on dashboard or profile)
- [ ] **F7** — Deadline lock screen — block new submissions after the batch deadline passes
- [ ] **F10** — Registrar queue — "Ready for final processing" list of fully cleared students for pickup/sign-off

### Review feedback tasks (assigned 2026-08-25)

- [ ] **F11** — Dashboard email display: add `personal_email` to dashboard greeting header. After M10 makes it available, show it alongside `user_code` and `program`. Something like: "Hello, Moinul · CSE · Batch 2021 · moinul@niter.edu.bd". File: `src/routes/_authenticated/dashboard.tsx`.

- [ ] **F12** — Profile page cleanup: remove readonly `bg-muted` fields that show empty values. The profile page currently displays full_name, user_code, program, batch, phone, personal_email as readonly inputs. Instead: show them as clean text (not inputs), or add an "Edit" button that toggles to editable mode. File: `src/routes/_authenticated/profile.tsx`.

- [ ] **F13** — Thesis/internship on profile: add `thesis_title`, `supervisor_name`, `expected_graduation` to the profile page display section. These are collected in apply.tsx but not shown on profile. Show them as optional fields — only display if non-null. Label update: change "Thesis / project title" in apply.tsx to "Thesis / Project / Internship title" (some departments do internships, not theses). Files: `src/routes/_authenticated/profile.tsx`, `src/routes/_authenticated/apply.tsx`.

- [ ] **F14** — Document delete countdown popup: when student clicks delete on an uploaded document, show an AlertDialog with a 3-second countdown timer. The dialog auto-closes when the countdown reaches zero and the deletion info loads. Pattern: similar to `notifications.tsx` soft-delete AlertDialog. File: `src/routes/_authenticated/section.$code.tsx`.

- [ ] **F15** — Status icon standardization: in `status-badge.tsx`, all status icons (approved ✓, rejected ×, pending ⏳, N/A 🔘) must be the same pixel size. Currently the pending clock icon appears smaller. Force consistent `width`/`height` on all icon wrappers. File: `src/components/status-badge.tsx`.

- [ ] **F16** — "Uploaded" text in dashboard: when a department has documents uploaded for its review, show "Uploaded" text below the status badge on the dashboard. This requires fetching the document count per review. Section page behavior stays unchanged — still shows pending with upload form. Admin accept still changes status as now. Files: `src/routes/_authenticated/dashboard.tsx`.

- [ ] **F17** — Remarks display in dashboard: show the review `remarks` text under the status badge in each department card on the dashboard. Only show if remarks is non-null. This way students see feedback without navigating to the section page. File: `src/routes/_authenticated/dashboard.tsx`.

- [ ] **F18** — Notification counter badge: show a numeric badge over the bell icon in the navbar indicating unread notification count. Use the existing notifications query data. Badge should be red with white text, positioned at top-right of the bell icon. File: `src/components/portal-shell.tsx`.

---

## Shafin — Admin Panel & Queue Upgrades

**Status: 5/11 done. S1-S3 are stubs needing rebuild. 6 remaining.**

### Completed (code merged via PR #27, but M6 honesty pass replaced with stubs)

- [x] **S1** — Admin: user management — currently "Coming soon" stub
- [x] **S2** — Admin: workflow config — currently "Coming soon" stub
- [x] **S3** — Admin: batch reports — currently hardcoded data
- [x] **S4** — Admin: notices management — **broken** (`notices` table doesn't exist)
- [x] **S5** — Admin: audit log viewer — **broken** (queries wrong columns)

### Remaining

- [ ] **S6** — Override staff decision — admin overturn + mandatory `audit_log` entry
- [ ] **S7** — Department config UI — enable/disable offices per program, no code changes
- [ ] **S8** — Queue search/filter/pagination — scale to 300+ students (inside `queue.tsx`)
- [ ] **S9** — Rejection history panel — past rejections/remarks per student in queue
- [ ] **S10** — Bulk approve summary modal — "X approved, Y skipped (reason)" feedback
- [ ] **S11** — Notices rebuild (fixes S4/S5) — create `notices` table + RLS + wire home page to DB

---

## Order of attack

| Priority | Member | Task | Why |
|----------|--------|------|-----|
| 1 | Moinul | M10 — Email data flow | Unblocks F11 (dashboard email display) |
| 2 | Moinul | M12 — Verification workflow | Core certificate verification feature |
| 3 | Moinul | M11 — N/A remarks encoding | Quick fix, improves N/A display |
| 4 | Fatin | F15 — Status icon sizes | Quick UI fix, visible improvement |
| 5 | Fatin | F16 — "Uploaded" text | Dashboard clarity |
| 6 | Fatin | F17 — Remarks in dashboard | Student sees feedback without navigation |
| 7 | Fatin | F18 — Notification badge | Users see unread count at a glance |
| 8 | Fatin | F14 — Delete countdown popup | Safety UX for document deletion |
| 9 | Fatin | F11 — Dashboard email display | After M10 unblocks it |
| 10 | Fatin | F12 — Profile page cleanup | Remove clutter |
| 11 | Fatin | F13 — Thesis/internship on profile | Show collected data |
| 12 | Shafin | S11 — Notices rebuild | Fixes S4/S5, enables public notices |
| 13 | Shafin | S6 — Override decision | Admin can overturn staff decisions |
| 14 | Shafin | S7-S10 | Queue UX improvements |

---

## Definition of done for v1

Student applies → staff approves/rejects with remarks → escalation works → admin route guard active → no status-forgery path → Head ordering enforced at DB level → certificate PDF downloads with scannable QR → **verification page confirms 8/8 clearance or directs to portal** → admin manages users, overrides decisions (audited), reads batch reports, and manages notices on the public home page.

---

## Progress summary

| Member | Tasks assigned | Done | Remaining |
|--------|----------------|------|-----------|
| Moinul | 14 + 14 extra + 3 new | **14/17** | 3 |
| Fatin | 10 + 8 new | **7/18** | 11 |
| Shafin | 11 | **5/11** | 6 |
| **Total** | **46** | **26** | **20** |
