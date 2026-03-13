Scaffold new files theo project conventions.

## Instructions

Dựa vào argument để tạo files đúng convention:

### Component: `scaffold component <name> [level]`
Level: atom | molecule | organism | template (default: atom)
- Tạo `app/components/{level}s/{Name}.tsx`
- Tạo `app/components/{level}s/{Name}.test.tsx`
- Follow Atomic Design pattern từ dev-patterns skill

### Model: `scaffold model <name>`
- Tạo `app/models/{name}.server.ts`
- Tạo `app/models/{name}.server.test.ts`
- Include CRUD operations skeleton với Prisma

### Service: `scaffold service <name>`
- Tạo `app/services/{name}.server.ts`
- Tạo `app/services/{name}.server.test.ts`
- Include business logic skeleton

### Route: `scaffold route <path>`
- Tạo `app/routes/app.{path}.tsx`
- Include loader + action skeleton theo Remix convention

### Job: `scaffold job <name>`
- Tạo `app/jobs/{name}.ts`
- Include BullMQ job skeleton

Luôn follow naming conventions từ CLAUDE.md. Hỏi clarification nếu argument không rõ ràng.

$ARGUMENTS
