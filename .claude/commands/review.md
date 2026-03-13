Review code changes hiện tại và đưa ra feedback.

## Instructions

1. Chạy `git diff` để xem staged + unstaged changes
2. Chạy `git diff --cached` để xem staged changes
3. Review theo các tiêu chí:
   - **Correctness**: Logic có đúng không?
   - **Security**: Có vulnerability nào không? (OWASP top 10)
   - **Performance**: Có N+1 queries, unnecessary re-renders, memory leaks?
   - **Type Safety**: Có `any`, missing types, unsafe casts?
   - **Testing**: Có test cho logic mới/thay đổi không?
   - **Conventions**: Theo đúng coding rules trong CLAUDE.md?
   - **DRY**: Có code duplicate không?
4. Output format:

### Issues Found
- 🔴 Critical: ...
- 🟡 Warning: ...
- 🟢 Suggestion: ...

### Summary
1-2 câu tóm tắt overall quality.

$ARGUMENTS
