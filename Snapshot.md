# 📋 NITER Clearance Portal — Snapshot

> **Last updated:** 2026-08-25 · **Progress: 26/46 done (~57%)**

---

### Legend

✅ Done · 🚧 In progress · ⬜ Not started · 🔒 Blocked

---

## 👨‍💻 Moinul — Core + Infrastructure

> ✅ **14/14 core done** · 🔧 3 new backend tasks

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

### ⬜ New review feedback tasks

- ⬜ **M10** — Email data flow: link auth → profile → dashboard so user doesn't re-type email
- ⬜ **M11** — N/A remarks encoding: verify em-dash renders correctly, fix if `???`
- ⬜ **M12** — Verification workflow: RPC to check 8/8 status + public `/verify` page

---

## 🎨 Fatin — Certificate Pipeline & Student Features

> ✅ **7/10 done** · ⬜ 3 remaining + 8 new from review

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
- ⬜ **F7** — Deadline lock — block submissions after batch deadline
- ⬜ **F10** — Registrar queue — "Ready for final processing" list

### ⬜ New review feedback tasks

- ⬜ **F11** — Dashboard email: add `personal_email` to greeting header
- ⬜ **F12** — Profile cleanup: remove readonly bg-muted clutter
- ⬜ **F13** — Thesis/internship on profile: show collected fields (optional)
- ⬜ **F14** — Delete countdown popup: 3-second auto-close AlertDialog
- ⬜ **F15** — Icon sizes: standardize all status badge icons
- ⬜ **F16** — "Uploaded" text: show on dashboard when docs submitted
- ⬜ **F17** — Remarks in dashboard: show feedback without navigation
- ⬜ **F18** — Notification badge: unread count on bell icon

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
- ⬜ **S7** — Department config UI — enable/disable offices per program
- ⬜ **S8** — Queue search/filter/pagination — scale to 300+ students
- ⬜ **S9** — Rejection history panel — past rejections per student
- ⬜ **S10** — Bulk approve summary — "X approved, Y skipped"
- ⬜ **S11** — Notices rebuild (fixes S4/S5) — `notices` table + RLS

---

## 📊 Progress

| Member | Done | Remaining | Total |
|--------|------|-----------|-------|
| Moinul | ✅ 14 | ⬜ 3 | 17 |
| Fatin | ✅ 7 | ⬜ 11 | 18 |
| Shafin | ✅ 5 | ⬜ 6 | 11 |
| **Total** | **✅ 26** | **⬜ 20** | **46** |

---

## 🎯 Order of Attack

| # | Who | Task | Why |
|---|-----|------|-----|
| 1 | Moinul | M10 — Email data flow | Unblocks F11 |
| 2 | Moinul | M12 — Verification workflow | Core cert feature |
| 3 | Moinul | M11 — N/A remarks encoding | Quick fix |
| 4 | Fatin | F15 — Icon sizes | Quick UI win |
| 5 | Fatin | F16 — "Uploaded" text | Dashboard clarity |
| 6 | Fatin | F17 — Remarks display | Student feedback |
| 7 | Fatin | F18 — Notification badge | UX improvement |
| 8 | Fatin | F14 — Delete popup | Safety UX |
| 9 | Fatin | F11 — Dashboard email | After M10 |
| 10 | Fatin | F12 — Profile cleanup | Remove clutter |
| 11 | Fatin | F13 — Thesis/internship | Show collected data |
| 12 | Shafin | S11 — Notices rebuild | Fixes S4/S5 |
| 13 | Shafin | S6 — Override decision | Admin power |
| 14 | Shafin | S7-S10 | Queue UX |

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
