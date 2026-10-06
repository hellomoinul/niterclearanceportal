<p align="center">
  <img src="public/niterLogo.png" alt="NITER crest" width="80" />
</p>

<h1 align="center">NITER Clearance Portal</h1>

<p align="center">
  A digital clearance management system for final-year students at the<br/>
  <strong>National Institute of Textile Engineering and Research (NITER)</strong>
</p>

<p align="center">
  <a href="https://niterclearanceportal.vercel.app">
    <img src="https://img.shields.io/badge/LIVE-Portal-4e65ff" alt="Live Portal" />
  </a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss" alt="Tailwind 4" />
  <img src="https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Hosted-Vercel-000000?logo=vercel" alt="Vercel" />
</p>

---

## Overview

Final-year students at NITER have traditionally obtained clearance by visiting each
administrative office in person, collecting a signature on a physical form before their degree
can be processed. This portal digitizes that process: a student submits one application, and
the ten clearance sections are reviewed in strict sequential order — mirroring the institute's
physical Student Clearance Form — with each office unlocking only once the previous one has
approved. Once the final section, Administration, signs off, a QR-verifiable digital
certificate is issued automatically.

```
Student applies → Section 1 (Laboratory) → … sequence continues in order …
                   Each section: document upload → office review → next section unlocks
                   Final section: Administration approves → certificate issued
```

## Clearance sections

| # | Section | Notes |
|---|---------|-------|
| 1 | Laboratory | |
| 2 | Dept. Head | |
| 3 | Hostel Superintendent | |
| 4 | Proctor Office | |
| 5 | Store | |
| 6 | Library | |
| 7 | Caretaker & Security Inspector | |
| 8 | Exam Section | |
| 9 | Accounts Section | |
| 10 | Administration | Final sign-off — issues the certificate |

Every student proceeds through all ten sections in the same fixed order. A section remains
locked, displaying *"Clearance not received from [office]"*, until the preceding section has
approved. This sequence is enforced at the database level, not only in the interface.

## Key features

- **Single application** — one form initiates the full ten-step clearance process
- **Sequential review** — each office opens only after the previous one approves
- **Database-enforced locking** — document uploads to a locked section are rejected server-side
- **Status tracking** — students can view locked, active, approved, and not-applicable states for each section
- **Automatic certificate issuance** — generated on final approval, with a scannable QR code, a typeable certificate ID (`NCP-XXXXXXXX`), and the registrar's uploaded signature
- **Academic calendar** — a public calendar of institute events, deadlines, and holidays, managed by administrators
- **Escalation handling** — a section rejected three times is automatically escalated to Administration for resolution
- **Audit trail** — every review decision is recorded with the responsible officer's identity and timestamp
- **Notifications** — in-app and email alerts for students, office staff, and administrators
- **Role-based access** — separate portals for students, office staff, and administrators
- **Bulk review actions** — office staff can act on multiple pending requests at once
- **Not-applicable declarations** — students may flag a section as not applicable (e.g. Hostel for a day scholar), subject to administrative audit
- **Public verification** — anyone can verify an issued certificate via QR code or certificate ID, without logging in

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, SSR) with TanStack Router and Query |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) with [shadcn/ui](https://ui.shadcn.com) |
| Backend | [Supabase](https://supabase.com) (PostgreSQL, Auth, Storage, Edge Functions) |
| Document generation | jsPDF, html2canvas, qrcode |
| Build | Vite with Nitro (SSR output on Node.js) |
| Hosting | [Vercel](https://vercel.com), deployed automatically from `main` |

## Getting started

**Prerequisites:** Node.js LTS (v22 recommended) and Git.

```sh
git clone https://github.com/hellomoinul/niterclearanceportal
cd niterclearanceportal
npm install
npm run dev
```

The application runs at `http://localhost:8080`. Copy `.env.example` to `.env` and provide
your Supabase project URL and publishable key.

### Scripts

| Command | Description |
|---------|--------------|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build in `.output/` |
| `node .output/server/index.mjs` | Run the production build locally |
| `npm run lint` | Check code style |
| `npm run format` | Format all files |

## Project structure

```
src/
├── routes/                 # Application pages (file-based routing)
│   ├── home.tsx, auth.tsx, about.tsx, calendar.tsx, guide.tsx, verify.*
│   └── _authenticated/     # Pages requiring sign-in
│       ├── dashboard.tsx, apply.tsx, section.$code.tsx, certificate.tsx
│       ├── profile.tsx, notifications.tsx, queue.tsx
│       └── admin/          # Administrator-only pages
├── components/              # Shared UI components (shell, navigation, status badges)
├── integrations/supabase/   # Database client and generated types
├── lib/                     # Shared constants, auth context, and helpers
└── supabase/                # Database migrations and schema reference
```

## Roles and access

A distinction is made between *roles* and *offices*: an office is one of the ten clearance
sections above, while a role determines what a user can access within the system.

| Role | Description | Access |
|------|--------------|--------|
| **Student** | Final-year students | Submit an application, progress through the ten-step sequence, upload documents, track status, download the certificate |
| **Office** | One account per clearance section | Review and act on their assigned section's queue only |
| **Admin** | Administration office | Full visibility across all sections, user and workflow management, audit review, and final sign-off |

Student accounts are created through self-registration. Office and admin accounts are
provisioned separately; each office account is bound to exactly one of the ten clearance
sections.

## Deployment

The application deploys automatically to Vercel on every push to `main`:

**https://niterclearanceportal.vercel.app**

Database migrations are applied via the Supabase CLI or the Supabase dashboard.

## Contributing

Contributions follow a standard branch-and-pull-request workflow: create a feature branch from
`main`, verify the build locally (`npx tsc --noEmit && npx vite build`), and open a pull
request for review before merging. See `CONTRIBUTING.md` for detailed guidelines.

## License

© National Institute of Textile Engineering and Research (NITER). All rights reserved.