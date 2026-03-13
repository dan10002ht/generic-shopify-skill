---
description: Chạy tests — unit, component, E2E, hoặc coverage report. Hỗ trợ chạy targeted tests cho file/module cụ thể.
allowed-tools: Read, Grep, Glob, Bash, AskUserQuestion
---

# Test Runner

Chạy tests thông minh dựa trên context.

## Step 1: Determine Scope

Nếu user chỉ định target → focus vào đó.
Nếu không → detect từ recent changes:

```bash
# Files changed since last commit
git diff --name-only HEAD
git diff --name-only --cached
```

Map changed files → related test files:
- `app/models/product.server.ts` → `app/models/product.server.test.ts`
- `app/components/atoms/Badge.tsx` → `app/components/atoms/Badge.test.tsx`
- `app/services/order.server.ts` → `app/services/order.server.test.ts`

## Step 2: Run Tests

### Targeted (có specific files)
```bash
npm run test -- --reporter=verbose <test-files>
```

### Full Suite
```bash
npm run test -- --reporter=verbose
```

### With Coverage
```bash
npm run test -- --coverage --reporter=verbose
```

### E2E Only
```bash
npx playwright test
```

## Step 3: Analyze Results

Với mỗi test run, report:

```
## Test Results

### Summary
- ✅ Passed: X
- ❌ Failed: Y
- ⏭ Skipped: Z
- ⏱ Duration: Xs

### Failed Tests (nếu có)
- [file:line] test name — error message
  → Suggested fix: ...

### Coverage (nếu chạy --coverage)
| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| models/ | X% | X% | X% | X% |
| services/ | X% | X% | X% | X% |
| components/ | X% | X% | X% | X% |

Target: >= 80% cho critical paths (services/, models/)
```

## Step 4: Fix Failures (nếu user muốn)

Với mỗi test failure:
1. Đọc test file và source file liên quan
2. Analyze root cause
3. Đề xuất fix (test sai hay source sai?)
4. Hỏi user confirm trước khi sửa

## Rules

- KHÔNG skip failing tests — fix hoặc report
- KHÔNG sửa test để pass mà không fix root cause
- Chạy targeted tests trước, full suite sau
- Report coverage gaps cho critical paths

$ARGUMENTS
