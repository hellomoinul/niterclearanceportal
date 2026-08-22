# Team Assignment — NITER Clearance Portal

> Who owns what. Update `Snapshot.md` as work progresses. Only edit this file if scope changes.

## Team

| Member | Branch               | Owns                                                                                                                           |
| ------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Moinul | `moinul/queue-and-escalation` | `src/routes/_authenticated/queue.tsx` (new), escalation migration (`supabase/migrations/`), small edits in `section.$code.tsx` |
| Fatin  | `fatin/certificate`  | `src/routes/_authenticated/certificate.tsx` (new), forgot-password in `routes/auth.tsx`, profile page (new)                    |
| Shafin | `shafin/admin-panel` | `src/routes/_authenticated/admin/` (new folder, everything inside)                                                             |

## Ground rules

1. Work on your own branch — never push directly to `main`.
2. Do not edit files another member owns; ask them instead.
3. ~~Merge order: Moinul's queue first (unblocks end-to-end testing), then Fatin and Shafin.~~ ✅ Done — queue merged and verified.
4. When a task is done: tick it here, add a dated entry in `Snapshot.md`.
5. Run lint before opening a PR.

---

## 🔵 Moinul — Core approval loop + infrastructure + stretch pool

- [x] **Staff queue `/queue`** — route missing but the dashboard already links to it.
  - Pending students list filtered to the logged-in staff member's department(s)
  - Approve / Reject actions; remarks field **required on rejection**
  - Document preview beside the decision buttons (signed URL)
- [x] **Escalation logic** — new SQL migration: increment `attempts` on each rejection; auto-set `escalated = true` after 3; notify Department Head
- [x] **Audit trail writes** — insert into `audit_log` on every approve/reject (actor, action, timestamp)
- [x] **Bulk approve in queue** — checkboxes + Select all + bottom action bar
- [x] **Email notifications** — Edge Function + Resend + Database Webhook. Triggers: admin on submission, staff on review creation, student on approve/reject
- [x] **Bangla/English toggle** — i18n infrastructure + toggle in header
- [x] **Settings page `/settings`** — admin/staff enter their email for notifications
- [x] **Notification pipeline** — 3 DB triggers + Edge Function + Webhook → email via Resend
- [x] **Profile page fix** — wrapped in PortalShell, back button role-aware, nav link added

*Extra (beyond original scope):* own Supabase project created & configured
(`jmpavfglhtmcraxfiock` — Lovable Cloud was inaccessible), app deployed to Vercel
(<https://niterclearanceportal.vercel.app/>, auto-deploys `main`), NITER favicon.
Dashboard redirect for admin/staff. Git conflict resolution.

**Status: ALL DONE. Moinul is in support mode — free to help Fatin/Shafin or fix bugs.**

## 🟢 Fatin — Certificate pipeline & account features

- [x] **Profile page `/profile`** — merged via PR #11. Fixed by Moinul (PortalShell + back button + nav link)
- [ ] **Certificate page `/certificate`** — route linked from dashboard, doesn't exist yet
- [ ] **PDF download + QR code** — generate client-side (`jspdf` + `qrcode` packages), QR links to the existing `/verify/$code` page
- [ ] **Forgot password** — Supabase `resetPasswordForEmail` + reset form

## 🟡 Shafin — Admin panel (biggest chunk)

- [ ] **User management** — registrar creates staff/admin accounts, assigns roles & departments (`user_roles`, `staff_departments`)
- [ ] **Workflow config** — required departments per program, batch deadlines
- [ ] **Batch reports** — cleared vs pending per program/batch (`recharts` already installed)
- [ ] **Notices management** — public notices shown on Home
- [ ] **Audit log viewer** — read-only table of `audit_log`

## 📋 Stretch pool (whoever finishes their section first)

- [x] **Bulk approve in queue** — Moinul (PR #9/10)
- [x] **Bangla / English toggle** — Moinul (PR #10)
- [x] **Email notifications** — Moinul (PR #10 + migrations). Edge Function + Resend + Database Webhook live. Triggers: admin on submission, staff on review creation, student on approve/reject. Settings page for email entry. Dashboard role redirect.
- [x] **Notification pipeline** — Moinul. 3 DB triggers + Edge Function + Webhook. All notifications fire emails.
- [x] **Settings page** — Moinul. `/settings` route for email entry.
- [x] **Profile page fix** — Moinul. PortalShell wrapper, role-aware back button, nav link.

---

## 📊 Progress summary

| Member | Tasks assigned | Done | Remaining |
|---|---|---|---|
| Moinul | 3 core + 6 stretch/extra | 9/9 | **0** — support mode |
| Fatin | 4 | 1 | **3** — Certificate page, PDF/QR, Forgot password |
| Shafin | 5 | 0 | **5** — Entire admin panel (S1–S5) |

**Blocked on:** Shafin needs to create `src/routes/_authenticated/admin/` folder. Fatin needs to create `src/routes/_authenticated/certificate.tsx`.
