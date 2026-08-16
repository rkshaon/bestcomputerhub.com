<!-- File: /README.md -->

# Best Computer Hub — Frontend

Frontend application for **Best Computer Hub**, an e-commerce platform focused on computers, components, accessories, networking equipment, and related technology products.

This project is a rebuild of the existing WordPress/WooCommerce storefront using **Nuxt, Vue 3, TypeScript, Tailwind CSS, and Pinia**.

The frontend communicates with a **Django REST Framework (DRF)** backend and is designed around server-rendered storefront content, SEO, maintainable domain boundaries, and reusable UI architecture.

---

## References
* [Backend Reference](https://github.com/KrystalSoftwareBangladesh/Ecommerce-Backend)
* [Docs](https://apibestcomputerhub.rkshaon.info/docs)

---

## Technology Stack

### Core

* **Nuxt** — application framework and SSR
* **Vue 3** — UI framework
* **TypeScript** — strict type-safe development
* **Vite** — development and build tooling
* **pnpm** — package manager

### Styling

* **Tailwind CSS**
* **clsx**
* **tailwind-merge**
* Project-level semantic design tokens

### State & Utilities

* **Pinia** — application state management
* **VueUse** — Vue composable utilities
* **vue-sonner** — notifications
* **lucide-vue-next** — icon library

### Backend

The frontend consumes APIs provided by:

* Django
* Django REST Framework
* PostgreSQL

The backend remains authoritative for commerce business rules such as pricing, inventory, authentication, checkout, orders, and permissions.

---

## Architecture

The frontend follows a layered Nuxt architecture.

```text
Pages
  │
  ├── route orchestration
  ├── SSR data loading
  └── SEO
        │
        ▼
Components / Features
        │
        ▼
Composables / Domain Services
        │
        ▼
useApiClient
        │
        ▼
Django REST Framework
```

Primary directories:

```text
.
├── AGENTS.md
├── app.vue
├── assets/
│   └── css/
├── components/
│   ├── commerce/
│   ├── layout/
│   └── ui/
├── composables/
├── docs/
│   └── agent-context/
├── features/
├── layouts/
├── middleware/
├── pages/
├── skills/
├── stores/
├── types/
├── utils/
├── nuxt.config.ts
├── tailwind.config.mjs
└── package.json
```

### Pages

`/pages/` contains Nuxt file-based routes.

Pages are responsible primarily for:

* route handling
* route-level data fetching
* SSR
* SEO metadata
* page composition
* route-level error handling

Large reusable functionality should not be embedded directly into route files.

### Components

```text
/components/ui/
```

Reusable generic UI primitives.

```text
/components/layout/
```

Application-level structural components such as the header and footer.

```text
/components/commerce/
```

Reusable storefront commerce components such as product cards and cart UI.

### Features

```text
/features/
```

Contains larger domain-specific UI and workflows that do not belong in generic components.

### Composables

```text
/composables/
```

Contains reusable application logic and domain API services.

The centralized API client is:

```text
/composables/useApiClient.ts
```

Domain API access should be organized through appropriate services such as:

```text
useProductService
useCategoryService
useBrandService
useBlogService
```

### Stores

```text
/stores/
```

Contains Pinia stores for application-facing state such as authentication, cart, wishlist, and UI state.

Frontend state must not replace backend authority for commerce-critical information.

### Types

```text
/types/
```

Contains shared TypeScript domain and API contracts.

Types should remain domain-oriented and should not be duplicated unnecessarily across pages, stores, and composables.

---

## Server Rendering & SEO

SEO is a primary requirement of the WordPress-to-Nuxt migration.

Public storefront pages should provide meaningful server-rendered content wherever appropriate.

Important SEO-sensitive routes include:

* product pages
* category pages
* brand pages
* product listings
* blog articles
* public landing pages
* important informational pages

SEO implementation includes:

* server-rendered primary content
* page titles and descriptions
* canonical URLs
* Open Graph metadata
* structured data where applicable
* breadcrumbs
* sitemap support
* robots configuration
* correct HTTP status handling
* WordPress URL preservation and redirects

Existing WordPress URLs should not be changed casually because they may already carry search rankings, backlinks, and indexed history.

See:

```text
/docs/agent-context/seo-strategy.md
```

---

## API Integration

All normal API communication should use the project's centralized API architecture.

```text
Page / Component
       ↓
Domain Service
       ↓
useApiClient
       ↓
DRF API
```

API endpoints require trailing slashes.

Correct:

```text
/api/v1/products/
/api/v1/categories/
/api/v1/products/12/
```

Avoid:

```text
/api/v1/products
/api/v1/categories
```

Do not guess backend fields, request payloads, filters, or response structures.

Use the actual DRF API contract.

---

## Pagination

Standard paginated APIs should use the shared generic TypeScript contract where compatible with the backend:

```ts
PaginatedResponse<T>
```

Domain-specific duplicate pagination interfaces should not be created unnecessarily.

---

## Environment Configuration

Public runtime configuration is defined through Nuxt runtime configuration.

Current public configuration includes:

```text
appUrl
apiBase
```

Configure the appropriate environment values for the target environment.

Example:

```env
NUXT_PUBLIC_APP_URL=http://localhost:3000
NUXT_PUBLIC_API_BASE=http://localhost:8000
```

Production values must point to the real storefront and backend environments.

Do not commit secrets to the repository.

---

## Local Development

### Prerequisites

Install:

* Node.js compatible with the current project dependencies
* pnpm

The repository's `package.json` defines the expected package-manager version.

Enable Corepack if required:

```bash
corepack enable
```

---

### Install Dependencies

```bash
pnpm install
```

---

### Start Development Server

```bash
pnpm dev
```

The Nuxt development server normally starts at:

```text
http://localhost:3000
```

---

### Type Check

```bash
pnpm type-check
```

The current project also exposes:

```bash
pnpm lint
```

as a type-checking command.

---

### Production Build

```bash
pnpm build
```

---

### Preview Production Build

```bash
pnpm preview
```

---

## Package Management

This project uses **pnpm exclusively**.

Use:

```bash
pnpm install
pnpm add <package>
pnpm remove <package>
```

Do not use:

```text
npm install
yarn
```

Do not generate or commit `package-lock.json`.

The repository should maintain `pnpm-lock.yaml` as its package lockfile.

---

## Design System

The storefront uses a semantic theme system built around Tailwind CSS variables.

Examples:

```text
bg-background
text-foreground

bg-card
text-card-foreground

bg-primary
text-primary-foreground

bg-muted
text-muted-foreground

border-border
```

Avoid hard-coding foreground colors against semantic backgrounds.

For example:

```text
bg-primary text-primary-foreground
```

should be preferred over assuming:

```text
bg-primary text-white
```

The UI should remain consistent across light and dark themes.

See:

```text
/docs/agent-context/design-system.md
```

---

## Agentic Development

This repository is structured for agent-assisted software development.

The root instruction file is:

```text
/AGENTS.md
```

Long-lived project context is stored in:

```text
/docs/agent-context/
```

Current context documents include:

```text
architecture.md
api-conventions.md
ecommerce-domain.md
design-system.md
seo-strategy.md
```

Task-specific workflows are stored in:

```text
/skills/
```

Current skills include:

```text
api-integration/
storefront-page/
ui-component/
admin-crud/
seo/
```

Each skill contains a `SKILL.md`.

### Context vs Skills

Context documents describe:

```text
What the project is
How the architecture works
What conventions exist
What business/domain assumptions are valid
```

Skills describe:

```text
How the coding agent should perform a particular type of task
```

Project-wide rules should not be duplicated across every skill.

---

## Working With Coding Agents

When assigning work, provide the agent with the actual feature requirement rather than repeating repository-wide conventions.

Example:

```text
Integrate the product listing API into the storefront products page.

Endpoint:
GET /api/v1/products/

Requirements:
- Replace the current production mock-data dependency.
- Support pagination.
- Preserve SSR for the initial product listing.
- Handle loading, empty, and API error states.
- Preserve the existing ProductCard behavior.

Inspect the existing implementation and follow the project's agent
instructions, context, and relevant skills.

Run the appropriate validation after implementation.
```

API contracts, business requirements, and task-specific constraints should be supplied explicitly when they are not already available in the repository.

---

## Development Principles

When contributing to the frontend:

* Follow the existing architecture before introducing new patterns.
* Keep pages focused on route-level orchestration.
* Keep reusable presentation logic in appropriate components.
* Keep API access behind the appropriate service boundaries.
* Use TypeScript contracts instead of hiding uncertainty with `any`.
* Keep DRF authoritative for commerce-critical business rules.
* Never fabricate production commerce data.
* Preserve SSR for important SEO-sensitive content.
* Consider SEO impact before changing public URLs.
* Build responsive and accessible interfaces.
* Reuse existing abstractions before creating duplicates.
* Avoid premature abstraction.
* Avoid unrelated repository-wide refactoring during feature work.

---

## Validation

Before considering substantial frontend work complete, run the applicable project validation commands:

```bash
pnpm type-check
pnpm build
```

Do not consider a task successfully validated unless the relevant commands actually pass.

---

## Related Documentation

Project architecture and engineering context:

```text
/docs/agent-context/architecture.md
/docs/agent-context/api-conventions.md
/docs/agent-context/ecommerce-domain.md
/docs/agent-context/design-system.md
/docs/agent-context/seo-strategy.md
```

Agent workflows:

```text
/skills/api-integration/SKILL.md
/skills/storefront-page/SKILL.md
/skills/ui-component/SKILL.md
/skills/admin-crud/SKILL.md
/skills/seo/SKILL.md
```

Global agent instructions:

```text
/AGENTS.md
```

---

## Project Status

Best Computer Hub is currently being migrated from its existing WordPress/WooCommerce implementation to the new Nuxt + DRF architecture.

Development should prioritize:

1. architecture stabilization
2. storefront implementation
3. real DRF API integration
4. removal of prototype/mock dependencies
5. preservation of existing SEO value
6. progressive replacement of legacy WordPress functionality

The rebuild should favor maintainability and incremental migration over unnecessary large-scale rewrites.

---

## Implementation Discipline

When working on any task in this repository:

- Do not assume missing requirements, business rules, API contracts, data shapes, routes, or intended behavior.
- Inspect the existing implementation and relevant project context before making changes.
- If information required for a correct implementation cannot be determined from the repository, context, or task description, ask for clarification before proceeding.
- Do not invent requirements or silently choose behavior when multiple materially different interpretations are possible.
- Do not over-engineer. Prefer the simplest solution that correctly satisfies the requirement and fits the existing architecture.
- Do not over-implement. Implement only what is required for the current task.
- Do not modify unrelated code, components, styles, APIs, routes, configuration, or architecture.
- Do not perform opportunistic refactoring or cleanup outside the task scope.
- Reuse existing abstractions and patterns when they are appropriate instead of introducing unnecessary new ones.
- Do not create new abstractions, components, utilities, services, or configuration unless they provide clear value for the current requirement.
- Preserve existing behavior unless the task explicitly requires changing it.
- If you notice an unrelated issue, mention it in the final report rather than fixing it unless it blocks the requested work.

---

### Clarification Rule

Do not ask for clarification when the answer can be reliably determined by inspecting the repository, existing implementation, project context, or established conventions.

Ask for clarification when required information is genuinely missing or when multiple materially different choices would affect business behavior, architecture, API contracts, user experience, or task scope.
