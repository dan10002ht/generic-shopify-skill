Chạy full quality check cho project.

## Instructions

Chạy lần lượt và report kết quả:

1. **TypeScript**: `npm run typecheck` (nếu có)
2. **Lint**: `npm run lint` (nếu có)
3. **Test**: `npm run test` (nếu có)
4. **Build**: `npm run build` (nếu có)

Với mỗi step:
- ✅ Pass → ghi ngắn gọn
- ❌ Fail → list errors cụ thể và suggest fix

Nếu script chưa tồn tại trong package.json, skip và note lại.

$ARGUMENTS
