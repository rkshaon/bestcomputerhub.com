# Disabled Features Registry

This registry tracks application features that have been temporarily commented out or hidden, preserving all underlying backend services, state stores, and code structures for easy restoration.

---

## 1. Feature: Storefront Theme Mode Selection

- **Current Status**: Temporarily Disabled (Storefront Surface Only)
- **Reason**: Client specification requires hiding theme selection controls from the storefront user interface while retaining full theme functionality and controls in the Admin Panel.
- **Disabled Surfaces**: Storefront Navigation Header (`/components/layout/Header.vue`).
- **Active Surfaces**: Admin Panel (`/layouts/admin.vue`) retains full access to Light, Dark, and System theme mode toggling.
- **Files & Components Involved**:
  - `/components/layout/Header.vue` (Storefront header controls commented out)
  - `/layouts/admin.vue` (UNTOUCHED — Admin theme toggle remains fully functional)
  - `/stores/ui.ts` (UNTOUCHED — Global theme state, persistence, and `applyTheme()` remain active)

### What Was Commented Out in `Header.vue`
1. **Lucide Icons**: `Sun`, `Moon`, `Monitor` icon imports from `lucide-vue-next`.
2. **Component State**: `const isThemeMenuOpen = ref(false);`.
3. **Click-Outside Listener**: `if (!target.closest('.theme-dropdown')) { isThemeMenuOpen.value = false; }` inside `handleWindowClick`.
4. **Mobile Header Template**: Mobile theme toggle icon button in the top mobile action bar.
5. **Desktop Header Template**: Desktop theme dropdown container (`.theme-dropdown`) and menu items.

### How to Restore
1. Open `/components/layout/Header.vue`.
2. Uncomment `Sun, Moon, Monitor` imports from `lucide-vue-next`.
3. Uncomment `const isThemeMenuOpen = ref(false);` ref declaration.
4. Uncomment the `!target.closest('.theme-dropdown')` block in `handleWindowClick`.
5. Remove the HTML comment wrappers `<!-- ... -->` around the mobile and desktop theme selector blocks.

---

## 2. Feature: Storefront Top Utility Bar (`HeaderUtilityBar.vue`)

- **Current Status**: Temporarily Hidden
- **Reason**: Client specification requires temporarily hiding the storefront top utility bar while preserving all links and functionality in the main storefront header.
- **Component Preserved**: `/components/layout/HeaderUtilityBar.vue` (file kept intact with internal markup, styles, marquee keyframes, and icons preserved).
- **Relocated Links**:
  - `Track Your Order` → Moved to Main Header Desktop Actions (`/account/`) & Mobile Drawer (`/account/`).
  - `Insights` → Moved to Main Header Desktop Actions (`/blog/`) & Mobile Drawer (`/blog/`).
  - `Store` → Moved to Main Header Desktop Actions (Google Maps URL) & Mobile Drawer (Google Maps URL).
  - `Login / Account` → Moved to Main Header Desktop Actions (`:to="authStore.isLoggedIn ? '/account/' : '/login/'"`) & Mobile Drawer.
- **Admin Button**: Unchanged in `Header.vue` (lines 680–698 & 1185–1192). Existing Admin button in main header handles `isSuperAdmin` / `isAdmin` for desktop and mobile.
- **Files & Components Involved**:
  - `/components/layout/Header.vue` (`HeaderUtilityBar` import & usage commented out; relocated links added to desktop header and mobile drawer)
  - `/components/layout/HeaderUtilityBar.vue` (UNTOUCHED — component file preserved intact)
  - `/layouts/admin.vue` (UNTOUCHED — Admin layout unaffected)
  - `/stores/auth.ts` (UNTOUCHED — Auth state & routes unaffected)

### What Was Commented Out in `Header.vue`
1. **HeaderUtilityBar Import**: `// import HeaderUtilityBar from '@/components/layout/HeaderUtilityBar.vue';`
2. **HeaderUtilityBar Usage**: Commented out `<HeaderUtilityBar />` in template wrapped with `<!-- TEMPORARILY DISABLED: Storefront Top Utility Bar -->`.

### How to Restore
1. Open `/components/layout/Header.vue`.
2. Uncomment `import HeaderUtilityBar from '@/components/layout/HeaderUtilityBar.vue';`.
3. Remove HTML comment wrapper around `<HeaderUtilityBar />` in template.
4. Optionally remove or reconcile relocated utility links in main header desktop actions if top bar is restored.

---

## 3. Feature: Footer Newsletter Subscription

- **Status**: Temporarily Disabled (Hidden)
- **Reason**: Client does not currently require the newsletter feature.
- **Scope**: Storefront footer (`/components/layout/Footer.vue`).
- **Current State**: Design-only and non-functional (static input and button without form submission, reactive state, or API bindings).
- **File**: `/components/layout/Footer.vue`
- **Backend Support**: None required.
- **Preservation**: Original markup and structure preserved in HTML comments.
- **Restoration Steps**:
  1. Open `/components/layout/Footer.vue`.
  2. Uncomment `Mail` and `ArrowRight` icon imports in `<script setup>`.
  3. Remove HTML comment wrapper around the newsletter `<div>` block in template.
  4. Verify whether form submission and backend email service integration are required before re-enabling.

---

## 4. Feature: Product Detail Value Highlights Grid

- **Status**: Temporarily Disabled (Hidden)
- **Reason**: Client specification requires hiding the two hardcoded marketing blocks ("Authentic Hardware" and "Enterprise Reliability") from the storefront product detail page.
- **Scope**: Storefront product detail page (`/pages/product/[slug].vue`).
- **Current State**: Hardcoded marketing text block commented out.
- **File**: `/pages/product/[slug].vue`
- **Preservation**: Original markup and structure preserved in HTML comments below the product availability/brand/SKU section.
- **Restoration Steps**:
  1. Open `/pages/product/[slug].vue`.
  2. Locate `<!-- TEMPORARILY DISABLED: Product Detail Value Highlights Grid ... -->`.
  3. Remove the HTML comment wrapper around the `<div class="grid grid-cols-1 sm:grid-cols-2 ...">` block.

---

## 5. Feature: Secondary Storefront Header Actions (Compare, Insights, Store)

- **Status**: Temporarily Hidden
- **Reason**: Client specification requires simplifying the desktop header actions to the right of the search box to keep only `Admin` (authenticated owner/staff), `PC Builder`, `Track Order`, `Account`, and `Add to Cart`.
- **Scope**: Storefront desktop navigation header (`/components/layout/Header.vue`).
- **Hidden Actions**:
  - `Compare` button (`ArrowLeftRight` icon, click handler `handleCompareClick`).
  - `Insights` link (`/blog/`, `BookOpen` icon).
  - `Store` location link (Google Maps external URL, `MapPin` icon).
- **Preserved Actions**:
  - `Admin`: Visible when authenticated and user type is owner or staff (`isSuperAdmin`).
  - `PC Builder`: Direct link to `/products/`.
  - `Track Order`: Direct link to `/account/` with `hidden sm:inline-flex` for responsive desktop presentation.
  - `Account`: Dynamic login/account link (`/account/` or `/login/`).
  - `Add to Cart`: Cart toggle button with dynamic badge.
- **File**: `/components/layout/Header.vue`
- **Preservation**: All component definitions, imports, click handlers, and route structures remain intact.
- **Restoration Steps**:
  1. Open `/components/layout/Header.vue`.
  2. Locate the `<!-- TEMPORARILY HIDDEN: Compare Header Action -->`, `<!-- TEMPORARILY HIDDEN: Tech Insights Header Action -->`, or `<!-- TEMPORARILY HIDDEN: Store Location Header Action -->` blocks.
  3. Remove the HTML comment wrappers around the respective buttons/links.

---

## 6. Feature: Storefront Enterprise Offer Promo Banner (`PromoBanner.vue`)

- **Status**: Temporarily Hidden
- **Reason**: Client specification requires temporarily hiding the Enterprise Offer promo banner ("Professional Workstations for Remote Innovation") from the storefront homepage.
- **Scope**: Storefront homepage (`/pages/index.vue`).
- **Component Preserved**: `/components/home/PromoBanner.vue` (file, markup, styles, CTA button, and internal structure preserved intact).
- **File**: `/pages/index.vue`
- **Preservation**: `<HomePromoBanner />` call wrapped in HTML comments inside the homepage template.
- **Restoration Steps**:
  1. Open `/pages/index.vue`.
  2. Locate `<!-- TEMPORARILY DISABLED: Enterprise Offer Promo Banner -->`.
  3. Remove the HTML comment wrapper around `<HomePromoBanner />`.

---
*Date Registered*: September 20, 2026

