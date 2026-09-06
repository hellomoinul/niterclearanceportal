# 📋 NITER Clearance Portal — Snapshot

> **Last updated:** 2026-09-06 · **Phase:** v2 pivot in planning (teacher + physical form) · **Progress:** docs set, work not started

---

### Legend

✅ Done · 🚧 In progress · ⬜ Not started · 🔒 Blocked · ♻️ Re-scoped · 🗑 Dropped

---

## 🧭 v2 — The pivot (teacher's suggestion + physical clearance form)

The live system reviews **8 offices in parallel**, finishing with Department Head. The physical
"Student Clearance Form" and the teacher's instruction change the model to **10 sequential
sections** with a strict order, program/gender-specific variants, and a backend-enforced lock.

### Decisions locked

1. **v2 is #1 priority.** Previous 13 tasks are re-mapped onto it — kept where they survive,
   dropped where obsolete (asked + confirmed).
2. **Purge all test data** — clean-slate migration (applications/reviews/documents/certificates/
   notifications/audit_log/registrar_departments wiped, departments re-seeded).
3. **N/A is declared per-office, only when that office unlocks** (day-scholar → Hostel).
4. **Drop F13 + thesis fields** — Course Coordinator is gone; Exam Section checks exam/transcript,
   not thesis. `thesis_title`, `supervisor_name`, `expected_graduation` removed from apply form + schema.
5. **S7 Workflow page re-scoped** — becomes an **Office Editor** over the 19 office rows
   (no more decorative `workflow_steps` list).
6. **Strict 5-program dropdown** (TE / IPE / FDAE / CSE / EEE) — normalize legacy values
   (`Computer Science & Engineering` → CSE) so Lab/Dept-Head routing is reliable.

### The physical-form office model (19 office rows)

`sleep_order` = position 1–10. Variants share a section's position. `is_final_signoff = true` on
**Administration** only → certificate issues when Administration approves, not Department Head.

| pos | Section | Rows | program | gender |
|-----|---------|------|---------|--------|
| 1 | Laboratory | 5 | TE/IPE/FDAE/CSE/EEE | – |
| 2 | Dept. Head | 5 | TE/IPE/FDAE/CSE/EEE | – |
| 3 | Hostel Superintendent | 2 | – | Male / Female |
| 4 | Proctor Office | 1 | – | – |
| 5 | Store | 1 | – | – |
| 6 | Library | 1 | – | – |
| 7 | Caretaker & Security Inspector | 1 | – | – |
| 8 | Exam Section | 1 | – | – |
| 9 | Accounts Section | 1 | – | – |
| 10 | Administration | 1 | – | – **(final sign-off)** |

**Total = 19 department rows.** Each student's route = 7 universal offices + their 1 Lab variant +
their 1 Head variant + their 1 Hostel variant = **10 steps**, walked strictly in order.

### Terminology changes vs. the old model

| Old (8 offices) | New (10 sections) |
|-----------------|-------------------|
| Lab / Workshop | Laboratory (×5 program) |
| Department Head (final) | Dept. Head (×5 program), now position 2 |
| Hostel | Hostel Superintendent (×2 gender) |
| — | **Proctor Office** (new) |
| — | **Store** (new) |
| Library | Library |
| Security | Caretaker & Security Inspector |
| Course Coordinator | Exam Section |
| Accounts | Accounts Section |
| Admin (position 2) | Administration (position 10, **final**) |

---

## 🎯 Task distribution (v2)

Split by each teammate's established lane. Build order: **Moinul PR A (backend) first**, then
**Fatin (student) + Shafin (admin) in parallel**, then Moinul integration + docs.

### 🟦 Moinul — Backend, migrations, integration, docs

- ⬜ **M-v2.1** Migration `20260906000000_v2_sequential_clearance.sql`:
  add `departments.program text NULL`, `departments.gender text NULL`; re-seed 19 rows;
  `is_final_signoff` → Administration; drop legacy 8 rows (accounts/admin/coordinator/hostel/
  security/library/lab/head UUIDs).
- ⬜ **M-v2.2** `profiles.gender text` column + **program normalization** (legacy full name → CSE;
  NULL → CSE default or excluded) + purge data (truncate all test records as decided).
- ⬜ **M-v2.3** Review-creation triggers: `create_department_reviews()` creates **only the first
  eligible office** on submit (variant resolved by program/gender); new AFTER-UPDATE trigger creates
  the **next** office's review on approval (skips N/A auto-approvals). Drop obsolete
  `guard_head_approval_order` + `trigger_head_review` + `triggered` flag semantics.
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

- ⬜ **F-v2.1** Apply page: add **gender** field (purpose-stated: routes Hostel Superintendent) +
  **program** dropdown (strict 5); **remove** thesis/supervisor/graduation fields; **remove** the
  "Departments not applicable" multi-check block; update "parallel review" copy → sequential.
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

- ⬜ **S-v2.1** **Office Editor** (`/admin/workflow` re-scoped): CRUD over the 19 offices — name,
  requirement, document_hint, sort_order, program/gender assignment, final-signoff toggle.
  Single source of truth = `departments`. (replaces old **S7** workflow_steps CRUD)
- ⬜ **S-v2.2** **Users page** (`/admin/users`, **S1**): real CRUD + role management; **enforce
  exactly one office-variant per staff** (single `registrar_departments` row per staff).
- ⬜ **S-v2.3** Queue: **variant-aware filtering** (staff sees only their assigned office/`gender`)
  + **S8** search/pagination + **S9** rejection history + **S10** bulk summary toast.
- ⬜ **S-v2.4** Admin index: **S6** override approve/reject (mandatory reason + audit_log) +
  **S14** N/A revert button (calls live `reopen_na_review` RPC).
- ⬜ **S-v2.5** Reports/Audit/Notices: verify against the new 19-row set (mostly automatic via FK
  joins); fix any label/count drift.

### Dropped / superseded (confirmed with owner)

| Task | Verdict |
|------|---------|
| **F13** thesis/graduation on profile | 🗑 Dropped (thesis fields removed with Course Coordinator → Exam Section) |
| Old N/A-at-submit multi-check flow | 🗑 Replaced by per-office N/A (F-v2.1/F-v2.3) |
| Old "parallel fan-out" review creation | 🗑 Replaced by sequential creation (M-v2.3) |
| `triggered` / "7/8 approval" concept | 🗑 Obsolete in sequential model |
| **S7** workflow_steps CRUD | ♻️ Re-scoped → Office Editor (S-v2.1) |

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
| 1 | `20260906000000_v2_sequential_clearance.sql` | departments re-seed (19 rows) + program/gender columns + final-signoff move |
| 2 | (same migration) | profiles.gender + program normalization + **test-data purge** |
| 3 | (same migration) | sequential review triggers (replace fan-out/head-trigger) |
| 4 | (same migration) | documents upload RLS gate |
| 5 | (same migration) | `declare_review_na(review_id)` replaces bulk NA RPC |

Older migrations stay as historical record — never edit applied migrations.

---

## 📝 Work history

### 2026-09-06 — v2 pivot planning (docs)
- Read revised plan `niter_clearance_portal_revised_plan_v2.md` (teacher + physical form).
- Audited live DB + migrations + all frontend touchpoints; confirmed `profiles` has no gender,
  8 legacy offices, parallel fan-out trigger, `is_final_signoff` on `head`.
- Locked 6 scope decisions with owner (priority, data purge, per-office N/A, drop F13, S7
  re-scope → Office Editor, strict 5-program dropdown).
- Documented v2 task distribution (M-v2.x / F-v2.x / S-v2.x) across all lanes.
- Updated `README.md`, `UI Guide.md`, `AGENTS.md`, `Snapshot.md` for the sequential model.

### Earlier
- Admin panel completion (PRs #53–#57), env example (PR #58), Shafin local-repo re-sync.
- See git history for the full log up to v2.

---

## ⚠️ Known gaps (carried into v2)
- `declare_review_na` only works on the unlocked active office after M-v2.5 — day-scholar Hostel
  N/A must wait until step 3 unlocks (by design, mirrors the paper form).
- Legacy program values sealed by M-v2.2; existing students with NULL program need a value set
  (or excluded from test data purge scope).
- No gender anywhere in the current schema — collected fresh at apply time (F-v2.1), not retroactively.