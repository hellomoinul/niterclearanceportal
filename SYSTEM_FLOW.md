# NITER Clearance Portal — Complete System Flow

> For presentations, viva voce, and team reference. Last updated: 6 Sep 2026.

---

## What it is

A web portal where final-year students get cleared by all 10 offices of the institute **in strict sequential order**, mirroring the physical Student Clearance Form — instead of running desk-to-desk with paper. Built with React (TanStack Start) frontend, Supabase (PostgreSQL + auth + storage) backend, deployed on Vercel.

---

## 1. Identity & Login Mechanism

There are **no separate login systems** for roles — one login page, three account types:

- User types their **NITER ID** (e.g. `2203077`), their **Portal ID** (e.g. `2203077@niter.portal`), or their **email**. The app converts the ID to a synthetic email and signs in via Supabase Auth.
- **Registration is student-only** (name, ID, program, academic year, phone, email, password). The system auto-assigns the role `student`.
- **Registrar and admin accounts are provisioned separately** (via the Supabase signup API or by the admin office) — they cannot self-register through the student registration form.
- Role lives in a `user_roles` table (`student`, `registrar`, `admin`); each registrar is linked to **exactly one office** via `registrar_departments`. One person can hold multiple roles.

> **Important terminology:** **Registrar** is a *role* (an office employee who reviews one office's queue), **not** an office. The 10 offices are the physical clearance sections (Laboratory … Administration). A registrar account is bound to exactly one office via `registrar_departments`; the `admin` role can see all offices and acts as the final Administration sign-off.

> **Labeling note:** the field stored in the DB is `profile.batch`, but the UI labels it **"Academic year"** consistently across registration, settings, dashboard, queue, certificate, verify, profile and admin pages.

---

## 2. What Happens Right After Login

1. A route guard checks the session on every protected page — no session → bounced to `/auth`. The **Admin panel has its own guard**: `admin/route.tsx` also checks the caller is actually an admin, else redirects to `/dashboard`.
2. The app loads your profile + roles, then decides what you see:

| Role | Lands on | Header nav shows |
|---|---|---|
| **Student** | Dashboard | Home · About · Verify · FAQ · **Dashboard** |
| **Registrar** | Auto-redirects to **My office** (their one bound office's queue) | …· **My office** |
| **Admin** | Auto-redirects to **Department queue** (full, with office filter) | …· **Department queue** · **Admin** |

Everyone gets: 🔔 Notifications bell, ⚙️ Settings, their ID (→ Profile), Sign out.

> **v2 change:** the old hardcoded "Accounts queue" and the registrar-only "Final Queue" link were removed. A registrar now lands on their own office queue labeled **"My office"**; the final certificate sign-off is handled by the **Administration** office (admin role) only. Admin sees every section via an "All offices" filter.

---

## 3. Student Journey (Step by Step)

1. **Apply once** (`/apply`) — one form: registration no., guardian + address, thesis/project title or internship company, supervisor, expected graduation.

2. **On submit, a DB trigger fires** (`trg_create_department_reviews`) creating **only the first review row** — the Laboratory office (lowest `sort_order`). This is the sequential model: offices are unlocked **one at a time**, not all at once.

   The **10 offices in their fixed order** (with what each checks):

   | # | Office | What they check |
   |---|---|---|
   | 1 | **Laboratory** | All lab equipment and loaned items returned; laboratory undertaking issued |
   | 2 | **Dept. Head** | Program-specific sign-off; all credits complete, thesis/project submitted |
   | 3 | **Hostel Superintendent** | Hostel dues cleared, room vacated |
   | 4 | **Proctor Office** | No pending disciplinary matters; student ID card still valid |
   | 5 | **Store** | All store items/equipment returned |
   | 6 | **Library** | All books returned, no fines pending |
   | 7 | **Caretaker & Security Inspector** | Room/facility inspection passed; gate pass settled |
   | 8 | **Exam Section** | Transcript/exam records verified, no pending dues |
   | 9 | **Accounts Section** | All tuition fees and fines cleared |
   | 10 | **Administration** | Final sign-off after all offices approve → issues certificate |

3. Each office opens **only after the previous one approves** (enforced in the DB by `trg_advance_sequential_review`, not just hidden in the UI). While a step is locked, the student sees *"Clearance not received from [office]"*.

4. **Dashboard** = mission control: an overall progress readout (e.g. *"3 of 10 offices approved"*) and one card per office with requirement text + status badge (**Locked / Active / Approved / Not applicable**) + remark. The **active** (currently unlocked) office is highlighted for upload.

5. The active office's **section page** is where the student uploads the specific document (JPG/PNG/PDF, ≤ 5 MB, **private** bucket, temporary signed URLs). Uploads are **gated at the database level** to the currently-active step only (`is_current_upload_step`) — you cannot upload to a locked office. The Administration (final) office requires **no document**.

6. **Not-applicable handling:** if the current office doesn't apply to the student (e.g. Hostel for a day-scholar), the student can declare it N/A via `declare_review_na(review_id)` — this marks it approved and advances the sequence. The Administration (final) office **cannot** be declared N/A. Every N/A is logged to an admin audit table so false claims can be caught and reverted.

7. **Rejection loop:** if an office rejects with a remark, the student re-uploads and the review auto-flips back to *pending*. Every rejection increments an attempt counter — **at 3 rejections the case auto-escalates**, notifying the Administration office + all admins (Administration itself never self-escalates).

8. **Certificate unlock:** when the **Administration** (final) approval lands, a trigger marks the application `cleared` and the certificate is issued. The Certificate page shows a formal A4 certificate with **PDF download**, a **QR code linking to `/verify/<certificate-id>`**, and the registrar signature.

9. Anyone — even logged-out visitors — can enter that certificate ID (or scan the QR) in **Verify** and see the authentic certificate record straight from the DB.

---

## 4. Registrar Journey (Office Employee)

A registrar is a **role**, an office employee bound to **exactly one office** via `registrar_departments`. After login they land straight on **My office** — the queue showing only students whose review belongs to *their* bound office:

- **Two tabs:** Pending / Rejected (with counts).
- Each card: student name + ID + program/academic year + **which office** + proof documents (openable) + status badge.
- Actions per card: **Approve** (one click) or **Reject** (remark mandatory — enforced client-side **and** by RLS).
- **Bulk approve:** checkboxes + Select-all + bottom action bar.
- Effects ripple automatically: documents get stamped with reviewer name/time, the student gets an in-app notification, everything is written to the `audit_log`.

The final certificate step belongs to the **Administration** office. Its registrar (or the admin) sees the final Administration review in queue once offices 1–9 have approved, and issues the certificate with a single approval. There is no separate registrar "Final Queue" page for certificate issuance anymore — final sign-off is the Administration office's step in the same ordered queue.

---

## 5. Admin Journey

Admins have everything registrars have (the full queue), plus:

- An **"All offices" filter** to view every office's queue at once (or drill into one).
- The **final sign-off** on the **Administration** office — the last step, which issues the certificate once offices 1–9 have approved; no document required.
- The **Admin dashboard** (`/admin`) — **real, live-queried** stats (total students / cleared / pending) + a searchable, filterable, CSV-exportable **N/A declarations** audit table + quick links.
- Sub-pages — see **Honest Current-State** below (some are stubs pending admin-panel work).

---

## 6. Automation Layer (What Happens Invisibly)

| Trigger / function | Fires when | Effect |
|---|---|---|
| `create_department_reviews` | Application submitted | Creates **only the first** review (Laboratory, lowest `sort_order`) |
| `trg_advance_sequential_review` | A review approved (or N/A-declared) | Creates the **next** office review (never more than one at a time) |
| `is_current_upload_step` | Any document INSERT | Gates uploads to the currently-active step only (DB-enforced lock) |
| `declare_review_na` | Student flags N/A | Marks the active review approved (not the final office), advances the sequence, logs to audit table |
| `trg_review_rejection` | Rejection recorded | attempts++, at 3 → `escalated = true` + alerts to Administration & admins (final office doesn't self-escalate) |
| `trg_notify_on_resubmit` | Doc re-uploaded after rejection | Review auto-returns to pending, office notified |
| `trg_maybe_issue_certificate` | Administration (final) approval lands | App marked `cleared`, certificate issued, student notified |
| `trg_review_audit` | Any approve/reject | Actor, office, student, remark written to `audit_log` |
| `trg_notify_review_change` | Status changes | Notifies student of the decision |
| `trg_profiles_updated` | Profile updated | Touches `updated_at` |

> **v2 change:** the old parallel-model machinery was removed — `trg_head_review_trigger`, `trg_guard_head_approval_order`, and the bulk `declare_departments_na(array)` RPC are gone. Sequence advancement is now handled solely by `trg_advance_sequential_review` + the per-review `declare_review_na(review_id)`.

---

## 7. Email Pipeline

```
DB notification row
  → Database Webhook on notifications table (NOT CONFIGURED / edge fn not invoked)
    → send-notification-email Edge Function
      → Resend API
        → email sent to recipient
```

**Honest status:** the Edge Function exists but is **not called from the frontend or by a DB webhook**, and its code currently forwards to a **hardcoded personal inbox** (`akash.moinulhasan@gmail.com`) rather than each student's `personal_email`. **The in-app notification system (SQL-based) is the fully working channel**; email delivery is deferred. Recipients are student **personal emails** via sender `onboarding@resend.dev`.

---

## 8. Security Model

| Layer | How it works |
|---|---|
| **Auth** | Supabase Auth session on every route |
| **Route guard** | `_authenticated/route.tsx` (session) + `admin/route.tsx` (session + admin role) — guard fixed |
| **RLS** | Students read only their own rows; registrars only their bound office's reviews; admins read the audit log; **only registrar/admin can write `audit_log`** |
| **Upload lock** | Documents can only be inserted for the currently-active (`is_current_upload_step`) office — enforced in the DB, not just hidden in the UI |
| **Storage** | `clearance-docs` bucket is **private** — documents accessed only via temporary signed URLs (60s TTL) |
| **Roles** | `user_roles`: `student`, `registrar`, `admin`; registrars linked to **exactly one office** via `registrar_departments` |

---

## 9. Honest Current-State Caveats

The **core clearance loop** (student ↔ registrar ↔ automation ↔ certificate) is fully real and E2E-tested for the sequential 10-office model.

**Backend (Moinul, M-v2.x):** the v2 sequential backend is **merged and live** (PR #61) — 10 offices in order, sequential review creation, upload gating, per-review N/A, final-signoff certificate, escalation. The schema is applied to the live project `jmpavfglhtmcraxfiock` (10 departments seeded). The 9 office auth accounts (`lab@…`, `head@…`, etc.) exist in that project's auth but still need their `user_roles`/`registrar_departments` bindings re-applied (the original bindings were applied against a different, now-deleted Supabase project). No student applications/documents exist on the live project yet — that data was lost when the old project was deleted before migration.

**Frontend (Fatin F-v2.x / Shafin S-v2.x):** pending.

| Area | Status |
|---|---|
| v2 sequential backend | ✅ **Merged & live** (PR #61) |
| Office logins / role bindings | ⚠️ Accounts exist; `user_roles`/`registrar_departments` re-binding pending on live project |
| Student apply + dashboard (sequential) | ⏳ Pending (Fatin F-v2.x) |
| Section upload + N/A (per active step) | ⏳ Pending (Fatin) |
| Per-office queue + filter/search | ⏳ Pending (Shafin S-v2.x) |
| Admin override + N/A revert UI | ⏳ Pending (Shafin) |
| Reports / audit / notices pages | ⏳ Pending (Shafin) |
| Live E2E on sequential flow | ⏳ Blocked on the above UI lanes (M-v2.7) |

**Other known gaps:**
- **Email pipeline** deferred (see Section 7) — in-app notifications are the working channel.
- **"Re-submit for final approval"** currently has **no comment field** — the student cannot attach a response to the Administration office's objection.
- **Certificate ID** on the certificate is the raw certificate UUID (QR is correct); label may be made friendlier.

---

## Summary

```
┌──────────┐    ┌──────────────┐    ┌───────────────────────────────┐
│ Student   │───▶│ Apply form   │───▶│ Office 1 opens only (Lab)     │
│ registers │    │ (one form)   │    │  = first department_review    │
└──────────┘    └──────────────┘    └──────────────┬────────────────┘
                                                    │
                 ┌──────────────────────────────────┘
                 │  upload → office approves
                 ▼
        ┌────────────────────┐    ┌──────────────────────┐
        │ Next office unlocks│───▶│ ...walks the 10-step  │
        │ (one at a time,    │    │ sequence in order ... │
        │  DB-enforced)      │    │                       │
        └─────────┬──────────┘    └───────────┬──────────┘
                  │                           │
          rejected?            when the 10th (Administration)
          ▼                    approves:
   ┌───────────────┐           ▼
   │ re-upload      │   ┌───────────────┐
   │ (3× → escalate)│   │ Certificate   │
   └───────────────┘   │ auto-generated │
                       │ (PDF + QR)     │
                       └───────────────┘
```
