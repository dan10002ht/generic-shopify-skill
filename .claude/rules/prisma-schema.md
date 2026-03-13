# Glob: prisma/**

## Prisma Schema Rules

### Model Structure (bắt buộc cho mọi model)
```prisma
model ModelName {
  id        String    @id @default(cuid())
  shop      String                          // multi-tenant key
  // ... business fields ...
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?                       // soft delete

  @@index([shop])
  @@index([deletedAt])
}
```

### Naming
- PascalCase: model names, enum names
- camelCase: field names
- SCREAMING_SNAKE: enum values

### Indexes
- `@@index([shop])` trên MỌI model (multi-tenant queries)
- `@@index([deletedAt])` cho soft delete filtering
- Composite indexes cho frequent WHERE combinations
- `@@unique` cho business-unique constraints (luôn include `shop`)

### Relations
- `onDelete: Cascade` chỉ cho true child records
- `onDelete: SetNull` cho optional references
- KHÔNG cascade delete across aggregate boundaries

### Enums
```prisma
enum StatusName {
  DRAFT
  ACTIVE
  PAUSED
  ARCHIVED
}
```

### Migration Safety
- KHÔNG modify existing migration files
- KHÔNG rename columns trực tiếp — tạo new column → migrate data → drop old
- Luôn test migration trên copy of production data trước
- `npx prisma migrate dev --name descriptive-name`

## See Also
- DB architect agent: `.claude/agents/db-architect.md`
- Backend patterns: `.claude/skills/dev-api/patterns.md` (Prisma model, transaction)
- Server-side rules: `.claude/rules/server-code.md`
