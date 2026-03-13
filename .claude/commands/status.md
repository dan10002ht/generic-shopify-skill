Hiển thị tổng quan trạng thái project hiện tại.

## Instructions

Thu thập và hiển thị:

1. **Git Status**: branch hiện tại, uncommitted changes, ahead/behind remote
2. **Recent Commits**: 5 commits gần nhất (`git log --oneline -5`)
3. **Dependencies**: check `package.json` exists, list key deps
4. **Database**: `npx prisma migrate status` (nếu Prisma đã setup)
5. **TODO/FIXME**: scan codebase cho TODO và FIXME comments

Format output gọn, dễ scan:

```
📍 Branch: feat/commission-tracking (2 ahead, 0 behind)
📝 Changes: 3 modified, 1 untracked
🗄️ DB: 5 migrations applied, up to date
⚠️ TODOs: 3 found (app/services/commission.server.ts:42, ...)
```

$ARGUMENTS
