# User Story Template

```
AS A [merchant/customer/admin]
I WANT TO [action]
SO THAT [business value]
```

## Acceptance Criteria (Given/When/Then)

```
GIVEN [precondition / context]
WHEN [action / trigger]
THEN [expected outcome]
```

### Happy Path
- GIVEN ... WHEN ... THEN ...

### Edge Cases
- GIVEN ... WHEN ... THEN ...

### Error Cases
- GIVEN ... WHEN ... THEN ...

## Dependencies
- [ ] Dependency 1

## Out of Scope
- Explicitly excluded item 1

## Non-Functional Requirements
- **Performance**: Response time < X ms
- **Security**: Authentication required? Data sensitivity?
- **Scalability**: Expected load / concurrent users
- **Accessibility**: WCAG 2.1 compliance level

## Shopify-Specific Considerations
- **API Scopes Required**: `read_products`, `write_orders`, etc.
- **Webhooks Needed**: `orders/create`, `app/uninstalled`, etc.
- **Rate Limits**: GraphQL cost budget per query
- **Billing Impact**: Nếu feature ảnh hưởng pricing plan
