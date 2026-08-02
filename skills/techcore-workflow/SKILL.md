---
name: techcore-workflow
description: Standard development and architectural workflows for TechCore Enterprise (Nuxt 3, Vue 3, Tailwind, Pinia, pnpm).
---

<!-- File: /skills/techcore-workflow/SKILL.md -->

# TechCore Enterprise Workflow & Architectural Standards

This skill documents the mandatory development practices, API protocols, UI guidelines, and auto-maintenance rules for TechCore Enterprise.

---

## 1. Stack & Package Management
- **Primary Runtime**: Nuxt 3 (`^4.4.6`) + Vue 3 (`^3.5.34`) + TypeScript (`~5.8.2`)
- **Package Manager**: **pnpm** strictly (`pnpm-lock.yaml`). Never run `npm` or `yarn`.
- **Styling**: Tailwind CSS (`^3.4.19`), `clsx`, `tailwind-merge` (`cn()` helper in `@/utils`).
- **Icons**: Exclusively `lucide-vue-next`.

---

## 2. API Communication Guidelines
- **Trailing Slashes Requirement**: ALWAYS append a trailing slash (`/`) to all API endpoints (`/api/v1/products/`, `/api/v1/categories/${id}/`, `/api/v1/auth/login/`).
- **ApiClient Composables**: All requests must pass through `useApiClient()`.
- **JWT Auto-Refresh**: Uses queued interceptors with refresh endpoint fallback strategy (`/api/v1/token/refresh/`, `/api/v1/auth/token/refresh/`, `/api/v1/auth/refresh/`).
- **Session Expiry Event**: Emits `'techcore-auth-required'` on token failure to trigger global authentication drawer/modal.
- **Pagination Interface**: All paginated responses must implement `PaginatedResponse<T>` (`results`, `count`, `next`, `previous`, `pages`, `page`).

---

## 3. Component & UI Patterns
- **File Header Comments**: Place a relative path comment at the top line of every source file:
  - Vue files: `<!-- File: /pages/index.vue -->`
  - TS files: `// File: /composables/useApiClient.ts`
- **Buttons**: Use `UiButton` or `Button` with `primary`, `outline`, or `ghost`.
- **Contrast Security Rule**: Pair `bg-primary` with `text-primary-foreground` to ensure WCAG legibility in both light and dark themes.
- **Modals**:
  - Backdrop overlay with click-outside handler (`@click.self`) and `cursor-pointer`.
  - Wrap interactive modal data collection in `<form @submit.prevent="...">`.
  - Aux buttons: `type="button"`. Confirm/submit button: `type="submit"`.
  - Auto-focus first input field via `nextTick()`.

---

## 4. Auto-Maintenance Checklist
1. Align components to designated folders (`/components/ui/`, `/components/layout/`).
2. Sync barrel `index.ts` files and imports when files are moved or renamed.
3. Clean up empty folders and temporary files.
4. Verify project compilation (`pnpm build`) and type check (`pnpm lint`).
