# NITER Clearance Portal — UI Guide

> How the user interface looks and behaves, page by page. Written for anyone (teammates, reviewers, new developers) to understand the UI without running the app. Uses textual mockups throughout.

---

## Roles

| Role | What they can do | Portal ID example |
|------|------------------|-------------------|
| **Student** | Apply, upload documents, view status, download certificate | `cs2103021@niter.portal` |
| **Registrar** | Review their assigned office's queue, approve/reject with remarks | `700001@niter.portal` |
| **Admin** | Review all offices, final Head sign-off, admin dashboard | `700000@niter.portal` |

**Key fact:** everyone signs in with their **Student ID / Registrar ID / Admin ID** (e.g. `CS 2103021`, `700001`), their **portal ID**, or their **email** — same login box, one password.

---

## Navigation Bar (on every logged-in page)

```
[logo]  Dashboard  About  Calendar  Verify  Guide   [bell 3]  [▾ MyID]
                                            (hidden when   └── Profile
                                             logged in)        Settings
                                                               Sign out
```

- **Bell icon** = notifications, with an unread-count red badge (refreshes every 30s).
- Nav links depend on role:
  - Student → **Dashboard**
  - Registrar → **Accounts queue**
  - Admin → **Department queue** + **Admin**
- On mobile it becomes a hamburger menu.

---

## Public pages (no login)

### Home `/`
```
│ 💡 Final-year clearance, without walking to eight offices      [Sign in] │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                              │
│  │ Apply    │ │ Parallel │ │ Auto     │  ← 3 step explainer cards     │
│  │ once     │ │ review   │ │ cert     │                               │
│  └──────────┘ └──────────┘ └──────────┘                              │
│  Offices in the workflow:                                            │
│    Accounts · Admin · Coordinator · Hostel · Security · Library ·    │
│    Lab · Department Head                                             │
│  Latest notices (3 static cards)                                     │
```
Marketing landing page + how-it-works + office list + notices.

### Sign in / Register `/auth`
```
[Tabs: Sign in | New student]
── Sign in ────────────────────────────────
│ Student/Admin/Registrar ID, Portal ID, or Email │
│ Password                                        │
│ [Sign in]  [Forgot password?]                   │
───────────────────────────────────────────────────
── New student ──── (2-column form) ──────────────
│ Student ID │ Full name │
│ Email      │ Phone (11 digits) │
│ Program (dropdown) │
│ Academic year (dropdown) │
│ Password │ Confirm password │
│ [Create account] │
```
Footer note: *"Registrar and Admin accounts are created by the admin office."*

### Verify certificate `/verify` → `/verify/<id>`
```
│ Verify a clearance certificate │
│ No account needed (for employers) │
│ [Certificate ID ____________]  [Verify certificate] │

Result page (verified):
│ ✓ Verified — Clear to sign off from NITER │
│  Certificate ID · Student name · Student ID · │
│  Program · Batch · Departments approved (8/8) │
│  Issued on                                      │
```
If not all offices approved: **"Not verified — go to NITER clearance portal"** with approved/total counts.

### Also public
- **About** `/about` — how clearance works + how decisions are recorded (hidden from nav once logged in).
- **Academic calendar** `/calendar` — key dates (window opens, deadline, review deadline, certificate release).
- **Guide** `/guide` — a **role-based** guide (Student / Registrar / Admin tabs). Step-by-step how-to for each role, plus a folded-in FAQ accordion whose questions switch by role. Replaces the old "FAQ" page.

---

## Student pages

### Dashboard `/dashboard`
```
│ Hello, Moinul ─── CS 2103021 · CSE · Batch 2021   [View Certificate][Queue]│
│ Overall progress                              7 of 8 offices approved │
│ [█████████████████░░]  88%                                             │
│  ┌─ Accounts ───────────┐  ┌─ Admin ──────────────┐                 │
│  │ Office verifies:...  │  │ Office verifies:...  │                 │
│  │          [Approved]  │  │          [Pending]   │                 │
│  └──────────────────────┘  └──────────────────────┘                 │
│  ... (8 cards, clickable → /section/<code>)                          │
│  ┌─ Department Head ─────┐                                          │
│  │ Final sign-off         │                                          │
│  │      [Waiting for 7/8 approval]  ← before trigger                 │
│  └──────────────────────┘                                           │
```
- Progress bar shows X of Y offices approved.
- **Department Head card**: shows **"Waiting for 7/8 approval"** until all 7 offices approve, then turns into a normal **Pending** badge.
- Top-right **View Certificate** button is disabled until all 8 approved.
- If no application: "No clearance application yet" + **Start my application**.

### Start application `/apply`
Sections in one form (no upload yet, that's per-office):
```
Student details      Name, ID (read-only) · Registration no · Personal email (ro)
Guardian and address Guardian name · Guardian phone (11 digits) · addresses
Academic closing     Thesis/Project title or Internship company name
                     Supervisor name · Expected graduation
Departments N/A      ☐ I have no record at Hostel
                     ☐ I have no record at Library   (Accounts/Head cannot be N/A)
[Submit application]
```
Submitting creates the application and fans it out to all offices in parallel.

### Section page `/section/<code>` (per office)
```
│ {Office name} ─ Office verifies: ... │
│ Review status                  [Pending] │
│ Office remark: (if any)                 │
│ Re-upload attempts used: 0 of 3         │
│ ── Upload proof document ────────────── │
│ {what to upload} JPG/PNG/PDF up to 5 MB │
│ [Choose file]  [Upload document]        │
│ ── Uploaded documents ───────────────── │
│  file.pdf      [Approved by office · date] [🗑] │
└──────────────────────────────────────────┘
```
- Uploading a document to a **rejected** section automatically reopens it.
- **Department Head section** (`/section/head`) has **no upload** — it shows:
  - `Waiting for 7/8 approval` (before trigger), or
  - `No document required... the Head will review once all offices finish` (after trigger), or
  - after a Head rejection: **Re-submit for final approval** button (no upload) + the admin's remark.

### Certificate `/certificate`
```
┌──────────────────────────────────────────────┐
│        NITER Digital Clearance Certificate   │
│                 [Print] [Download PDF]       │
│                                              │
│   This is to certify that                   │
│   MOINUL HASAN                              │
│   Student ID: CS 2103021                    │
│   Program: CSE        Batch: 2021           │
│                                              │
│   [QR code]   Date Issued: 26 Aug 2026     │
│   Certificate ID: f7ddbb0b-...              │
│                                              │
│                          (Registrar)        │
│                          signature          │
└──────────────────────────────────────────────┘
```
- QR code points to `/verify/<cert-id>` — anyone can scan/enter it to confirm authenticity.
- Download PDF + Print disabled until the application is fully **cleared**.

---

## Registrar / Admin page

### Queue `/queue`
```
│ Department queue (admin) / Accounts queue (registrar) │
│ All offices · 12 awaiting review                     │
│ [Pending (12)] [Rejected (3)]     [Office ▾] {admin}  │
│  ☐ ┌─ M Moinul Hasan ─────────────── [Pending]      │
│     │ ID CS 2103021 · CSE · Batch 2021               │
│     │ Office: Accounts                               │
│     │ Proof documents (2)                            │
│     │   slip.pdf  [Approved]                         │
│     │ [Remark textarea]  [Reject] [Approve]          │
│     └────────────────────────────────────────────────┘
│  ... (more cards)                                    │
│  ┌─ S Sara — Office: Department Head ── [Pending]   │
│  │   ID CS 2203001 · EEE · Academic year 2022        │
│  │   Office: Department Head — applied for final approval │
│  │   Final sign-off: no document required            │
│  │   [Remark textarea]  [Reject] [Approve]           │
│  └───────────────────────────────────────────────────┘
═════════════════════════════════════════════════════
│ [Approve 3 students]   (bulk bar, bottom, when selected) │
```
- **Pending/Rejected tabs** + office filter (admin sees all offices).
- **Reject requires a remark** — otherwise a toast blocks it.
- Final-signoff (Head) reviews appear only once **triggered (7/8 done)**, labeled **"applied for final approval"**, no documents shown.
- Bulk **approve** via checkbox + bottom action bar.

### Final Queue `/registrar/queue` (registrar only)
```
Final Clearance Queue — Monitor and filter student certificate issuance
[Search by NITER ID or Name...]  [All Statuses ▾]
┌──────────┬───────────────┬──────────────────┬──────────┬──────────────┐
│ NITER ID │ Student Name  │ Program / Batch  │ Status   │ Cleared Date │
├──────────┼───────────────┼──────────────────┼──────────┼──────────────┤
│ ...      │ ...           │ ...              │ Issued   │ 2026-08-24   │
│ ...      │ ...           │ ...              │ Pending  │ —            │
└──────────┴───────────────┴──────────────────┴──────────┴──────────────┘
```
- Lists **all** clearance applications joined with student profiles (currently, not filtered to 8/8-approved — accepted as-is).
- Status filter: **All statuses / Issued only / Not Issued only**; search by NITER ID or name; sortable + paginated (25/page).
- **Issued** badge = application `status == 'cleared'`; **Pending** = anything else.
- Added to the registrar's nav as **Final Queue**.

---

## Shared authenticated pages

### Settings `/settings`
```
── Profile details ──────────────────────
Full name * | Registrar ID *   (Student: role label swaps)
Personal email (full width)
Phone (11 digits)
[Student extra:] Registration no · Program · Academic year
                  Guardian name · Guardian phone · addresses
[Registrar/Admin:] Role / Office (read-only)
[Save profile]
```
Personal email is edited here directly.

### Profile `/profile`
Read-only card: Name, ID, **Portal ID**, Department+Session (student) or Role/Office (registrar/admin), Phone, Email, and **Account UUID** at the bottom.

### Notifications `/notifications`
```
│ Notifications            [Mark all read] [Delete all]│
│  ☐ [bell] Accounts: approved   · 2h ago   [🗑]       │
│  ☐ [bell] Hostel: rejected     · 5h ago   [🗑]       │
│            remark: Room vacate receipt required     │
│ No notifications yet.  (empty state)                 │
```
Mark-one-read, delete one/selected/all (soft delete with confirmation).

---

## Admin dashboard & sub-pages

### Admin dashboard `/admin`
```
│ Total Students: 120 │ Cleared: 80 │ Pending: 40 │
│ [User Mgmt] [Audit Log] [Notices] [Reports] [Workflow]  │
│ ── N/A Declarations ────────────────────────────   │
│ [search] [dept filter]   [Export CSV]              │
│ Student | ID | Program | Declared N/A | App | Cert │
```
Working feature: stats, quick links, and a filterable/sortable **N/A declarations** table with CSV export.
- The **stats are live-queried** (total students / cleared / pending from the DB) — not placeholder.
- The **N/A declarations table** is read from the DB, but claims are **trusted at face value** at submit time (auto-approved). An admin should review this table regularly; a caught false declaration can be reverted via the `reopen_na_review` RPC (UI pending).

### Admin sub-pages
| Page | Route | Status |
|------|-------|--------|
| User Management | `/admin/users` | **Coming soon** (stub) |
| Workflow Config | `/admin/workflow` | **Working** — reorder/toggle/delete clearance stages, persisted to `workflow_steps` (S7) |
| Notices | `/admin/notices` | **Working** — admin CRUD on `notices` table, RLS-restricted (S11) |
| Audit Log | `/admin/audit` | **Working** — paginated searchable/filtered read-only table over `audit_log` (S12) |
| Reports | `/admin/reports` | **Working** — live data from `department_reviews` + `departments`; status pie + per-department bar + CSV (S13) |

Reports now reads real data: per-department approved/pending/rejected from `department_reviews`, an overall status pie, and total application count.

---

## Department Head final sign-off (how it works end-to-end)

```
Student applies
   │
   ▼
8 office reviews created (incl. Department Head)
   │
   ▼  (student dashboard)
Head card = "Waiting for 7/8 approval"
   │
   ▼  (all 7 non-Head offices approve → DB auto-triggers)
Head card = "Pending"  ·  admin queue shows it as
   "Office: Department Head — applied for final approval"
   │
   ▼
Admin approves  →  certificate issued, student can download
   OR
Admin rejects (with remark)  →  student sees remark + "Re-submit
   for final approval" (no upload) → back to pending → admin reviews again

Note (known gap): "Re-submit for final approval" currently captures **no comment
from the student** — it's a blind "please look again" ping with no new evidence.
A comment field is planned (F20).
```

---

## Key statuses (visual badges)

| Badge | Color | Meaning |
|-------|-------|---------|
| **Approved** | green | Office signed off |
| **Pending** | amber | Awaiting review |
| **Rejected** | red | Needs a fix; remark shown |
| **Not applicable** | grey | Student declared N/A (auto-approved) |
| **Waiting for 7/8 approval** | grey (Head card) | Final sign-off not yet unlocked |

---

## Notes / known gaps
- Several **admin sub-pages are stubs** (users, workflow, notices) and reports is hardcoded — pending teammate work (Shafin S11/S13). The **audit page (S12) is done** — `audit_log` table + trigger work and are populated, and the read-only page is live. Reports (S13) is blocked: `clearance_applications` has no `department`/`batch` columns, so it must be rebuilt against `department_reviews` rather than copied verbatim.
- The **"Certificate ID"** shown on the certificate is the raw certificate **UUID** (the QR encodes it correctly for `/verify/<id>`).
- The **Department Head** has no separate login — it's handled by the **admin** in the queue.
- **N/A declarations** extend to every office except Accounts + Department Head (not just hostel/library). Declared offices are auto-approved at submit; admin reviews them after the fact, with a rollback RPC available.
- Labels are standardized on **"Academic year"** (stored as `batch`) across all pages.

## Role & scope quick reference
| Member | Lane |
|--------|------|
| Moinul (architect) | Core, security, DB RPCs, docs |
| Fatin | Certificate + student features (incl. resubmit comment field F20) |
| Shafin | Admin panel + queue (incl. audit page S12, live reports S13, N/A revert UI S14) |

Full ownership + status: see `Snapshot.md`.
