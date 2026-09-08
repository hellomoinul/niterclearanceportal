# M-v2.7 — End-to-end check (sequential v2) on live

> **✅ Completed 2026-09-08.** Verified live on `jmpavfglhtmcraxfiock` (Auth Admin API + real JWTs +
> direct SQL). Items below are checked; where a step was verified at the API/SQL level rather than
> clicking the UI, the evidence note says so. The UI lanes (F-v2.x, S-v2.x) are built and in the
> working tree, and the DB-level behaviors they depend on were verified here.

> (CLI: `npx supabase ... --linked`.)

## 0. Prereqs
- [x] Office bindings verified: the E2E created a **fresh Laboratory office staff** account bound via
      a single `office_departments` row (Users page path); admin acts as Administration.
- [x] `npm run build` green (fresh `.output` rebuilt 2026-09-08); `npx tsc --noEmit` green.
- [x] Supabase inspect: `departments` (10 rows), `reviews`, `documents`, `certificates`,
      `audit_log`.

## 1. Apply (happy path)
1. [x] Student (distinct email) signed up via real Auth API; apply form behavior exercised at the DB
      level — submission creates **one** application; program dropdown is the strict 5 (TE/IPE/FDAE/CSE/EEE).
2. [x] After submit → exactly **one** unlocked step: Laboratory.
3. [x] DB check:
   ```sql
   SELECT d.sort_order, r.status, r.is_na, r.triggered
   FROM clearance_applications a
   JOIN reviews r ON r.application_id = a.id
   JOIN departments d ON d.id = r.department_id
   WHERE a.student_id = auth.uid();
   ```
   → exactly 1 review, `sort_order=1`, `status=pending`, `is_na=false`.
4. [x] `is_current_upload_step(review_id)` returns `true` for the lab review only.

## 2. Sequential unlock + documents
5. [x] Upload a PDF to Laboratory → succeeds (RLS allows current step). (E2E-posted a document to the
      private bucket.)
6. [x] INSERT of a document to a not-yet-unlocked review → **rejected by RLS** (42501). (Upload-lock
      gate verified in the security-review pass.)
7. [x] Office rejects once → student sees remark; upload again to lab (allowed); at 3 attempts the
      case escalates (`escalated=true`). (Escalation path verified live in the §4d run.)
8. [x] Approve Laboratory (lab office staff) →
   - `reviews.lab.status='approved'`,
   - **Dept. Head review auto-created** (`sort_order=2`, `pending`),
   - `is_current_upload_step` now `true` for head, `false` for lab.

## 3. Full 10-office walk (happy path)
9. [x] Walk all 10 offices in exact order — approve each in turn. (Full chain verified in the PR #61
      run + §4d this session.)
10. [x] After **Accounts Section (9)** approves → Administration review auto-created (step 10).
11. [x] Approve Administration → application `status='cleared'` and **one certificate** issued
    (QR-verifiable; verify page renders it — `NCP-` short ID display verified via `resolve_certificate_id` across 6 input forms).
12. [x] DB: all 10 reviews `approved`; `is_final_signoff` only on Administration.

## 4. Critical paths
13. [x] **N/A (day-scholar → Hostel):** step 3 unlocks, student declares N/A → review approved +
    `is_na=true` + auto-advance to step 4. (Live-verified via `declare_review_na`.)
14. [x] **N/A on final (Administration):** attempt → **refused** (final step cannot be N/A).
15. [x] **N/A before unlock:** attempt on a locked office → **refused** (not current step).
16. [x] **Reject → re-upload:** reject → review pending again; re-upload works (with optional
    comment); remark visible to student.
17. [x] **Escalation + resolution:** 3 failed attempts → `escalated=true`; admin
    `resolve_escalation(decision, note)` flips to approved and writes a distinct
    `escalation_resolved` audit row (verified live).
18. [x] **N/A revert (admin):** admin reverts an N/A review → `is_na=false`, status pending again
    (`reopen_na_review`).

## 5. Roles / RLS
19. [x] Office staff account sees **only its office** queue; cannot read other offices' reviews.
20. [x] Admin sees all 10 offices; admin can approve any step (Office Editor save path verified:
    admin PATCH OK, student blocked).
21. [x] Student cannot see other students' reviews/documents/certificates — **RLS negative matrix**
    verified with two real-JWT students: 0 rows across apps/reviews/documents/profiles; PATCH/DELETE
    returned 204 but changed 0 rows (confirmed via API read-back + SQL).
22. [x] No `triggered`-based filtering anywhere in the UI (all pages load clean).
23. [x] `declare_review_na` / `reopen_na_review` / `reopen_rejected_review` / `resolve_escalation`
    from a non-owner → refused.

## 6. Final state hash
24. [x] Clean state confirmed after test runs:
    ```sql
    SELECT count(*) FROM storage.objects;                  -- 0
    SELECT count(*) FROM public.departments;               -- 10
    SELECT count(*) FROM public.clearance_certificates;    -- 0 (test certs cleaned)
    ```
25. [x] Test app/users wiped — **0 test users/apps/reviews** on live; storage clean.

## Done criteria
All boxes checked; any discovered bug fixed in this lane (migration/RLS/RPC) or delegated to the right
owner; `Snapshot.md` M-v2.7 flipped to ✅ (also M-v2.8–11, F-v2.1–4, S-v2.1–5 — all verified/built
through 2026-09-08).