---
description: Deploy app lên production/staging. Chạy quality checks trước khi deploy.
allowed-tools: Read, Grep, Glob, Bash, AskUserQuestion
---

# Deploy Workflow

Chạy pre-deploy checks rồi deploy lên target environment.

## Step 1: Pre-deploy Checks

Chạy tuần tự, dừng ngay nếu có lỗi:

```bash
# 1. Ensure clean working tree
git status

# 2. TypeScript
npm run typecheck

# 3. Lint
npm run lint

# 4. Tests
npm run test

# 5. Build
npm run build
```

Nếu bất kỳ step nào fail → DỪNG, báo lỗi, KHÔNG deploy.

## Step 2: Database Migration Check

```bash
npx prisma migrate status
```

- Nếu có pending migrations → cảnh báo user
- Dùng AskUserQuestion: "Có pending migrations. Muốn chạy migrate trước khi deploy không?"

## Step 3: Confirm Deploy

Dùng AskUserQuestion hỏi:
- Target: production hay staging?
- Có changes nào cần lưu ý đặc biệt không? (breaking changes, migration)

## Step 4: Deploy

Dựa trên platform đã config:

**Railway:**
```bash
# Push to trigger auto-deploy
git push origin main
# Check deploy status
railway status
```

**Fly.io:**
```bash
fly deploy --strategy rolling
fly status
```

**Manual/Other:**
```bash
# Push to main (triggers CI/CD)
git push origin main
```

## Step 5: Post-deploy Verification

```bash
# Check app is running
curl -s -o /dev/null -w "%{http_code}" https://<app-url>/

# Check recent logs for errors
railway logs --recent  # hoặc fly logs
```

Report:
- Deploy status: success/fail
- App URL
- Any errors in logs

## Rules

- KHÔNG deploy nếu pre-checks fail
- KHÔNG force push
- Luôn confirm với user trước khi push
- Nếu deploy fail → suggest rollback steps

$ARGUMENTS
