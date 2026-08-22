# NITER Clearance Portal

A digital clearance management system for final-year students at NITER. Students apply once,
upload proof documents, and track every department's approval in real time — ending in an
auto-generated, verifiable clearance certificate.

Built independently by Team Moinul / Fatin / Shafin. Originally scaffolded with Lovable;
now fully self-hosted and self-maintained.

## Tech stack

- **Framework:** TanStack Start (React 19, SSR) + TanStack Router + TanStack Query
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **Backend:** Supabase (Postgres database, auth, file storage)
- **Build:** Vite 8 + Nitro (SSR output runs on Node.js)

## Getting started

**Prerequisites:** Node.js LTS (v22 recommended) and Git.

```sh
git clone https://github.com/hellomoinul/niterclearanceportal
cd niterclearanceportal
npm install
npm run dev
```

Open http://localhost:8080. If the page loads without console errors, your setup works.

The `.env` file with the public Supabase keys is committed to the repo, so no extra
configuration is needed to run locally.

### Scripts

| Command                         | What it does                                   |
| ------------------------------- | ---------------------------------------------- |
| `npm run dev`                   | Start the dev server at localhost:8080         |
| `npm run build`                 | Production build → `.output/` (Node.js server) |
| `node .output/server/index.mjs` | Run the production build locally               |
| `npm run lint`                  | Check code style issues                        |
| `npm run format`                | Auto-format all files                          |

Set `NITRO_PRESET=cloudflare-module` (or any Nitro preset) before building if you want a
different deploy target than Node.js.

## How our team works

1. **Never push directly to `main`.** Work happens on personal branches.
2. Read `Assignment.md` for who owns which files and tasks.
3. Daily loop:

   ```sh
   git switch main && git pull        # get latest work from everyone
   git switch -c <your-name>/<task>   # first time only; later just git switch <branch>
   # ...code...
   git add . && git commit -m "short message of what you did"
   git push                           # first time: git push -u origin <branch>
   ```

4. When a task is done, open a Pull Request on GitHub (your branch → `main`). Moinul reviews
   and merges.
5. Update your checklist in `Assignment.md` and log progress in `Snapshot.md`
   **in the same PR** as your code.
6. Stuck more than ~30 minutes? Post in the group chat instead of struggling silently.

## Repository layout

```
src/routes/            Pages (one file = one URL). _authenticated/ requires login.
src/components/ui/     shadcn/ui primitives — shared, don't edit casually.
src/integrations/supabase/  Database client, types, auth helpers.
supabase/migrations/   SQL schema changes. New migration = new numbered .sql file.
.env                   Public Supabase keys (safe to commit).
```

## Roles

Three roles exist: **student**, **staff** (per department office), and **admin** (registrar).
Staff/admin accounts are created by the registrar office, not by self-registration.
