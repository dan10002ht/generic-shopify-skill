---
description: Onboard dev mới hoặc chính mình khi quay lại project sau thời gian dài. Tổng quan architecture, conventions, cách contribute.
allowed-tools: Read, Grep, Glob, Bash
---

# Project Onboarding Guide

Generate interactive onboarding guide dựa trên trạng thái thực tế của project.

## Step 1: Project Overview

Đọc và tổng hợp:

```bash
# Package info
cat package.json | head -20

# Tech stack
cat CLAUDE.md

# Git activity
git log --oneline -10
git shortlog -sn --no-merges | head -5
```

Output:
- App làm gì (1-2 câu)
- Tech stack
- Team size / contributors
- Trạng thái hiện tại (active dev / maintenance / early stage)

## Step 2: Architecture Map

Scan codebase, tạo architecture overview:

```
Project Structure:
├ app/routes/       → X routes (list key ones)
├ app/models/       → Y models (list all)
├ app/services/     → Z services (list all)
├ app/components/   → Atomic Design (count per level)
├ app/jobs/         → Background jobs
├ app/lib/          → Infrastructure
├ app/utils/        → Utilities
├ extensions/       → Shopify extensions
└ prisma/           → Database schema (N models)
```

**Data flow:**
```
HTTP Request → Route (auth + validate) → Service (logic) → Model (DB) → Response
Webhook      → Handler (HMAC + idempotency) → Job Queue → Service → Model
Cron         → Job → Service → Model
```

## Step 3: Key Conventions

Tóm tắt conventions quan trọng nhất từ `.claude/rules/`:

1. **File naming**: `.server.ts` suffix, PascalCase components, camelCase models
2. **Layer rules**: Routes → Services → Models (strict downward)
3. **Multi-tenant**: Mọi query có `shop` param, soft delete `deletedAt: null`
4. **Components**: Polaris only, Atomic Design, named exports
5. **Testing**: Vitest, real DB, 80% coverage target

## Step 4: Getting Started

```bash
# Setup commands
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Quality commands
npm run typecheck
npm run lint
npm run test
npm run build

# Claude commands
/status          — project overview
/scaffold        — tạo files mới
/db              — database operations
/check           — full quality pipeline
/review          — code review
/deploy          — deploy to production
```

## Step 5: Key Files to Read First

List top 10 files mà dev mới nên đọc đầu tiên, ordered by importance:

1. `CLAUDE.md` — project conventions
2. `prisma/schema.prisma` — data model
3. `app/lib/shopify.server.ts` — Shopify config
4. `app/lib/db.server.ts` — Database setup
5. Key route files (list 2-3 most important)
6. Key service files (list 2-3 most important)
7. ... (dựa trên actual codebase)

## Output Format

Output toàn bộ như 1 guide document mà dev mới có thể đọc trong 10 phút.

$ARGUMENTS
