# Glob: app/components/**

## Component Rules (Atomic Design)

- **atoms/**: Chỉ nhận props, không fetch data, không import molecules/organisms
- **molecules/**: Combine 2-3 atoms, minimal logic, không import organisms
- **organisms/**: Có thể có internal state, nhận data via props
- **templates/**: Layout only, no business logic, accept children/slots

## Import Direction
```
atoms      → Polaris, utils, types
molecules  → atoms, Polaris, utils, types, hooks
organisms  → molecules, atoms, Polaris, utils, types, hooks
templates  → Polaris, types (NO business components)
```

## Conventions
- PascalCase file names
- Named exports (không default export)
- Polaris components only — KHÔNG custom CSS trong admin
- Test file cùng folder: `Component.test.tsx`

## See Also
- Architecture: `.claude/skills/dev-patterns/atomic-design.md`
- Admin patterns: `.claude/skills/dev-admin/patterns.md`
- Component test examples: `.claude/skills/tester/templates/example-component.test.tsx`
