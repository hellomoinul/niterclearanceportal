# 📋 NITER Clearance Portal — Snapshot

> **Last updated:** 2026-08-28 (admin panel completion) · **Progress: 43/52 done (~85%)**

---

### Legend

✅ Done · 🚧 In progress · ⬜ Not started · 🔒 Blocked

---

## 👨‍💻 Moinul — Core, Infrastructure, Security, Docs

> ✅ **22/22 done** — all core, security, review-feedback, docs complete.

### ✅ Core approval loop (PR #9)

- ✅ **M1** — Staff queue — approve/reject with remarks + document preview
- ✅ **M2** — Escalation — auto-escalates at 3 rejections → Head + admins
- ✅ **M3** — Audit trail — every action logged with actor + timestamp

### ✅ Security patches (PR #34)

- ✅ **M4** — Admin route guard — `beforeLoad` role check, redirect non-admins
- ✅ **M5** — Status-forgery patch — DB trigger blocks student status tampering
- ✅ **M6** — Admin honesty pass — 5 broken admin pages → stubs
- ✅ **M7** — Head-ordering trigger — blocks Head approval until 7/8 approved

### ✅ Identity & infrastructure (PRs #32/#33)

- ✅ **M8** — Staff → Registrar full rename
- ✅ **M9** — Accounts Queue hard-rule

### ✅ Stretch pool (PRs #9/#10)

- ✅ **SP1** — Bulk approve — checkboxes + action bar
- ✅ **SP2** — Email notifications — Edge Function + Resend (deferred)
- ✅ **SP3** — Notification pipeline — 3 DB triggers
- ✅ **SP4** — Settings page
- ✅ **SP5** — Profile page fix

### ✅ New review feedback tasks

- ✅ **M10** — Email data flow: personal email readonly in apply
- ✅ **M11** — N/A remarks encoding: em-dash → ASCII dash
- ✅ **M12** — Verification workflow: `verify_clearance_status` RPC + `/verify` verdict

### ✅ 2026-08-27 — external review fixes

- ✅ **M13** — Standardize label **"Academic year"** everywhere (was "Batch"/"Session")
- ✅ **M14** — Restrict `audit_log` INSERT RLS to registrar/admin · Migration applied to live
- ✅ **M15** — `reopen_na_review` N/A rollback RPC · Migration applied to live ✅ verified live
- ✅ **M16** — Fix Fatin's Final Queue "No students found" · FK `student_id → profiles(id)` applied
- ✅ **M17** — Restore `portal-shell.tsx` after PR #51 regressions
- ✅ **Docs** — Rewrite `SYSTEM_FLOW.md`, consolidated Snapshot+Assignment

---

## 📝 Fatin — Certificate Pipeline & Student Features

> ✅ **13/20 done (plus F19)** · ⬜ 7 remaining

### ✅ Completed

✅ F4 Profile page (PR #11) · F1 Certificate page (PR #18) · F2 PDF + QR (PR #26) · F3 Forgot password (PRs #35/#36) · F6 Printable certificate (PR #29) · F8 Confirmation dialogs (PR #31) · F9 Global error states (PR #41) · F12 Profile cleanup · F15 Icon sizes · F17 Remarks in dashboard · F18 Notification badge · F19 Certificate QR + verify flow · F10 Registrar final queue (PR #51, fixed via M16)

### ⬜ Remaining — step-by-step guidance

---

#### ⬜ **F20** — Resubmit comment field (highest priority — fixes the blind resubmit loop)

**Problem:** When a Head rejects, the student sees "Re-submit for final approval" but has **no way to explain what changed**. It's a blind "please look again" ping.

**What to do:** Add an optional comment textarea before the resubmit button. Store it on `department_reviews.student_comment`. Surface it to the office in the queue card.

**Database migration needed** — `department_reviews` has no `student_comment` column, and `reopen_rejected_review` only accepts `p_review_id`:

```sql
-- supabase/migrations/20260829000000_f20_resubmit_comment.sql
ALTER TABLE department_reviews ADD COLUMN student_comment TEXT;

CREATE OR REPLACE FUNCTION reopen_rejected_review(
  p_review_id UUID,
  p_student_comment TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE department_reviews
  SET status = 'pending',
      student_comment = p_student_comment,
      remarks = NULL,
      reviewed_at = NULL,
      reviewed_by = NULL
  WHERE id = p_review_id
    AND owns_application(application_id, auth.uid())
    AND status = 'rejected';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**File:** `src/routes/_authenticated/section.$code.tsx`

1. Add state: `const [resubmitComment, setResubmitComment] = useState("");`
2. Modify `handleResubmit()` to pass the comment:
   ```tsx
   const { error } = await supabase.rpc("reopen_rejected_review", {
     p_review_id: review.id,
     p_student_comment: resubmitComment.trim() || null,
   });
   ```
3. Add a `<Textarea>` before the resubmit button (only when `review.status === "rejected"`):
   ```tsx
   <Label htmlFor="resubmitComment">Comment for resubmission (optional)</Label>
   <Textarea
     id="resubmitComment"
     rows={2}
     placeholder="Explain what you've fixed or why this should be reconsidered..."
     value={resubmitComment}
     onChange={(e) => setResubmitComment(e.target.value)}
   />
   ```
4. Add imports: `Textarea` from `@/components/ui/textarea`, `Label` from `@/components/ui/label`.

**Also in `queue.tsx`:** Show `review.student_comment` in the rejected review card so the office sees the student's explanation.

**Verify:** `npx tsc --noEmit && npx vite build`

---

#### ⬜ **F16** — "Uploaded" text on dashboard

**Problem:** Student dashboard shows department review cards but no indication of whether documents have been uploaded.

**What to do:** Query documents for the student's reviews, show "Uploaded (N)" on each card.

**File:** `src/routes/_authenticated/dashboard.tsx`

1. Add a documents query after the `reviews` query (after line 64):
   ```tsx
   const reviewIds = (reviews ?? []).map((r) => r.id);
   const { data: documents } = useQuery({
     enabled: reviewIds.length > 0,
     queryKey: ["dashboard-documents", reviewIds],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("documents")
         .select("review_id, file_name, status, uploaded_at")
         .in("review_id", reviewIds)
         .order("uploaded_at", { ascending: false });
       if (error) throw error;
       return data;
     },
   });
   ```
2. Build a doc count map:
   ```tsx
   const docCountByReview = useMemo(() => {
     const map: Record<string, number> = {};
     for (const doc of documents ?? []) {
       map[doc.review_id] = (map[doc.review_id] ?? 0) + 1;
     }
     return map;
   }, [documents]);
   ```
3. Inside each review card (after the StatusBadge), add:
   ```tsx
   {(docCountByReview[review.id] ?? 0) > 0 && (
     <p className="mt-2 text-xs text-green-600 font-medium">
       Uploaded ({docCountByReview[review.id]} document{(docCountByReview[review.id] ?? 0) === 1 ? "" : "s"})
     </p>
   )}
   ```
4. Add `useMemo` to imports.

---

#### ⬜ **F11** — Dashboard email in greeting

**Problem:** Dashboard shows student name but no email contact.

**What to do:** Show `personal_email` from the profile object in the greeting header.

**File:** `src/routes/_authenticated/dashboard.tsx`

The `profile` object already has `personal_email` (from `useAuth()`). After the `PageHeader` component (after line 99), add:

```tsx
{profile?.personal_email && (
  <p className="mt-2 text-sm text-muted-foreground">
    Email: {profile.personal_email}
  </p>
)}
```

**Verify:** `npx tsc --noEmit && npx vite build`

---

#### ⬜ **F14** — Delete countdown popup

**Problem:** Delete button immediately deletes with no safety delay.

**What to do:** Add a 3-second countdown on the delete confirmation button.

**File:** `src/routes/_authenticated/section.$code.tsx`

1. Add state: `const [deleteTarget, setDeleteTarget] = useState<{ id: string; path: string } | null>(null);`
2. Add countdown state: `const [countdown, setCountdown] = useState(0);`
3. Add `useEffect` for the timer:
   ```tsx
   useEffect(() => {
     if (countdown <= 0) return;
     const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
     return () => clearTimeout(timer);
   }, [countdown]);
   ```
4. Make the AlertDialog controlled (`open` / `onOpenChange`), disable the delete action while `countdown > 0`, show "Wait {countdown}s" on the button.
5. The AlertDialog is already imported and used (lines 314-343) — just modify it.
6. Add `useEffect` to imports (line 3).

---

#### ⬜ **F13** — Thesis/internship on profile

**Problem:** Profile page doesn't show thesis/supervisor info collected during application.

**What to do:** Fetch the student's latest `clearance_applications` row and display `thesis_title`, `supervisor_name`, `expected_graduation`.

**File:** `src/routes/_authenticated/profile.tsx`

1. Add a query (the profile page is 86 lines, add after line 16):
   ```tsx
   const { data: application } = useQuery({
     enabled: !!isStudent,
     queryKey: ["profile-application"],
     queryFn: async () => {
       const { data } = await supabase
         .from("clearance_applications")
         .select("thesis_title, supervisor_name, expected_graduation")
         .eq("student_id", profile!.id)
         .order("submitted_at", { ascending: false })
         .limit(1)
         .maybeSingle();
       return data;
     },
   });
   ```
2. Add imports: `useQuery` from `@tanstack/react-query`, `supabase` from `@/integrations/supabase/client`.
3. Add a section after the existing info cards (after line 71):
   ```tsx
   {isStudent && application && (
     <div className="pt-4 border-t mt-4 space-y-1">
       <p><span className="font-semibold">Thesis/Project/Internship:</span> {application.thesis_title || "Not provided"}</p>
       <p><span className="font-semibold">Supervisor:</span> {application.supervisor_name || "Not provided"}</p>
       <p><span className="font-semibold">Expected Graduation:</span> {application.expected_graduation || "Not provided"}</p>
     </div>
   )}
   ```

---

#### ⬜ **F7** — Deadline lock

**Problem:** Students can submit after the batch deadline.

**What to do:** Add a deadline setting, block submissions after it passes.

**Database migration needed** — no `app_settings` table exists:

```sql
-- supabase/migrations/20260829000001_f7_deadline_lock.sql
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO app_settings (key, value) VALUES ('application_deadline', '2026-12-31T23:59:59Z');
```

**File:** `src/routes/_authenticated/apply.tsx`

1. Add a deadline query after line 55:
   ```tsx
   const { data: deadlineSetting } = useQuery({
     queryKey: ["app-deadline"],
     queryFn: async () => {
       const { data } = await supabase
         .from("app_settings")
         .select("value")
         .eq("key", "application_deadline")
         .maybeSingle();
       return data?.value ?? null;
     },
   });
   const isExpired = deadlineSetting ? new Date(deadlineSetting) < new Date() : false;
   ```
2. Add check at top of `handleSubmit`:
   ```tsx
   if (isExpired) {
     toast.error("Application deadline has passed");
     setBusy(false);
     return;
   }
   ```
3. Disable submit button: `disabled={busy || isExpired}`
4. Show deadline notice in the form header.

---

#### ⬜ **F5** — Student timeline

**Problem:** Students can't see their clearance history in chronological order.

**What to do:** Add a vertical timeline showing each department review's status changes.

**File:** `src/routes/_authenticated/dashboard.tsx`

1. Sort reviews by `created_at`:
   ```tsx
   const sortedReviews = [...(reviews ?? [])].sort(
     (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
   );
   ```
2. Insert a timeline between the progress card and the department card grid. Use `CheckCircle2`, `XCircle`, `Clock` from `lucide-react` for status dots.
3. Each timeline item shows: department name, status (approved/rejected/pending), remarks, submitted date, reviewed date.
4. Add imports: `CheckCircle2`, `Clock`, `XCircle` from `lucide-react`, `cn` from `@/lib/utils`.

---

## 🔧 Shafin — Admin Panel & Queue Upgrades

> ✅ **8/14 done** · ⬜ 6 remaining

### ✅ Done & working (real pages)

- ✅ **S2/S7** — Workflow & deadline config — `admin/workflow.tsx`, backed by `workflow_steps` table (PR #54)
- ✅ **S3/S13** — Reports — `admin/reports.tsx` rebuilt vs real schema: `department_reviews` + `departments` (PR #54)
- ✅ **S4/S11** — Notices — `admin/notices.tsx`, backed by `notices` table with admin-only RLS (PR #54)
- ✅ **S5/S12** — Audit log — `admin/audit.tsx`: paginated/searchable/filtered read-only table (PR #53)
- ✅ **Admin nav/layout** — `admin/route.tsx` renders `<Outlet />` + sub-nav bar (PR #55)

### ⬜ Not done — step-by-step guidance

---

#### ⬜ **S14** — N/A revert button (uses M15 RPC — already live)

**Problem:** Admin can see N/A declarations but can't revert false ones. M15's `reopen_na_review` RPC already exists on live ✅ — just needs a UI button.

**What to do:** Add a "Revert to Pending" button on each N/A row that calls `reopen_na_review(review_id)`.

**File:** `src/routes/_authenticated/admin/index.tsx`

1. Add imports: `Button` from `@/components/ui/button`, `AlertDialog` components from `@/components/ui/alert-dialog`, `toast` from `sonner`.
2. Add state: `const [revertingId, setRevertingId] = useState<string | null>(null);`
3. Add handler:
   ```tsx
   async function handleRevertNa(reviewId: string) {
     setRevertingId(reviewId);
     const { error } = await supabase.rpc("reopen_na_review", { p_review_id: reviewId });
     setRevertingId(null);
     if (error) {
       toast.error("Could not revert N/A", { description: error.message });
       return;
     }
     await supabase.from("audit_log").insert({
       action: "revert_na",
       entity: "department_reviews",
       entity_id: reviewId,
       details: `Reverted N/A declaration`,
     });
     setNaRows((prev) => prev.filter((r) => r.reviewId !== reviewId));
     toast.success("N/A declaration reverted to pending");
   }
   ```
4. Add an "Action" column to the table with a revert button wrapped in AlertDialog for confirmation.

---

#### ⬜ **S1** — Real users page (was stub)

**Problem:** `/admin/users` shows "Coming soon" — no role management.

**What to do:** Build a full CRUD page: list profiles + roles, edit role, assign registrar departments.

**File:** `src/routes/_authenticated/admin/users.tsx` (20 lines — replace entirely)

**Tables to query:**
- `profiles` — all user data (`id`, `user_code`, `full_name`, `program`, etc.)
- `user_roles` — `user_id`, `role` (student/registrar/admin)
- `registrar_departments` — `user_id`, `department_id` (which offices a registrar can review)
- `departments` — for the assignment dropdown

**Implementation:**
1. Fetch profiles, join with `user_roles` to get role, join with `registrar_departments` for assigned offices.
2. Show a table: Name, User Code, Portal Email (`idToEmail(user_code)`), Role, Assigned Departments (for registrar), Actions.
3. Edit button opens a Dialog: change role (select), assign departments (multi-select checkboxes).
4. Search input + role filter tabs (All / Students / Registrars / Admins).
5. Use `supabase.from("user_roles").upsert(...)` to change roles.
6. Use `supabase.from("registrar_departments").delete().eq("user_id", ...)` + `.insert(...)` to reassign departments.

---

#### ⬜ **S6** — Override staff decision

**Problem:** Admin can't overturn a staff member's approve/reject decision.

**What to do:** Add "Force Approve" / "Force Reject" buttons on admin queue view, with mandatory reason + audit_log write.

**File:** `src/routes/_authenticated/queue.tsx`

1. Add override state: `const [overrideReason, setOverrideReason] = useState<Record<string, string>>({});`
2. Add override handler:
   ```tsx
   async function handleOverride(review, decision: "approved" | "rejected") {
     const reason = (overrideReason[review.id] ?? "").trim();
     if (!reason) {
       toast.error("Override reason required");
       return;
     }
     // Update department_reviews
     await supabase.from("department_reviews").update({
       status: decision,
       remarks: `[ADMIN OVERRIDE] ${reason}`,
       reviewed_by: user.id,
       reviewed_at: new Date().toISOString(),
     }).eq("id", review.id);
     // Write audit_log
     await supabase.from("audit_log").insert({
       action: `admin_override_${decision}`,
       actor_id: user.id,
       entity: "department_reviews",
       entity_id: review.id,
       details: `Admin overrode ${decision}. Reason: ${reason}`,
     });
   }
   ```
3. In the review card (only when `isAdmin`), add after the approve/reject buttons:
   - A reason `<Input>` field
   - "Force Approve" and "Force Reject" buttons calling `handleOverride`

---

#### ⬜ **S8** — Queue search/filter/pagination

**Problem:** Queue shows all results with no search, no student-name filter, no pagination. Doesn't scale to 300+ students.

**What to do:** Add search by student name/ID, pagination (20/page).

**File:** `src/routes/_authenticated/queue.tsx`

1. Add state: `const [search, setSearch] = useState(""); const [page, setPage] = useState(1);`
2. Add search `<Input>` after the Tabs.
3. Filter the `visible` memo by search:
   ```tsx
   const searched = useMemo(() => {
     if (!search.trim()) return visible;
     const q = search.trim().toLowerCase();
     return visible.filter((r) => {
       const s = r.clearance_applications?.profiles;
       return s?.full_name?.toLowerCase().includes(q) || s?.user_code?.toLowerCase().includes(q);
     });
   }, [visible, search]);
   ```
4. Paginate: `const paginated = searched.slice((page - 1) * 20, page * 20);`
5. Replace `visible.map` with `paginated.map`.
6. Add Previous/Next pagination controls after the review list.

---

#### ⬜ **S9** — Rejection history panel

**Problem:** Staff only sees the current remark — not past rejection reasons.

**What to do:** Show a mini-table of past rejected documents with their `rejection_reason`.

**File:** `src/routes/_authenticated/queue.tsx`

The `documents` table has `status`, `rejection_reason`, `uploaded_at` — and the `docsByReview` map already exists (lines 227-233).

1. Inside each rejected review card, after the current remark block, add:
   ```tsx
   {review.status === "rejected" && docsByReview[review.id]?.length > 0 && (
     <div className="mt-3 rounded-md border bg-secondary/50 p-3">
       <p className="text-xs font-semibold text-muted-foreground mb-2">Rejection history</p>
       <ul className="space-y-2">
         {docsByReview[review.id]
           .filter((doc) => doc.status === "rejected" && doc.rejection_reason)
           .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
           .map((doc) => (
             <li key={doc.id} className="text-xs">
               <p className="text-red-600 font-medium">Rejected: {doc.rejection_reason}</p>
               <p className="text-muted-foreground">
                 {doc.file_name} — {new Date(doc.uploaded_at).toLocaleDateString()}
               </p>
             </li>
           ))}
       </ul>
     </div>
   )}
   ```

---

#### ⬜ **S10** — Bulk approve summary toast

**Problem:** After bulk approve, only a generic "Approved X students" toast — no detail.

**What to do:** Show a detailed summary with student names.

**File:** `src/routes/_authenticated/queue.tsx`

1. In `bulkApprove()` (lines 331-356), collect student names before approval:
   ```tsx
   const studentNames = ids.map((id) => {
     const review = reviews?.find((r) => r.id === id);
     return review?.clearance_applications?.profiles?.full_name ?? "Unknown";
   });
   ```
2. Replace the toast with:
   ```tsx
   toast.success("Bulk approve complete", {
     description: `${ids.length} approved\n` + studentNames.map((n) => `  • ${n}`).join("\n"),
     duration: 8000,
   });
   ```

---

## 🎯 Order of Attack (next up)

| # | Who | Task | Why | Effort |
|---|-----|------|-----|--------|
| 1 | Fatin | F20 — Resubmit comment field | Fixes the blind resubmit loop | Medium (migration + UI) |
| 2 | Shafin | S14 — N/A revert UI | Act on caught false N/A | Easy (RPC exists, just UI) |
| 3 | Fatin | F16 — "Uploaded" text | Dashboard clarity | Easy |
| 4 | Fatin | F11 — Dashboard email | Show contact info | Easy (1 line) |
| 5 | Fatin | F14 — Delete countdown | Safety UX | Easy |
| 6 | Fatin | F13 — Thesis/internship | Show collected data | Easy |
| 7 | Fatin | F5 — Student timeline | Full history view | Medium |
| 8 | Fatin | F7 — Deadline lock | Block late submissions | Medium (migration + UI) |
| 9 | Shafin | S1 — Real users page | Admin role mgmt | Large (full CRUD) |
| 10 | Shafin | S6 — Override decision | Admin power | Medium |
| 11 | Shafin | S8 — Queue pagination | Scale to 300+ | Medium |
| 12 | Shafin | S9 — Rejection history | Queue UX | Easy |
| 13 | Shafin | S10 — Bulk summary | Queue UX | Easy |

---

## 📊 Progress

| Member | Done | Remaining | Total |
|--------|------|-----------|-------|
| Moinul | ✅ 22 | ⬜ 0 | 22 |
| Fatin | ✅ 13 | ⬜ 7 | 20 |
| Shafin | ✅ 8 | ⬜ 6 | 14 |
| **Total** | **✅ 43** | **⬜ 13** | **52** (excl. deferred) |

---

## 🎯 Definition of Done for v1

Student applies → staff approves/rejects with remarks → escalation works → admin guard active → no status-forgery → Head ordering enforced → certificate PDF with QR → verification confirms 8/8 or directs to portal → admin manages users + notices + sees real audit log.

---

## ⏸️ Deferred (go-live decisions)

| Finding | Priority | Notes |
|---------|----------|-------|
| Test data purge | Medium | Gibberish data before go-live |
| Password hardening | Medium | Client minLength 8 only |
| Certificate revocation | Medium | No revoke process |
| Escalation resolution | Medium | No resolve/reassign UI |
| Mobile/WCAG audit | Low | AA contrast done, no full audit |
| Resend custom domain | — | Needs resend.dev sender only for now |
| PDPA compliance | — | No Bangladesh region in Supabase |

---

## ⚠️ Known Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Edge function hardcoded recipient | Medium | `send-notification-email` sends to Moinul's Gmail; not wired from frontend |
| Email pipeline not delivering | Medium | Needs DB webhook/edge-function wiring; in-app notifications work |
| `/verify` "Certificate ID" shows raw UUID | Low | QR encoding correct; label could be friendlier |
| 27 unused shadcn/ui components | Low | Over half never imported |
| No storage bucket in migrations | Medium | `clearance-docs` only in `consolidated_setup.sql` |
| No seed file | Low | Test users/roles created manually |

---

## 🔧 DB Migrations Required (before implementing)

| Task | Migration | SQL |
|------|-----------|-----|
| **F20** | `20260829000000_f20_resubmit_comment.sql` | `ALTER TABLE department_reviews ADD COLUMN student_comment TEXT;` + update `reopen_rejected_review` RPC |
| **F7** | `20260829000001_f7_deadline_lock.sql` | Create `app_settings` table + insert default deadline |
| **S14** | None needed | `reopen_na_review` already exists on live ✅ |

---

## 📝 Work History

### 2026-08-28 (admin panel completion)
- **PR #53 merged** — Shafin audit page (S12) landed on main
- **PR #52 (stale `shafin/admin-panel`) closed** — unsolvable 68-file conflict; nothing lost
- **Migration `20260828000000` created + applied** — `notices` + `workflow_steps` tables with admin-only RLS
- **Lifted Shafin's `workflow.tsx` (S7) + `notices.tsx` (S11)** and **rebuilt `reports.tsx` (S13)** against real schema. Fixed UUID save bug + UTF-16 encoding corruption. tsc + build pass.
- **PR #54 merged** — workflow/notices/reports landed on main
- **Admin layout fix (PR #55 merged)** — `admin/route.tsx` placeholder replaced with `<Outlet />` + sub-nav bar
- **Doc-sync fix (PR #56 merged)** — removed stale `Assignment.md` reference from workflow
- **Snapshot emojis (PR #57 merged)** — restored emoji format for readability
- **Docs updated** — Snapshot + UI Guide reflect accurate Shafin status (8/14 done)

### 2026-08-27 (build-mode session)
- **Fatin PR #51 merged** — registrar Final Queue + route-tree. Fatin's portal-shell edit clobbered Moinul's nav/UI work.
- **M17** — Restored `portal-shell.tsx` (all clobbered work restored, Fatin's new items kept)
- **M16** — Fixed Fatin's Final Queue "No students found" · FK `student_id → profiles(id)` applied
- **M14/M15 verified** applied on live (pg_proc + pg_policies checks)
- **Shafin admin salvage (S12)** — lifted audit.tsx from stale branch; PR #53 opened

### 2026-08-27
- M13 — Standardized "Academic year" label everywhere
- M14 — audit_log INSERT RLS restricted to registrar/admin
- M15 — `reopen_na_review` N/A rollback RPC
- Docs — consolidated Snapshot+Assignment; rewrote SYSTEM_FLOW

### Earlier
- See git history for full log (certificate, admin panel, security patches, core loop).
