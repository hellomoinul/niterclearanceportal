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

**Status: ALL DONE. Moinul is in support mode — free to help Fatin/Shafin or fix bugs.**

## 🟢 Fatin — Certificate pipeline & account features (10 tasks)

- [x] **Profile page `/profile` (F4)** — merged via PR #11. Fixed by Moinul (PortalShell + back button + nav link)
- [x] **Certificate page `/certificate` (F1)** — merged via PR #18; conditional link on dashboard (enabled when 8/8 approved). Dashboard conflict resolved with brand refresh.
- [x] **PDF download + QR code (F2)** — generate client-side (`jspdf` + `qrcode` packages), QR links to the existing `/verify/$code` page
- [ ] **Forgot password (F3)** — Supabase `resetPasswordForEmail` + reset form
- [ ] **Student timeline/history (F5)** — every past rejection, resubmission and approval in order (on dashboard or profile)
- [ ] **Printable certificate view (F6)** — print-friendly route/CSS so students can submit a physical copy
- [ ] **Deadline lock screen (F7)** — block new submissions after the batch deadline passes
- [ ] **Confirmation dialogs on student flows (F8)** — confirm before deleting uploaded documents
- [ ] **Global error states (F9)** — network drop / upload failure / session expiry handled with clear messages
- [ ] **Registrar queue (F10)** — "Ready for final processing" list of fully cleared students for pickup/sign-off

## 🟡 Shafin — Admin panel & staff queue upgrades (10 tasks)

- [x] **User management (S1)** — registrar creates staff/admin accounts, assigns roles & departments (`user_roles`, `staff_departments`)
- [x] **Workflow config (S2)** — required departments per program, batch deadlines
- [x] **Batch reports (S3)** — cleared vs pending per program/batch (`recharts` already installed)
- [x] **Notices management (S4)** — public notices shown on Home
- [x] **Audit log viewer (S5)** — read-only table of `audit_log`
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
| Moinul | 10 — core + stretch + infra | 10/10 + 14 bug fixes | **0** — support mode |
| Fatin | 10 — 4 original + 6 gap fixes | 3/10 | **7** — forgot password (F3) first, then F5–F10 |
| Shafin | 10 — 5 original + 5 gap fixes | 5/10 | **5** — S6–S10 (override, dept config, queue search, rejection history, bulk summary) |

**Blocked on:** Fatin needs forgot password (F3) next, then gap fixes (F5–F10). Shafin has admin panel (S1–S5) built; needs S6–S10 (override, dept config, queue search, rejection history, bulk summary) next.

**Backlog total: 30 tasks · 20 done · 10 remaining** (F1 + F2 merged 23 Aug, S1–S5 merged 23 Aug).
**Extra work done by Moinul (not in backlog):** 14 bug fixes — i18n removal, doc-status cascade, section page UX, footer copyright, resubmit email delivery, upload-flip fix, back link readability, UCAM gradient adoption, WCAG contrast fixes, white headings on gradients, registrar removal, notifications layout fix, role-based nav + FAQ, admin queue polish. PRs #12–#25 all merged; PR #28 open. Brand refresh applied across 19 files. UCAM pink→blue gradient adopted. Email delivery workaround active (Resend free tier → forward to owner Gmail).
