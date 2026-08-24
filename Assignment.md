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

**Status: All assigned tasks complete. In support mode.**

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
- [x] 14+ bug fixes across auth, queue, notifications, branding, security

---

## Fatin — Certificate Pipeline & Account Features

**Status: 7/10 done. 3 remaining.**

### Completed

- [x] **F4** — Profile page `/profile` (PR #11)
- [x] **F1** — Certificate page `/certificate` (PR #18)
- [x] **F2** — PDF download + QR code — jsPDF + qrcode, dynamic QR, A4 scaling (PR #26)
- [x] **F3** — Forgot password flow — Supabase `resetPasswordForEmail` + reset form (PRs #35/#36)
- [x] **F6** — Printable certificate view — unified print + download PDF (PR #29)
- [x] **F8** — Confirmation dialogs — confirm before deleting uploaded documents (PR #31)
- [x] **F9** — Global error states — settled by default (toasts + session persistence; confirmed by Fatin)

### Remaining

- [ ] **F5** — Student timeline/history — every past rejection, resubmission, and approval in chronological order (on dashboard or profile)
- [ ] **F7** — Deadline lock screen — block new submissions after the batch deadline passes
- [ ] **F10** — Registrar queue — "Ready for final processing" list of fully cleared students for pickup/sign-off

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
| 1 | Fatin | F5 — Student timeline | Shows full audit trail to students |
| 2 | Fatin | F7 — Deadline lock | Prevents late submissions |
| 3 | Fatin | F10 — Registrar queue | Final processing page |
| 4 | Shafin | S11 — Notices rebuild | Fixes S4/S5, enables public notices |
| 5 | Shafin | S6 — Override decision | Admin can overturn staff decisions |
| 6 | Shafin | S7-S10 | Queue UX improvements |

---

## Definition of done for v1

Student applies → staff approves/rejects with remarks → escalation works → admin route guard active → no status-forgery path → Head ordering enforced at DB level → certificate PDF downloads with scannable QR → admin manages users, overrides decisions (audited), reads batch reports, and manages notices on the public home page.

---

## Progress summary

| Member | Tasks assigned | Done | Remaining |
|--------|----------------|------|-----------|
| Moinul | 14 + 14 bug fixes | **14/14** | 0 |
| Fatin | 10 | **7/10** | 3 |
| Shafin | 11 | **5/11** (S1-S3 stubs) | 6 |
| **Total** | **35** | **26** | **9** |
