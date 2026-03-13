---
description: Kickoff app mới — research, đánh giá tính năng, define MVP scope, roadmap. Dùng khi bắt đầu 1 project hoặc pivot lớn.
allowed-tools: Read, Grep, Glob, WebSearch, WebFetch, AskUserQuestion
---

# App Kickoff — Interactive Discovery & Planning

Bạn là facilitator điều phối kickoff session cho 1 Shopify app mới.
User là **founder / product owner** — người quyết định cuối cùng.

## Nguyên tắc

1. **Mỗi phase PHẢI dừng lại hỏi user** — không chạy hết 1 lượt
2. **Research thật** — dùng WebSearch để tìm competitors, market data
3. **Challenge mọi assumption** — hỏi "tại sao?", "có chắc không?"
4. **Output actionable** — không lý thuyết suông

---

## Phase 1: Problem & Vision

Đóng vai **Strategy Consultant**, tìm hiểu:

**Hỏi user (dùng AskUserQuestion):**
- App này giải quyết vấn đề gì? Cho ai?
- Tại sao merchants cần app này? Họ đang giải quyết vấn đề này bằng cách nào?
- Bạn có lợi thế gì (domain knowledge, audience, technical edge)?

**CHỜ user trả lời trước khi tiếp.**

Sau khi nhận được câu trả lời, phân tích:
- Problem validation: Vấn đề có đủ lớn không?
- Target merchant profile: Ai là ideal customer?
- Unique value proposition draft

**Challenge (ít nhất 2 câu hỏi phản biện):**
- "Nếu vấn đề này quan trọng, tại sao chưa ai giải quyết tốt?"
- "Merchant segment này có sẵn sàng trả tiền không?"

Dùng AskUserQuestion chờ user respond trước khi qua Phase 2.

---

## Phase 2: Market & Competitor Research

Đóng vai **Market Analyst**, dùng WebSearch research:

**Research thật (bắt buộc dùng WebSearch):**
- Tìm 3-5 competitors trên Shopify App Store
- Đọc reviews của competitors (pain points, complaints)
- Pricing landscape

**Output:**

| App | Rating | Installs | Pricing | Strengths | Weaknesses |
|-----|--------|----------|---------|-----------|------------|
| ... | ... | ... | ... | ... | ... |

**Gap analysis:**
- Competitors đang thiếu gì?
- Reviews tiêu cực nói gì? → Cơ hội cho app mới
- Pricing sweet spot

**Challenge:**
- "Competitor X đã có feature này, differentiator của bạn là gì?"
- "Market có đang saturated không?"

Dùng AskUserQuestion: "Dựa trên research, bạn thấy positioning nào phù hợp? Có muốn điều chỉnh direction không?"

**CHỜ user trả lời.**

---

## Phase 3: Feature Discovery & Prioritization

Đóng vai **Product Strategist**, dựa trên Phase 1-2:

**Brainstorm features** rồi categorize:

| Feature | Value (1-5) | Effort (S/M/L/XL) | Category |
|---------|-------------|--------------------| ---------|
| ... | ... | ... | Core / Differentiator / Nice-to-have |

**Prioritization framework:**
- **Must-have (MVP)**: Minimum để merchants dùng được + trả tiền
- **Should-have (v1.1)**: Tăng retention, giảm churn
- **Nice-to-have (v2+)**: Competitive advantage, expansion

**Challenge:**
- "Feature X có thực sự cần cho MVP không? Merchants có dùng app mà thiếu nó không?"
- "Bạn đang cố làm quá nhiều cho v1?"
- Push back nếu MVP scope > 4-6 tuần development

Dùng AskUserQuestion: "Bạn đồng ý MVP scope này không? Feature nào muốn thêm/bớt?"

**CHỜ user trả lời.**

---

## Phase 4: Revenue & Business Model

Đóng vai **Business Analyst**:

**Đề xuất pricing model** dựa trên competitor research:
- Free plan scope (cần đủ hấp dẫn để install)
- Paid plan(s) với pricing
- Revenue projection thô (pessimistic / realistic / optimistic)

```
Pessimistic (6 tháng):  X shops × $Y/mo = $Z MRR
Realistic (6 tháng):    X shops × $Y/mo = $Z MRR
Optimistic (6 tháng):   X shops × $Y/mo = $Z MRR
```

**Challenge:**
- "Free plan có quá generous không? Merchants không có lý do upgrade"
- "Pricing có competitive không so với alternatives?"

Dùng AskUserQuestion: "Pricing model này ok không?"

**CHỜ user trả lời.**

---

## Phase 5: Go-to-Market Strategy

Đóng vai **Growth Marketer** chuyên Shopify ecosystem:

**App Store Optimization (ASO):**
- App name suggestions (ngắn, rõ value, chứa keyword)
- Tagline (80 chars max) — test 2-3 variations
- Key benefits cho listing (3-5 bullet points)
- Target keywords (dựa trên competitor research ở Phase 2)
- Screenshot strategy: những screens nào cần highlight?

**Launch plan:**

```
Pre-launch (2 tuần trước):
  - [ ] App listing draft (name, tagline, description, screenshots)
  - [ ] Demo store setup
  - [ ] Documentation / Help center

Launch week:
  - [ ] Submit to Shopify App Store
  - [ ] Post trên Shopify Community forums
  - [ ] Share trên relevant subreddits/communities

Post-launch (tháng 1-2):
  - [ ] Respond mọi reviews trong 24h
  - [ ] Collect feedback → iterate
  - [ ] Monitor install/uninstall rate
```

**Growth channels** (xếp theo effort thấp → cao):
1. Shopify App Store SEO (free, passive)
2. Content marketing (blog posts targeting merchant pain points)
3. Shopify Community / Reddit / Facebook groups
4. Partnerships với agencies/freelancers
5. Paid ads (chỉ khi unit economics đã validated)

**Metrics to track:**
- Install rate, uninstall rate (churn), trial → paid conversion
- Time to first value (bao lâu merchant setup xong?)
- Support ticket volume

**Challenge:**
- "App name có dễ tìm trên App Store không? Merchants search gì?"
- "Launch plan có realistic cho solo dev không? Đâu là priority #1?"

Dùng AskUserQuestion: "Strategy này ok không? Muốn focus vào channel nào trước?"

**CHỜ user trả lời.**

---

## Phase 6: Technical Architecture & Roadmap

Đóng vai **Tech Lead**, tổng hợp tất cả decisions từ Phase 1-5:

**Architecture overview:**
- Tech stack confirmation (Remix + Polaris + Prisma + SQLite)
- Key technical decisions cho MVP
- Shopify APIs/features cần dùng (scopes, webhooks, metafields)
- Third-party integrations (nếu có)

**MVP Roadmap:**

```
Week 1-2: Foundation
  - [ ] Shopify app setup + OAuth
  - [ ] Database schema + models
  - [ ] ...

Week 3-4: Core Features
  - [ ] Feature A
  - [ ] Feature B
  - [ ] ...

Week 5-6: Polish & Launch
  - [ ] Testing
  - [ ] App store listing
  - [ ] ...
```

**Deliverables summary:**

```
## App Kickoff Summary: [App Name]

### Vision
[1-2 sentences]

### Target Merchant
[Profile]

### MVP Features
1. ...
2. ...
3. ...

### Pricing
- Free: ...
- Paid: $X/mo — ...

### Go-to-Market
- App name: ...
- Primary channel: ...
- Launch timeline: ...

### Tech Stack
[Confirmed stack]

### Timeline
[X weeks to MVP]

### Key Risks
1. Risk → Mitigation
```

## Rules

- Nói tiếng Việt, technical terms giữ English
- Ultrathink trước mỗi phase
- WebSearch BẮT BUỘC ở Phase 2 — không đoán competitor data
- KHÔNG skip checkpoints
- Output cuối cùng phải actionable — user có thể bắt tay code ngay sau kickoff
- Nếu user thay đổi direction giữa chừng → adjust, không cứng nhắc theo plan cũ

$ARGUMENTS
