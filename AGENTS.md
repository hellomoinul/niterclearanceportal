# Agent instructions

Guidance for AI coding agents (and humans) working in this repository.

## Commands

- `npm run dev` — dev server on port 8080
- `npm run lint` — ESLint; must pass before committing
- `npm run format` — Prettier; run before committing if you touched formatting
- `npm run build` — production build (must succeed before opening a PR)

## Conventions

- TanStack Start file-based routing: one file per route in `src/routes/`.
  Never edit `src/routeTree.gen.ts` manually — it regenerates on dev/build.
- UI primitives live in `src/components/ui/` (shadcn/ui). Prefer composing them;
  do not restyle them casually since every page depends on them.
- Database changes go in a new `supabase/migrations/<timestamp>_<name>.sql` file.
  Existing migrations are already applied to the live project — never edit them.
- The project uses `@` path alias for `src/`.
- Keep code comment-free unless the user asks for comments or the logic is genuinely
  non-obvious.
- Do not commit secrets. `.env` is gitignored; `.env.example` is the committed template
  (public keys only, placeholders for the anon key). A fresh clone: `Copy-Item .env.example .env`
  then fill the anon key.
- Student **program** is a canonical select value, not free text: strictly
  `TE | IPE | FDAE | CSE | EEE`. Never free-text it in forms or seeds. (Program does not route
  reviews — every office reviews every student. It is shown on the form and certificate.)

## Ownership

Team members own separate files (see `Snapshot.md` for the v2 task map and lane ownership). When
implementing a task, only touch files owned by the person who requested the work, plus shared files
explicitly agreed on.

## Office login model

Every clearance office has its own login role. A registrar staff account is bound to **exactly one
of the 10 office sections** (Laboratory, Dept. Head, Hostel Superintendent, Proctor Office, Store,
Library, Caretaker & Security Inspector, Exam Section, Accounts Section, Administration) via a
single `registrar_departments` row. Their queue shows only that office's pending reviews. Admin is
superior over all offices and reviews the Administration (final sign-off) step.

## Git

- Work happens on feature branches (`<member>/<task>`), merged via PR into `main`.
- Never force-push `main`. Never commit directly to `main`.
