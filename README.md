# RAG Assessment Prototype

This repository contains a prototype for an automated assessment engine powered by Retrieval-Augmented Generation (RAG). Built with Next.js, Supabase, and TypeScript, it provides a comprehensive platform for creating, administering, and analyzing educational assessments with distinct roles for Administrators, Faculty, and Learners. The system is specifically tailored for licensure exam preparation, featuring psychometric analysis based on standards like the BLEPP (Board Licensure Examination for Psychologists and Psychometricians) Table of Specifications.

## Core Features

The platform is divided into three distinct user portals, each with a specialized set of tools:

### 🎓 Learner Portal
- **Interactive Exam Sessions:** A focused, timed interface for taking mock exams.
- **Personalized Dashboards:** View upcoming exams, deadlines, and assigned review materials.
- **Performance Analytics:** Track historical exam scores and overall progress.
- **Detailed Exam Review:** Go through completed attempts question-by-question, viewing correct answers and AI-generated rationales.
- **Progress Roadmap:** A psychometrics-driven dashboard that visualizes domain mastery, projects board licensure readiness, and identifies weak spots for targeted remediation.

### 🧑‍🏫 Faculty Portal
- **AI-Powered Exam Generation:** Create exams using predefined blueprints (e.g., TOS-compliant) or custom parameters, leveraging an AI backend to generate questions from a knowledge base.
- **Question Validation & Management:** Review, edit, approve, or regenerate AI-generated questions before deploying an exam.
- **Cohort Management:** Oversee assigned student cohorts, manage their assigned materials, and track their progress.
- **Advanced Analytics:** Access detailed psychometric reports, including item analysis (facility, discrimination), Kuder-Richardson 20 (KR-20) reliability, and cohort-wide performance breakdowns.
- **Gradebook & Exporting:** View student grades and export comprehensive performance reports in CSV, XLSX, and PDF formats.

### ⚙️ Admin Portal
- **Global System Dashboard:** Monitor platform health, AI worker status, storage usage, and API consumption in real-time.
- **User & Cohort Management:** A centralized directory to create, manage, and assign users (Learners, Faculty, Admins) to their respective cohorts and roles.
- **RAG Knowledge Base:** Upload and manage source documents that fuel the AI generation engine. Configure domain-specific settings and operational contexts for question scenarios.
- **Access Control:** Configure role-based permissions to manage access to sensitive features like user management and audit logs.
- **System Auditing:** A comprehensive log of all significant user actions and system events across the platform.

## Technical Architecture

This project is a modern full-stack application built on the following technologies:

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Backend & Database:** [Supabase](https://supabase.com/) (Authentication, PostgreSQL DB, Storage)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Data Visualization:** [Recharts](https://recharts.org/)
- **State Management:** React Hooks and Context API
- **AI Backend:** A separate service (Python/FastAPI with Celery for background tasks) handles RAG ingestion and exam generation. The frontend communicates with it via a dedicated API.

## Project Structure

The repository is organized following Next.js App Router conventions:

- **/app**: Contains all pages and layouts.
  - **`/(admin)`**, **`/(faculty)`**, **`/(learner)`**: Route groups for each user role, applying role-specific layouts.
  - **`/(entry)`**: Layout for authentication pages like login and password reset.
  - **`/api`**: API routes handled by Next.js for server-side logic like telemetry and password resets.
- **/components**: Shared, reusable React components (`/ui` for primitives, `/layout` for major structures).
- **/hooks**: Custom React hooks encapsulating business logic (e.g., `useExamGeneration`, `useIngestion`, `usePermissions`).
- **/lib**: Core utility functions, including the Supabase client, psychometric calculation engines (`psychometrics.ts`), and data export utilities (`exportUtils.ts`).
- **/public**: Static assets like images and fonts.
