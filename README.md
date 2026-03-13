# Generic Shopify App — Claude Code Skills

A production-ready `.claude/` configuration for building Shopify apps with **Claude Code**. Built for the **Remix + Polaris + Prisma** stack with cost-optimized solo dev workflow.

## What's Inside

69 files (~400KB) of structured skills, commands, rules, hooks, agents, and templates — everything Claude Code needs to assist you from idea to production.

### Quick Start

```bash
# 1. Copy .claude/ and CLAUDE.md into your Shopify app project
cp -r .claude/ /path/to/your-shopify-app/.claude/
cp CLAUDE.md /path/to/your-shopify-app/CLAUDE.md
cp .mcp.json /path/to/your-shopify-app/.mcp.json

# 2. Open your project with Claude Code
cd /path/to/your-shopify-app
claude

# 3. Start building
/kickoff       # Plan a new app from scratch
/plan-feature  # Plan a specific feature
/scaffold      # Generate files following conventions
```

## Architecture

```
.claude/
├── agents/        4 autonomous AI agents
├── commands/     12 interactive slash commands
├── rules/         7 path-scoped coding rules (auto-applied)
├── hooks/         6 lifecycle automation scripts
├── skills/       11 specialized AI personas + code patterns
│   ├── pm/           CPO — strategy, PRD, prioritization
│   ├── ba/           Business Analyst — requirements, specs
│   ├── tech-lead/    Principal Engineer — architecture, DevOps
│   ├── tester/       QA/SDET — test strategy, automation
│   ├── team/         Multi-role team discussion mode
│   ├── dev-api/      Backend patterns (webhooks, queue, cron)
│   ├── dev-admin/    Admin UI patterns (Remix + Polaris)
│   ├── dev-storefront/ Storefront patterns (Preact, <15KB)
│   ├── dev-shopify/  Platform conventions (metafields, throttle)
│   └── dev-patterns/ Architecture (Atomic Design, Repository)
├── settings.json  Permissions + hook configuration
└── .gitignore
```

## Commands

### Planning
| Command | Description |
|---------|-------------|
| `/kickoff` | 6-phase app discovery: problem → market → features → revenue → GTM → tech |
| `/plan-feature` | 3-role planning: PM → BA → Tech Lead with stakeholder checkpoints |

### Development
| Command | Description |
|---------|-------------|
| `/scaffold` | Generate files following project conventions |
| `/db` | Prisma operations (migrate, generate, status, seed) |
| `/review` | Code review on current changes |
| `/check` | Full quality pipeline (typecheck, lint, test, build) |
| `/test` | Smart test runner with coverage and failure analysis |
| `/refactor` | Guided refactoring: analyze → plan → execute safely |

### Operations
| Command | Description |
|---------|-------------|
| `/deploy` | Pre-checks → confirm → deploy → verify |
| `/hotfix` | Production bug workflow: investigate → fix → test → deploy |
| `/status` | Project overview (git, deps, DB, TODOs) |
| `/onboard` | Generate onboarding guide from actual codebase |

## Team Roles (Skills)

Invoke with slash commands to get role-specific expertise:

| Role | Command | Expertise |
|------|---------|-----------|
| CPO | `/pm` | Product strategy, roadmap, RICE scoring |
| Business Analyst | `/ba` | Requirements, user stories, specs |
| Tech Lead | `/tech-lead` | Architecture, DevOps, implementation |
| QA Engineer | `/tester` | Test strategy, automation, quality |
| Full Team | `/team` | Multi-role discussion with challenges |

## Agents

Autonomous agents for specialized tasks:

| Agent | Purpose |
|-------|---------|
| `scaffolder` | Generate code following all conventions |
| `db-architect` | Database design, migrations, query optimization |
| `code-reviewer` | Correctness, security, performance review |
| `performance-auditor` | DB queries, bundle size, API latency audit |

## Rules (Auto-applied)

Rules are automatically applied based on file path:

| Rule | Glob Pattern | Enforces |
|------|-------------|----------|
| Components | `app/components/**` | Atomic Design, Polaris only, named exports |
| Server Code | `app/models/**,services/**,jobs/**` | `.server.ts`, multi-tenant, soft delete |
| Routes | `app/routes/**` | Authentication, no business logic, ErrorBoundary |
| Prisma Schema | `prisma/**` | Model structure, indexes, migration safety |
| Shared Code | `app/lib/**,utils/**,types/**,hooks/**` | Import direction, naming conventions |
| Storefront | `extensions/**` | Preact only, <15KB budget, no banned imports |
| Tests | `**/*.test.*` | Vitest, real DB (no mocks), 80% coverage |

## Hooks

Automated lifecycle scripts:

| Hook | Trigger | Action |
|------|---------|--------|
| `session-context` | Session start | Inject git/project state into conversation |
| `protect-files` | Before Edit/Write | Block edits to `.env`, lock files, migrations |
| `pre-commit-typecheck` | Before `git commit` | Run TypeScript check, block on errors |
| `auto-format` | After Edit/Write | Run Prettier on edited files |
| `lint-on-edit` | After Edit/Write | Report ESLint issues as context |
| `notify-macos` | Notification | macOS desktop alert with sound |

## Templates & References

Ready-to-copy configurations and code examples:

### Infrastructure (`skills/tech-lead/reference/`)
| Template | Copy To | When |
|----------|---------|------|
| `Dockerfile` | Project root | Deploying to containers |
| `docker-compose.yml` | Project root | Local dev environment |
| `dependabot.yml` | `.github/dependabot.yml` | Auto-update dependencies |
| `lighthouserc.js` | Project root | Storefront performance budget |
| `sentry-setup.ts` | `app/lib/monitoring.server.ts` | Error tracking + logging |
| `adr-template.md` | `docs/adr/` | Architecture decisions |

### Test Examples (`skills/tester/templates/`)
| Template | Framework | Pattern |
|----------|-----------|---------|
| `example-service.test.ts` | Vitest | Real DB, multi-tenant isolation |
| `example-component.test.tsx` | RTL + Polaris | User interaction testing |
| `example-e2e.test.ts` | Playwright | Page object pattern |
| `example-webhook.test.ts` | Vitest | HMAC mock, idempotency, GDPR |
| `example-loadtest.js` | k6 | Multi-tenant load simulation |
| `ci-pipeline.yml` | GitHub Actions | Lint, test, build, bundle check |

### Business Templates
| Template | Location | Purpose |
|----------|----------|---------|
| PRD template | `skills/pm/templates/prd.md` | Product Requirements Document |
| User story | `skills/ba/templates/user-story.md` | User stories + acceptance criteria |
| Checklist | `skills/ba/templates/checklist.md` | Requirements analysis checklist |
| Test case | `skills/tester/templates/test-case.md` | Test case template |
| Bug report | `skills/tester/templates/bug-report.md` | Bug report with severity guide |

## Tech Stack

Optimized for solo dev, with clear scale path:

```
Phase 1 (MVP):     SQLite + DB queue + node-cron     → $5-10/mo
Phase 2 (Growth):  PostgreSQL + DB queue              → $15-20/mo
Phase 3 (Scale):   PostgreSQL + Redis + BullMQ        → $30-50/mo
```

| Layer | Technology |
|-------|-----------|
| Framework | Remix (Shopify App Template) |
| UI | Polaris + App Bridge 4.x |
| Storefront | Preact (<15KB gzipped) |
| Language | TypeScript (strict mode) |
| ORM | Prisma |
| Database | SQLite → PostgreSQL |
| Queue | DB-based → BullMQ |
| Testing | Vitest + RTL + Playwright |
| Deployment | Railway / Fly.io |

## Code Pattern Coverage

50+ KB of production-grade TypeScript patterns:

**Backend (10 patterns):** Prisma models, webhook handlers, DB queue, cron jobs, API responses, Zod validation, rate limiting, App Proxy, transactions, structured logging

**Admin UI (9 patterns):** Loaders, actions, Polaris layouts, error boundaries, GraphQL queries, resource pickers, toasts/banners, pagination, bulk actions

**Storefront (9 patterns):** Preact components, Signals state, lazy loading, Theme App Extensions, Storefront API, tracking pixels, CSS scoping, bundle entry, Vite config

**Shopify Platform (3 guides):** Metafields/metaobjects, Built for Shopify checklist, API throttle handling

## Customization

### Adapting for your project

1. **CLAUDE.md** — Update project name, team structure, and tech stack
2. **Rules** — Modify glob patterns if your directory structure differs
3. **Skills** — Update patterns to match your specific Shopify app type
4. **Hooks** — Adjust protected files list and formatting preferences
5. **Settings** — Add/remove allowed commands for your workflow

### Adding new skills

```
.claude/skills/your-skill/
├── SKILL.md          # Persona + expertise description
└── patterns.md       # Code patterns and examples
```

### Adding new commands

```
.claude/commands/your-command.md
```

With frontmatter:
```yaml
---
description: What the command does
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---
```

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI
- Node.js 20+
- macOS (for notification hook) — remove `notify-macos.sh` on Linux

## License

MIT
