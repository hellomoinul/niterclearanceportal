# 📋 NITER Clearance Portal — Snapshot

> **Last updated:** 2026-09-11 · **Phase:** v2 live (post-review hardening) + email-notification fix shipped · **Progress:** ~70%

---

### Legend

✅ Done · 🚧 In progress · ⬜ Not started · 🔒 Blocked · ♻️ Re-scoped · 🗑 Dropped

---

## 🧭 v2 — The pivot (teacher's suggestion + physical clearance form)

The old system reviewed **8 offices in parallel**, finishing with Department Head. The physical
"Student Clearance Form" and the teacher's instruction change the model to **10 sequential
sections** with a strict order and a backend-enforced lock. Each office keeps **its own login
role** — an Office staff account reviews only the office (queue) they are assigned to.

### Decisions locked

1. **v2 is #1 priority.** Previous 13 tasks are re-mapped onto it — kept where they survive,
   dropped where obsolete (asked + confirmed).
2. **Purge all test data** — clean-slate migration (applications/reviews/documents/certificates/
   notifications/audit_log/office_departments wiped, departments re-seeded). ✅ done in PR #61.
3. **N/A is declared per-office, only when that office unlocks** (day-scholar → Hostel).
4. **Drop F13 + thesis fields** — Course Coordinator is gone; Exam Section checks exam/transcript,
   not thesis. `thesis_title`, `supervisor_name`, `expected_graduation` removed from apply form + schema.
5. **S7 Workflow page re-scoped** — becomes an **Office Editor** over the 10 office rows
   (no more decorative `workflow_steps` list).
6. **Strict 5-program dropdown** (TE / IPE / FDAE / CSE / EEE) — keep on `profiles` for the
   form/certificate display; **no per-variant routing**.
7. **One login role per office (teacher's instruction).** Exactly 10 office rows — Laboratory,
   Dept. Head, Hostel Superintendent, Proctor Office, Store, Library, Caretaker & Security
   Inspector, Exam Section, Accounts Section, Administration. **No `program`/`gender` columns, no
   variant rows, no `profiles.gender`.** Each Office staff account is bound to one of the 10 offices
   (single `office_departments` row); the queue filters to that office; admin sees all offices
   and is superior over all.

### The clearance office model (10 offices)

`sort_order` = position 1–10. `is_final_signoff = true` on **Administration** only → certificate
issues when Administration approves, not Department Head.

| pos | Office | note |
|-----|--------|------|
| 1 | Laboratory | |
| 2 | Dept. Head | |
| 3 | Hostel Superintendent | |
| 4 | Proctor Office | |
| 5 | Store | |
| 6 | Library | |
| 7 | Caretaker & Security Inspector | |
| 8 | Exam Section | |
| 9 | Accounts Section | |
| 10 | Administration | **final sign-off → certificate** |

**Every student walks the same 10 offices in strict order** — no variant routing.

### Terminology changes vs. the old model

Use this table when rewriting old copy (F-v2.4 / M-v2.8).

| Old (8 offices) | New (10 sections) |
|-----------------|-------------------|
| Lab / Workshop | Laboratory |
| Department Head (final) | Dept. Head, now position 2 |
| Hostel | Hostel Superintendent |
| — | **Proctor Office** (new) |
| — | **Store** (new) |
| Library | Library |
| Security | Caretaker & Security Inspector |
| Course Coordinator | Exam Section |
| Accounts | Accounts Section |
| Admin (position 2) | Administration (position 10, **final**), reviewed by the admin role |

### Login model (one role per office)

- An Office staff account is bound to **exactly one of the 10 offices** via a single
  `office_departments` row (enforced in the Users page, **S-v2.2**).
- After sign-in, the Office staff member lands on that office's queue **only**; **Admin is superior over
  all** — full queue visibility + the Administration (final) step + user/office management.
- No separate login page or URL per office — one shared sign-in box; the assigned role routes the
  staff member to their office.

---

## 🎯 Task distribution (v2)

Build order: **Moinul PR #61 (backend) ✅ shipped**, then **Fatin (student) + Shafin (admin) in
parallel**, then **Moinul integration + docs (M-v2.7 / M-v2.8) + review hardening (M-v2.9–11)**.
All lanes are ✅ as of 2026-09-08.

### 🟦 Moinul — Backend, migrations, integration, docs

- ✅ **M-v2.1** Migration `20260906000000_v2_sequential_clearance.sql`:
  re-seed **10 office rows** (no `program`/`gender` columns); `is_final_signoff` → Administration;
  drop legacy 8 rows (accounts/admin/coordinator/hostel/security/library/lab/head UUIDs).
- ✅ **M-v2.2** Program normalization (legacy full name → CSE) + data purge (all test records). ✅
  **No `profiles.gender` column.**
- ✅ **M-v2.3** Review-creation triggers: `create_department_reviews()` creates **only the first
  office** on submit; AFTER-UPDATE trigger creates the **next** office's review on approval.
  Dropped obsolete `guard_head_approval_order` + `trigger_head_review` machinery (kept the
  `triggered` column for the interim UI — removal lands in M-v2.8).
- ✅ **M-v2.4** **Upload RLS gate** on `documents` INSERT via `is_current_upload_step(review_id)`:
  rejects uploads to any review that is not the student's current unlocked step. Backend-enforced,
  not UI-only.
- ✅ **M-v2.5** Replaced `declare_departments_na(uuid, text[])` → `declare_review_na(review_id uuid)`
  (per-office, only on the active unlocked review). Kept `reopen_na_review` + `reopen_rejected_review`.
- ✅ **M-v2.6** Regenerated `src/integrations/supabase/types.ts` (new columns + RPC). Verified with
  `npx tsc --noEmit` + `npx vite build` + live spot-checks.
- ✅ **M-v2.7** Integration pass — security-review fixes + end-to-end on live: authenticated E2E
  (apply → **only Laboratory review** created → upload → Lab approves → Dept. Head review
  auto-created), **RLS negative matrix** (cross-student reads 0 rows; PATCH/DELETE no-op; data
  intact via API + SQL), and a **secret-value grep** across all 169 built bundle files (clean).
  Checklist: `scripts/e2e-v2-checklist.md`.
- ✅ **M-v2.8** Dead-code + copy cleanup — 8-office leftovers/obsolete strings removed; the
  decorative `workflow_steps` **table + policy dropped** (migration `20260908000003`), types
  regenerated, bundle rebuilt (no `workflow_steps`). Storage purge of orphaned `clearance-docs`
  objects already done (✅ 22 objects removed).
- ✅ **M-v2.9** Registrar→office rename (migration `20260907000000_rename_registrar_to_office.sql`);
  thesis/supervisor/graduation fields dropped from schema + apply/settings
  (migration `20260908000000_drop_thesis_fields.sql`). Applied live.
- ✅ **M-v2.10** Resubmit comments + escalation audit —
  `reopen_rejected_review(review_id, p_comment)` and `resolve_escalation(app, decision, note)`
  writing a distinct **`escalation_resolved`** audit row (migration
  `20260908000001_resubmit_comment_and_escalation.sql`). Verified live — audit rows
  `review_rejected` / `review_approved` / `escalation_resolved`; state approved, escalated=false.
- ✅ **M-v2.11** Certificate display ID — `formatCertificateId()` → `NCP-<first 8 hex>`, shown on
  the certificate with the full UUID beneath, and `resolve_certificate_id(code)` accepting full
  UUID / `NCP-` code / bare 8-hex (migration `20260908000002_certificate_display_id.sql`).
  Verified live across 6 input forms via anon REST.

### 🟩 Fatin — Student / certificate lane

- ✅ **F-v2.1** Apply page: **program** dropdown (strict 5); **remove** gender field (no gender in
  schema), thesis/supervisor/graduation fields, and the "Departments not applicable" multi-check
  block; update "parallel review" copy → sequential.
- ✅ **F-v2.2** Dashboard → **sequential stepper**: locked / active / approved / N-A per step;
  locked office shows **"Clearance not received from [X] office"**; progress bar now = step position.
  (absorbs old **F5** timeline, **F16** "Uploaded", **F11** email greeting)
- ✅ **F-v2.3** Section page: lock state (no upload) when office not yet unlocked; **"I have no
  record at [office]"** N/A button on the active office; remove hardcoded "7/8" and
  "Department Head final" strings. (absorbs **F20** resubmit comment + **F14** delete countdown)
- ✅ **F-v2.4** Guide/help + marketing copy: rewrite the 24 hardcoded "Department Head / 7/8 /
  parallel" strings in `guide.tsx`, `about.tsx`, `index.tsx` for the sequential model.
- ✅ Certificate + verify pages — updated for the `NCP-` display ID (`verify.$code.tsx` +
  `certificate.tsx`); issuance fired by Administration approval trigger.

### 🟨 Shafin — Office / admin panel lane

- ✅ **S-v2.1** **Office Editor** (`/admin/workflow` re-scoped): CRUD over the 10 offices — name,
  requirement, document_hint, sort_order, final-signoff toggle. Single source of truth =
  `departments`. (replaces old **S7** workflow_steps CRUD) — built as a `sort_order` editor with
  up/down reorder + exactly-one final-signoff toggle; save path E2E-verified live.
- ✅ **S-v2.2** **Users page** (`/admin/users`, **S1**): real CRUD + role management; **enforce
  exactly one office per staff** (single `office_departments` row) — this IS the teacher's
  "every office has its own login role". Re-binds staff to offices (used to provision the E2E
  Lab office account).
- ✅ **S-v2.3** Queue: filters to the staff's **single assigned office** + **S8** search/pagination
  + **S9** rejection history + **S10** bulk summary toast.
- ✅ **S-v2.4** Admin index: **S6** override approve/reject (mandatory reason + audit_log) +
  **S14** N/A revert button (calls live `reopen_na_review` RPC).
- ✅ **S-v2.5** Reports/Audit/Notices: verified against the new 10-office set (FK joins); labels/
  counts current.

### 🟨 Shafin — Round 2: Admin UX polish (assigned 2026-09-11)

10 tasks from the `/admin` UI/UX review. Each has a **What** (problem) and **How**
(implementation). Branch pattern: `shafin/admin-r2-<task-id>`; tag the PR title with the
task ID (e.g. `[S-v2.8] ...`) so doc-sync marks it done automatically.

- ⬜ **S-v2.6** Password-reset never notifies the user —
  **What:** `admin_reset_password` updates the password silently; only the admin sees a toast.
  **How:** (a, recommended) use Supabase recovery — generate link via RPC or edge call, email
  it via `send-notification-email`; user sets their own password. (b, minimal) show the new
  password clearly in the toast, add an `audit_log` row, and replace `window.prompt` with a
  Dialog in `admin/users.tsx`.

- ⬜ **S-v2.7** Audit "Entity" column is useless —
  **What:** Every row shows `department_review`; the real `entity_id` is hidden.
  **How:** in `admin/audit.tsx`, render `entity · <first 8 hex of entity_id>` with full uuid as
  a `title` tooltip; or drop the column and rely on Details.

- ⬜ **S-v2.8** Notice delete has no confirmation —
  **What:** single-click, no undo.
  **How:** wrap the delete button in `admin/notices.tsx` with `AlertDialog` (component exists);
  keep the sonner toast on success.

- ⬜ **S-v2.9** N/A filters dead when empty + stat label wrong —
  **What:** Dept dropdown is derived from loaded rows → only "All departments" when 0 declarations;
  "Total Students" counts accounts, not applications.
  **How:** hide search + dept filter when no N/A rows in `admin/index.tsx`; relabel stat to
  "Registered students" with subtle "(accounts, not applications)".

- ⬜ **S-v2.10** Dashboard quick-links duplicate the tab bar —
  **What:** 5 cards ≡ 5 tabs, pure duplication.
  **How:** replace the card grid in `admin/index.tsx` with a live "needs attention" panel
  (escalated count, oldest pending N/A, last 5 audit rows).

- ⬜ **S-v2.11** Conflicting metrics across pages —
  **What:** Dashboard uses application counts (Cleared/Pending); Reports uses review-level counts
  (Approved/Pending) — same labels, different numbers.
  **How:** align units and add explicit labels ("Pending applications", "Pending reviews") in
  `admin/index.tsx` + `admin/reports.tsx`.

- ⬜ **S-v2.12** Users page has no pagination —
  **What:** all accounts render at once; scales badly.
  **How:** add page-size (25) + Previous/Next using the `audit.tsx` pattern in `admin/users.tsx`.

- ⬜ **S-v2.13** Reports has no filters despite the copy —
  **What:** promises "academic year statistics" but no date/batch filter.
  **How:** add a date-range or batch selector in `admin/reports.tsx` feeding chart queries;
  default "All time".

- ⬜ **S-v2.14** Audit log hardcoded action list + no date filter —
  **What:** action dropdown lists exactly 4 hardcoded values; no date range.
  **How:** derive options from `select distinct action`; add from/to date filters in
  `admin/audit.tsx`.

- ✅ **S-v2.15** Mixed confirm / prompt / alert patterns —
  **What:** `window.confirm`/`window.prompt`/`alert()` across Workflow + Users; toasts elsewhere.
  **How:** standardize on `AlertDialog`/`Dialog` + sonner in `admin/workflow.tsx`,
  `admin/users.tsx`, `admin/notices.tsx`.

---

### Dropped / superseded (confirmed with owner)

| Task | Verdict |
|------|---------|
| **F13** thesis/graduation on profile | 🗑 Dropped (thesis fields removed with Course Coordinator → Exam Section) |
| Old N/A-at-submit multi-check flow | 🗑 Replaced by per-office N/A (F-v2.1/F-v2.3) |
| Old "parallel fan-out" review creation | 🗑 Replaced by sequential creation (M-v2.3) |
| `triggered` / "7/8 approval" concept | 🗑 Obsolete in sequential model (column kept only for interim UI; removal in M-v2.8) |
| **S7** workflow_steps CRUD | ♻️ Re-scoped → Office Editor (S-v2.1) |
| Program/gender variant rows (19-office model) | 🗑 Dropped — one login per office section, 10 offices (decision 7) |

---

## 📊 Progress

| Member | Lane | v2 done | v2 remaining |
|--------|------|---------|--------------|
| Moinul | Backend/infra/docs | ✅ 11 (M-v2.1–M-v2.11) | — |
| Fatin | Student/certificate | ✅ 5 (F-v2.1–F-v2.4 + cert/verify) | — |
| Shafin | Admin panel/queue | ✅ 5 (S-v2.1–S-v2.5) | — |
| Shafin (round 2) | Admin UX polish | — | 🚧 10 assigned (S-v2.6–S-v2.15) |

---

## 🔧 Migrations — status

| # | File | Purpose | Status |
|---|------|---------|--------|
| 1 | `20260906000000_v2_sequential_clearance.sql` | departments re-seed (10 offices) + final-signoff move | ✅ applied to live (PR #61) |
| 2 | (same migration) | program normalization + **test-data purge** | ✅ applied (PR #61) |
| 3 | (same migration) | sequential review triggers (replace fan-out/head-trigger) | ✅ applied (PR #61) |
| 4 | (same migration) | documents upload RLS gate | ✅ applied (PR #61) |
| 5 | (same migration) | `declare_review_na(review_id)` replaces bulk NA RPC | ✅ applied (PR #61) |
| 6 | `20260907000000_rename_registrar_to_office.sql` | registrar role/route → **office** | ✅ applied to live |
| 7 | `20260908000000_drop_thesis_fields.sql` | thesis/graduation columns dropped | ✅ applied to live |
| 8 | `20260908000001_resubmit_comment_and_escalation.sql` | resubmit comment + `escalation_resolved` audit | ✅ applied to live |
| 9 | `20260908000002_certificate_display_id.sql` | `resolve_certificate_id` (NCP- display ID) | ✅ applied to live |
| 10 | `20260908000003_drop_workflow_steps.sql` | `workflow_steps` table + policy dropped | ✅ applied to live |
| 11 | `20260909120000_normalize_student_ids.sql` | student IDs normalized (canonical `lower(alnum)`) + `profiles_user_code_norm_key` unique index | ✅ applied to live (PR #70) |
| 12 | `20260911140000_notify_office_on_document_upload.sql` | office email fires on document upload (dropped review-open + resubmit notice triggers) | ✅ applied to live (PR #72) |

Older migrations stay as historical record — never edit applied migrations.

---

## 📝 Work history

- **Consistent confirm / toast patterns (S-v2.15):** completed via PR #74.


### 2026-09-11 — Admin UX review, email-notification fix, Fatin QR autofill
- **PR #67** copy fixes re-landed (10-office sequential copy, `/home` active rule) — merged `bb255ac`.
- **PR #68** `/home` route added (`/` redirects there) — merged `6186594`.
- **PR #69** settings save fix — upserts `profiles` so office accounts without a profile row work; 9 office profiles seeded live — merged `ca1db9c`.
- **PR #70** student-ID normalization — canonical IDs (`lower`, alnum), unique index `profiles_user_code_norm_key`, register-time duplicate guard; migration `20260909120000` applied live — merged `3cd4d28`.
- **PR #71** footer address → "Savar, Dhaka-1350, Bangladesh" — merged `7d7608e`.
- **PR #72** office email now fires **on document upload**, not on review-open — dropped `trg_notify_offices_on_review` + `trg_notify_on_resubmit`, added `trg_notify_office_on_document_upload`; 17 stale notifications soft-deleted. Root cause: DB webhook emails the monitoring mailbox for every `notifications` insert — merged `778c28c`.
- **PR #73 (Fatin)** certificate QR now points to `/verify?id=<NCP-…>` and the verify page autofills that code from `?id`/`?code` — merged `8684638`.
- **Admin UI/UX review** (as a designer lens): gaps found → password-reset never notifies the user; Audit "Entity" column is meaningless; notice delete has no confirm; N/A filter is dead when empty; dashboard quick-links duplicate the tab bar; conflicting metrics across pages; no Users pagination; no Reports/Audit filters; mixed confirm/alert patterns. Turned into the Shafin Round-2 task list (S-v2.6–S-v2.15).

### 2026-09-08 — Post-review verification + hardening (REVIEW_RESPONSE round 2)
- **Live authenticated E2E (review §0):** created a student + Laboratory office staff via the Auth
  Admin API (non-browser UA), applied → **only Laboratory review created** (sequential confirmed),
  uploaded a doc, Lab approved → **Dept. Head review auto-created**. Cleaned up after.
- **RLS negative matrix (§4e):** two student accounts with real JWTs — cross-student reads of
  apps/reviews/documents/profiles returned **0 rows**; PATCH/DELETE returned 204 but changed
  **0 rows** (verified via API read-back + direct SQL). Data intact. Grepped all 169 built bundle
  files: **no secret values** (only SDK source text/JSDoc).
- **§4d:** `resolve_escalation` now writes a distinct **`escalation_resolved`** audit row (decision
  + note) alongside the generic trigger row; verified live (`review_rejected` / `review_approved` /
  `escalation_resolved`, state approved/escalated=false). Migration `20260908000001` amended + re-applied.
- **§4b:** certificate display ID — `formatCertificateId()` → `NCP-<first 8 hex>`; shown on the
  certificate with the full UUID beneath; Verify accepts full UUID / `NCP-` code / bare 8-hex via
  `resolve_certificate_id` RPC (migration `20260908000002`). Verified via anon REST across 6 forms
  (all resolve, garbage → null).
- **Office Editor (S-v2.1) + `workflow_steps` drop:** `/admin/workflow` rebuilt as an editor over
  `departments.sort_order` (reorder up/down, exactly-one final-signoff toggle) and the admin index
  link relabeled; `workflow_steps` table + policy **dropped** (migration `20260908000003`); save
  path E2E-verified live (admin PATCH OK, student blocked).
- **Types + build:** `src/integrations/supabase/types.ts` regenerated (resolver added,
  `workflow_steps` removed); `npx tsc --noEmit` + `npm run build` green (fresh `.output`).
- **Data hygiene:** leftover RLS-test users cleaned → **0 test users/apps/reviews** on live.
- `REVIEW_RESPONSE_v2.md` updated: §0/4b/4d/4e/`workflow_steps` all **RESOLVED with evidence**;
  only item 2 (registrar confirmation) + email remain.

### 2026-09-07 — Review-response groundwork (working tree)
- Registrar→office rename migration `20260907000000`; thesis/supervisor/graduation dropped
  (migration `20260908000000`) from schema + apply/settings/profiles copy.
- RLS audited + reworked per the security review; resubmit **comment** field on rejected sections.
- Frontend lanes landed in the working tree: apply/dashboard/section/guide/about/index sequential
  copy, per-office queue, users page (one office per staff), admin override + N/A revert,
  reports/audit/notices.

### 2026-09-06 — v2 backend shipped (M-v2.1 → M-v2.6), via PR #61
- Seeded the 10 offices in teacher order (Laboratory → Administration, final sign-off), normalized
  programs, purged all test data, swapped parallel fan-out for sequential review creation,
  gated uploads to the unlocked step, replaced the bulk N/A RPC with per-review
  `declare_review_na`, regenerated types, minimal apply-page edit to keep the build green.
- Fixed two latent backend bugs discovered live: stale `staff_departments` ref in
  `handle_review_rejection`, and `guard_clearance_status` blocking non-admin office staff from
  completing the final office (cert-issuance flag).
- Purged 22 orphaned `clearance-docs` storage objects (via `storage.allow_delete_query` session
  flag). Repaired the doc-sync action so status flips commit even when a PR merge races the bot.
- Verified on live: submit → only Laboratory; approve/unlock chain across all 10; N/A advance;
  upload RLS rejects non-current steps; full walkthrough issues a certificate.

### 2026-09-06 — v2 pivot planning (docs)
- Read revised plan `niter_clearance_portal_revised_plan_v2.md` (teacher + physical form).
- Audited live DB + migrations + all frontend touchpoints; confirmed `profiles` has no gender,
  8 legacy offices, parallel fan-out trigger, `is_final_signoff` on `head`.
- Locked scope decisions with owner (priority, data purge, per-office N/A, drop F13, S7
  re-scope → Office Editor, strict 5-program dropdown, **one login role per office**).
- Documented v2 task distribution (M-v2.x / F-v2.x / S-v2.x) across all lanes.
- Updated `README.md`, `UI Guide.md`, `AGENTS.md`, `Snapshot.md` for the sequential 10-office
  model; fixed the doc-sync GitHub Action to recognize v2 task IDs.

### Earlier
- Admin panel completion (PRs #53–#57), env example (PR #58), Shafin local-repo re-sync.
- See git history for the full log up to v2.

---

## ⚠️ Known gaps
- **Email pipeline** is wired — DB webhook on `notifications` insert → `send-notification-email` edge function (Resend) to a single monitoring mailbox (`akash.moinulhasan@gmail.com`). Office emails fire **on document upload** (PR #72); known limits: one hardcoded recipient and all office accounts share one `personal_email`.
- **Section 2 collapsed shared-office routing** — the reviewer's alternative model; awaiting
  written confirmation from the registrar. The current sequential model matches the physical form
  and is what ships today (see `REVIEW_RESPONSE_v2.md`, item 2).
- `declare_review_na` only works on the unlocked active office — day-scholar Hostel N/A must wait
  until step 3 unlocks (by design, mirrors the paper form).
- No gender/program routing exists — all 10 offices review every student (decided, decision 7).
- `triggered` column retained in the schema for backward-compat but is **not read by the UI**
  (verified — no `triggered`-based filtering anywhere).
- Live-project auth accounts created for E2E runs are removed after each run — **0 test data**
  on live.