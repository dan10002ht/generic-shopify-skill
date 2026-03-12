# Test Case Template

```
TC-[ID]: [Test Case Title]
Priority: Critical / High / Medium / Low
Type: Functional / Integration / E2E / Performance / Security

Preconditions:
- [Setup required]

Steps:
1. [Action]
2. [Action]

Expected Result:
- [Expected outcome]

Edge Cases:
- [Edge case 1]
- [Edge case 2]

Test Data:
- [Required test data]
```

# Test Strategy Template

## Scope
- Features included
- Features excluded

## Test Levels
| Level | Tool | Coverage Target | Focus |
|-------|------|-----------------|-------|
| Unit | Vitest | 80%+ | Business logic, utils |
| Integration | Vitest + Prisma | 70%+ | API routes, DB queries |
| E2E | Playwright | Critical paths | User flows |
| Performance | k6 | Baselines | API latency, throughput |

## Risk-Based Priority
| Area | Risk Level | Test Effort |
|------|-----------|-------------|
| Auth/OAuth | Critical | Heavy |
| Billing | Critical | Heavy |
| Core features | High | Moderate |
| UI/cosmetic | Low | Light |

## Environment
- Dev: Local Docker
- Staging: [URL]
- Production: [URL]
