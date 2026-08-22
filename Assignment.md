# Team Assignment — NITER Clearance Portal

> Who owns what. Update `Snapshot.md` as work progresses. Only edit this file if scope changes.

## Team

| Member | Branch               | Owns                                                                                                                           |
| ------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Moinul | `moinul/staff-queue` | `src/routes/_authenticated/queue.tsx` (new), escalation migration (`supabase/migrations/`), small edits in `section.$code.tsx` |
| Fatin  | `fatin/certificate`  | `src/routes/_authenticated/certificate.tsx` (new), forgot-password in `routes/auth.tsx`, profile page (new)                    |
| Shafin | `shafin/admin-panel` | `src/routes/_authenticated/admin/` (new folder, everything inside)                                                             |

## Ground rules

1. Work on your own branch — never push directly to `main`.
2. Do not edit files another member owns; ask them instead.
3. Merge order: Moinul's queue first (unblocks end-to-end testing), then Fatin and Shafin.
4. When a task is done: tick it here, add a dated entry in `Snapshot.md`.
5. Run lint before opening a PR.

---

## 🔵 Moinul — Core approval loop (highest priority)

- [ ] **Staff queue `/queue`** — route missing but the dashboard already links to it.
  - Pending students list filtered to the logged-in staff member's department(s)
  - Approve / Reject actions; remarks field **required on rejection**
  - Document preview beside the decision buttons (signed URL)
- [ ] **Escalation logic** — new SQL migration: increment `attempts` on each rejection; auto-set `escalated = true` after 3; notify Department Head
- [ ] **Audit trail writes** — insert into `audit_log` on every approve/reject (actor, action, timestamp)

## 🟢 Fatin — Certificate pipeline & account features

- [ ] **Certificate page `/certificate`** — route missing but dashboard links to it; show certificate details once status = cleared
- [ ] **PDF download + QR code** — generate client-side (`jspdf` + `qrcode` packages), QR links to the existing `/verify/$code` page
- [ ] **Forgot password** — Supabase `resetPasswordForEmail` + reset form
- [ ] **Profile page** — read-only view of `profiles` data

## 🟡 Shafin — Admin panel (biggest chunk)

- [ ] **User management** — registrar creates staff/admin accounts, assigns roles & departments (`user_roles`, `staff_departments`)
- [ ] **Workflow config** — required departments per program, batch deadlines
- [ ] **Batch reports** — cleared vs pending per program/batch (`recharts` already installed)
- [ ] **Notices management** — public notices shown on Home
- [ ] **Audit log viewer** — read-only table of `audit_log`

## 📋 Stretch pool (whoever finishes their section first)

- [ ] Bulk approve in queue (after Moinul's queue lands)
- [ ] Email notifications (Supabase Edge Function)
- [ ] Bangla / English language toggle
