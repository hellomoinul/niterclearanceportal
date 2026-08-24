# NITER Clearance Portal

A digital clearance management system for final-year students at NITER (National Institute of Textile Engineering and Research). Students apply once, upload proof documents, and track every department's approval in real time — ending in an auto-generated, QR-verifiable clearance certificate.

## Features

- **Single application** — one form fans out to all required offices automatically
- **Parallel review** — eight offices review simultaneously; a slow desk never blocks the rest
- **Real-time tracking** — students see approvals, rejections, and remarks as they happen
- **Auto-issued certificate** — generated the moment all 8/8 approvals land, with a scannable QR code linking to public verification
- **Escalation built-in** — three rejected re-uploads escalate the case to the Department Head automatically
- **Audit trail** — every decision is stored with the reviewing officer's identity and timestamp
- **Email notifications** — admins, reviewers, and students are notified at each step
- **Role portals** — dedicated dashboards for students, registrars, and admins
- **Bulk actions** — reviewers can select and approve multiple pending requests at once

## Tech stack

| Layer     | Technology                                              |
| --------- | ------------------------------------------------------- |
| Framework | TanStack Start (React 19, SSR) + TanStack Router/Query  |
| Styling   | Tailwind CSS v4 + shadcn/ui components                  |
| Backend   | Supabase (Postgres, Auth, Storage, Edge Functions)      |
| PDF       | jsPDF + html2canvas + qrcode                            |
| Build     | Vite + Nitro (SSR output runs on Node.js)               |
| Hosting   | Vercel                                                  |

## Getting started

**Prerequisites:** Node.js LTS (v22 recommended) and Git.

```sh
git clone https://github.com/hellomoinul/niterclearanceportal
cd niterclearanceportal
npm install
npm run dev
```

Open http://localhost:8080. The `.env` file with the public Supabase keys is committed to the repo, so no extra configuration is needed to run locally.

### Scripts

| Command                         | What it does                                     |
| ------------------------------- | ------------------------------------------------ |
| `npm run dev`                   | Start the dev server at localhost:8080           |
| `npm run build`                 | Production build → `.output/` (Node.js server)   |
| `node .output/server/index.mjs` | Run the production build locally                 |
| `npm run lint`                  | Check code style issues                          |
| `npm run format`                | Auto-format all files                            |

Set `NITRO_PRESET=cloudflare-module` (or any Nitro preset) before building if you want a different deploy target than Node.js.

## Project structure

```
src/routes/                 Pages (one file = one URL). _authenticated/ requires login.
src/components/ui/          shadcn/ui primitives — shared, don't edit casually.
src/integrations/supabase/  Database client, types, auth helpers.
supabase/migrations/        SQL schema changes. New migration = new numbered .sql file.
.env                        Public Supabase keys (safe to commit).
```

## Roles

Three roles exist:

| Role      | Capabilities                                                                 |
| --------- | ---------------------------------------------------------------------------- |
| Student   | Apply for clearance, upload documents per office, track progress, download certificate |
| Registrar | Review assigned department queues (Accounts by default), approve/reject with remarks |
| Admin     | Full queue visibility, user management, workflow configuration               |

Student accounts are created via self-registration. Registrar and admin accounts are provisioned by the admin office.

## Team workflow

1. **Never push directly to `main`.** Work happens on personal branches.
2. Read [`Assignment.md`](Assignment.md) for who owns which files and tasks.
3. Daily loop:

   ```sh
   git switch main && git pull        # get latest work from everyone
   git switch -c <your-name>/<task>   # first time only; later just git switch <branch>
   # ...code...
   git add . && git commit -m "short message of what you did"
   git push                           # first time: git push -u origin <branch>
   ```

4. When a task is done, open a Pull Request on GitHub (your branch → `main`). Moinul reviews and merges.
5. Update your checklist in `Assignment.md` and log progress in [`Snapshot.md`](Snapshot.md) in the same PR as your code.
6. Stuck more than ~30 minutes? Post in the group chat instead of struggling silently.

## Deployment

The site auto-deploys to Vercel on every push to `main`: **https://niterclearanceportal.vercel.app**

Database migrations are applied via the Supabase CLI (`npx supabase db query --linked`) or the Supabase dashboard.
