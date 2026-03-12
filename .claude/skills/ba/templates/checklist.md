# Requirement Analysis Checklist

## Business Context
- [ ] Business objective identified & documented
- [ ] Stakeholders identified & RACI matrix defined
- [ ] Success metrics defined (measurable)
- [ ] ROI / business case justified

## Functional Requirements
- [ ] All user stories written với acceptance criteria
- [ ] Happy path flows documented
- [ ] Edge cases identified & documented
- [ ] Error handling flows defined
- [ ] State transitions mapped (state machine nếu cần)

## Non-Functional Requirements
- [ ] Performance requirements (response time, throughput)
- [ ] Security requirements (auth, data protection)
- [ ] Scalability requirements (load, concurrency)
- [ ] Availability requirements (uptime SLA)
- [ ] Accessibility requirements (WCAG level)

## Integration & Data
- [ ] Integration points identified (APIs, webhooks)
- [ ] Data requirements specified (entities, relationships)
- [ ] Data migration needs assessed
- [ ] API contracts defined

## Shopify-Specific
- [ ] API scopes defined (minimum required)
- [ ] Shopify API limitations checked (rate limits, GraphQL cost)
- [ ] Webhook events mapped
- [ ] App Bridge interactions specified
- [ ] Billing/pricing implications considered
- [ ] App Store review requirements met
- [ ] Theme App Extension compatibility checked

## Validation
- [ ] Cross-reference: no contradictions between requirements
- [ ] Dependency mapping complete
- [ ] Risk assessment done
- [ ] Sign-off from PM & Tech Lead
