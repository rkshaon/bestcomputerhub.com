---

name: ui-component
description: Standard workflow for creating and modifying reusable Vue UI components in the Best Computer Hub frontend.
-----------------------------------------------------------------------------------------------------------------------

<!-- File: /skills/ui-component/SKILL.md -->

# UI Component

## Use When

Use this skill when creating or substantially modifying reusable Vue components.

Examples:

* buttons
* inputs
* cards
* badges
* modals
* drawers
* search inputs
* pagination controls
* product cards
* reusable commerce UI
* layout components

## Workflow

1. Identify the component's responsibility and expected reuse.
2. Inspect existing related components before creating a new one.
3. Determine the correct component directory.
4. Define typed props, emits, and local state.
5. Reuse existing UI primitives where appropriate.
6. Implement semantic HTML and accessibility.
7. Apply semantic design-system tokens.
8. Implement required interaction states.
9. Verify responsive behavior.
10. Verify light and dark mode.
11. Run type-checking and build validation.

## Rules

* Use Vue 3 Composition API with `<script setup lang="ts">`.
* Keep components focused on a clear responsibility.
* Prefer typed `interface` definitions for props and component state.
* Avoid `any`.
* Use `lucide-vue-next` for icons.
* Do not introduce React components or React-specific libraries into Vue components.
* Use the project's `cn()` utility for dynamic class composition where appropriate.
* Prefer existing `Ui*` primitives before creating duplicate generic components.
* Use semantic colors such as `bg-primary`, `text-primary-foreground`, `bg-card`, and `border-border`.
* Never assume `text-white` is correct for `bg-primary`.
* Use native `<button>` elements for actions and `NuxtLink` for internal navigation.
* Icon-only buttons must have accessible names (`aria-label`, `title`/tooltip). For common secondary actions (View, Edit, Delete, Add, Remove) on cards, tables, or list items, prefer compact icon-only buttons. Retain text labels for primary CTAs or non-obvious actions.
* Essential actions must not depend exclusively on hover.
* Maintain visible keyboard focus states.
* Forms must use semantic `<form>` behavior where applicable.
* Non-submit buttons inside forms must explicitly use `type="button"`.
* Submit actions must use `type="submit"`.
* Modals and drawers must provide clear close behavior and appropriate keyboard interaction.
* Data-entry modals should focus the first meaningful input when appropriate.
* Handle applicable loading, disabled, empty, and error states; API error toasts must delegate to centralized error handling (`handleApiError` in `useToast.ts`) rather than displaying raw technical request strings or status codes.
* Do not put backend commerce business rules inside presentation components.
* Do not fabricate commerce data to complete a component's appearance.
* Admin UI components and action controls (Create, Edit, Delete buttons) must respect user permissions via `useAdminPermissions()` and hide or disable unauthorized operations.
* Admin panel layouts and containers must follow project Admin UI Layout & Density Standards: combine breadcrumbs, titles, and action controls on single-row headers where feasible, maximize viewport data density by removing excessive outer container padding without shrinking font or control touch targets, and maintain compact filter bar containers with comfortable internal control breathing room (refer to `/docs/agent-context/design-system.md`).
* For search inputs and filter controls driving API requests, maintain immediate local input responsiveness while debouncing the downstream API query state (e.g. using `refDebounced` with 300ms delay) to prevent requests on every keystroke.
* Do not blindly debounce generic `v-model` updates on all input components unless they are specifically designed for debounced search queries.
* Avoid triggering unnecessary API calls during component mounting, watcher execution, or modal setup; fetch data only when required for the current view or active user workflow, reusing existing state/props where available.
* For paginated filter option controls across Admin and Storefront, implement infinite scroll (`useInfinitePagination` / `<UiInfiniteScroll />`) to fetch and append sequential option pages as the user scrolls until `next` is `null`. Do not overwrite loaded options, prevent duplicate concurrent requests, preserve loaded option state when closed and reopened where lifecycle permits, fetch options strictly on demand when activated, and debounce search inputs (300ms).
* For hierarchical tree components (e.g. Admin Categories Tree), enforce sibling-level accordion expansion behavior: expanding a node collapses other expanded siblings with the same immediate parent, while all ancestor levels remain expanded.
* Do not create premature generic abstractions for hypothetical future use.

## Component Placement

Use the existing architecture:

```text
/components/ui/
    → generic reusable UI primitives

/components/layout/
    → application-wide structural components

/components/commerce/
    → reusable commerce presentation components

/features/
    → larger domain-specific components and workflows
```

Choose the narrowest correct responsibility.

## Relevant Context

Refer to:

* `/docs/agent-context/architecture.md`
* `/docs/agent-context/design-system.md`
* `/docs/agent-context/ecommerce-domain.md`

For complete storefront pages, also use the `storefront-page` skill.
