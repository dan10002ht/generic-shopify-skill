---
description: Production bug workflow — investigate, fix, test, deploy nhanh.
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, WebSearch, AskUserQuestion
---

# Hotfix Workflow

Quy trình xử lý bug production nhanh và an toàn.

## Step 1: Investigate

Dùng AskUserQuestion hỏi user:
- Mô tả bug: gì xảy ra? Expected vs actual?
- Ảnh hưởng: bao nhiêu merchants? Critical không?
- Reproduce steps (nếu có)
- Error logs / screenshots (nếu có)

## Step 2: Diagnose

Dựa trên thông tin user cung cấp:

1. **Search codebase** cho related code:
   ```
   Grep/Glob để tìm files liên quan
   ```

2. **Check recent changes** có thể gây ra bug:
   ```bash
   git log --oneline -10
   git diff HEAD~3..HEAD -- <suspected files>
   ```

3. **Analyze root cause** — output:
   - File(s) gây lỗi
   - Root cause
   - Impact assessment (data corruption? UI only? security?)

Dùng AskUserQuestion: "Root cause analysis trên đúng không? Confirm trước khi fix."

## Step 3: Fix

1. Tạo hotfix branch:
   ```bash
   git checkout -b hotfix/<short-description>
   ```

2. Implement fix — nguyên tắc:
   - **Minimal change** — chỉ fix bug, không refactor
   - **Add test** reproduce bug trước, rồi fix
   - **No scope creep** — không sửa thêm thứ khác

3. Verify fix:
   ```bash
   npm run typecheck
   npm run test
   npm run build
   ```

## Step 4: Review & Deploy

1. Show diff cho user:
   ```bash
   git diff
   ```

2. Dùng AskUserQuestion: "Fix này ok không? Có muốn review thêm trước khi deploy?"

3. Commit + merge:
   ```bash
   git add <specific files>
   git commit -m "fix(<scope>): <description>"
   git checkout main
   git merge hotfix/<short-description>
   ```

4. Gợi ý user chạy `/deploy` để push lên production.

## Step 5: Post-mortem (optional)

Suggest user ghi lại:
- Gì đã xảy ra?
- Tại sao không catch trước? (thiếu test? edge case?)
- Cải thiện gì để tránh lặp lại?

## Rules

- KHÔNG sửa thêm bất kỳ thứ gì ngoài bug
- KHÔNG skip tests
- Luôn tạo branch riêng cho hotfix
- Confirm với user trước mỗi bước quan trọng

$ARGUMENTS
