# 📋 NITER Clearance Portal — Snapshot

> **Last updated:** 2026-09-06 · **Phase:** v2 pivot in planning (teacher + physical form) · **Progress:** ~0%

---

### Legend

✅ Done · 🚧 In progress · ⬜ Not started · 🔒 Blocked · ♻️ Re-scoped · 🗑 Dropped

---

## 🧭 v2 — The pivot (teacher's suggestion + physical clearance form)

The live system reviews **8 offices in parallel**, finishing with Department Head. The physical
"Student Clearance Form" and the teacher's instruction change the model to **10 sequential
sections** with a strict order and a backend-enforced lock. Each office keeps **its own login
role** — a registrar staff account reviews only the office (queue) they are assigned to.

### Decisions locked

1. **v2 is #1 priority.** Previous 13 tasks are re-mapped onto it — kept where they survive,
   dropped where obsolete (asked + confirmed).
2. **Purge all test data** — clean-slate migration (applications/reviews/documents/certificates/
   notifications/audit_log/registrar_departments wiped, departments re-seeded).
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
   variant rows, no `profiles.gender`.** Each registrar account is bound to one of the 10 offices
   (single `registrar_departments` row); the queue filters to that office; admin sees all offices
   and is superior over all.

### The clearance office model (10 offices)

`sleep_order` = position 1–10. `is_final_signoff = true` on **Administration** only → certificate
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

### One login role per office (teacher's instruction)

The teacher asked to keep a login role for **every office**. No per-program/per-gender logins are
needed — each office section gets one login identity:

- A registrar staff account is bound to **exactly one of the 10 offices** via a single
  `registrar_departments` row (enforced in the Users page, **S-v2.2**).
- After sign-in, the registrar lands on that office's queue **only** (e.g. Laboratory staff see
  the Laboratory queue, Accounts staff see the Accounts queue) — same as the registrar/reviewer
  model today, applied to all 10 offices.
- **Admin is superior over all** — same as now: full queue visibility + the Administration (final)
  step + user/office management.
- No separate login page or URL per office — one shared sign-in box; the assigned role routes the
  staff member to their office.

---

## 🎯 Task distribution (v2)

Split by each teammate's established lane. Build order: **Moinul PR A (backend) first**, then
**Fatin (student) + Shafin (admin) in parallel**, then Moinul integration + docs.

### 🟦 Moinul — Backend, migrations, integration, docs

- ⬜ **M-v2.1** Migration `20260906000000_v2_sequential_clearance.sql`:
  re-seed **10 office rows** (no `program`/`gender` columns); `is_final_signoff` → Administration;
  drop legacy 8 rows (accounts/admin/coordinator/hostel/security/library/lab/head UUIDs).
- ⬜ **M-v2.2** Program normalization (legacy full name → CSE; NULL → CSE default or excluded) +
  purge data (truncate all test records as decided). **No `profiles.gender` column.**
- ⬜ **M-v2.3** Review-creation triggers: `create_department_reviews()` creates **only the first
  office** on submit; new AFTER-UPDATE trigger creates the **next** office's review on approval
  (skips N/A auto-approvals). Drop obsolete `guard_head_approval_order` + `trigger_head_review` +
  `triggered` flag semantics.
- ⬜ **M-v2.4** **Upload RLS gate** on `documents` INSERT: reject uploads to any review that is not
  the student's current unlocked step (no smaller-position non-approved review exists). Backend-enforced,
  not UI-only.
- ⬜ **M-v2.5** Replace `declare_departments_na(uuid, text[])` → `declare_review_na(review_id uuid)`
  (per-office, only on the active unlocked review). Keep `reopen_na_review` + `reopen_rejected_review`.
- ⬜ **M-v2.6** Regenerate `supabase/types.ts` (new columns + RPC). Verify with
  `npx tsc --noEmit` + `npx vite build` + live spot-checks.
- ⬜ **M-v2.7** Integration pass — fix RLS/sequencing edges surfaced by UI PRs; end-to-end happy +
  critical path on live.
- ⬜ **M-v2.8** Remove dead code from the 8-office model + obsolete copy; final cleanup.

### 🟩 Fatin — Student / certificate lane

- ⬜ **F-v2.1** Apply page: **program** dropdown (strict 5); **remove** gender field (no gender in
  schema), thesis/supervisor/graduation fields, and the "Departments not applicable" multi-check
  block; update "parallel review" copy → sequential.
- ⬜ **F-v2.2** Dashboard → **sequential stepper**: locked / active / approved / N-A per step;
  locked office shows **"Clearance not received from [X] office"**; progress bar now = step position.
  (absorbs old **F5** timeline, **F16** "Uploaded", **F11** email greeting)
- ⬜ **F-v2.3** Section page: lock state (no upload) when office not yet unlocked; **"I have no
  record at [office]"** N/A button on the active office; remove hardcoded "7/8" and
  "Department Head final" strings. (absorbs **F20** resubmit comment + **F14** delete countdown)
- ⬜ **F-v2.4** Guide/help + marketing copy: rewrite the 24 hardcoded "Department Head / 7/8 /
  parallel" strings in `guide.tsx`, `about.tsx`, `index.tsx` for the sequential model.
- ✅ Certificate + verify pages — unchanged (issuance now fired by Administration approval trigger).

### 🟨 Shafin — Office / admin panel lane

- ⬜ **S-v2.1** **Office Editor** (`/admin/workflow` re-scoped): CRUD over the 10 offices — name,
  requirement, document_hint, sort_order, final-signoff toggle. Single source of truth =
  `departments`. (replaces old **S7** workflow_steps CRUD)
- ⬜ **S-v2.2** **Users page** (`/admin/users`, **S1**): real CRUD + role management; **enforce
  exactly one office per staff** (single `registrar_departments` row) — this IS the teacher's
  "every office has its own login role".
- ⬜ **S-v2.3** Queue: filters to the staff's **single assigned office** + **S8** search/pagination
  + **S9** rejection history + **S10** bulk summary toast.
- ⬜ **S-v2.4** Admin index: **S6** override approve/reject (mandatory reason + audit_log) +
  **S14** N/A revert button (calls live `reopen_na_review` RPC).
- ⬜ **S-v2.5** Reports/Audit/Notices: verify against the new 10-office set (mostly automatic via FK
  joins); fix any label/count drift.

### Dropped / superseded (confirmed with owner)

| Task | Verdict |
|------|---------|
| **F13** thesis/graduation on profile | 🗑 Dropped (thesis fields removed with Course Coordinator → Exam Section) |
| Old N/A-at-submit multi-check flow | 🗑 Replaced by per-office N/A (F-v2.1/F-v2.3) |
| Old "parallel fan-out" review creation | 🗑 Replaced by sequential creation (M-v2.3) |
| `triggered` / "7/8 approval" concept | 🗑 Obsolete in sequential model |
| **S7** workflow_steps CRUD | ♻️ Re-scoped → Office Editor (S-v2.1) |
| Program/gender variant rows (19-office model) | 🗑 Dropped — one login per office section, 10 offices (decision 7) |

---

## 📊 Progress

| Member | Lane | v2 done | v2 remaining |
|--------|------|---------|--------------|
| Moinul | Backend/infra/docs | ✅ 0 | ⬜ 8 (M-v2.1–M-v2.8) |
| Fatin | Student/certificate | ✅ 1 (certificate unchanged) | ⬜ 4 (F-v2.1–F-v2.4) |
| Shafin | Admin panel/queue | ✅ 0 | ⬜ 5 (S-v2.1–S-v2.5) |

---

## 🔧 Migrations required (in order)

| # | File | Purpose |
|---|------|---------|
| 1 | `20260906000000_v2_sequential_clearance.sql` | departments re-seed (10 offices) + final-signoff move |
| 2 | (same migration) | program normalization + **test-data purge** |
| 3 | (same migration) | sequential review triggers (replace fan-out/head-trigger) |
| 4 | (same migration) | documents upload RLS gate |
| 5 | (same migration) | `declare_review_na(review_id)` replaces bulk NA RPC |

Older migrations stay as historical record — never edit applied migrations.

---

## 📝 Work history

- **Migration: 10-office reseed (M-v2.1):** completed via PR #60.


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

## ⚠️ Known gaps (carried into v2)
- `declare_review_na` only works on the unlocked active office after M-v2.5 — day-scholar Hostel
  N/A must wait until step 3 unlocks (by design, mirrors the paper form).
- Legacy program values sealed by M-v2.2; existing students with NULL program need a value set
  (or excluded from test data purge scope).
- No gender/program routing exists — all 10 offices review every student (decided, decision 7).