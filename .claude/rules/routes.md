# Glob: app/routes/**

## Route Rules (Remix)

- Prefix `app.` cho tất cả authenticated routes
- `authenticate.admin(request)` ở đầu mọi loader/action
- KHÔNG chứa business logic — delegate sang services/models
- KHÔNG import Prisma trực tiếp — qua models layer
- Mọi route PHẢI có `ErrorBoundary` export
- Loading states dùng Polaris `SkeletonPage`

## Action Pattern
1. Authenticate
2. Parse formData
3. Validate với Zod (safeParse)
4. Call service/model
5. Return json hoặc redirect

## Loader Pattern
1. Authenticate
2. Parse searchParams (optional)
3. Call model
4. Return json
