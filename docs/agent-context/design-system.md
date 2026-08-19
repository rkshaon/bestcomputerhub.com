# Best Computer Hub — Design System

This document defines the visual language, UI principles, component conventions, interaction patterns, and accessibility expectations for the Best Computer Hub frontend.

The goal is to maintain a consistent, professional, customer-oriented e-commerce experience across the storefront and administrative interfaces.

---

## 1. Design Direction

The primary visual direction is:

**Technical Premium**

The interface should feel:

* clean
* modern
* professional
* trustworthy
* precise
* spacious
* technology-focused
* commerce-oriented

The design should prioritize usability and product discovery over decoration.

Avoid excessive visual effects that compete with product information or customer actions.

---

## 2. Core Design Principles

When designing or modifying UI, prioritize in this order:

1. Usability
2. Accessibility
3. Information clarity
4. Commerce conversion
5. Visual consistency
6. Responsive behavior
7. Performance
8. Animation and decoration

A visually impressive interface must not make shopping harder.

Important customer actions such as:

* searching
* browsing categories
* viewing prices
* checking availability
* adding to cart
* managing wishlist
* checking out

must remain obvious and easy to use.

---

## 3. Styling Technology

The project currently uses:

* Tailwind CSS 3
* CSS custom properties
* semantic color tokens
* class-based dark mode

Prefer Tailwind utility classes for component styling.

Avoid introducing additional styling frameworks without an architectural reason.

---

## 4. Semantic Color System

The design system uses CSS variables exposed through Tailwind semantic colors.

### Light / Default Palette

| Token | Value |
| --- | --- |
| `background` | `#F7F9FC` |
| `foreground` | `#101828` |
| `card` | `#FFFFFF` |
| `card-foreground` | `#101828` |
| `primary` | `#237BEA` |
| `primary-foreground` | `#FFFFFF` |
| `primary-hover` | `#1764C0` |
| `primary-soft` | `#EAF3FF` |
| `secondary` | `#E9EEF5` |
| `secondary-foreground` | `#243247` |
| `muted` | `#EEF2F7` |
| `muted-foreground` | `#667085` |
| `border` | `#E2E8F0` |
| `input` | `#FFFFFF` |
| `ring` | `#237BEA` |

### Dark Palette

| Token | Value |
| --- | --- |
| `background` | `#071426` |
| `foreground` | `#F8FAFC` |
| `card` | `#111F33` |
| `card-foreground` | `#F8FAFC` |
| `primary` | `#3B8DF5` |
| `primary-foreground` | `#FFFFFF` |
| `primary-hover` | `#65A5F7` |
| `primary-soft` | `#102E52` |
| `secondary` | `#1A2A40` |
| `secondary-foreground` | `#E2E8F0` |
| `muted` | `#16253A` |
| `muted-foreground` | `#94A3B8` |
| `border` | `#26364B` |
| `input` | `#0D1B2E` |
| `ring` | `#3B8DF5` |

### Semantic State Colors

| State | Light Value | Dark Value |
| --- | --- | --- |
| `success` | `#16A34A` | `#4ADE80` |
| `warning` | `#D97706` | `#FBBF24` |
| `destructive` | `#DC2626` | `#F87171` |
| `info` | `#0284C7` | `#38BDF8` |

Prefer semantic colors over hard-coded theme-specific colors.

### Preferred

```text
bg-background
text-foreground

bg-card
text-card-foreground

bg-primary
text-primary-foreground

bg-secondary
text-secondary-foreground

bg-muted
text-muted-foreground

bg-destructive
text-destructive-foreground

border-border
```

### Avoid

Avoid unnecessarily hard-coding colors such as:

```text
bg-white
text-black
bg-gray-100
text-gray-900
```

when an equivalent semantic token exists.

Hard-coded colors may still be used when the color itself carries intentional meaning, such as a specific rating or status treatment, but semantic tokens should remain the default.

---

## 5. Foreground Contrast

Background and foreground semantic tokens should normally be paired.

For example:

```text
bg-primary
text-primary-foreground
```

and:

```text
bg-card
text-card-foreground
```

Do not assume `text-white` will always contrast with `bg-primary`.

The primary color changes between light and dark themes.

Incorrect:

```text
bg-primary text-white
```

Preferred:

```text
bg-primary text-primary-foreground
```

Apply the same principle to other semantic background/foreground pairs.

---

## 6. Dark Mode

Light mode is the default theme. An explicitly saved user theme preference takes precedence.

Dark mode uses the `.dark` class.

All reusable UI should remain usable in both light and dark modes.

Prefer semantic tokens because they automatically adapt to theme changes.

When introducing custom colors, verify:

* text contrast
* borders
* hover states
* disabled states
* focus states
* cards
* overlays
* inputs
* icons

in both themes.

Do not create components that depend exclusively on light-mode assumptions.

---

## 7. Typography

Typography should communicate a clean enterprise technology aesthetic.

Use clear hierarchy between:

* page titles
* section headings
* product names
* prices
* supporting labels
* metadata
* descriptions

UI text should prioritize readability.

Uppercase text with increased tracking may be used for small labels, category indicators, metadata, and technical labels.

Example:

```text
text-xs
font-medium
uppercase
tracking-widest
```

Do not overuse uppercase text for long content.

Product names and important customer information should remain easy to scan.

---

## 8. Spacing

Prefer consistent spacing over arbitrary values.

Use Tailwind's spacing scale whenever practical.

Layouts should feel spacious without wasting screen area.

Commerce pages should maintain enough separation between:

* product information
* pricing
* purchasing actions
* specifications
* reviews
* related products

Avoid excessively dense interfaces.

Administrative interfaces may use slightly tighter spacing where information density is more important.

---

## 9. Border Radius

The visual language favors rounded interfaces.

Reusable controls commonly use moderate rounding:

```text
rounded-lg
rounded-xl
rounded-2xl
```

Large visual containers may use stronger rounding when appropriate:

```text
rounded-3xl
rounded-[2.5rem]
rounded-[3rem]
```

Large radius values should primarily be used for major visual sections, hero containers, promotional areas, or intentionally prominent cards.

Do not apply extreme rounding to every element.

Maintain visual hierarchy through different radius sizes.

---

## 10. Borders and Shadows

Borders should generally use:

```text
border
border-border
```

Use borders to establish structure without creating excessive visual noise.

Shadows should be subtle by default.

Stronger shadows may appear during interactive states such as:

```text
hover:shadow-xl
hover:shadow-2xl
```

Avoid heavy permanent shadows across every card.

Cards should usually gain visual emphasis through a combination of:

* border
* background
* spacing
* hover state
* subtle shadow

---

## 11. Buttons

Prefer reusable button components such as:

```text
UiButton
Button
```

rather than repeatedly implementing button styles manually.

Supported conceptual variants include:

```text
primary
outline
ghost
```

Additional variants should only be introduced when there is a recurring UI requirement.

### Primary Button

Use for the dominant action.

Examples:

* Add to Cart
* Checkout
* Save
* Submit
* Confirm

### Outline Button

Use for secondary actions.

### Ghost Button

Use for low-emphasis actions, toolbar controls, and contextual interactions.

Avoid placing multiple visually dominant primary actions next to each other unless the workflow genuinely requires equal emphasis.

---

## 12. Button Behavior

Buttons must communicate interaction states.

Consider:

* default
* hover
* focus
* active
* loading
* disabled

Buttons performing asynchronous operations should prevent accidental repeated submission when appropriate.

Buttons inside forms must explicitly use the correct HTML type.

Use:

```html
<button type="button">
```

for non-submission actions.

Use:

```html
<button type="submit">
```

for form submission.

---

## 13. Icon Buttons & Action Controls

### Icon-Only Action Buttons

For common, visually recognizable actions such as:

- View
- Edit
- Delete
- Add
- Remove

prefer compact icon-only action buttons when they are used as secondary actions on cards, tables, list items, or similar dense admin interfaces.

Use visible text when:

- the action is not immediately recognizable from its icon
- the action is a primary/important CTA
- additional context is needed to prevent ambiguity
- the surrounding UI does not provide enough context

Icon-only buttons MUST:

- use the project's existing icon library (`lucide-vue-next`)
- have an accessible `aria-label`
- use an appropriate tooltip/title when useful for sighted users
- remain visually consistent with similar actions

Do not treat this as an absolute rule. Use judgment based on context and clarity.

Do not rely on the icon alone to communicate meaning to assistive technologies.

---

## 14. Icons

Use:

```text
lucide-vue-next
```

for application icons.

Do not introduce `lucide-react` or other React icon packages into Vue components.

Keep icon sizing consistent within similar controls.

Typical sizes include:

```text
w-4 h-4
w-5 h-5
w-6 h-6
```

Icons should support the interface rather than become decorative clutter.

---

## 15. Cards

Cards are used extensively for:

* products
* categories
* brands
* dashboard information
* content previews
* account information

A typical card should use semantic styling such as:

```text
bg-card
text-card-foreground
border
border-border
rounded-2xl
```

Interactive cards may add:

```text
hover:shadow-xl
hover:border-primary/20
transition-all
```

Do not make every card excessively animated.

---

## 16. Product Cards

Product cards should make the following information easy to scan:

* product image
* product name
* brand when available
* current price
* previous price when applicable
* rating when real rating data exists
* product status
* important customer actions

Product cards must not invent missing commerce information.

For example, if rating data is unavailable, do not display a fabricated rating merely to fill the layout.

Product cards should remain reusable across:

* homepage sections
* category pages
* search results
* related products
* new arrivals
* promotional listings

---

## 17. Product Images

Product imagery is a major part of the storefront experience.

Product image containers should maintain predictable dimensions to prevent layout shift.

Common product-card imagery may use:

```text
aspect-square
object-cover
```

or another intentionally defined aspect ratio.

Always provide meaningful `alt` text.

For product images, the product name is usually an appropriate baseline alt value unless more specific image context is available.

Do not assume a product always has an image.

Provide an intentional missing-image state.

Image loading strategy should consider whether the image is:

* above the fold
* part of the primary product gallery
* below the fold
* part of a large listing

Avoid lazy-loading critical above-the-fold imagery without considering performance impact.

---

## 18. Forms

Forms should use semantic HTML.

Interactive forms should generally use:

```html
<form @submit.prevent="submitHandler">
```

instead of depending only on button click handlers.

Forms should provide clear:

* labels
* required states
* validation errors
* disabled states
* loading states
* submission feedback

Do not rely solely on placeholder text as the field label.

Validation messages should appear close to the relevant field when possible.

---

## 19. Inputs

Inputs should use the semantic input and focus tokens.

Inputs should have visible focus behavior.

Consider:

```text
border-input
focus:ring-ring
```

or the equivalent behavior implemented by the project's reusable input components.

Input states should clearly distinguish:

* normal
* focused
* disabled
* invalid

---

## 20. Modals and Dialogs

Modals should provide predictable interaction behavior.

The backdrop should support click-outside closure when closing the modal that way is safe for the workflow.

Vue's:

```text
@click.self
```

may be used on the backdrop.

The modal container must prevent backdrop interaction from incorrectly triggering closure.

For data-entry modals:

* use a semantic `<form>`
* focus the first meaningful input when appropriate
* support keyboard submission
* use `type="button"` for auxiliary actions
* use `type="submit"` for the confirmation action

Use `nextTick()` when necessary to focus an element after the modal has rendered.

Do not automatically close destructive or sensitive dialogs from accidental interaction if doing so could cause user frustration or data loss.

---

## 21. Drawers

Drawers may be used for experiences such as:

* cart
* mobile navigation
* filters
* account actions

Drawers should:

* provide an obvious close control
* support keyboard interaction
* prevent confusing background interaction
* maintain clear visual hierarchy
* behave appropriately on mobile

Do not use drawers when a normal page provides a substantially better experience for complex workflows.

---

## 22. Accessibility

Accessibility is part of the definition of a complete UI, not an optional enhancement.

When building components, consider:

* semantic HTML
* keyboard navigation
* focus visibility
* accessible names
* form labels
* image alt text
* color contrast
* disabled states
* screen-reader context

Interactive non-button elements should not replace native buttons unnecessarily.

Prefer:

```html
<button>
```

over clickable:

```html
<div>
```

for actions.

Prefer:

```html
<NuxtLink>
```

for navigation.

---

## 23. Focus Management

Keyboard users must be able to identify the currently focused interactive element.

Do not globally remove focus outlines without providing an accessible replacement.

Dialogs and similar overlays should manage focus intentionally.

When opening a data-entry modal, focus may move to the first meaningful input.

When closing an overlay, returning focus to the triggering control is preferred where practical.

---

## 24. Responsive Design

The storefront must work across:

* mobile
* tablet
* laptop
* desktop

Design mobile behavior intentionally rather than treating it as a compressed desktop layout.

Important customer actions must remain accessible on smaller screens.

Product grids should adapt to available width.

Large multi-column product layouts should collapse into appropriate mobile structures.

Navigation should provide a dedicated mobile experience when desktop navigation cannot fit naturally.

---

## 25. Header

The storefront header supports two conceptual states:

```text
Expanded
Compact / Scrolled
```

The expanded header may contain multiple rows.

When the compact scrolled state is used, the intended order is:

```text
Logo
  →
Search
  →
Navigation
  →
Action Icons
```

Search must remain discoverable and usable in the compact state.

Header transitions should remain smooth without causing distracting layout jumps.

Mobile header behavior may differ from desktop behavior where necessary.

---

## 26. Search

Search is a primary e-commerce navigation mechanism.

The search interface should be:

* easy to find
* easy to focus
* keyboard accessible
* usable on mobile
* visually prominent without overwhelming navigation

Search UI should clearly distinguish between:

* empty state
* typing state
* loading state
* results
* no results
* errors

Do not hide search solely for visual simplification when it is a primary storefront action.

---

## 27. Navigation

Navigation should help customers understand the product catalog.

Desktop navigation may use:

* category menus
* mega menus
* nested navigation

Mobile navigation should prioritize clarity over reproducing the desktop mega menu exactly.

Navigation labels should use customer-facing terminology.

Avoid exposing internal backend terminology when a clearer customer-facing label exists.

---

## 28. Loading States

Asynchronous UI must provide appropriate feedback.

Depending on the interaction, use:

* loading indicators
* skeletons
* disabled controls
* progress feedback

Avoid large layout jumps between loading and loaded states.

For storefront product listings, skeleton layouts are preferred when they help preserve page structure.

---

## 29. Empty States

Empty states should explain what happened and, where useful, provide a next action.

Examples:

```text
No products found.
Your cart is empty.
Your wishlist is empty.
No reviews yet.
No orders found.
```

Do not display broken or partially rendered UI when a collection is empty.

---

## 30. Error States

Errors should be understandable to customers and administrative users alike.

Avoid exposing raw backend exceptions, technical request strings, HTTP method names, URLs, or status code signatures (such as `[POST] "...": 403 Forbidden`).

Where appropriate, provide:

* concise explanation extracted from the backend response (e.g. `detail` or `message`)
* retry action
* navigation alternative
* support path

Validation errors from DRF should be presented near the relevant form fields when possible.

API error toasts must utilize the centralized error handling utilities (`handleApiError` / `extractErrorMessage`) to present user-facing API messages or clean fallbacks.

---

## 31. Toasts and Notifications

Use transient notifications for lightweight feedback such as:

* item added
* item removed
* settings saved
* operation failed

Error toasts must consistently display backend-supplied user-facing error messages (such as `detail` or `message`) or generic user-friendly fallbacks. They must never display raw technical request strings, internal error objects, or status headers.

Do not use toasts as the only mechanism for important information that the user must read or act upon.

Avoid excessive toast notifications for routine interactions.

---

## 32. Animation

Animation should communicate state and hierarchy.

Use Tailwind transitions for normal UI interactions.

Examples:

```text
transition-colors
transition-transform
transition-all
duration-200
duration-300
duration-500
```

Use more advanced animation only when it materially improves the experience.

If the `motion` package is used, use its Vue-compatible API.

Do not use React-specific imports such as:

```text
motion/react
```

inside the Nuxt/Vue application.

Avoid excessive motion on commerce pages.

Product information and customer actions should remain the visual priority.

---

## 33. Hover Behavior

Hover effects may provide additional feedback on pointer-capable devices.

Examples include:

* subtle image zoom
* border emphasis
* shadow elevation
* text color changes
* contextual quick actions

Do not make essential actions available only through hover.

Touch users must still be able to access important functionality.

---

## 34. Customer-Facing vs Admin UI

The storefront and administration interface share the same core design system but have different priorities.

### Storefront

Prioritize:

* product discovery
* visual hierarchy
* trust
* readability
* conversion
* responsive behavior
* SEO-compatible rendering

### Admin

Prioritize:

* information density
* efficiency
* predictable forms
* filtering
* tables
* status visibility
* operational clarity
* permission-based control visibility (hiding unauthorized navigation and CRUD actions via `useAdminPermissions()`)

Do not force decorative storefront patterns into dense administrative workflows.

---

## 35. Component Reuse

Before creating a new generic UI component, check whether an existing component already solves the problem.

Prefer extending reusable primitives where appropriate rather than creating visually inconsistent duplicates.

Examples include:

```text
UiButton
UiBadge
UiCard
UiSearchInput
```

Do not over-generalize components prematurely.

A component should become generic because multiple real use cases share the abstraction, not because it might theoretically be reusable later.

---

## 36. Design Consistency Rule

When implementing new UI, first inspect nearby existing components and established design tokens.

Prefer consistency with the existing system unless the task explicitly introduces a design-system change.

New components should feel like part of the same application rather than isolated designs.

---

## 37. Final UI Check

Before considering a UI implementation complete, verify:

```text
Visual hierarchy
Responsive behavior
Light mode
Dark mode
Keyboard accessibility
Focus states
Semantic colors
Loading state
Empty state
Error state
Interactive states
Commerce-data accuracy
Reuse of existing primitives
```

Not every component requires every state, but each applicable state should be considered.

The goal is a consistent, accessible, customer-oriented interface rather than visual complexity.

---

## 38. Grid/List View Toggle Standard

Whenever a page provides both Grid View and List View options:
- **Button Order**: The Grid View icon must appear first (left), and the List View icon must appear second (right).
- **Default State**: The initial view must always default to **List View**.
- **Visual Indicator**: The List View toggle button must be visually active by default.
- **Scope**: This applies consistently across all Admin pages and any future pages offering dual view layouts.

---

## 39. Admin Numbered Pagination Standard

All administrative list and table interfaces that require numbered pagination must use `<UiPagination />` from `/components/ui/UiPagination.vue`.

- **Mandatory Single Standard**: `<UiPagination />` is the sole standard component for admin numbered page navigation. Do not build bespoke or page-local pagination controls or duplicate pagination logic.
- **Standardized Features & Layout**:
  - Concise item summary format on the left: `Showing X–Y of Z` (e.g. `Showing 1–10 of 1,572`).
  - Balanced page navigation controls on the right, displaying multiple page buttons near both the start and end boundaries.
  - Ellipsis (`...`) used strictly for skipped page ranges without introducing artificial layout gaps.
  - Stable, fixed slot count layout to prevent layout shift during page navigation.
  - Previous and Next page controls.
- **Extensibility**: If an admin page requires additional pagination behavior not currently supported, extend `<UiPagination />` directly rather than creating a separate pagination implementation.
- **Infinite Scroll vs. Numbered Pagination**:
  - Use **`<UiPagination />`** for admin tables, list views, and records management where users benefit from page jumping, explicit page numbers, and total count awareness.
  - Use **`<UiInfiniteScroll />`** (`useInfinitePagination`) for continuous streaming lists, dropdown selectors, compact modal feeds, and paginated filter option lists where discrete page numbers are unnecessary.
  - **Paginated Filter Option Standard**: All filter option lists across Storefront and Admin whose option API is paginated must use `useInfinitePagination` / `<UiInfiniteScroll />`. They must check the API's `next` pagination URL, load and append new option pages when scrolling reaches the end of list without overwriting existing options, stop requesting pages when `next` is `null`, prevent duplicate in-flight requests, preserve loaded option state when closed and reopened where lifecycle permits, fetch options strictly on demand, and debounce option searches (300ms).

---

## 40. Admin Reusable Table Standard (`<UiTable />`)

All administrative pages displaying tabular data must use `<UiTable />` from `/components/ui/UiTable.vue` instead of implementing raw `<table>` HTML markup or inline table styling directly within pages.

- **Mandatory Reusable Primitive**: `<UiTable />` is the sole standard table primitive for all Admin dataset tables. Future and existing Admin pages displaying tabular data must first look for and reuse `<UiTable />` rather than creating raw custom table markup or duplicate table components.
- **Presentation & Visual Responsibilities**:
  - Table container/wrapper with responsive horizontal scroll handling (`overflow-x-auto`).
  - Standard header rendering (`<thead>`, `<th>`) driven by a clean column definition prop.
  - Standard row (`<tr>`) and cell (`<td>`) styling enforcing consistent padding, typography, alignment, hover states, and semantic design tokens (`bg-card`, `text-card-foreground`, `border-border`, etc.).
  - Built-in empty state display when data collection is empty.
  - Built-in loading state display (skeletons or spinners) during data operations.
- **Customization via Reusable API**:
  - Column alignment, widths, and cell content (badges, images, action buttons) are defined via props and named slot templates (`#cell(columnKey)`) without hardcoding entity-specific logic into `<UiTable />`.
- **Strict Architectural Separation**:
  - **Pagination**: Kept separate. `<UiPagination />` and `<UiInfiniteScroll />` remain responsible for pagination controls positioned outside `<UiTable />`.
  - **Data & Business Logic**: Searching, filtering, sorting computations, permission checks, row action handling, and API data-fetching remain managed by parent pages or composables and passed into `<UiTable />`.

---

## 41. Admin UI Layout & Information Density Standards

All administrative panel pages across the application (including Categories, Products, Brands, Orders, Inventory, Users/Staff, Roles, Permissions, Notifications, Security, and future Admin CRUD pages) must adhere to these project-wide layout efficiency and information density standards.

### Admin Page Header Standard

For Admin pages that contain a breadcrumb/path, page title, and page-level actions:

- **Single-Row Header Layout**: Position the breadcrumb trail and page title together on the left side of the header row, with page-level action buttons (e.g. Refresh, Import, Add Entity) right-aligned on the same horizontal row.
- **Avoid Redundant Title Rows**: Do not allocate a dedicated vertical row solely for the page title when it can be cleanly combined with the breadcrumb/header row.
- **Omit Low-Value Subtitles**: Remove descriptive page subtitles or body paragraphs that consume vertical space without providing meaningful operational value.
- **Title Prominence & Hierarchy**: Ensure the page title remains visually prominent (e.g. `text-xl` or `text-2xl` display font) and clearly distinguishable from the breadcrumb text.
- **Responsive Adaptation**: On narrower screens or mobile viewports, allow the header row to wrap smoothly (`flex flex-col sm:flex-row sm:items-center justify-between gap-3`) rather than forcing horizontal clipping or overflow.

*Note: This is a layout-efficiency principle. It does not mandate forcing every page into an identical layout if a specific complex workflow genuinely requires unique header structures.*

### Admin Information-Density Standard

Administrative workflows prioritize operational efficiency and visibility of actionable data within the primary viewport.

- **Viewport Content Maximization**: Maximize the amount of useful data, metrics, and interactive controls visible above the fold by reducing excessive vertical padding and margins between major page sections.
- **Container Padding Reduction**: Prefer compact container margins and card padding (e.g. `p-3` or `p-3.5` instead of `p-6` or `p-8` for summary metrics and toolbars).
- **Whitespace Over Font Shrinking**: Increase information density primarily by removing unnecessary outer whitespace, section gaps, and tall padding — NOT by reducing font sizes or interactive control touch targets below WCAG AA accessibility guidelines.
- **Visual Balance**: Maintain distinct section boundaries, semantic borders, and clear typographic hierarchy so dense interfaces remain easily scannable and comfortable to navigate.

### Search / Filter Bar Standard

For Admin pages containing search inputs and filter controls:

- **Compact Outer Container**: Keep the top and bottom padding of the overall search/filter bar container compact (e.g. `px-3.5 py-2.5`).
- **Comfortable Internal Controls**: Individual filter buttons, dropdown toggles, select inputs, and action buttons inside the row must retain comfortable height and internal breathing room (standard `h-9` height with clear padding) to avoid a cramped appearance.
- **Search Input Size Protection**: Never reduce the height or internal padding of the search input component (`UiSearchInput`) itself.
- **Horizontal Organization**: Arrange search inputs, boolean toggles, popover filters, ordering dropdowns, and view switchers on a single cleanly aligned horizontal flex row.

```text
Outer filter container
  → compact (e.g. px-3.5 py-2.5)

Individual filter controls & search field
  → comfortable & readable (e.g. h-9 height, full input padding)
```

---

## 42. Admin Categories Tree Sibling-Level Accordion Expansion Standard

The Admin Categories Tree view must use **sibling-level accordion behavior**, not global single-node expansion.

### Canonical Rule
> At each hierarchy level, only one sibling branch may be expanded at a time. Expanding a category collapses other expanded siblings with the same immediate parent, while all ancestors of the selected category remain expanded.

### Hierarchy & Behavior Definitions
1. **Siblings**:
   - Categories with the same immediate parent are siblings.
   - Root categories are treated as siblings under the root level.
2. **Expansion**:
   - Expanding a category collapses only other expanded siblings with the same immediate parent.
   - The selected category becomes expanded.
   - All ancestors of the selected category remain expanded.
3. **Nested Navigation**:
   - A child can be expanded while its parent remains expanded.
   - A grandchild can be expanded while both its parent and grandparent remain expanded.
   - Never collapse an ancestor simply because a descendant is expanded.
4. **Lazy Loading**:
   - Expanding a category continues to use the existing lazy child-loading mechanism (`categoryService.getCategoryChildrenBatch([node.id])`).
   - Load children only when necessary.
   - Do not introduce additional API requests because of the expansion rule.
5. **State Management**:
   - Use the existing centralized tree/category expansion state (`expandedCategoryIds`, `setNodeExpanded`, `isNodeExpanded`).
   - Do not create a second independent expansion-state system.
   - Expansion state must be hierarchical rather than globally exclusive.
6. **Menu Tree**:
   - The same hierarchical expansion principle applies to Menu Tree views.
   - Existing menu filtering behavior (`is_menu=true`) remains unchanged.

### Examples

**Root Level**:
```text
Gaming Component ▼
PC Component ▶
Gadget ▶
```
*Expanding `PC Component` collapses `Gaming Component` because they are root-level siblings.*

**Nested Level**:
```text
Gaming Component ▼
├── Laptop ▼
│   ├── Gaming Laptop
│   └── Work Laptop
├── Desktop PC Component ▶
└── Sound System ▶
```
*Expanding `Laptop` must NOT collapse `Gaming Component`.*

**Deeper Level**:
```text
Gaming Component ▼
└── Laptop ▼
    └── Gaming Laptop ▼
        ├── Gaming Laptop Accessories
        └── Gaming Laptop Parts
```
*Expanding `Gaming Laptop` must keep both `Laptop` and `Gaming Component` expanded.*



