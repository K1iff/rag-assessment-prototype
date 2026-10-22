# Agent Instructions & Project Context

## Overview
Automated assessment engine built with Next.js (App Router), TypeScript, and Tailwind CSS.

## Tech Stack & Architecture
- Framework: Next.js (App Router, located in `/app`)
- Language: TypeScript
- Styling: Tailwind CSS, Lucide React (or your icon library)
- State & Hooks: Custom hooks located in `/hooks`
- Shared Components: Reusable UI widgets located in `/components`

## Operational Guidelines for AI Agents
1. **Preserve Contracts:** Do not alter existing API request/response contracts connecting to the backend.
2. **Component Reuse:** Before creating new UI elements, check `/components` for existing styles, tables, and buttons.
3. **TypeScript Strictness:** All changes must pass TypeScript validation without type errors (`npx tsc --noEmit`).
4. **Scope Discipline:** Only touch files explicitly related to the assigned prompt or plan. Do not refactor unrelated pages.
