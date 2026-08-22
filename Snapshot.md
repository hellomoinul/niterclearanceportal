# Project Snapshot — NITER Clearance Portal

**Last updated:** 22 Aug 2026 · **Overall progress: ~60%**

Baseline: the full student flow works end-to-end (register → apply → per-office sections → document upload → notifications → public verification). Missing: staff cannot act on applications, no certificate PDF, no admin panel.

## Status board

Legend: ✅ Done · 🚧 In progress · ⬜ Not started

### Foundation (done before division)

| Task | Owner | Status | Notes |
|---|---|---|---|
| Project scaffold | Lovable | ✅ Done | TanStack Start, React 19, Tailwind 4, shadcn/ui |
| Database schema | Lovable | ✅ Done | All tables + RLS in `supabase/migrations/` |
| DB automation triggers | Lovable | ✅ Done | Fan-out reviews, auto-certificate, auto-notify |
| Auth pages (sign-in / register) | Lovable | ✅ Done | NITER ID → email mapping |
| Apply form + student dashboard | Lovable | ✅ Done | Progress %, per-office cards, remarks shown |
| Section pages + doc upload | Lovable | ✅ Done | Client validation, signed URLs, delete |
| Notifications page (in-app) | Lovable | ✅ Done | List + mark all read |
| Public pages (home/about/FAQ) | Lovable | ✅ Done | |
| Certificate verify pages | Lovable | ✅ Done | `/verify` + `/verify/$code` |

### Current sprint

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| M1 | Staff queue `/queue` | Moinul | ⬜ Not started | **Critical path** — blocks end-to-end testing |
| M2 | Escalation logic migration | Moinul | ⬜ Not started | attempts++ on reject; escalate at 3 |
| M3 | Audit trail writes | Moinul | ⬜ Not started | On every approve/reject |
| F1 | Certificate page `/certificate` | Fatin | ⬜ Not started | Route linked from dashboard, doesn't exist |
| F2 | PDF download + QR code | Fatin | ⬜ Not started | `jspdf` + `qrcode`, QR → `/verify/$code` |
| F3 | Forgot password flow | Fatin | ⬜ Not started | `resetPasswordForEmail` + reset form |
| F4 | Profile page (read-only) | Fatin | ⬜ Not started | Data already in `profiles` |
| S1 | Admin: user management | Shafin | ⬜ Not started | Roles + staff department assignment |
| S2 | Admin: workflow config | Shafin | ⬜ Not started | Departments per program, batch deadlines |
| S3 | Admin: batch reports | Shafin | ⬜ Not started | `recharts` installed |
| S4 | Admin: notices management | Shafin | ⬜ Not started | Feeds Home page |
| S5 | Admin: audit log viewer | Shafin | ⬜ Not started | Read-only table |

### Stretch / deferred

| Task | Owner | Status | Notes |
|---|---|---|---|
| Bulk approve in queue | pool | ⬜ Deferred | Needs M1 |
| Email notifications | pool | ⬜ Deferred | Supabase Edge Function |
| Bangla/English toggle | pool | ⬜ Deferred | |
| **Firebase auth migration** | Moinul | ⬜ Final phase | Decision after v1 ships; options: Firebase-only-auth hybrid vs full Firestore rewrite |

## Work history

### 2026-08-22
- Repo cloned locally to `P:\My projects\niterclearanceportal`.
- Plan (`niter_clearance_portal_plan.md`) cross-checked against codebase: ~60% complete.
- Task division agreed among Moinul / Fatin / Shafin (see `Assignment.md`).
- Firebase deferred to final phase by team decision.

## Remaining summary

- **Critical path:** staff queue (M1) — until it lands, approvals can't happen and certificate flow can't be tested for real.
- **Independent work:** Fatin and Shafin can start immediately without waiting.
- **Definition of done for v1:** student applies → staff approves/rejects with remarks → escalation works → certificate PDF downloads with scannable QR → admin can manage users and see reports.

## How to update this file

When you finish or start a task: change its Status cell, add a dated bullet under Work history, then commit both this file and your code together.
