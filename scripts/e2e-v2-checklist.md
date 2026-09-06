# M-v2.7 — End-to-end check (sequential v2) on live

Run after **all** UI lanes land (F-v2.1–F-v2.4, S-v2.1–S-v2.5). Live project: `jmpavfglhtmcraxfiock`
(CLI: `npx supabase ... --linked`).

> ✅ = expected. If a step diverges, capture the DB rows + error and fix before declaring M-v2.7 done.

## 0. Prereqs
- [ ] Staff re-bound: each of the 10 offices has a `registrar_departments` row to a real staff
      account (re-check after S-v2.2).
- [ ] `npm run build` green; app runs locally or deployed.
- [ ] Supabase Studio open on tables: `departments`, `clearance_applications`, `reviews`, `documents`,
      `certificates`, `audit_log`.

## 1. Apply (happy path)
1. New student (distinct email) signs up and finishes the apply form; program dropdown works (TE/IPE/FDAE/CSE/EEE).
2. After submit → dashboard shows **exactly one** unlocked step: Laboratory.
3. DB check:
   ```sql
   SELECT d.sort_order, r.status, r.is_na, r.triggered
   FROM clearance_applications a
   JOIN reviews r ON r.application_id = a.id
   JOIN departments d ON d.id = r.department_id
   WHERE a.student_id = auth.uid();   -- or use the known app id
   ```
   → exactly 1 review, `sort_order=1`, `status=pending`, `is_na=false`.
4. `is_current_upload_step(review_id)` returns `true` for the lab review only.

## 2. Sequential unlock + documents
5. Upload a PDF to Laboratory → succeeds (RLS allows current step).
6. Try uploading to Dept. Head's review (exists? no — releases only when unlocked) → attempt
   INSERT of a document to a not-yet-active review → **42501 rejected**.
7. Office rejects once → student sees remark; upload again to lab (allowed);
   after 3 attempts → escalated (optional check).
8. Approve Laboratory (either role: lab registrar or admin) →
   - `reviews.lab.status='approved'`,
   - **Dept. Head review auto-created** (`sort_order=2`, `pending`),
   - `is_current_upload_step` now `true` for head, `false` for lab.

## 3. Full 10-office walk (happy path)
9. Walk all 10 offices in exact order: approve each in turn (uploading to `store` etc. as it unlocks).
10. After **Accounts Section (9)** approves → Administration review auto-created (step 10).
11. Approve Administration → application `status='cleared'` and **one certificate** issued
    (cert has unique code + QR; verify page renders it).
12. DB: all 10 reviews `approved`; `is_final_signoff` only on Administration.

## 4. Critical paths
13. **N/A (day-scholar → Hostel):** student with no hostel record. Wait until step 3 unlocks, click
    "I have no record at Hostel Superintendent" → review approved + `is_na=true` + auto-advance to step 4.
14. **N/A on final (Administration):** attempt → should be **refused** (final step cannot be N/A).
15. **N/A before unlock:** attempt on a locked office → **refused** (not current step).
16. **Reject → re-upload:** reject → review pending again; re-upload works; remark visible to student.
17. **Escalation:** 3 failed attempts on an office → review `escalated=true`, handled by admin (S-v2.4).
18. **N/A revert (admin):** admin clicks revert on an N/A review → `is_na=false`, status pending again
    (S-v2.4).

## 5. Roles / RLS
19. Science staff account sees **only its office** queue (S-v2.3), and cannot open other offices' reviews.
20. Admin sees all 10 offices; admin can approve any step.
21. Student cannot see other students' reviews/documents/certificates.
22. No `triggered`-based filtering anywhere in the UI (all pages load clean).
23. `declare_review_na` / `reopen_na_review` / `reopen_rejected_review` from a non-owner → refused.

## 6. Final state hash
24. Run once cleanly and confirm:
    ```sql
    SELECT count(*) FROM storage.objects;                  -- 0
    SELECT count(*) FROM public.departments;               -- 10
    SELECT count(*) FROM public.clearance_certificates;    -- 1 (from test walk)
    ```
25. Wipe test app if desired (same purge statements as migration S2) — keep storage clean too.

## Done criteria
All boxes checked; any discovered bug fixed in this lane (migration/RLS/RPC) or delegated to the right
owner; `Snapshot.md` M-v2.7 flipped to ✅ via PR title tag.