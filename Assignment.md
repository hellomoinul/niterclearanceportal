# Team Assignment — NITER Clearance Portal

> Who owns what. Update `Snapshot.md` as work progresses. Only edit this file if scope changes.

## Team

| Member | Branch               | Owns                                                                                                                           |
| ------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Moinul | `main` (support mode) | Core loop + stretch + infra — **all done**. Reviews PRs, unblocks Fatin/Shafin, fixes bugs                                     |
| Fatin  | `fatin/certificate`   | `certificate.tsx` + printable view (new), forgot-password in `routes/auth.tsx`, student timeline, deadline lock, registrar queue page (new), confirmation dialogs + error states on student flows |
| Shafin | `shafin/admin-panel`  | `src/routes/_authenticated/admin/` (new folder, everything inside), queue upgrades in `queue.tsx`: search/filter/pagination, rejection history panel, bulk approve summary                      |

## Ground rules

1. Work on your own branch — never push directly to `main`.
2. Do not edit files another member owns; ask them instead. *(Exception: Shafin edits `queue.tsx` for his three queue upgrades — originally Moinul's file. Keep changes scoped; Moinul reviews those PRs.)*
3. ~~Merge order: Moinul's queue first (unblocks end-to-end testing), then Fatin and Shafin.~~ ✅ Done — queue merged and verified.
4. When a task is done: tick it here, add a dated entry in `Snapshot.md`.
5. Run lint before opening a PR.

---

## 🔵 Moinul — Core approval loop + infrastructure + stretch pool + bug fixes

- [x] **Staff queue `/queue`** — route missing but the dashboard already links to it.
  - Pending students list filtered to the logged-in staff member's department(s)
  - Approve / Reject actions; remarks field **required on rejection**
  - Document preview beside the decision buttons (signed URL)
- [x] **Escalation logic** — new SQL migration: increment `attempts` on each rejection; auto-set `escalated = true` after 3; notify Department Head
- [x] **Audit trail writes** — insert into `audit_log` on every approve/reject (actor, action, timestamp)
- [x] **Bulk approve in queue** — checkboxes + Select all + bottom action bar
- [x] **Email notifications** — Edge Function + Resend + Database Webhook. Triggers: admin on submission, staff on review creation, student on approve/reject
- [x] **Bangla/English toggle** — i18n infrastructure + toggle in header *(later removed — decided English-only)*
- [x] **Settings page `/settings`** — admin/staff enter their email for notifications
- [x] **Notification pipeline** — 3 DB triggers + Edge Function + Webhook → email via Resend
- [x] **Profile page fix** — wrapped in PortalShell, back button role-aware, nav link added

*Extra (beyond original scope):* own Supabase project created & configured
(`jmpavfglhtmcraxfiock` — Lovable Cloud was inaccessible), app deployed to Vercel
(<https://niterclearanceportal.vercel.app/>, auto-deploys `main`), NITER favicon.
Dashboard redirect for admin/staff. Git conflict resolution.

*Bug fixes (23 Aug — UI review):*
- [x] **Remove i18n entirely** — English-only site. Deleted locale files, LanguageToggle, uninstalled i18n packages. Hardcoded English in portal-shell + queue.
- [x] **Document status cascade** — approve/reject now cascades to linked documents. New DB columns (`reviewed_by`, `reviewed_at`), new RPC (`reviewer_display_name`), one-time data repair for existing contradictions.
- [x] **Section page UX** — reviewer name + timestamp, hide attempts when approved, "uploaded after approval" notice, rejection reason on rejected docs.
- [x] **Footer copyright** — dynamic year via `new Date().getFullYear()`.

**Status: ALL DONE. Moinul is in support mode — free to help Fatin/Shafin or fix bugs.**

## 🟢 Fatin — Certificate pipeline & account features (10 tasks)

- [x] **Profile page `/profile` (F4)** — merged via PR #11. Fixed by Moinul (PortalShell + back button + nav link)
- [ ] **Certificate page `/certificate` (F1)** — route linked from dashboard, doesn't exist yet
- [ ] **PDF download + QR code (F2)** — generate client-side (`jspdf` + `qrcode` packages), QR links to the existing `/verify/$code` page
- [ ] **Forgot password (F3)** — Supabase `resetPasswordForEmail` + reset form
- [ ] **Student timeline/history (F5)** — every past rejection, resubmission and approval in order (on dashboard or profile)
- [ ] **Printable certificate view (F6)** — print-friendly route/CSS so students can submit a physical copy
- [ ] **Deadline lock screen (F7)** — block new submissions after the batch deadline passes
- [ ] **Confirmation dialogs on student flows (F8)** — confirm before deleting uploaded documents
- [ ] **Global error states (F9)** — network drop / upload failure / session expiry handled with clear messages
- [ ] **Registrar queue (F10)** — "Ready for final processing" list of fully cleared students for pickup/sign-off

## 🟡 Shafin — Admin panel & staff queue upgrades (10 tasks)

- [ ] **User management (S1)** — registrar creates staff/admin accounts, assigns roles & departments (`user_roles`, `staff_departments`)
- [ ] **Workflow config (S2)** — required departments per program, batch deadlines
- [ ] **Batch reports (S3)** — cleared vs pending per program/batch (`recharts` already installed)
- [ ] **Notices management (S4)** — public notices shown on Home
- [ ] **Audit log viewer (S5)** — read-only table of `audit_log`
- [ ] **Override staff decision (S6)** — admin can overturn an approve/reject; always written to `audit_log`
- [ ] **Department config UI (S7)** — enable/disable offices per program without code changes
- [ ] **Queue search / filter / pagination (S8)** — find students fast at 300+ scale (inside `queue.tsx`)
- [ ] **Rejection history panel (S9)** — show each student's past rejections/remarks beside the current one in the queue
- [ ] **Bulk approve summary modal (S10)** — "X approved, Y skipped (reason)" feedback after bulk actions

## 📋 Stretch pool (whoever finishes their section first)

- [x] **Bulk approve in queue** — Moinul (PR #9/10)
- [x] ~~Bangla / English toggle~~ — Moinul (PR #10). **Removed 23 Aug** — team decided English-only site. i18n infrastructure deleted.
- [x] **Email notifications** — Moinul (PR #10 + migrations). Edge Function + Resend + Database Webhook live. Triggers: admin on submission, staff on review creation, student on approve/reject. Settings page for email entry. Dashboard role redirect.
- [x] **Notification pipeline** — Moinul. 3 DB triggers + Edge Function + Webhook. All notifications fire emails.
- [x] **Settings page** — Moinul. `/settings` route for email entry.
- [x] **Profile page fix** — Moinul. PortalShell wrapper, role-aware back button, nav link.

---

## 📊 Progress summary

| Member | Tasks assigned | Done | Remaining |
|---|---|---|---|
| Moinul | 10 — core + stretch + infra | 10/10 + 4 bug fixes | **0** — support mode |
| Fatin | 10 — 4 original + 6 gap fixes | 1/10 | **9** — originals (F1–F3) first, then F5–F10 |
| Shafin | 10 — 5 original + 5 gap fixes | 0/10 | **10** — originals (S1–S5) first, then S6–S10 |

**Blocked on:** Shafin needs to create `src/routes/_authenticated/admin/` folder. Fatin needs to create `src/routes/_authenticated/certificate.tsx`. Both start with their original tasks, then pick up the gap fixes (F5–F10 / S6–S10).

**Backlog total: 30 tasks · 11 done · 19 remaining** (redistributed evenly 23 Aug after the UI-gap audit).
**Extra work done by Moinul (not in backlog):** 4 bug fixes — i18n removal, doc-status cascade, section page UX, footer copyright. PR #12 pending merge.
