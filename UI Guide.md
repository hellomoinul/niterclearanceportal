# NITER Clearance Portal — UI Guide

> How the user interface looks and behaves, page by page. Written for anyone (teammates, reviewers, new developers) to understand the UI without running the app. Uses textual mockups throughout.

---

## Roles

| Role | What they can do | Portal ID example |
|------|------------------|-------------------|
| **Student** | Apply, then walk the 10-step clearance in strict order, upload per active office, view status, download certificate | `cs2103021@niter.portal` |
| **Registrar** | Review **their single assigned office/variant** queue, approve/reject with remarks | `700001@niter.portal` |
| **Admin** | Administration office — full queue visibility, Office Editor, users, final sign-off | `700000@niter.portal` |

**Key fact:** everyone signs in with their **Student ID / Registrar ID / Admin ID** (e.g. `CS 2103021`, `700001`), their **portal ID**, or their **email** — same login box, one password. Each **office staff** account is bound to exactly **one office or variant** (e.g. "Lab – Textile", "Hostel – Female"), so its queue is filtered automatically.

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
  - Registrar → **Queue** (their assigned office)
  - Admin → **Queue** + **Admin**
- On mobile it becomes a hamburger menu.

---

## Public pages (no login)

### Home `/`
```
│ 💡 Final-year clearance, step by step, exactly like the paper form   [Sign in] │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                              │
│  │ Apply    │ │ Step by  │ │ Auto     │  ← 3 step explainer cards     │
│  │ once     │ │ step     │ │ cert     │                               │
│  └──────────┘ └──────────┘ └──────────┘                              │
│  The 10 clearance sections, in order:                                │
│    Laboratory · Dept. Head · Hostel Superintendent · Proctor ·      │
│    Store · Library · Caretaker & Security · Exam Section ·           │
│    Accounts · Administration (final)                                 │
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
│  Program · Batch · Departments approved (10/10) │
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
│ Hello, Moinul ─── CS 2103021 · CSE · Academic year 2021   [View Certificate][Queue]│
│ Overall progress                          Step 3 of 10 — Hostel Superintendent │
│ [██████████░░░░░░░░░░░]  30%                                                     │
│  ┌─ 1 Laboratory · CSE         ✓ Approved ──────────────┐                       │
│  └───────────────────────────────────────────────────────┘                       │
│  ┌─ 2 Dept. Head · CSE         ✓ Approved ──────────────┐                       │
│  └───────────────────────────────────────────────────────┘                       │
│  ┌─ 3 Hostel Superintendent ▸ [Active] ───────────────┐                          │
│  │   Office verifies: Room vacated, hostel dues paid.  │                          │
│  └──────────────────────────────────────────────────────┘                       │
│  ┌─ 4 Proctor Office          🔒 Clearance not received│                         │
│  │     from Hostel Superintendent office               │                          │
│  └──────────────────────────────────────────────────────┘                       │
│  ... steps 5–10 also show 🔒 locked (or N/A if declared)                        │
```
- This is a **vertical stepper**, not 8 side-by-side cards. Each step shows: number, office name,
  status (Approved / Not applicable / Active / Locked).
- Only the **active step** is clickable (opens `/section/<code>`). Locked steps are not navigable.
- Next unlocked step opens automatically when the previous one is approved.
- **View Certificate** button is disabled until all 10/10 approved (i.e. Administration signed off).
- If no application: "No clearance application yet" + **Start my application**.
- Header shows the student's email (F11).

### Start application `/apply`
Sections in one form (no upload yet, that's per-office):
```
Student details      Name, ID (read-only) · Registration no · Personal email (ro)
Program (strict dropdown)  TE / IPE / FDAE / CSE / EEE
Gender (purpose-stated)   used only to route your Hostel Superintendent clearance
Guardian and address Guardian name · Guardian phone (11 digits) · addresses
[Submit application]
```
Submitting creates the application and opens **step 1 only** (Laboratory, program-matched). The next
step unlocks only when the current one approves. N/A is declared **per office** once it unlocks —
not on this form.

### Section page `/section/<code>` (per active office)
```
│ {Office name} ─ Office verifies: ... │
│ Review status                  [Pending] │
│ Office remark: (if any)                 │
│ Re-upload attempts used: 0 of 3         │
│ ── Upload proof document ────────────── │
│ {what to upload} JPG/PNG/PDF up to 5 MB │
│ [Choose file]  [Upload document]        │
│ ── Or declare not applicable ────────── │
│ [I have no record at {Office name}]     │
│ ── Uploaded documents ───────────────── │
│  file.pdf      [Approved by office · date] [🗑] │
└──────────────────────────────────────────┘
```
- Uploading a document to a **rejected** section automatically reopens it (resubmit comment optional — F20).
- **Locked office** (visited directly): no upload form — shows **"Clearance not received from [previous
  office] office. It will open once that office approves."**
- **Administration section** (`/section/admin`) has **no upload** — it is the same "no document
  required, review on proof of preceding approvals" final step; rejection shows **Re-submit** (comment – F20).
- N/A button only appears on the **currently unlocked** office (e.g. Hostel for a day-scholar).

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
│ Queue — {Office name} (staff's assigned office/variant)           │
│ [Pending (12)] [Rejected (3)]     [All offices ▾] {admin only}   │
│  ☐ ┌─ M Moinul Hasan ─────────────── [Pending]      │
│     │ ID CS 2103021 · CSE · Academic year 2021       │
│     │ Office: Laboratory · CSE                       │
│     │ Proof documents (2)                            │
│     │   slip.pdf  [Approved]                         │
│     │ [Remark textarea]  [Reject] [Approve]          │
│     └────────────────────────────────────────────────┘
│  ... (more cards)                                    │
│  ┌─ S Sara — Office: Administration ── [Pending]   │
│  │   ID CS 2203001 · EEE · Academic year 2022        │
│  │   Final sign-off: no document required            │
│  │   [Remark textarea]  [Reject] [Approve]           │
│  └───────────────────────────────────────────────────┘
═════════════════════════════════════════════════════
│ [Approve 3 students]   (bulk bar, bottom, when selected) │
```
- A **registrar sees only their one assigned office/variant** (e.g. "Lab – CSE", "Hostel – Female").
- **Admin** sees all 19 offices via the office filter.
- **Pending/Rejected tabs** + search + pagination; rejection history shown on rejected cards (S9).
- **Reject requires a remark** — otherwise a toast blocks it.
- Bulk **approve** via checkbox + bottom action bar; completion shows a per-student summary (S10).
- Admin-only **Override** (force approve/reject with mandatory reason + audit trail — S6).

### Final Queue `/registrar/queue` (registrar only)
```
Final Clearance Queue — Monitor and filter student certificate issuance
[Search by NITER ID or Name...]  [All Statuses ▾]
┌──────────┬───────────────┬──────────────────┬──────────┬──────────────┐
│ NITER ID │ Student Name  │ Program / Batch  │ Status   │ Cleared Date │
├──────────┼───────────────┼──────────────────┼──────────┼──────────────┤
│ ...      │ ...           │ ...              │ Issued   │ 2026-09-06   │
│ ...      │ ...           │ ...              │ Pending  │ —            │
└──────────┴───────────────┴──────────────────┴──────────┴──────────────┘
```
- Lists **all** clearance applications joined with student profiles.
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
│ [User Mgmt] [Office Editor] [Audit Log] [Notices] [Reports] │
│ ── N/A Declarations ────────────────────────────   │
│ [search] [office filter]   [Export CSV]            │
│ Student | ID | Program | Declared N/A | Office | Revert │
```
Working feature: stats, quick links, and a filterable/sortable **N/A declarations** table with CSV export + **Revert to pending** button per row (calls the `reopen_na_review` RPC — S14).
- The **stats are live-queried** (total students / cleared / pending from the DB) — not placeholder.
- N/A claims are **auto-approved at declaration** and reverted here if false.

### Admin sub-pages
| Page | Route | Status |
|------|-------|--------|
| User Management | `/admin/users` | ⬜ **v2** — CRUD + roles + **one office-variant per staff** (S-v2.2) |
| Office Editor | `/admin/offices` | ⬜ **v2** — CRUD over the 19 office rows (name/requirement/doc-hint/order/program/gender/final) (S-v2.1) |
| Notices | `/admin/notices` | ✅ **Working** — admin CRUD on `notices` table, RLS-restricted (S11) |
| Audit Log | `/admin/audit` | ✅ **Working** — paginated searchable/filtered read-only table over `audit_log` (S12) |
| Reports | `/admin/reports` | ✅ **Working** — live data from `department_reviews` + `departments`; status pie + per-office bar + CSV (S13) |

Reports reads real data: per-office approved/pending/rejected from `department_reviews` (will reflect the new 19-office set after the v2 reseed), an overall status pie, and total application count.

---

## Administration final sign-off (how it works end-to-end)

```
Student applies
   │
   ▼
Step 1 opens (Laboratory · program-matched)
   │
   ▼ (office approves)
Step 2 opens (Dept. Head · program-matched)  → … → Step 9 (Accounts)
   │
   ▼ (all 9 steps approved/N-A)
Step 10 opens — Administration (no document required)
   │
   ▼
Administration approves  →  certificate issued, student can download
   OR
Administration rejects (with remark)  →  student sees remark + "Re-submit"
   (optional comment – F20) → back to pending → Administration reviews again
```
Note: **no "triggered / 7-of-8" state** exists anymore — sequential creation makes the next step's
opening a database action, not a waiting state.

---

## Key statuses (visual badges)

| Badge | Color | Meaning |
|-------|-------|---------|
| **Approved** | green | Office signed off |
| **Pending** | amber | Currently active office, awaiting review |
| **Rejected** | red | Needs a fix; remark shown |
| **Not applicable** | grey | Student declared N/A on the active office (auto-approved) |
| **Locked** | grey | Office not yet unlocked — "Clearance not received from [previous office]" |

---

## Notes / known gaps
- **v2 pivot in progress.** The UI is being rebuilt around the sequential 10-step model: dashboard
  becomes a stepper, apply drops thesis fields + bulk N/A, section page gets a per-office N/A button
  and lock state, and `/admin/workflow` becomes an **Office Editor** (S-v2.1). See `Snapshot.md`.
- The **"Certificate ID"** shown on the certificate is the raw certificate **UUID** (the QR encodes it correctly for `/verify/<id>`).
- **Administration** (final office) is handled in the admin queue — the Administration office staff sign in with the same credentials used for any registrar account assigned to that office.
- **N/A is declared per office, only once it unlocks** (e.g. Hostel for a day-scholar). Declared offices auto-approve; an admin can revert a false claim via the N/A table (S14).
- Labels are standardized on **"Academic year"** (stored as `batch`) across all pages.

## Role & scope quick reference
| Member | Lane |
|--------|------|
| Moinul (architect) | Core, migrations, sequential triggers + upload lock, RLS, integration, docs |
| Fatin | Student + certificate lane (stepper dashboard, apply form, section lock/N-A, guide copy) |
| Shafin | Admin panel + queue (Office Editor, real users, queue search/history/bulk, override, N/A revert) |

Full ownership + status + v2 task IDs: see `Snapshot.md`.
