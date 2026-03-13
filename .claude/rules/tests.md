# Glob: **/*.test.ts,**/*.test.tsx

## Testing Rules

- Unit tests: Vitest — mọi service, model, utility
- Component tests: React Testing Library
- E2E: Playwright — critical user journeys
- Coverage target: >= 80% cho critical paths

## Conventions
- `describe("ModuleName")` → `it("should do expected behavior")`
- Mỗi test self-contained — không share mutable state
- NO mocks cho database — dùng test database thật
- Test file cùng folder với source file
- Arrange → Act → Assert pattern

## Khi nào viết test?
- Mới tạo service/model → PHẢI có test
- Fix bug → viết regression test trước khi fix
- Refactor → đảm bảo tests pass trước và sau
