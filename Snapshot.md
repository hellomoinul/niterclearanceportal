# NITER Clearance Portal — Project Snapshot

**Last updated:** 2026-08-24 · **Progress: 26/35 tasks done (~74%)**

---

## How to use this document

This is the team's **checklist**. Every task has a checkbox. Tick it when your PR merges. If you start a task, mark it 🚧. If it's blocked, mark it 🔒 with a reason.

**Legend:** ✅ Done · 🚧 In progress · ⬜ Not started · 🔒 Blocked

---

## Moinul — Core + Infrastructure + Stretch + Bug Fixes

**Status: 14/14 tasks done. Support mode — reviewing PRs and unblocking teammates.**

### Core approval loop

- [x] **M1** — Staff queue `/queue` — approve/reject with remarks, student notification (PR #9)
- [x] **M2** — Escalation logic — auto-escalates at 3 rejections, notifies Head + admins (PR #9)
- [x] **M3** — Audit trail — every approve/reject logged with actor + remark (PR #9)

### Security patches

- [x] **M4** — Admin route guard — `beforeLoad` role check, redirect non-admins (PR #34)
- [x] **M5** — Status-forgery patch — BEFORE UPDATE trigger blocks student status tampering (PR #34)
- [x] **M6** — Admin honesty pass — replaced 5 broken admin pages with "Coming soon" stubs (PR #34)
- [x] **M7** — Head-ordering trigger — DB trigger blocks Head approval until 7/8 approved (PR #34)

### Identity & infrastructure

- [x] **M8** — Staff → Registrar full rename — enum, table, function, RLS, all client refs (PRs #32/#33)
- [x] **M9** — Accounts Queue hard-rule — registrar always sees Accounts queue (PR #32)

### Stretch pool

- [x] **SP1** — Bulk approve in queue — checkboxes + Select all + bottom action bar (PR #9)
- [x] **SP2** — Email notifications — Edge Function + Resend + Webhook (PR #10)
- [x] **SP3** — Notification pipeline — 3 DB triggers + Edge Function + Webhook (PR #10)
- [x] **SP4** — Settings page — `/settings` route for email entry (PR #10)
- [x] **SP5** — Profile page fix — PortalShell wrapper, role-aware back, nav link (PR #10)

### Extra work (not in backlog)

- [x] Own Supabase project (`jmpavfglhtmcraxfiock`) — old DB inaccessible
- [x] Deployed to Vercel — auto-deploys `main`
- [x] NITER branding — favicon, UCAM gradient, Playfair Display + Inter
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

**Status: 7/10 tasks done. 3 remaining.**

- [x] **F4** — Profile page `/profile` (PR #11)
- [x] **F1** — Certificate page `/certificate` (PR #18)
- [x] **F2** — PDF download + QR code (PR #26)
- [x] **F3** — Forgot password flow (PRs #35/#36)
- [x] **F6** — Printable certificate view (PR #29)
- [x] **F8** — Confirmation dialogs on student flows (PR #31)
- [x] **F9** — Global error states — settled by default (confirmed by Fatin, PR #41)

- [ ] **F5** — Student timeline/history — every past rejection/resubmission/approval in order
- [ ] **F7** — Deadline lock screen — block new submissions after batch deadline
- [ ] **F10** — Registrar queue — "Ready for final processing" list of cleared students

---

## Shafin — Admin Panel & Queue Upgrades

**Status: 5/11 tasks done (S1-S3 are stubs needing rebuild). 6 remaining.**

### Original tasks (code merged via PR #27, but M6 honesty pass replaced with stubs)

- [x] **S1** — Admin: user management — code merged, currently "Coming soon" stub
- [x] **S2** — Admin: workflow config — code merged, currently "Coming soon" stub
- [x] **S3** — Admin: batch reports — code merged, currently hardcoded data
- [x] **S4** — Admin: notices management — code merged, **broken** (`notices` table doesn't exist)
- [x] **S5** — Admin: audit log viewer — code merged, **broken** (queries wrong columns)

### Gap fixes (remaining)

- [ ] **S6** — Override staff decision — admin overturn + mandatory audit_log entry
- [ ] **S7** — Department config UI — enable/disable offices per program
- [ ] **S8** — Queue search/filter/pagination — scale to 300+ students
- [ ] **S9** — Rejection history panel — past rejections/remarks per student in queue
- [ ] **S10** — Bulk approve summary modal — "X approved, Y skipped" feedback
- [ ] **S11** — Notices rebuild (fixes S4/S5) — create `notices` table + RLS + wire home page

---

## Progress summary

| Member | Assigned | Done | Remaining |
|--------|----------|------|-----------|
| Moinul | 14 + 14 bug fixes | **14/14** | 0 |
| Fatin | 10 | **7/10** | 3 (F5, F7, F10) |
| Shafin | 11 | **5/11** (S1-S3 stubs) | 6 (S6-S11) |
| **Total** | **35** | **26** | **9** |

---

## Order of attack

1. **Fatin** → F5 (Student timeline) → F7 (Deadline lock) → F10 (Registrar queue)
2. **Shafin** → S11 (Notices rebuild, fixes S4/S5) → S6 (Override decision) → S7-S10

---

## Definition of done for v1

Student applies → staff approves/rejects with remarks → escalation works → admin route guard active → no status-forgery path → Head ordering enforced at DB level → certificate PDF downloads with scannable QR → admin manages users, overrides decisions (audited), reads batch reports, and manages notices on the public home page.

---

## Deferred findings (go-live decisions)

| Finding | Priority | Notes |
|---------|----------|-------|
| Test data purge | Medium | Gibberish data in DB before go-live |
| Password policy hardening | Medium | Client minLength 8 only; no forced change on provisioned staff |
| Certificate revocation | Medium | No process to revoke issued certificates |
| Escalation resolution screen | Medium | Escalation sends notification but has no resolve/reassign UI |
| Formal mobile/WCAG audit | Low | AA contrast pass done; no comprehensive audit |
| Resend custom domain | — | Free tier only delivers to account owner; needs `niter.edu.bd` domain verification |
| PDPA legal counsel | — | Supabase has no Bangladesh region; confirm compliance before go-live |

---

## Work history

### 2026-08-24

- Global error states (F9) — PR #41
- N/A self-declaration + review-reopen RPCs — PR #42
- Admin N/A audit table — PR #42
- Login redirect, mobile profile, auth form, approved-doc guard — PR #43
- Hide About for logged-in users, section "Office verifies:" text — PR #44
- Doc-sync workflow fix — PR #44

### 2026-08-23

- Certificate page (F1) — PR #18
- PDF download + QR code (F2) — PR #26
- Admin panel (S1-S5) — PR #27
- Confirmation dialogs (F8) — PR #31
- Forgot password (F3) — PRs #35/#36
- Staff → Registrar rename (M8) — PRs #32/#33
- Security patches (M4-M7) — PR #34
- Printable certificate (F6) — PR #29
- Auth + home UI polish — PRs #37/#38/#39
- UI polish round 2 — PR #41

### 2026-08-22

- Staff queue (M1) — PR #9
- Escalation logic (M2) — PR #9
- Audit trail (M3) — PR #9
- Profile page (F4) — PR #11
- Bulk approve (SP1) — PR #9
- Email notifications (SP2/SP3) — PR #10
- Settings page (SP4) — PR #10
- Profile page fix (SP5) — PR #10
