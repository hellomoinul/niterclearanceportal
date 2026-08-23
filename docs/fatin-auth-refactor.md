# Auth Refactor Guide — For Fatin

> **⚠️ IMPLEMENTED (PR #35)** — This guide is superseded. The actual implementation
> lives in `src/routes/auth.tsx` (smart login + email at signup), `src/routes/_authenticated/settings.tsx`
> (recovery email change), and `supabase/migrations/20260823190000_login_email_rpc.sql`.
> No need to build `/complete-profile` — the register form already collects profile fields inline.

**Problem:** Current login uses synthetic emails (`ID@niter.portal`) derived from NITER IDs. Password reset emails can never be delivered (the domain doesn't exist).

**Goal:** Add real email support so password reset works, while keeping NITER ID login for backward compatibility.

## Architecture

```
New flow (signup):
  1. Student signs up with REAL email + password + NITER ID
  2. After signup, forced to /complete-profile to set name, dept, batch, program
  3. After profile done, redirected to /dashboard

Existing flow (unchanged):
  1. Student enters NITER ID on /auth
  2. System converts to synthetic email (ID@niter.portal)
  3. Profile exists -> login; No profile -> "Contact admin"

Login field supports both:
  - NITER ID (no @) -> synthetic email path
  - Email (contains @) -> Supabase native auth
```

## Step 1: Add `email` column to profiles

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text UNIQUE;
```

## Step 2: Update register page (`src/routes/register.tsx`)

Fields: NITER ID, real email, password. On submit:
1. `supabase.auth.signUp({ email, password })`
2. `supabase.from('profiles').insert({ id, user_code, email, role: 'student' })`
3. Navigate to `/complete-profile`

## Step 3: Create `/complete-profile` route

Create `src/routes/_authenticated/complete-profile.tsx`:
- Fields: full name, department (select), batch (number), program
- On submit: `supabase.from('profiles').update({ full_name, department_id, batch, program }).eq('id', user.id)`
- Navigate to `/dashboard`

## Step 4: Auth guard for incomplete profiles

In `src/lib/auth.tsx`, after login:
```tsx
if (profile && !profile.full_name) {
  window.location.href = "/complete-profile";
  return;
}
```

## Step 5: Smart login field

The current login field in `src/routes/auth.tsx` already detects NITER ID vs email. Just add `type="text"` and update the placeholder:

```tsx
placeholder="NITER ID or email"
hint={inputValue.includes("@") ? "Signing in with email" : "Signing in with NITER ID"}
```

When `inputValue.includes("@")`:
- Use `supabase.auth.signInWithPassword({ email: inputValue, password })`

When no `@`:
- Use existing synthetic email path: `idToEmail(inputValue)`

## Testing checklist

1. [ ] Register with real email -> redirected to /complete-profile
2. [ ] Complete profile -> redirected to /dashboard
3. [ ] Logout -> login with NITER ID -> works
4. [ ] Logout -> login with email -> works
5. [ ] Password reset with real email -> receives email -> can set new password
6. [ ] Password reset with NITER ID -> shows "Contact admin" (expected)
7. [ ] Admin can still create staff accounts manually
8. [ ] Build passes: `npx vite build`
