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
- [x] **Resubmit notifications** — new trigger `trg_notify_on_resubmit` on `department_reviews` UPDATE. Notifies dept staff + all admins when a rejected student re-uploads documents (review flips back to pending).
- [x] **Re-upload flip fix (PR #14)** — `section.$code.tsx` handleUpload used cached `review.status`, so flip silently skipped and resubmit trigger never fired. Fix: fetch fresh DB status before flipping, toast on failure. E2E verified.
- [x] **Email delivery workaround (PR #14)** — Resend free tier only delivers to account owner email. All notifications now forward to `akash.moinulhasan@gmail.com` with intended recipient in subject/body. Proper fix deferred (requires `niter.edu.bd` domain verification on Resend).
- [x] **Footer text + housekeeping (PR #15)** — footer text updated, `supabase/.temp/` added to `.gitignore`.
- [x] **Back link readability (PR #21)** — moved standalone ghost back button into PageHeader as `back` prop (white/85 ink on dark banner). Fixes all 8 department pages + profile page.
- [x] **UCAM gradient adoption (PR #22)** — switched hero + button gradients from navy→teal to UCAM pink→blue (#fbc1ff → #4e65ff). All banner text switched to dark ink (#07172B). Header/footer chrome stays dark navy.
- [x] **WCAG contrast fixes (PR #23)** — raised muted tiers (breadcrumbs → solid ink, description → /95), flipped hero outline CTA to bg-white/70, lightened button hover stops. All combos ≥4.5:1 AA.
- [x] **White headings + registrar removal + notifications (PR #24)** — h1 on gradient surfaces → white. Login label updated to "Student / Staff ID/Admin". All "registrar" references replaced with "admin" across auth, faq, queue, certificate, verify. Notifications full-bleed gradient restored; "Mark all read" placed below banner.
- [x] **Role-based nav + FAQ (PR #25)** — staff/admin no longer see Dashboard link (redirect bounced them to queue). Admin link kept visible pending Shafin's panel. FAQ split: student questions (apply, upload, cert) vs staff/admin questions (review, bulk approve, escalation, queue filtering).
- [x] **Admin queue polish (PR #28, `moinul/queue-round3`)** — full-width banner fix (same flex-wrapper bug as notifications), admin office filter moved below tabs. Office name shown on every card. Thesis title removed from queue cards. Zero-document pending students hidden from admin queue entirely. PageHeader description prop fixed to accept nullable DB columns.
- [x] **Auth + home UI polish (PRs #37–#39, `moinul/signin-copy-polish` / `moinul/auth-form-overhaul`)** — sign-in: removed redundant heading, universal helper copy, real-ID placeholder (`CS 2103021`). Register: program dropdown (TE/IPE/FDAE/CSE/EEE), academic-year select replacing batch input, confirm-password field with cross-validation, updated placeholders. Home hero: removed extra intro paragraph and gradient CTA buttons. Login RPC hotfix shipped alongside (PR #36).
- [x] **N/A self-declaration + review-reopen RPCs (PR #41/#42 era, `moinul/na-declaration`)** — students may declare departments not applicable at application time (never stayed in hostel, no library record…). Accounts + Head always required; N/A auto-approves via ownership-checked RPC `declare_departments_na` (refuses accounts/head and reviews that already have documents). Admin dashboard gains a searchable/filterable/sortable N/A declarations table (name/ID search, department filter, sortable columns, CSV export) to spot false claims before certificates are accepted. Dashboard cards now say "Office verifies:" so requirement text isn't mistaken for an instruction; N/A sections show a distinct "Not applicable" badge. Also fixed a latent P0: the re-upload flip (rejected → pending) was blocked by RLS for students — now goes through `reopen_rejected_review` RPC with ownership + status guards.

*Security & integrity fixes (post-verification, 23 Aug):*
- [x] **Admin route guard** — no access control on `/admin/*` routes; any logged-in user (including students) can reach audit log page. Fix: `beforeLoad` role check on admin layout route, redirect non-admins. PR #34.
- [x] **Status-forgery patch** — students can UPDATE own `clearance_applications.status` to `'cleared'` via API (column not restricted in RLS policy), unlocking certificate PDF view. Same pattern on `documents.status`. Fix: revoke blanket student UPDATE, replace with column-safe path (BEFORE UPDATE trigger rejects `status`/`cleared_at` changes by non-admins). PR #34.
- [x] **Admin panel honesty pass** — all five `/admin` pages are non-functional (workflow→localStorage, users→console.log, reports→hardcoded data, audit→wrong column names, notices→table doesn't exist). Replace with clear "Coming soon" states or proper stubs so nobody mistakes scaffolding for features. PR #34.
- [x] **Head-ordering trigger** — Department Head (`head`) can approve before other 7 offices. Nothing enforces sequential ordering. Fix: BEFORE UPDATE trigger on `office_reviews` blocks `head` approval unless all other 7 reviews for same application are approved. PR #34.
- [x] **Staff → Registrar rename (M8)** — DB enum value, table (`staff_departments` → `registrar_departments`), function with accounts hard-rule, all RLS policies, all client references (`isStaff` → `isRegistrar`). PR #32.
- [x] **Accounts Queue hard rule (M9)** — registrar always sees "Accounts queue" (DB hard-rule + client fallback). PR #32.

**Status: Moinul in support mode — security fixes shipped (PR #34), registrar rename live (PRs #32/#33), auth email upgrade + hotfix live (PRs #35/#36), UI polish shipped (PRs #37–#39). Available to review PRs and unblock Fatin/Shafin.**

## 🟢 Fatin — Certificate pipeline & account features (10 tasks)

- [x] **Profile page `/profile` (F4)** — merged via PR #11. Fixed by Moinul (PortalShell + back button + nav link)
- [x] **Certificate page `/certificate` (F1)** — merged via PR #18; conditional link on dashboard (enabled when 8/8 approved). Dashboard conflict resolved with brand refresh.
- [x] **PDF download + QR code (F2)** — generate client-side (`jspdf` + `qrcode` packages), QR links to the existing `/verify/$code` page
- [x] **Forgot password (F3)** — Supabase `resetPasswordForEmail` + reset form; real email at signup + smart login + recovery email migration. PR #35.
- [ ] **Student timeline/history (F5)** — every past rejection, resubmission and approval in order (on dashboard or profile)
- [x] **Printable certificate view (F6)** — unified print + download PDF generation on `/certificate` (jspdf + html2canvas + auto-print, A4 landscape scaling). PR #29.
- [ ] **Deadline lock screen (F7)** — block new submissions after the batch deadline passes
- [x] **Confirmation dialogs on student flows (F8)** — confirm before deleting uploaded documents
- [x] **Global error states (F9)** — settled by default: Supabase session persistence + auto-refresh covers expiry, and upload/network failures surface sonner toasts with clear messages. Confirmed by Fatin — no dedicated work needed.
- [ ] **Registrar queue (F10)** — "Ready for final processing" list of fully cleared students for pickup/sign-off

## 🟡 Shafin — Admin panel & staff queue upgrades (10 tasks)

- [x] **User management (S1)** — registrar creates staff/admin accounts, assigns roles & departments (`user_roles`, `staff_departments`)
- [x] **Workflow config (S2)** — required departments per program, batch deadlines
- [x] **Batch reports (S3)** — cleared vs pending per program/batch (`recharts` already installed)
- [x] **Notices management (S4)** — public notices shown on Home ⚠️ *S4 code writes to `notices` table that doesn't exist in any migration — see Shafin fix below*
- [x] **Audit log viewer (S5)** — read-only table of `audit_log` ⚠️ *S5 code queries wrong columns (`timestamp`/`actor`/`remarks` don't exist; real columns: `created_at`/`actor_name`/`details`) — needs rebuild alongside S4*
- [ ] **Override staff decision (S6)** — admin can overturn an approve/reject; always written to `audit_log`
- [ ] **S11: Notices rebuild (S4 fix)** — current S4 code queries `notices` table that doesn't exist in any migration (`as any` cast hid the error). Must create: `notices` table migration + RLS (admin INSERT, public SELECT) + wire home page to read from DB instead of hardcoded array.
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
| Moinul | 14 — core + stretch + infra | 14/14 + 14 bug fixes | 0 |
| Fatin | 10 — 4 original + 6 gap fixes | 7/10 | 3 |
| Shafin | 11 — 5 original + 5 gap fixes + 1 rebuild | 5/11 | 6 |

**Blocked on:** Fatin needs Student timeline/history next. Shafin needs Override staff decision next. Moinul in support mode — available to help Fatin/Shafin.

**Backlog total: 35 tasks · 26 done · 9 remaining** (30 original + 1 rebuild + 4 security).
**Extra work done by Moinul (not in backlog):** 14 bug fixes (PRs #12–#28 all merged). Email delivery workaround active (Resend free tier → forward to owner Gmail). System gap verification completed 23 Aug — identified 5 critical + 7 high-priority issues across security, RLS, data integrity, and admin panel honesty.
