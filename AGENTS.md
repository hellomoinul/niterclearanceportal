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
- Do not commit secrets. `.env` contains only public publishable keys and stays committed.

## Ownership

Team members own separate files (see `Assignment.md`). When implementing a task, only touch
files owned by the person who requested the work, plus shared files explicitly agreed on.

## Git

- Work happens on feature branches (`<member>/<task>`), merged via PR into `main`.
- Never force-push `main`. Never commit directly to `main`.
