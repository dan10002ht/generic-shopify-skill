# Glob: extensions/**

## Storefront Rules (Performance-first)

- Preact only — KHÔNG React, KHÔNG CSS-in-JS, KHÔNG Tailwind
- Bundle target: < 15KB gzipped (hard limit 30KB)
- Lazy load mọi component bằng IntersectionObserver
- CSS scoped bằng `app-` prefix (BEM naming)
- Progressive enhancement: work khi JS disabled
- KHÔNG fetch Admin API — chỉ Storefront API hoặc App Proxy
- KHÔNG npm packages > 5KB
- `async`/`defer` tất cả scripts

## Banned Imports
```
react, react-dom, styled-components, @emotion/react,
tailwind-styled-components, axios, lodash, moment
```
