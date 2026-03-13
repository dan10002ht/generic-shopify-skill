---
description: Guided refactoring — phân tích code smells, đề xuất improvements, thực hiện từng bước an toàn.
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, AskUserQuestion
---

# Guided Refactoring

Phân tích và refactor code an toàn, từng bước.

## Step 1: Scope

Nếu user chỉ định file/folder → focus vào đó.
Nếu không → hỏi:

Dùng AskUserQuestion: "Muốn refactor gì? (file cụ thể, module, hay toàn bộ codebase?)"

## Step 2: Analysis

Scan target code, tìm:

**Code Smells:**
- Functions > 50 lines
- Files > 300 lines
- Duplicate code (copy-paste > 2 lần)
- God objects / God functions
- Deep nesting (> 3 levels)
- Mixed concerns (business logic trong route, DB queries trong service)

**Convention Violations:**
- Layer boundary violations (models import services, routes import Prisma)
- Missing `.server.ts` suffix trên server-only code
- Default exports thay vì named exports
- `any` types
- Missing error handling

**Performance Issues:**
- N+1 queries (loop + DB call)
- Missing indexes
- Unnecessary re-renders (missing useMemo/useCallback where needed)
- Large bundle imports

Output bảng:

| # | File | Issue | Severity | Effort |
|---|------|-------|----------|--------|
| 1 | ... | ... | High/Med/Low | S/M/L |

Dùng AskUserQuestion: "Muốn fix issues nào? Tất cả hay chọn specific items?"

## Step 3: Plan

Với mỗi issue được chọn, đề xuất approach:

```
Issue #X: [mô tả]
Current: [code hiện tại tóm tắt]
Proposed: [code sau refactor tóm tắt]
Risk: [có break gì không?]
```

Dùng AskUserQuestion: "Plan này ok không? Bắt đầu refactor?"

## Step 4: Execute

Với mỗi issue, thực hiện theo thứ tự:

1. **Verify tests pass** trước khi sửa:
   ```bash
   npm run test -- --related <file>
   ```

2. **Apply change** — 1 issue tại 1 thời điểm

3. **Verify tests vẫn pass** sau khi sửa:
   ```bash
   npm run typecheck && npm run test -- --related <file>
   ```

4. Nếu test fail → rollback, báo user

5. Chuyển sang issue tiếp theo

## Step 5: Summary

```
## Refactoring Summary

### Changes Made
- [file]: [thay đổi gì]

### Metrics
- Lines removed: X
- Files affected: Y
- Issues fixed: Z/N

### Remaining
- [issues chưa fix và lý do]
```

## Rules

- KHÔNG refactor + thêm feature cùng lúc
- KHÔNG sửa tests trong khi refactor production code (trừ khi test cần update theo)
- 1 issue = 1 logical change — dễ review, dễ rollback
- Confirm trước mỗi change nếu risk > Low
- Giữ behavior y hệt — refactor là thay đổi structure, không thay đổi logic

$ARGUMENTS
