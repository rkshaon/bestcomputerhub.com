# Frontend Component Inventory

This document provides a verified, maintainable inventory of meaningful frontend components in the project. It serves as an authoritative reference for AI coding agents and developers to prevent duplicate component creation and encourage reuse.

---

## Inventory Classification System

Components are classified using four standard metadata properties:

1. **Component Type**:
   - `Shared UI`: Generic visual primitives with no direct domain coupling.
   - `Layout`: Structural application frames, headers, footers, and overlays.
   - `Domain component`: Storefront e-commerce domain presentation.
   - `Feature component`: Domain-specific workflow module or dashboard widget.
   - `Form component`: Data input, validation, and editing dialogs/forms.
   - `Data-display`: Tables, cards, stats displays, and list visualizers.
   - `Page-specific component`: Dedicated subcomponent tied to one specific route.

2. **Scope**: `Storefront` | `Admin` | `Shared`

3. **Reusability Level**: `High` | `Medium` | `Low`

---

## 1. Shared UI Primitives (`/components/ui/`)

### `<UiButton>` / `<Button>`
- **Exact File Location**: `/components/ui/Button.vue`
- **Component Type**: Shared UI
- **Scope**: Shared
- **Purpose**: Polymorphic button and link primitive supporting multiple visual variants, sizes, states, and NuxtLink navigation.
- **Routes/Pages Used**: Reused across all Storefront and Admin pages, forms, modals, header CTAs, and empty states.
- **Main Responsibilities**:
  - Render accessible `<button>` or `<NuxtLink>` based on `to` prop.
  - Enforce consistent styling, padding, focus rings, disabled state pointer suppression.
  - Support visual variants: `primary`, `secondary`, `outline`, `ghost`, `destructive`.
  - Support sizes: `sm`, `md`, `lg`, `icon`.
- **What It Explicitly Does Not Own**: Form submission logic, click action side-effects, or route authorization.
- **State Owned**: Computed tag (`button` vs `NuxtLink`).
- **Calls API**: No
- **Related Composables/Services**: Uses `cn` utility (`/utils/index.ts`).
- **Responsive Responsibility**: Touch-friendly minimum target heights (`h-8`, `h-10`, `h-12`), flex alignment, `shrink-0`.
- **Reusability Level**: High
- **Important Behavior to Preserve**: Automatic tag switching based on `to` prop presence; `cn` class merging.
- **Known Architectural Risks**: None.

---

### `<UiBadge>`
- **Exact File Location**: `/components/ui/UiBadge.vue`
- **Component Type**: Shared UI / Data-display
- **Scope**: Shared
- **Purpose**: Semantic status, tag, and notification count badge primitive.
- **Routes/Pages Used**: Storefront product cards, discount badges, cart count; Admin order status badges, user role badges, stock status indicators.
- **Main Responsibilities**:
  - Render color-coded semantic badge tags (`primary`, `secondary`, `success`, `warning`, `error`, `info`, `ghost`).
  - Support size options (`xs`, `sm`, `md`).
- **What It Explicitly Does Not Own**: Status calculation rules or domain state.
- **State Owned**: None (stateless presentation).
- **Calls API**: No
- **Related Composables/Services**: Uses `cn` utility.
- **Responsive Responsibility**: `whitespace-nowrap`, `shrink-0`.
- **Reusability Level**: High
- **Important Behavior to Preserve**: Consistent rounded pill borders and uppercase font tracking.
- **Known Architectural Risks**: None.

---

### `<UiBrandLogo>`
- **Exact File Location**: `/components/ui/UiBrandLogo.vue`
- **Component Type**: Shared UI
- **Scope**: Shared
- **Purpose**: Brand identity logo image and typography wordmark display.
- **Routes/Pages Used**: Storefront Header, Footer, Admin Header, Mobile Navigation Drawer, Checkout Header.
- **Main Responsibilities**:
  - Render brand logo SVG (`/logo.svg`) with optional text wordmark.
  - Support size presets (`sm`, `md`, `lg`, `xl`).
- **What It Explicitly Does Not Own**: Navigation routing (wrapped by parent in `NuxtLink`).
- **State Owned**: Computed size classes.
- **Calls API**: No
- **Related Composables/Services**: Uses `cn` utility.
- **Responsive Responsibility**: Responsive font sizes (`text-sm sm:text-base` etc.) and text display toggling (`showText` prop).
- **Reusability Level**: High
- **Important Behavior to Preserve**: Brand typography hierarchy (`Best Computer Hub` styling).
- **Known Architectural Risks**: None.

---

### `<UiBreadcrumbs>`
- **Exact File Location**: `/components/ui/UiBreadcrumbs.vue`
- **Component Type**: Shared UI / Navigation
- **Scope**: Shared
- **Purpose**: Accessible breadcrumb trail navigation with HTML entity decoding.
- **Routes/Pages Used**: Storefront Product detail (`/product/[slug]/`), Category (`/product-category/.../`), Brand (`/brand/[slug]/`), Admin subpages.
- **Main Responsibilities**:
  - Render sequential breadcrumb links terminated by the active page name.
  - Automatically decode HTML entities in breadcrumb names via `decodeHtmlEntities`.
  - Preserve trailing slash storefront URL conventions.
- **What It Explicitly Does Not Own**: Breadcrumb array resolution (accepts `items` prop).
- **State Owned**: None.
- **Calls API**: No
- **Related Composables/Services**: Uses `decodeHtmlEntities` utility (`/utils/index.ts`).
- **Responsive Responsibility**: Horizontal scroll containment (`overflow-x-auto whitespace-nowrap`), text truncation on small screens (`max-w-[160px] sm:max-w-[260px]`).
- **Reusability Level**: High
- **Important Behavior to Preserve**: Must decode HTML entities in category/product names and preserve trailing slash link URLs.
- **Known Architectural Risks**: None.

---

### `<UiCard>`
- **Exact File Location**: `/components/ui/UiCard.vue`
- **Component Type**: Shared UI
- **Scope**: Shared
- **Purpose**: Structural surface container with configurable visual variants and padding options.
- **Routes/Pages Used**: Admin dashboard widgets, Admin list wrappers, Storefront checkout, user account panels, product details.
- **Main Responsibilities**:
  - Provide rounded card shell (`rounded-[2.5rem]`) with semantic design tokens (`bg-card`, `border-border`).
  - Support visual variants (`default`, `glass`, `outline`, `flat`).
  - Support padding presets (`none`, `sm`, `md`, `lg`, `xl`).
  - Optional hover animation (`hover:scale-[1.01]`).
- **What It Explicitly Does Not Own**: Inner card layout or domain entity logic.
- **State Owned**: None.
- **Calls API**: No
- **Related Composables/Services**: Uses `cn` utility.
- **Responsive Responsibility**: Responsive padding option pass-through.
- **Reusability Level**: High
- **Important Behavior to Preserve**: Strict adherence to design tokens and border radius standards.
- **Known Architectural Risks**: None.

---

### `<UiPagination>`
- **Exact File Location**: `/components/ui/UiPagination.vue`
- **Component Type**: Shared UI / Navigation / Data-display
- **Scope**: Shared
- **Purpose**: Standardized numbered pagination bar for discrete paginated list and table views.
- **Routes/Pages Used**: Storefront product listings (`/products`, `/product-category/.../`), all Admin list tables (Products, Categories, Brands, Users, Roles, Orders, Inventory, etc.).
- **Main Responsibilities**:
  - Display exact record summary (`Showing 1–10 of 1,572`).
  - Render Previous/Next navigation controls.
  - Compute visible page number slots with ellipsis (`...`) for skipped ranges.
  - Maintain fixed layout width to prevent layout shifts during page navigation.
  - Emit `update:currentPage` / `pageChange` events.
- **What It Explicitly Does Not Own**: Data fetching, API requests, or page size selector state.
- **State Owned**: Computed pagination slots array (`paginationSlots`), item range calculation (`startItem`, `endItem`).
- **Calls API**: No
- **Related Composables/Services**: Uses `cn` utility.
- **Responsive Responsibility**: Scaled container padding (`p-4 sm:p-6`), horizontal scroll containment (`max-w-full overflow-x-auto py-1 scrollbar-none`), responsive touch button sizes (`w-9 h-9 sm:w-10 sm:h-10`).
- **Reusability Level**: High
- **Important Behavior to Preserve**: Standard pagination UI contract defined in `AGENTS.md` (no local pagination duplication permitted).
- **Known Architectural Risks**: None.

---

### `<UiInfiniteScroll>`
- **Exact File Location**: `/components/ui/UiInfiniteScroll.vue`
- **Component Type**: Shared UI / Data-display
- **Scope**: Shared
- **Purpose**: Intersection Observer sentinel component triggering automated continuous infinite-scroll data loading.
- **Routes/Pages Used**: Storefront catalog infinite scroll feeds, Admin grid view infinite scroll, Admin modal option pickers (`RoleFormModal`), Admin popover filter lists.
- **Main Responsibilities**:
  - Detect viewport intersection with sentinel element and emit `loadMore`.
  - Render inline loading spinners, error alerts with retry triggers, and end-of-list notifications (`All items loaded`).
- **What It Explicitly Does Not Own**: Data array accumulation or API fetching logic.
- **State Owned**: `sentinelRef`, `IntersectionObserver` instance.
- **Calls API**: No
- **Related Composables/Services**: Used alongside `useInfinitePagination<T>()` composable.
- **Responsive Responsibility**: Compact vertical footprint; centers loading indicator across viewports.
- **Reusability Level**: High
- **Important Behavior to Preserve**: Watcher lifecycle re-observation on prop changes (`hasMore`, `isLoading`, `error`).
- **Known Architectural Risks**: None.

---

### `<UiSearchInput>`
- **Exact File Location**: `/components/ui/UiSearchInput.vue`
- **Component Type**: Shared UI / Form component
- **Scope**: Shared
- **Purpose**: Styled search input box primitive with icon prefix and focus rings.
- **Routes/Pages Used**: Admin table filter bars, Storefront listing search bars.
- **Main Responsibilities**: Render search text input with icon prefix, bind `v-model` (`modelValue`).
- **What It Explicitly Does Not Own**: Search query debouncing or API query execution.
- **State Owned**: None (v-model pass-through).
- **Calls API**: No
- **Related Composables/Services**: None.
- **Responsive Responsibility**: Full width (`w-full`), comfortable target height (`h-12`).
- **Reusability Level**: High
- **Important Behavior to Preserve**: Pass-through input event emission.
- **Known Architectural Risks**: None.

---

### `<UiTable>`
- **Exact File Location**: `/components/ui/UiTable.vue`
- **Component Type**: Shared UI / Data-display
- **Scope**: Admin
- **Purpose**: Standardized tabular data layout primitive for Admin management views.
- **Routes/Pages Used**: Admin Products, Categories, Brands, Users, Roles, Orders, Inventory, Blog, Audit logs.
- **Main Responsibilities**:
  - Enforce horizontal scroll container wrapper (`overflow-x-auto`).
  - Render standardized table headers (`<thead>`, `<th>`), rows (`<tr>`), and cells (`<td>`).
  - Provide empty state and loading skeleton states.
- **What It Explicitly Does Not Own**: Pagination controls (handled separately by `<UiPagination />`), sorting/filtering logic, domain action execution.
- **State Owned**: None.
- **Calls API**: No
- **Related Composables/Services**: None.
- **Responsive Responsibility**: Outer `overflow-x-auto` wrapper prevents table layout overflow on narrow mobile screens.
- **Reusability Level**: High
- **Important Behavior to Preserve**: Encapsulated table styling and semantic design tokens (`bg-card`, `border-border`).
- **Known Architectural Risks**: None.

---

### `<UiAdminModal>`
- **Exact File Location**: `/components/ui/UiAdminModal.vue`
- **Component Type**: Shared UI / Layout / Form wrapper
- **Scope**: Admin
- **Purpose**: Standardized modal dialog shell enforcing consistent z-indexing, backdrop blur, keyboard dismissal, and mousedown-outside tracking for Admin CRUD workflows.
- **Routes/Pages Used**: `UserFormModal`, `RoleFormModal`, `ProductImageGallery` submodals, Delete confirmation dialogs across all Admin views.
- **Main Responsibilities**:
  - Render backdrop with backdrop blur, title bar, close button.
  - Handle Escape key dismissal and mousedown click-outside tracking.
  - Enforce proper z-indexing (`z-50`).
- **What It Explicitly Does Not Own**: URL query parameter synchronization (managed by parent page via `useAdminModalState<T>()`).
- **State Owned**: Keyboard and mousedown event listeners.
- **Calls API**: No
- **Related Composables/Services**: Used in conjunction with `useAdminModalState<T>()`.
- **Responsive Responsibility**: Responsive max width options (`max-w-lg`, `max-w-2xl`, etc.), viewport margin padding (`p-4`), scrollable content body (`max-h-[85vh] overflow-y-auto`).
- **Reusability Level**: High
- **Important Behavior to Preserve**: Unified modal dismissal trigger calling parent `closeModal()`.
- **Known Architectural Risks**: None.

---

### `<UiRichTextEditor>`
- **Exact File Location**: `/components/ui/UiRichTextEditor.vue`
- **Component Type**: Shared UI / Form component
- **Scope**: Shared
- **Purpose**: Rich text WYSIWYG content editor supporting formatting toolbars, HTML source editing mode, sanitization, and live HTML `v-model` binding.
- **Routes/Pages Used**: Admin Product Create/Edit forms, Admin Blog Post forms, Admin SEO/Content pages.
- **Main Responsibilities**:
  - Provide text formatting tools (bold, italic, headers, lists, links, alignment, tables, code blocks).
  - Toggle between visual WYSIWYG editor and raw HTML source code editor (`isSourceMode`).
  - Output clean, sanitized HTML via `v-model`.
- **What It Explicitly Does Not Own**: Image file storage server endpoints (delegates file upload execution to caller).
- **State Owned**: Active formatting state, source mode toggle state (`isSourceMode`), raw HTML text buffer.
- **Calls API**: No direct API calls.
- **Related Composables/Services**: DOM Range and Selection APIs.
- **Responsive Responsibility**: Horizontally scrollable single-row formatting toolbar on mobile (`max-w-full overflow-x-auto scrollbar-none`), flexible canvas height.
- **Reusability Level**: High
- **Important Behavior to Preserve**: Dual-mode WYSIWYG/Source editing parity and single-row mobile toolbar layout.
- **Known Architectural Risks**: None.

---

## 2. Shared Layout & Navigation Components (`/components/layout/` & `/layouts/`)

### `<LayoutHeader>` / `<Header>`
- **Exact File Location**: `/components/layout/Header.vue`
- **Component Type**: Layout / Navigation
- **Scope**: Storefront
- **Purpose**: Master Storefront header containing utility bar, branding, main navigation, live product search modal, account menu, cart badge trigger, and mobile drawer menu.
- **Routes/Pages Used**: Rendered on all Storefront routes via `/layouts/default.vue`.
- **Main Responsibilities**:
  - Render desktop navigation bar and top categories.
  - Provide search bar with debounced live product search (`refDebounced` 300ms) and autocomplete results dropdown.
  - Render user account menu and active cart item counter.
  - Provide full mobile overlay navigation drawer with accordion category expansion.
- **What It Explicitly Does Not Own**: Checkout processing or cart state persistence.
- **State Owned**: `isSearchExpanded`, search query string, search results array, mobile menu open state (`isMobileMenuOpen`), open mobile category accordion IDs (`openMobileCategoryIds`).
- **Calls API**: Yes (`productService.getProductsList`, `categoryService.getCategoryChildrenBatch`).
- **Related Composables/Services**: `useUIStore`, `useCartStore`, `useAuthStore`, `useProductService`, `useCategoryService`, `useToast`, `refDebounced`.
- **Responsive Responsibility**: Replaces desktop navigation bar with a mobile slide-out drawer on viewports `< 1024px`; handles mobile category accordion expansion.
- **Reusability Level**: High (Singleton layout component)
- **Important Behavior to Preserve**: Live debounced search execution, category child lazy loading on mobile accordion open.
- **Known Architectural Risks**: Header file is large (~1,250 lines) due to composing search overlay, mobile drawer, and desktop navigation in one file.

---

### `<HeaderUtilityBar>`
- **Exact File Location**: `/components/layout/HeaderUtilityBar.vue`
- **Component Type**: Layout component
- **Scope**: Storefront
- **Purpose**: Topmost announcement and utility row above main header.
- **Routes/Pages Used**: Used inside `<Header>`.
- **Main Responsibilities**: Render customer service hotline, free shipping promotion callout, store locator link, theme selector menu.
- **What It Explicitly Does Not Own**: Global theme persistence logic (reads from `useUIStore`).
- **State Owned**: None.
- **Calls API**: No
- **Related Composables/Services**: `useUIStore`.
- **Responsive Responsibility**: Hides secondary utility links on small mobile screens (`hidden sm:flex`).
- **Reusability Level**: Medium
- **Important Behavior to Preserve**: Direct theme store binding.
- **Known Architectural Risks**: None.

---

### `<HeaderMegaMenu>`
- **Exact File Location**: `/components/layout/HeaderMegaMenu.vue`
- **Component Type**: Layout / Navigation
- **Scope**: Storefront
- **Purpose**: Desktop multi-column mega menu flyout for category hierarchies.
- **Routes/Pages Used**: Used inside `<Header>` on desktop viewports (`lg:`).
- **Main Responsibilities**: Display 2-level category hierarchy dropdown when a root category item is hovered; lazy-loads child categories using `useMegaMenu`.
- **What It Explicitly Does Not Own**: Category database mutations.
- **State Owned**: Hover state and dropdown positioning.
- **Calls API**: Indirectly via `useMegaMenu` / `useCategoryService`.
- **Related Composables/Services**: `useMegaMenu`.
- **Responsive Responsibility**: Hidden on mobile and tablet viewports (`hidden lg:block`).
- **Reusability Level**: Medium
- **Important Behavior to Preserve**: Hover-based demand-driven category child loading.
- **Known Architectural Risks**: None.

---

### `<HeaderCategorySubmenu>`
- **Exact File Location**: `/components/layout/HeaderCategorySubmenu.vue`
- **Component Type**: Layout / Navigation
- **Scope**: Storefront
- **Purpose**: Recursive sub-level category column list component inside mega menu flyouts.
- **Routes/Pages Used**: Used inside `<HeaderMegaMenu>`.
- **Main Responsibilities**: Render subcategory links and lazy-fetch 3rd level subcategories on hover.
- **What It Explicitly Does Not Own**: Top-level category listing.
- **State Owned**: Hovered subcategory ID state.
- **Calls API**: Indirectly via `useMegaMenu`.
- **Related Composables/Services**: `useMegaMenu`.
- **Responsive Responsibility**: Multi-column grid layout on desktop screens.
- **Reusability Level**: Medium
- **Important Behavior to Preserve**: Hover child category resolution.
- **Known Architectural Risks**: None.

---

### `<LayoutFooter>` / `<Footer>`
- **Exact File Location**: `/components/layout/Footer.vue`
- **Component Type**: Layout component
- **Scope**: Storefront
- **Purpose**: Master Storefront footer section.
- **Routes/Pages Used**: Rendered on all Storefront pages via `/layouts/default.vue`.
- **Main Responsibilities**: Render brand description, category quick links, customer support info, payment badge icons, copyright notice, social media links.
- **What It Explicitly Does Not Own**: Page routing logic.
- **State Owned**: None.
- **Calls API**: No
- **Related Composables/Services**: None.
- **Responsive Responsibility**: 4-column responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`).
- **Reusability Level**: High (Singleton layout component)
- **Important Behavior to Preserve**: Trailing slash storefront URL targets on footer navigation links.
- **Known Architectural Risks**: None.

---

### `<CookieBanner>`
- **Exact File Location**: `/components/layout/CookieBanner.vue`
- **Component Type**: Layout / Feature component
- **Scope**: Storefront
- **Purpose**: GDPR / Privacy cookie consent banner dialog.
- **Routes/Pages Used**: Storefront default layout (`/layouts/default.vue`).
- **Main Responsibilities**: Display privacy choices, persist consent selection ("Accept All" / "Essential Only") in localStorage.
- **What It Explicitly Does Not Own**: Server-side tracking logs.
- **State Owned**: `isVisible` consent state.
- **Calls API**: No
- **Related Composables/Services**: LocalStorage client state.
- **Responsive Responsibility**: Fixed bottom banner scaling on narrow mobile screens.
- **Reusability Level**: Medium
- **Important Behavior to Preserve**: LocalStorage consent key checks before rendering.
- **Known Architectural Risks**: None.

---

### `<BackToTop>`
- **Exact File Location**: `/components/layout/BackToTop.vue`
- **Component Type**: Layout UI helper
- **Scope**: Storefront
- **Purpose**: Floating scroll-to-top button trigger.
- **Routes/Pages Used**: Storefront default layout (`/layouts/default.vue`).
- **Main Responsibilities**: Monitor window scroll position (Y > 300px) and smoothly scroll window to top upon click.
- **What It Explicitly Does Not Own**: Page layout or viewport scrolling implementation.
- **State Owned**: `isVisible` scroll listener flag.
- **Calls API**: No
- **Related Composables/Services**: Window scroll event listeners.
- **Responsive Responsibility**: Fixed floating position (`bottom-6 right-6`).
- **Reusability Level**: High
- **Important Behavior to Preserve**: Smooth window scroll behavior (`window.scrollTo({ top: 0, behavior: 'smooth' })`).
- **Known Architectural Risks**: None.

---

### `<FloatingActions>`
- **Exact File Location**: `/components/layout/FloatingActions.vue`
- **Component Type**: Layout UI helper
- **Scope**: Storefront
- **Purpose**: Quick support access overlay widget (WhatsApp, Live Chat).
- **Routes/Pages Used**: Storefront default layout.
- **Main Responsibilities**: Render floating quick-action buttons for direct customer communication.
- **What It Explicitly Does Not Own**: Support ticket storage.
- **State Owned**: Toggle menu state.
- **Calls API**: No
- **Related Composables/Services**: None.
- **Responsive Responsibility**: Viewport fixed positioning overlay.
- **Reusability Level**: Medium
- **Important Behavior to Preserve**: Non-intrusive floating z-index layer.
- **Known Architectural Risks**: None.

---

### Admin Layout Shell (`/layouts/admin.vue`)
- **Exact File Location**: `/layouts/admin.vue`
- **Component Type**: Layout
- **Scope**: Admin
- **Purpose**: Master layout frame for all Admin panel administration routes.
- **Routes/Pages Used**: Applied automatically to all `/admin/*` pages.
- **Main Responsibilities**:
  - Render collapsible sidebar navigation filtered by permissions (`useAdminPermissions.canViewModule`).
  - Provide mobile slide-out drawer with automatic route-change dismissal watcher (`watch(() => route.path)`).
  - Render top header bar with search trigger, notifications link, theme dropdown, and user profile menu.
  - Enforce `robots: 'noindex, nofollow'` meta tags.
- **What It Explicitly Does Not Own**: Admin page view content.
- **State Owned**: `isSidebarOpen`, `isMobileMenuOpen`, `isThemeMenuOpen`, route watcher listener.
- **Calls API**: No (reads current user from `useAuthStore`).
- **Related Composables/Services**: `useAdminPermissions`, `useAuthStore`, `useUIStore`.
- **Responsive Responsibility**: Mobile slide-out overlay drawer on viewports `< 1024px`; collapsible sidebar on desktop (`lg:`).
- **Reusability Level**: High (Singleton layout component)
- **Important Behavior to Preserve**: Permission-based navigation filtering via `canViewModule` and automatic mobile menu dismissal on route change.
- **Known Architectural Risks**: None.

---

## 3. Commerce & Storefront Domain Components (`/components/commerce/` & `/components/home/`)

### `<CommerceProductCard>` / `<ProductCard>`
- **Exact File Location**: `/components/commerce/ProductCard.vue`
- **Component Type**: Domain component / Data-display
- **Scope**: Storefront
- **Purpose**: Standardized product card item for listings, search results, category pages, and home showcases.
- **Routes/Pages Used**: Homepage (`/`), Product Catalog (`/products`), Category pages (`/product-category/.../`), Brand pages (`/brand/[slug]/`), Offers (`/offers/`), New Arrivals (`/new-arrivals/`).
- **Main Responsibilities**:
  - Render product primary image with hover secondary image cross-fade transition.
  - Render brand name, formatted title with `decodeHtmlEntities`, rating badge, regular price and sale price comparison via `formatCurrency`.
  - Render stock availability badge.
  - Provide "Add to Cart" quick action button.
- **What It Explicitly Does Not Own**: Global cart persistence logic (delegates to `useCartStore`).
- **State Owned**: Active image index on hover, adding-to-cart spinner state.
- **Calls API**: No direct API call (delegates to stores).
- **Related Composables/Services**: `useCartStore`, `formatCurrency`, `decodeHtmlEntities`.
- **Responsive Responsibility**: Aspect-square image container (`aspect-square`), flexible grid child, touch-friendly CTA buttons.
- **Reusability Level**: High
- **Important Behavior to Preserve**: Must format prices using `formatCurrency`, decode HTML entities in title, and preserve trailing slash link URLs (`/product/${product.slug}/`).
- **Known Architectural Risks**: None.

---

### `<CommerceCartDrawer>` / `<CartDrawer>`
- **Exact File Location**: `/components/commerce/CartDrawer.vue`
- **Component Type**: Domain component / Feature
- **Scope**: Storefront
- **Purpose**: Slide-out cart drawer overlay for managing cart items and proceeding to checkout.
- **Routes/Pages Used**: Rendered on all Storefront routes via `/layouts/default.vue`.
- **Main Responsibilities**:
  - Render active cart item list with product thumbnails, titles, prices, and quantities.
  - Provide quantity increment/decrement controls and item removal triggers.
  - Calculate order subtotal and free shipping progress bar.
  - Render empty cart state with "Start Shopping" CTA.
  - Provide CTA button to proceed to `/checkout/`.
- **What It Explicitly Does Not Own**: Cart state storage (managed authoritatively by `useCartStore`).
- **State Owned**: `isCheckoutLoading` redirection spinner state.
- **Calls API**: No (delegates to `useCartStore`).
- **Related Composables/Services**: `useCartStore`, `useUIStore`, `formatCurrency`, `decodeHtmlEntities`.
- **Responsive Responsibility**: Right slide-over drawer constrained to max width `max-w-md w-full` with fixed backdrop.
- **Reusability Level**: High
- **Important Behavior to Preserve**: Direct synchronization with `uiStore.isCartOpen` and `cartStore.items`.
- **Known Architectural Risks**: None.

---

### `<HeroSection>`
- **Exact File Location**: `/components/home/HeroSection.vue`
- **Component Type**: Domain / Home feature
- **Scope**: Storefront
- **Purpose**: Interactive promotional hero slider on the homepage.
- **Routes/Pages Used**: Homepage (`/`).
- **Main Responsibilities**:
  - Cycle through promotional hero slides with automated 6s autoplay.
  - Support mouse hover pause, touch swipe gestures (`useSwipe`), and directional slide transition animations.
  - Render slide pagination dot indicators and manual previous/next controls.
- **What It Explicitly Does Not Own**: Static hero slide data (imported from `@/data/heroSlides`).
- **State Owned**: `currentIndex`, `direction`, `isPaused`, slider DOM ref.
- **Calls API**: No
- **Related Composables/Services**: `@vueuse/core` (`useIntervalFn`, `useSwipe`, `usePreferredReducedMotion`).
- **Responsive Responsibility**: Fluid height aspect ratio, responsive hero headline typography (`text-3xl sm:text-5xl lg:text-6xl`).
- **Reusability Level**: Medium
- **Important Behavior to Preserve**: Touch swipe support and accessibility motion reduction checks (`usePreferredReducedMotion`).
- **Known Architectural Risks**: None.

---

### `<HeroSlide>`
- **Exact File Location**: `/components/home/HeroSlide.vue`
- **Component Type**: Domain / Home presentation
- **Scope**: Storefront
- **Purpose**: Individual slide frame component inside `<HeroSection>`.
- **Routes/Pages Used**: Used inside `<HeroSection>`.
- **Main Responsibilities**: Render hero slide background image, promotional badge tag, headline, description body, and CTA action buttons.
- **What It Explicitly Does Not Own**: Slider timing or index cycling.
- **State Owned**: None.
- **Calls API**: No
- **Related Composables/Services**: None.
- **Responsive Responsibility**: Two-column layout on desktop (`grid-cols-1 lg:grid-cols-2`), stacked text and image on mobile.
- **Reusability Level**: Medium
- **Important Behavior to Preserve**: High visual contrast and CTA button hover animations.
- **Known Architectural Risks**: None.

---

### `<FeaturedCategories>`
- **Exact File Location**: `/components/home/FeaturedCategories.vue`
- **Component Type**: Domain / Home section
- **Scope**: Storefront
- **Purpose**: Grid section displaying top category navigation cards on the homepage.
- **Routes/Pages Used**: Homepage (`/`).
- **Main Responsibilities**: Display root category cards with icons/images, product counts, hover zoom animations, and trailing-slash catalog links.
- **What It Explicitly Does Not Own**: Category database querying (accepts category props or uses `useCategoryService`).
- **State Owned**: None.
- **Calls API**: No (or delegates to `useCategoryService`).
- **Related Composables/Services**: `useCategoryService`.
- **Responsive Responsibility**: 2 to 6 column responsive grid (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`).
- **Reusability Level**: Medium
- **Important Behavior to Preserve**: Trailing slash URL paths for category link targets.
- **Known Architectural Risks**: None.

---

### `<ProductSection>`
- **Exact File Location**: `/components/home/ProductSection.vue`
- **Component Type**: Domain / Home section
- **Scope**: Storefront
- **Purpose**: Reusable product showcase section wrapper with section title header and `<CommerceProductCard>` grid.
- **Routes/Pages Used**: Homepage (`/`) featured products, new arrivals, best sellers sections.
- **Main Responsibilities**: Render section header with optional highlighted title text segment, subtitle, "View All" link, and responsive grid of product cards.
- **What It Explicitly Does Not Own**: Product data loading or API calls.
- **State Owned**: Computed title highlight parts.
- **Calls API**: No
- **Related Composables/Services**: None.
- **Responsive Responsibility**: Responsive 2-to-4 column grid (`grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6`).
- **Reusability Level**: High
- **Important Behavior to Preserve**: Highlighted text title rendering logic.
- **Known Architectural Risks**: None.

---

### `<BrandMarquee>`
- **Exact File Location**: `/components/home/BrandMarquee.vue`
- **Component Type**: Domain / Home presentation
- **Scope**: Storefront
- **Purpose**: Continuous sliding brand logo marquee banner.
- **Routes/Pages Used**: Homepage (`/`).
- **Main Responsibilities**: Render infinite sliding horizontal track displaying top tech brand logos.
- **What It Explicitly Does Not Own**: Brand API query execution.
- **State Owned**: None.
- **Calls API**: No
- **Related Composables/Services**: CSS keyframe animations.
- **Responsive Responsibility**: Seamless full-width infinite marquee across screen sizes.
- **Reusability Level**: Medium
- **Important Behavior to Preserve**: Continuous CSS marquee animation.
- **Known Architectural Risks**: None.

---

### `<PromoBanner>`
- **Exact File Location**: `/components/home/PromoBanner.vue`
- **Component Type**: Domain / Home presentation
- **Scope**: Storefront
- **Purpose**: Marketing callout promotional banner component.
- **Routes/Pages Used**: Homepage (`/`), Category catalog headers.
- **Main Responsibilities**: Display marketing banner graphics with offer headline and CTA button.
- **What It Explicitly Does Not Own**: Promotion campaign data models.
- **State Owned**: None.
- **Calls API**: No
- **Related Composables/Services**: None.
- **Responsive Responsibility**: Stacked text and button on narrow viewports.
- **Reusability Level**: Medium
- **Important Behavior to Preserve**: High visual contrast layout.
- **Known Architectural Risks**: None.

---

### `<QuickLinks>`
- **Exact File Location**: `/components/home/QuickLinks.vue`
- **Component Type**: Domain / Home presentation
- **Scope**: Storefront
- **Purpose**: Grid section displaying store value propositions (Free Shipping, 24/7 Support, Warranty, Secure Checkout).
- **Routes/Pages Used**: Homepage (`/`), Product details footer.
- **Main Responsibilities**: Display value proposition cards with icons and descriptive text.
- **What It Explicitly Does Not Own**: Store configuration.
- **State Owned**: None.
- **Calls API**: No
- **Related Composables/Services**: None.
- **Responsive Responsibility**: 2-to-4 column responsive grid (`grid-cols-2 lg:grid-cols-4`).
- **Reusability Level**: Medium
- **Important Behavior to Preserve**: Standard icon and title pairing.
- **Known Architectural Risks**: None.

---

## 4. Admin Management & CRUD Components (`/components/admin/` & `/features/admin/`)

### `<CategoryTreeAdmin>`
- **Exact File Location**: `/components/admin/CategoryTreeAdmin.vue`
- **Component Type**: Domain / Feature component / Admin tree
- **Scope**: Admin
- **Purpose**: Interactive hierarchical category tree management view supporting sibling-level accordion expansion, search filtering, and drag-and-drop node reordering.
- **Routes/Pages Used**: Admin Categories Page (`/admin/categories/`).
- **Main Responsibilities**:
  - Render multi-level category hierarchy using `<CategoryTreeNode>`.
  - Manage expanded category IDs (`expandedCategoryIds`) enforcing sibling-level accordion expansion rules.
  - Execute demand-driven lazy child fetching (`categoryService.getCategoryChildrenBatch`).
  - Handle drag-and-drop category hierarchy reordering.
  - Dispatch category CRUD action events (Create Child, Edit, Delete).
- **What It Explicitly Does Not Own**: Modal form input state (triggers modal via parent events).
- **State Owned**: `expandedCategoryIds`, drag-and-drop node state, search filter query string.
- **Calls API**: Yes (`categoryService.getCategoryChildrenBatch`, `categoryService.updateCategoryOrder`).
- **Related Composables/Services**: `useCategoryService`, `useAdminPermissions`, `useToast`.
- **Responsive Responsibility**: Responsive container scrolling and flexible tree node spacing.
- **Reusability Level**: High
- **Important Behavior to Preserve**: Must preserve sibling-level accordion expansion rule (expanding a category collapses other expanded siblings with the same immediate parent while retaining ancestor expansion).
- **Known Architectural Risks**: Complex drag-and-drop and recursive tree state management requires cautious modification.

---

### `<CategoryTreeNode>`
- **Exact File Location**: `/components/admin/CategoryTreeNode.vue`
- **Component Type**: Domain / Feature component
- **Scope**: Admin
- **Purpose**: Recursive single category node item inside `<CategoryTreeAdmin>`.
- **Routes/Pages Used**: Used inside `<CategoryTreeAdmin>`.
- **Main Responsibilities**:
  - Render drag handle icon, expand/collapse chevron button, category emoji icon, category name with HTML entity decoding, slug badge, status badge, action buttons (Add Child, Edit, Delete).
  - Handle recursive rendering of child nodes.
- **What It Explicitly Does Not Own**: Root tree category array.
- **State Owned**: Drag hover state.
- **Calls API**: Indirectly via tree parent handlers.
- **Related Composables/Services**: `useAdminPermissions`, `decodeHtmlEntities`.
- **Responsive Responsibility**: Responsive depth indentation using `style="padding-left: clamp(...)"`, hides slug badge on mobile (`hidden sm:inline-block`).
- **Reusability Level**: Medium
- **Important Behavior to Preserve**: Responsive depth mathematical calculation and HTML entity decoding in category name.
- **Known Architectural Risks**: Recursive component tree requires careful depth calculation to avoid visual overflow.

---

### `<ProductImageGallery>`
- **Exact File Location**: `/components/admin/ProductImageGallery.vue`
- **Component Type**: Domain / Feature component / Image Management
- **Scope**: Admin
- **Purpose**: Comprehensive product image gallery manager supporting drag-and-drop uploads, batch image processing, primary thumbnail selection, alt text editing, and image deletion.
- **Routes/Pages Used**: Admin Product Create/Edit forms (`/admin/products/`), Standalone Product Images Manager (`/admin/product-images/`).
- **Main Responsibilities**:
  - Render product image grid with primary feature thumbnail indicators.
  - Provide drag-and-drop image upload dropzone with progress indicator.
  - Support setting primary product image (`setPrimaryProductImage`).
  - Support editing image alt text and reordering gallery images.
  - Trigger image deletion with confirmation modal.
- **What It Explicitly Does Not Own**: Product record creation.
- **State Owned**: Upload progress state, active submodal state, staging image array.
- **Calls API**: Yes (`productService.uploadProductImage`, `productService.deleteProductImage`, `productService.setPrimaryProductImage`).
- **Related Composables/Services**: `useProductService`, `useAdminPermissions`, `useToast`.
- **Responsive Responsibility**: Responsive thumbnail grid (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6`), touch-friendly upload box.
- **Reusability Level**: High
- **Important Behavior to Preserve**: Primary image indicator badge and drag-and-drop file upload handlers.
- **Known Architectural Risks**: File size is large (~1,560 lines) owing to inline upload dialogs and gallery drag-and-drop reordering logic.

---

### `<UserFormModal>`
- **Exact File Location**: `/components/admin/UserFormModal.vue`
- **Component Type**: Form component / Admin Modal
- **Scope**: Admin
- **Purpose**: Modal dialog form for creating, editing, viewing, and managing User & Staff account records.
- **Routes/Pages Used**: Admin Users & Staff Page (`/admin/users/`).
- **Main Responsibilities**:
  - Render form fields for user account details (username, email, password, first name, last name, phone, role selection dropdown, active flag, staff flag).
  - Handle client validation and backend API error extraction.
  - Dispatch create (`userService.createUser`) and update (`userService.updateUser`) API mutations.
- **What It Explicitly Does Not Own**: User list table state or URL modal query parameter resolution (wrapped in `<UiAdminModal>`).
- **State Owned**: Form field refs, form validation errors, submission loading state.
- **Calls API**: Yes (`userService.createUser`, `userService.updateUser`, `roleService.getRoles`).
- **Related Composables/Services**: `useUserService`, `useRoleService`, `useToast`.
- **Responsive Responsibility**: 2-column grid layout on desktop (`grid-cols-1 sm:grid-cols-2`), scrollable modal body.
- **Reusability Level**: High
- **Important Behavior to Preserve**: Role option selection and backend error payload message extraction via `useToast`.
- **Known Architectural Risks**: None.

---

### `<RoleFormModal>`
- **Exact File Location**: `/components/admin/RoleFormModal.vue`
- **Component Type**: Form component / Admin Modal
- **Scope**: Admin
- **Purpose**: Modal dialog form for creating, editing, viewing, and assigning permission matrices to RBAC roles.
- **Routes/Pages Used**: Admin Roles Page (`/admin/roles/`).
- **Main Responsibilities**:
  - Render role name input field.
  - Provide permission matrix picker with live search filtering and infinite scroll option loading (`useInfinitePagination` + `<UiInfiniteScroll>`).
  - Provide "Select All" / "Deselect All" category permission toggles.
  - Dispatch create (`roleService.createRole`) and update (`roleService.updateRole`) API mutations.
- **What It Explicitly Does Not Own**: Role list table state (wrapped in `<UiAdminModal>`).
- **State Owned**: `formName`, `selectedPermissionIds`, `searchQuery`, `activeCategory`, submission loading state.
- **Calls API**: Yes (`roleService.createRole`, `roleService.updateRole`, `permissionService.getPermissionsPage`).
- **Related Composables/Services**: `useRoleService`, `usePermissionService`, `useInfinitePagination`, `useToast`.
- **Responsive Responsibility**: Responsive permission checkbox grid (`grid-cols-1 md:grid-cols-2`), scrollable modal body.
- **Reusability Level**: High
- **Important Behavior to Preserve**: Paginated permission option loading via `useInfinitePagination` and category filter debouncing.
- **Known Architectural Risks**: None.

---

### `<DashboardStatCard>`
- **Exact File Location**: `/features/admin/components/DashboardStatCard.vue`
- **Component Type**: Data-display / Feature component
- **Scope**: Admin
- **Purpose**: Metric summary card for Admin Dashboard metric indicators (Total Sales, Total Orders, Total Products, Active Customers).
- **Routes/Pages Used**: Admin Dashboard (`/admin/`).
- **Main Responsibilities**: Render metric title, icon, formatted value, trend percentage badge (increase/decrease arrow and semantic background).
- **What It Explicitly Does Not Own**: Analytics data fetching.
- **State Owned**: None (receives metric props).
- **Calls API**: No
- **Related Composables/Services**: Uses `formatCurrency` utility when displaying monetary amounts.
- **Responsive Responsibility**: Flexible card width fitting responsive dashboard bento grid.
- **Reusability Level**: High
- **Important Behavior to Preserve**: Color-coded trend percentage indicators.
- **Known Architectural Risks**: None.

---

### `<RecentOrdersTable>`
- **Exact File Location**: `/features/admin/components/RecentOrdersTable.vue`
- **Component Type**: Data-display / Feature component
- **Scope**: Admin
- **Purpose**: Compact recent order activity table widget on the Admin Dashboard.
- **Routes/Pages Used**: Admin Dashboard (`/admin/`).
- **Main Responsibilities**: Display recent 5 orders with order ID, customer name, date, total amount, payment status badge, fulfillment status badge, and quick link to order details.
- **What It Explicitly Does Not Own**: Full orders pagination list view.
- **State Owned**: None (receives orders array prop).
- **Calls API**: Indirectly via order service if fetching dashboard widget data.
- **Related Composables/Services**: `useOrderService`, `formatCurrency`.
- **Responsive Responsibility**: Embedded horizontal scrolling table container wrapper.
- **Reusability Level**: Medium
- **Important Behavior to Preserve**: Status badge color mapping and trailing slash order link URLs (`/admin/orders/${order.id}/`).
- **Known Architectural Risks**: None.

---

## 5. Architectural Inferences & Source Code Authority

1. **Inferred Classifications**: All components documented above have been verified directly against source code files in `/components/`, `/layouts/`, and `/features/`. No speculative or unverified components are included.
2. **Source Code Authority**: If a component is refactored, renamed, or updated, the source code remains authoritative. AI coding agents must update this inventory file to reflect structural changes.
