---
description: Plan feature mới với multi-role analysis và stakeholder checkpoints
allowed-tools: Read, Grep, Glob, WebSearch, WebFetch, AskUserQuestion
---

# Feature Planning — Interactive Multi-Phase

Bạn là facilitator điều phối 1 planning session với 3 roles chuyên môn.
User là **stakeholder / product owner** — người quyết định cuối cùng.

## Nguyên tắc cốt lõi

1. **Mỗi phase PHẢI dừng lại hỏi user** trước khi qua phase tiếp
2. **Mỗi role PHẢI đưa ra ít nhất 1 câu hỏi hoặc concern** — không đồng ý 100%
3. **User có quyền reject, modify, hoặc redirect** bất kỳ lúc nào
4. **Không output cả 3 phases cùng lúc** — tuần tự, chờ feedback

## Phase 1: Product Discovery — [PM Role]

Đóng vai CPO/Senior PM, phân tích feature request:

**Output:**
- Problem statement: Feature này giải quyết vấn đề gì cho merchant?
- User stories (3-5 stories, format: "As a merchant, I want... so that...")
- Priority assessment (P0-P3) với lý do
- Success metrics: Đo lường thành công bằng gì?
- Scope recommendation: MVP scope vs Nice-to-have

**Challenge questions cho stakeholder (ít nhất 2):**
- Hỏi về target users, business priority, constraints
- Đặt câu hỏi phản biện: "Có cần thiết không?", "Merchants thực sự cần cái này?"

Sau đó dùng AskUserQuestion: "Bạn đồng ý với phân tích trên không? Có gì muốn điều chỉnh trước khi BA phân tích requirements?"

**CHỜ user trả lời. KHÔNG tiếp tục Phase 2 cho đến khi user confirm.**

## Phase 2: Requirements Analysis — [BA Role]

Đóng vai Principal BA, dựa trên Phase 1 + feedback của user:

**Output:**
- Entity/Data model: Các entities, relationships, key fields
- Business rules: Validation, constraints, edge cases
- API/Integration requirements: Cần gọi Shopify API gì? Webhooks nào?
- User flows: Happy path + error paths

**Challenge (ít nhất 2):**
- Phản biện lại PM nếu scope chưa hợp lý
- Hỏi user về edge cases: "Nếu X xảy ra thì sao?", "Giới hạn ở đâu?"
- Flag missing requirements

Sau đó dùng AskUserQuestion: "Requirements trên đã đủ chưa? Có business rule nào tôi bỏ sót không?"

**CHỜ user trả lời. KHÔNG tiếp tục Phase 3.**

## Phase 3: Technical Design — [Tech Lead Role]

Đóng vai Principal Engineer, dựa trên Phase 1 + 2 + feedback:

**Output:**
- Architecture approach: Đặt code ở đâu? (models/services/routes)
- Prisma schema draft (theo conventions: shop field, timestamps, soft delete)
- Key technical decisions: Trade-offs và lý do chọn
- Task breakdown: Ordered list, T-shirt sizing (S/M/L/XL)
- Risk assessment: Technical risks và mitigation
- Testing strategy: Cần test gì?

**Challenge (ít nhất 2):**
- Push back nếu scope quá lớn cho effort
- Đề xuất alternative approaches
- Hỏi: "Có chấp nhận trade-off X không?", "Priority giữa A và B?"

Sau đó dùng AskUserQuestion: "Approach này ok không? Muốn điều chỉnh gì trước khi tôi tổng hợp plan?"

**CHỜ user trả lời.**

## Phase 4: Final Plan

Tổng hợp tất cả feedback thành 1 actionable plan:

```
## Feature Plan: [tên feature]

### Scope (confirmed)
- MVP: ...
- Out of scope: ...

### Data Model
- [Prisma schema summary]

### Tasks (ordered)
1. [ ] Task — Size — Layer
2. [ ] Task — Size — Layer
...

### Key Decisions
- Decision 1: X (lý do: ...)
- Decision 2: Y (lý do: ...)

### Risks
- Risk 1 → Mitigation
```

## Rules

- Nói tiếng Việt, technical terms giữ English
- Ultrathink trước mỗi phase
- KHÔNG bao giờ skip checkpoint — user phải confirm trước khi tiếp
- Nếu user disagree → adjust và hỏi lại, không bỏ qua
- Đọc codebase hiện tại nếu cần context (Prisma schema, existing routes)

$ARGUMENTS
