# 📋 NITER Clearance Portal — Snapshot

> **Last updated:** 2026-08-28 (admin panel completion) · **Progress: 43/52 done (~85%)**

---

### Legend

✅ Done · 🚧 In progress · ⬜ Not started · 🔒 Blocked

---

## 👨‍💻 Moinul — Core, Infrastructure, Security, Docs

> ✅ **22/22 done** — all core, security, review-feedback, docs complete.

### ✅ Core approval loop (PR #9)

- ✅ **M1** — Staff queue — approve/reject with remarks + document preview
- ✅ **M2** — Escalation — auto-escalates at 3 rejections → Head + admins
- ✅ **M3** — Audit trail — every action logged with actor + timestamp

### ✅ Security patches (PR #34)

- ✅ **M4** — Admin route guard — `beforeLoad` role check, redirect non-admins
- ✅ **M5** — Status-forgery patch — DB trigger blocks student status tampering
- ✅ **M6** — Admin honesty pass — 5 broken admin pages → stubs
- ✅ **M7** — Head-ordering trigger — blocks Head approval until 7/8 approved

### ✅ Identity & infrastructure (PRs #32/#33)

- ✅ **M8** — Staff → Registrar full rename
- ✅ **M9** — Accounts Queue hard-rule

### ✅ Stretch pool (PRs #9/#10)

- ✅ **SP1** — Bulk approve — checkboxes + action bar
- ✅ **SP2** — Email notifications — Edge Function + Resend (deferred)
- ✅ **SP3** — Notification pipeline — 3 DB triggers
- ✅ **SP4** — Settings page
- ✅ **SP5** — Profile page fix

### ✅ New review feedback tasks

- ✅ **M10** — Email data flow: personal email readonly in apply
- ✅ **M11** — N/A remarks encoding: em-dash → ASCII dash
- ✅ **M12** — Verification workflow: `verify_clearance_status` RPC + `/verify` verdict

### ✅ 2026-08-27 — external review fixes

- ✅ **M13** — Standardize label **"Academic year"** everywhere (was "Batch"/"Session")
- ✅ **M14** — Restrict `audit_log` INSERT RLS to registrar/admin · Migration applied to live
- ✅ **M15** — `reopen_na_review` N/A rollback RPC · Migration applied to live
- ✅ **M16** — Fix Fatin's Final Queue "No students found" · FK `student_id → profiles(id)` applied
- ✅ **M17** — Restore `portal-shell.tsx` after PR #51 regressions
- ✅ **Docs** — Rewrite `SYSTEM_FLOW.md`, consolidated Snapshot+Assignment

---

## 📝 Fatin — Certificate Pipeline & Student Features

> ✅ **13/20 done (plus F19)** · ⬜ 7 remaining

### ✅ Completed

✅ F4 Profile page (PR #11) · F1 Certificate page (PR #18) · F2 PDF + QR (PR #26) · F3 Forgot password (PRs #35/#36) · F6 Printable certificate (PR #29) · F8 Confirmation dialogs (PR #31) · F9 Global error states (PR #41) · F12 Profile cleanup · F15 Icon sizes · F17 Remarks in dashboard · F18 Notification badge · F19 Certificate QR + verify flow · F10 Registrar final queue (PR #51, fixed via M16)

### ⬜ Remaining

- ⬜ **F5** — Student timeline — every rejection/resubmission/approval in order
  > `src/routes/_authenticated/dashboard.tsx` — vertical timeline under progress card
- ⬜ **F7** — Deadline lock — block submissions after batch deadline
  > `src/routes/_authenticated/apply.tsx` — read deadline from `app_settings`
- ⬜ **F11** — Dashboard email: show `personal_email` in greeting header
  > `src/routes/_authenticated/dashboard.tsx`
- ⬜ **F13** — Thesis/internship on profile: show collected fields
  > `profile.tsx` + `apply.tsx`
- ⬜ **F14** — Delete countdown popup: 3-second auto-close AlertDialog
  > `src/routes/_authenticated/section.$code.tsx`
- ⬜ **F16** — "Uploaded" text on dashboard when docs submitted
  > `src/routes/_authenticated/dashboard.tsx`
- ⬜ **F20** — **Resubmit comment field** — fixes the blind resubmit loop
  > `src/routes/_authenticated/section.$code.tsx` — store comment on `department_reviews`

---

## 🔧 Shafin — Admin Panel & Queue Upgrades

> ✅ **8/14 done** · ⬜ 6 remaining

### ✅ Done & working (real pages)

- ✅ **S2/S7** — Workflow & deadline config — `admin/workflow.tsx`, backed by `workflow_steps` table (PR #54)
- ✅ **S3/S13** — Reports — `admin/reports.tsx` rebuilt vs real schema: `department_reviews` + `departments` (PR #54)
- ✅ **S4/S11** — Notices — `admin/notices.tsx`, backed by `notices` table with admin-only RLS (PR #54)
- ✅ **S5/S12** — Audit log — `admin/audit.tsx`: paginated/searchable/filtered read-only table (PR #53)
- ✅ **Admin nav/layout** — `admin/route.tsx` renders `<Outlet />` + sub-nav bar (PR #55)

### ⬜ Not done (Shafin's remaining work)

- ⬜ **S1** — User management — `/admin/users` is still a **stub** (no role management)
- ⬜ **S6** — Override staff decision — add "Override" action + `audit_log` write
- ⬜ **S8** — Queue search/filter/pagination — `queue.tsx` search, status tabs, pagination
- ⬜ **S9** — Rejection history panel — `queue.tsx` mini-table of past rejections
- ⬜ **S10** — Bulk approve summary toast — "X approved, Y skipped" in `queue.tsx`
- ⬜ **S14** — N/A revert UI — "Revert" button on N/A declarations table (uses M15 RPC)

---

## 🎯 Order of Attack (next up)

| # | Who | Task | Why |
|---|-----|------|-----|
| 1 | Fatin | F20 — Resubmit comment field | Fixes the blind resubmit loop |
| 2 | Shafin | S14 — N/A revert UI (uses M15) | Act on caught false N/A |
| 3 | Fatin | F16 — "Uploaded" text | Dashboard clarity |
| 4 | Fatin | F11 — Dashboard email | Show contact info |
| 5 | Fatin | F14 — Delete countdown | Safety UX |
| 6 | Fatin | F13 — Thesis/internship | Show collected data |
| 7 | Fatin | F5 — Student timeline | Full history view |
| 8 | Fatin | F7 — Deadline lock | Block late submissions |
| 9 | Shafin | S1 — Real users page (was stub) | Admin role mgmt |
| 10 | Shafin | S6 — Override decision | Admin power |
| 11 | Shafin | S8 — Queue pagination | Scale to 300+ |
| 12 | Shafin | S9 — Rejection history | Queue UX |
| 13 | Shafin | S10 — Bulk summary | Queue UX |

---

## 📊 Progress

| Member | Done | Remaining | Total |
|--------|------|-----------|-------|
| Moinul | ✅ 22 | ⬜ 0 | 22 |
| Fatin | ✅ 13 | ⬜ 7 | 20 |
| Shafin | ✅ 8 | ⬜ 6 | 14 |
| **Total** | **✅ 43** | **⬜ 13** | **52** (excl. deferred) |

---

## 🎯 Definition of Done for v1

Student applies → staff approves/rejects with remarks → escalation works → admin guard active → no status-forgery → Head ordering enforced → certificate PDF with QR → verification confirms 8/8 or directs to portal → admin manages users + notices + sees real audit log.

---

## ⏸️ Deferred (go-live decisions)

| Finding | Priority | Notes |
|---------|----------|-------|
| Test data purge | Medium | Gibberish data before go-live |
| Password hardening | Medium | Client minLength 8 only |
| Certificate revocation | Medium | No revoke process |
| Escalation resolution | Medium | No resolve/reassign UI |
| Mobile/WCAG audit | Low | AA contrast done, no full audit |
| Resend custom domain | — | Needs resend.dev sender only for now |
| PDPA compliance | — | No Bangladesh region in Supabase |

---

## ⚠️ Known Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Edge function hardcoded recipient | Medium | `send-notification-email` sends to Moinul's Gmail; not wired from frontend |
| Email pipeline not delivering | Medium | Needs DB webhook/edge-function wiring; in-app notifications work |
| `/verify` "Certificate ID" shows raw UUID | Low | QR encoding correct; label could be friendlier |
| 27 unused shadcn/ui components | Low | Over half never imported |
| No storage bucket in migrations | Medium | `clearance-docs` only in `consolidated_setup.sql` |
| No seed file | Low | Test users/roles created manually |

---

## 📝 Work History

### 2026-08-28 (admin panel completion)
- **PR #53 merged** — Shafin audit page (S12) landed on main
- **PR #52 (stale `shafin/admin-panel`) closed** — unsolvable 68-file conflict; nothing lost
- **Migration `20260828000000` created + applied** — `notices` + `workflow_steps` tables with admin-only RLS
- **Lifted Shafin's `workflow.tsx` (S7) + `notices.tsx` (S11)** and **rebuilt `reports.tsx` (S13)** against real schema. Fixed UUID save bug + UTF-16 encoding corruption. tsc + build pass.
- **PR #54 merged** — workflow/notices/reports landed on main
- **Admin layout fix (PR #55, open)** — `admin/route.tsx` was a placeholder with no `<Outlet />`; replaced with proper layout + sub-nav bar
- **Docs updated** — Snapshot + UI Guide reflect accurate Shafin status (8/14 done)

### 2026-08-27 (build-mode session)
- **Fatin PR #51 merged** — registrar Final Queue + route-tree. Fatin's portal-shell edit clobbered Moinul's nav/UI work.
- **M17** — Restored `portal-shell.tsx` (all clobbered work restored, Fatin's new items kept)
- **M16** — Fixed Fatin's Final Queue "No students found" · FK `student_id → profiles(id)` applied
- **M14/M15 verified** applied on live (pg_proc + pg_policies checks)
- **Shafin admin salvage (S12)** — lifted audit.tsx from stale branch; PR #53 opened

### 2026-08-27
- M13 — Standardized "Academic year" label everywhere
- M14 — audit_log INSERT RLS restricted to registrar/admin
- M15 — `reopen_na_review` N/A rollback RPC
- Docs — consolidated Snapshot+Assignment; rewrote SYSTEM_FLOW

### Earlier
- See git history for full log (certificate, admin panel, security patches, core loop).
