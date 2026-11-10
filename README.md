# RAG Assessment Prototype

[![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Integrated-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Status](https://img.shields.io/badge/Status-Prototype-orange?style=flat)](#)

> An automated, psychometrics-driven assessment engine powered by Retrieval-Augmented Generation (RAG) for board licensure examination preparation across Learner, Faculty, and Administrator workflows.

```
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                           [ Dashboard & Exam Preview ]                            |
|                                                                                   |
|   +-----------------------+  +------------------------------------------------+   |
|   |   Navigation Sidebar  |  | Active Assessment Session                      |   |
|   |   - Dashboard         |  | Timer: 01:29:45 | Question 14 of 100           |   |
|   |   - Question Blueprints| |                                                |   |
|   |   - Psychometrics     |  | [BLEPP TOS Domain: Psychological Assessment]   |   |
|   |   - Knowledge Base    |  | AI Rationale & Source Citations Integrated     |   |
|   +-----------------------+  +------------------------------------------------+   |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 1. Header & Tagline

**RAG Assessment Prototype** provides an automated assessment platform leveraging Retrieval-Augmented Generation (RAG) to generate, validate, deliver, and analyze licensure examination questions according to rigorous psychometric standards such as the Board Licensure Examination for Psychologists and Psychometricians (BLEPP) Table of Specifications.

---

## 2. Key Features

The application provides three specialized role-based portals with end-to-end examination workflows:

### 🎓 Learner Portal (`/learner`)
- **Interactive Exam Sessions:** Distraction-free, timed interface (`/learner/exams/[id]/take`) supporting question navigation, flagging, and automated submission.
- **Personalized Learner Dashboard:** Real-time visibility into scheduled mock exams, deadlines, and assigned review materials.
- **Detailed Exam Review:** Question-by-question post-exam review (`/learner/exams/[id]/review`) displaying correct options, granular explanations, and retrieved AI reference citations (`CitationsList`).
- **Performance Analytics:** Historical exam scores, category-level accuracy breakdowns, and comparative trend analysis (`/learner/performance`).
- **Psychometric Progress Roadmap:** Visual domain mastery tracking (`/learner/roadmap`) that assesses readiness against licensure Table of Specifications (TOS) benchmarks and highlights weak topics for targeted revision.
- **Review Materials Hub:** Access curated subject notes and reference documents assigned by faculty (`/learner/materials`).

### 🧑‍🏫 Faculty Portal (`/faculty`)
- **AI-Powered Exam Generation:** Blueprint-driven question generation (`/faculty/exams/create`) using predefined BLEPP TOS weights or custom parameters connecting to the RAG backend (`useExamGeneration`).
- **Question Validation & Regeneration:** Granular review interface allowing faculty to edit, approve, or selectively regenerate question stems, choices, or rationales (`useRegeneration`).
- **Psychometric Item Analysis:** Calculation of item facility (difficulty) index, item discrimination index, and Kuder-Richardson 20 (KR-20) test reliability score (`psychometrics.ts`).
- **Cohort Management:** Create and supervise student cohorts, assign tailored exams and study materials, and monitor group-level progress (`/faculty/cohorts`).
- **Gradebook & Multi-Format Reporting:** Instant export of comprehensive student grades and cohort statistics to CSV, Excel (`.xlsx`), and formatted PDF (`exportUtils.ts`).

### ⚙️ Admin Portal (`/admin`)
- **System Health & Telemetry Dashboard:** Global monitoring of platform health, AI background worker queues, document ingestion progress, and storage usage (`/api/telemetry`).
- **Directory & Access Control:** Centralized user administration (`/admin/users`), user invitations (`/admin/users/add`), cohort assignments (`/admin/cohorts`), and role-based permissions management (`/admin/permissions`, `usePermissions`).
- **RAG Knowledge Base Administration:** Upload, index, and organize domain textbooks and reference documents (`/admin/rag`, `useIngestion`, `storageApi.ts`) that fuel retrieval-augmented exam creation.
- **System Auditing & Activity Logs:** Tamper-evident audit logging (`/admin/logs`) tracking significant actions, authentication attempts, and system events.

---

## 3. Tech Stack

| Category | Technology / Package | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend / Native UI** | [Next.js](https://nextjs.org/) | `16.2.10` | React framework with App Router, SSR, and API routes |
| | [React](https://react.dev/) | `19.2.4` | UI library and component lifecycle management |
| | [React DOM](https://react.dev/) | `19.2.4` | DOM rendering for React components |
| | [Tailwind CSS](https://tailwindcss.com/) | `^4.0.0` | Utility-first CSS styling and custom theme configuration |
| | [@tailwindcss/postcss](https://tailwindcss.com/) | `^4.0.0` | PostCSS plugin for Tailwind CSS compilation |
| | [Lucide React](https://lucide.dev/) | `^1.60.0` | Iconography library across UI portals |
| | [Recharts](https://recharts.org/) | `^3.10.1` | Data visualization for performance analytics and item analysis |
| | [@tanstack/react-virtual](https://tanstack.com/virtual) | `^3.14.13` | High-performance virtualized list rendering |
| **Backend / API** | [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) | `16.2.10` | Internal serverless API endpoints (`/api/telemetry`, `/api/reset-password`) |
| | External AI Service | — | FastAPI & Celery backend for document embedding, RAG ingestion, and question synthesis |
| **Database & Auth** | [@supabase/supabase-js](https://supabase.com/docs/reference/javascript) | `^2.112.4` | Supabase client for database operations and real-time events |
| | [@supabase/ssr](https://supabase.com/docs/guides/auth/server-side/nextjs) | `^0.12.5` | Server-side authentication and cookie management for Next.js |
| | PostgreSQL (Supabase) | — | Relational data persistence with Row-Level Security (RLS) |
| **Document Processing & Export** | [jspdf](https://github.com/parallax/jsPDF) | `^4.2.1` | Client-side PDF generation for assessment reports |
| | [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) | `^5.0.9` | Formatted table generation within PDF exports |
| | [xlsx](https://sheetjs.com/) | `^0.18.5` | Excel spreadsheet generation and gradebook data export |
| **Hosting & Tools** | [TypeScript](https://www.typescriptlang.org/) | `^5.0.0` | Strict static type checking and interfaces |
| | [ESLint](https://eslint.org/) | `^9.0.0` | Static code analysis and linting |
| | [eslint-config-next](https://nextjs.org/docs/app/api-reference/config/eslint) | `16.2.10` | Next.js-specific ESLint rule presets |
| | [PostCSS](https://postcss.org/) | — | CSS transformations and pipeline tooling |

---

## 4. Getting Started

Follow these steps to set up and run the application locally.

### Prerequisites
- **Node.js**: `v20.x` or later (tested on `v22.x`)
- **Package Manager**: `npm` (v10+), `yarn`, or `pnpm`
- **Supabase Account**: A Supabase project instance with database and authentication configured
- **RAG Backend Service**: Running instance of the Python/FastAPI RAG ingestion service (default: `http://localhost:8000`)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/rag-assessment-prototype.git
   cd rag-assessment-prototype
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   # Or create .env.local manually and supply required keys
   ```

4. **Run the local development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 5. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy-anon-key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy-service-role-key

# AI / RAG Ingestion Backend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> **Note:**
> - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are required for client and server Supabase operations.
> - `SUPABASE_SERVICE_ROLE_KEY` is required for administrative backend routes (`/api/reset-password`, `/api/telemetry`). Never expose this key in client-side code.
> - `NEXT_PUBLIC_API_BASE_URL` routes AI exam generation and knowledge base ingestion requests to the dedicated FastAPI backend.

---

## 6. Project Structure

```text
rag-assessment-prototype/
├── app/                              # Next.js App Router root
│   ├── (admin)/                      # Administrator portal
│   │   ├── admin/
│   │   │   ├── cohorts/              # Cohort and student allocation
│   │   │   ├── logs/                 # System audit logs
│   │   │   ├── permissions/          # Access control & permission matrices
│   │   │   ├── rag/                  # RAG knowledge base document management
│   │   │   ├── settings/             # System settings & AI configurations
│   │   │   └── users/                # User directory & user creation
│   │   └── layout.tsx                # Admin layout with navigation shell
│   ├── (entry)/                      # Authentication flows
│   │   ├── forgot_password/          # Password recovery & reset confirmation
│   │   ├── login/                    # Credentials-based sign-in
│   │   └── layout.tsx                # Minimalist auth shell layout
│   ├── (faculty)/                    # Faculty / Educator portal
│   │   ├── faculty/
│   │   │   ├── analytics/            # Psychometrics & KR-20 reliability reports
│   │   │   ├── cohorts/              # Student roster & assignment management
│   │   │   ├── exams/                # Exam repository & blueprint creator
│   │   │   └── materials/            # Learning material distribution
│   │   └── layout.tsx                # Faculty dashboard layout
│   ├── (learner)/                    # Learner / Student portal
│   │   ├── learner/
│   │   │   ├── exams/                # Mock exam catalog, taking interface & review
│   │   │   ├── materials/            # Assigned review guides
│   │   │   ├── performance/          # Score breakdowns and historical trends
│   │   │   └── roadmap/              # BLEPP TOS readiness & mastery roadmap
│   │   └── layout.tsx                # Learner portal layout
│   ├── api/                          # Next.js server-side route handlers
│   │   ├── reset-password/           # Admin-triggered password update API
│   │   └── telemetry/                # Health check and telemetry metrics
│   ├── globals.css                   # Global styles & Tailwind directives
│   ├── layout.tsx                    # Root application layout
│   ├── not-found.tsx                 # Custom 404 page
│   └── page.tsx                      # Root landing / redirect page
├── components/                       # Shared React UI components
│   ├── layout/
│   │   └── DashboardLayout.tsx       # Reusable responsive dashboard frame
│   └── ui/                           # Reusable UI widgets & primitives
│       ├── Badge.tsx                 # Status indicator badges
│       ├── CitationsList.tsx         # Retrieved RAG citations & source references
│       ├── EmptyState.tsx            # Zero-data fallback display
│       ├── FullScreenLoader.tsx      # Global loading overlay
│       ├── GlobalTable.tsx           # Standardized, accessible data tables
│       ├── Skeleton.tsx              # Loading skeleton placeholders
│       └── ToastContext.tsx          # Application-wide toast notifications
├── hooks/                            # Custom React hooks (business logic)
│   ├── useDebounce.ts                # Search and input debounce helper
│   ├── useExamGeneration.ts          # Exam synthesis orchestration with AI backend
│   ├── useIngestion.ts               # RAG document upload & indexing lifecycle
│   ├── usePagination.ts              # Client-side table and list pagination
│   ├── usePermissions.ts             # Role-based capability checks
│   └── useRegeneration.ts            # Granular question & rationale regeneration
├── lib/                              # Core utilities and shared engines
│   ├── authServer.ts                 # Server-side Supabase authentication helpers
│   ├── authUtils.ts                  # Client authentication helpers
│   ├── exportUtils.ts                # CSV, XLSX, and PDF report export generators
│   ├── psychometrics.ts              # Item analysis (facility, discrimination, KR-20)
│   ├── referenceUtils.ts             # Citation parsing and formatting
│   ├── storageApi.ts                 # Supabase storage bucket file management
│   └── supabaseClient.ts             # Browser-side Supabase client singleton
├── public/                           # Static public assets (SVGs, logos)
├── middleware.ts                     # Route protection & role-based redirects
├── next.config.ts                    # Next.js configuration
├── package.json                      # Project dependencies and script declarations
├── postcss.config.mjs                # PostCSS configuration
└── tsconfig.json                     # TypeScript compiler settings
```

---

## 7. Scripts & Testing

The following scripts are defined in `package.json` for development, build, and quality assurance:

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with hot-module reloading at `http://localhost:3000`. |
| `npm run build` | Compiles and optimizes the Next.js application for production deployment. |
| `npm run start` | Launches the Next.js production server (requires running `npm run build` first). |
| `npm run lint` | Runs ESLint to verify code quality, syntax standards, and rule compliance. |

### Quality Assurance & Type Checking
- **Type Checking:** Run TypeScript validation directly with:
  ```bash
  npx tsc --noEmit
  ```
- **Automated Testing:** Unit and psychometrics calculation tests (e.g., KR-20 reliability, item difficulty index) can be integrated with Vitest or Jest. Run tests via:
  ```bash
  npm test
  ```

---

## 8. License & Contact

### License
This project is licensed under the [MIT License](LICENSE) — see the LICENSE file for details.

### Maintainer & Contact
- **Project Maintainer:** RAG Assessment Engine Team
- **Issue Tracker:** Submit bug reports, feedback, or feature requests via GitHub Issues.
- **Repository:** [https://github.com/your-org/rag-assessment-prototype](https://github.com/your-org/rag-assessment-prototype)
