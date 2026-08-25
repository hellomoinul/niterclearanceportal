<p align="center">
  <img src="public/niterLogo.png" alt="NITER crest" width="80" />
</p>

<h1 align="center">NITER Clearance Portal</h1>

<p align="center">
  A digital clearance management system for final-year students at<br/>
  <strong>National Institute of Textile Engineering and Research</strong>
</p>

<p align="center">
  <a href="https://niterclearanceportal.vercel.app">
    <img src="https://img.shields.io/badge/LIVE-Portal-4e65ff" alt="Live Portal" />
  </a>
  <a href="https://github.com/hellomoinul/niterclearanceportal/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/hellomoinul/niterclearanceportal/doc-sync.yml?label=doc-sync" alt="Doc Sync" />
  </a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss" alt="Tailwind 4" />
  <img src="https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Hosted-Vercel-000000?logo=vercel" alt="Vercel" />
</p>

---

## What it does

Students apply once. Eight offices review in parallel. When every office approves, a **QR-verifiable clearance certificate** is generated instantly — no walking between buildings, no lost papers, no bottlenecks.

```
Student applies → 8 offices review in parallel → All approve → Certificate auto-issued
                          ↓                              ↓
                    Reject with remark           QR code links to
                    → Student re-uploads         public verification page
                    → Escalates after 3 rejections
```

## Features

| Feature | Description |
|---------|-------------|
| **Single application** | One form fans out to all required offices automatically |
| **Parallel review** | Eight offices review simultaneously — a slow desk never blocks the rest |
| **Real-time tracking** | Students see approvals, rejections, and remarks as they happen |
| **Auto-issued certificate** | Generated the moment all 8/8 approvals land, with a scannable QR code |
| **Escalation** | Three rejected re-uploads auto-escalate to the Department Head |
| **Audit trail** | Every decision stored with the reviewing officer's identity and timestamp |
| **Email notifications** | Admins, reviewers, and students notified at each step |
| **Role-based portals** | Dedicated dashboards for students, registrars, and admins |
| **Bulk actions** | Reviewers can approve multiple pending requests at once |
| **N/A declarations** | Students flag non-applicable departments; admin audit table catches false claims |
| **Public verification** | Anyone can verify a certificate via QR code — no login required |

## Tech stack

| Layer | Technology |
|-------|------------|
| **Framework** | [TanStack Start](https://tanstack.com/start) (React 19, SSR) + TanStack Router/Query |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) components |
| **Backend** | [Supabase](https://supabase.com) (Postgres, Auth, Storage, Edge Functions) |
| **PDF** | jsPDF + html2canvas + qrcode |
| **Build** | Vite + Nitro (SSR output runs on Node.js) |
| **Hosting** | [Vercel](https://vercel.com) — auto-deploys on every push to `main` |

## Getting started

**Prerequisites:** Node.js LTS (v22 recommended) and Git.

```sh
git clone https://github.com/hellomoinul/niterclearanceportal
cd niterclearanceportal
npm install
npm run dev
```

Open **http://localhost:8080**. Copy `.env.example` to `.env` and add your Supabase URL + publishable key.

### Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start dev server at localhost:8080 |
| `npm run build` | Production build → `.output/` (Node.js server) |
| `node .output/server/index.mjs` | Run the production build locally |
| `npm run lint` | Check code style |
| `npm run format` | Auto-format all files |

## Project structure

```
src/
├── routes/                          # Pages (one file = one URL)
│   ├── index.tsx                    # Public home page
│   ├── auth.tsx                     # Sign in / register
│   ├── about.tsx                    # About page
│   ├── calendar.tsx                 # Academic calendar
│   ├── faq.tsx                      # FAQ
│   ├── verify.tsx                   # Public certificate verification
│   └── _authenticated/              # Requires login
│       ├── dashboard.tsx            # Student dashboard
│       ├── apply.tsx                # Clearance application form
│       ├── section.$code.tsx        # Per-office section (upload docs)
│       ├── certificate.tsx          # Certificate view + PDF download
│       ├── profile.tsx              # Student profile
│       ├── settings.tsx             # Account settings
│       ├── notifications.tsx        # In-app notifications
│       ├── queue.tsx                # Registrar/admin review queue
│       └── admin/                   # Admin-only pages
│           ├── route.tsx            # Layout guard (admin role check)
│           ├── index.tsx            # Admin dashboard + N/A audit table
│           ├── users.tsx            # User management
│           ├── workflow.tsx         # Workflow config
│           ├── reports.tsx          # Batch reports
│           ├── audit.tsx            # Audit log viewer
│           └── notices.tsx          # Notices management
├── components/
│   ├── portal-shell.tsx             # Header + footer + nav
│   ├── status-badge.tsx             # Approval status badges
│   └── ui/                          # shadcn/ui primitives
├── integrations/supabase/           # Database client + types
├── lib/
│   ├── auth.tsx                     # Auth provider + useAuth hook
│   ├── portal.ts                    # Shared constants + helpers
│   └── departments.ts               # Department + academic year data
└── supabase/
    ├── migrations/                  # SQL schema changes
    └── consolidated_setup.sql       # Full schema reference
```

## Roles

| Role | Who | Capabilities |
|------|-----|-------------|
| **Student** | Final-year students | Apply for clearance, upload documents per office, track progress, download certificate |
| **Registrar** | Department staff | Review assigned department queues, approve/reject with remarks |
| **Admin** | Admin office | Full queue visibility, user management, workflow configuration, N/A audit |

Student accounts are created via self-registration. Registrar and admin accounts are provisioned by the admin office.

## Deployment

The site auto-deploys to Vercel on every push to `main`:

**https://niterclearanceportal.vercel.app**

Database migrations are applied via the Supabase CLI (`npx supabase db query --linked`) or the Supabase dashboard.

## Team workflow

1. **Never push directly to `main`.** Work on personal branches.
2. Read [`Assignment.md`](Assignment.md) for who owns which files and tasks.
3. Daily loop:

   ```sh
   git switch main && git pull
   git switch -c <your-name>/<task>
   # ...code...
   npx tsc --noEmit && npx vite build    # verify before pushing
   git add . && git commit -m "short message"
   git push -u origin <branch>
   ```

4. Open a Pull Request → Moinul reviews and merges.
5. Update your checklist in [`Assignment.md`](Assignment.md) and log progress in [`Snapshot.md`](Snapshot.md) in the same PR.
6. Stuck more than 30 minutes? Post in the group chat.

## License

This project is built for NITER (National Institute of Textile Engineering and Research). All rights reserved.
