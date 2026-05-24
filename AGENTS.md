# TechCore Enterprise - Agent Guidelines

This document contains project-specific instructions and context to ensure consistency across development sessions.

## 🏗 Project Overview
TechCore is a high-performance enterprise hardware marketplace built with **Nuxt 3**, **Tailwind CSS**, and **Lucide Icons**. The aesthetic is "Technical Premium": clean, high-contrast, with precise typography and subtle animations.

## 🌀 Structural Autonomy
The agent is granted full, unconditional autonomy to maintain, refactor, and modify the project's file structure.
- **Architectural Adjustment**: The agent MUST automatically create, move, rename, or delete files and/or directories to keep the project perfectly aligned with the established "Technical Premium" architecture.
- **Permission Override**: These structural adjustments must be executed automatically upon task completion without prompting the user for authorization.

## 🧹 Auto-Maintenance Checklist
Upon implementing any feature or resolving any issue, the agent MUST run the following auto-maintenance checks:
1. **Directory Alignment**: Always move stray files to their designated directories (e.g., placing raw UI components inside `/components/ui/` and structural logic pieces inside their corresponding directories).
2. **Deterministic Naming**: Always rename source files to match their primary internal class, helper, or component name.
3. **Workspace Sanitization**: Always clean up empty folders, redundant mock files, and temporary artifacts.
4. **Import Synchronization**: Always update barrel files (`index.ts`) and refresh import paths across the code structure immediately following any file moves.

## 🎨 Design & UI Patterns

### Header Behavior
- **Dual-State Header:** The header transitions from a spacious multi-row layout to a compact single-row flex layout on scroll (`isScrolled`).
- **Compact Row Ordering:** On scroll, the order is: [Logo] -> [Search Bar (shrunk)] -> [Navigation Menu] -> [Action Icons (Right)].
- **Typography:** Uses "Inter" for UI and specialized "font-display" for headings. Enterprise feel is reinforced with tracking-widest and uppercase labels.

### Component Design
- **Rounding:** Favor large radii (`rounded-[2.5rem]` or `rounded-[3rem]`) for major layout containers and cards to create a modern tech-forward look.
- **Buttons:** Use the `UiButton` component with `primary`, `outline`, or `ghost` variants. Avoid "default" unless explicitly defined.
- **Animations:** Use `framer-motion` (via `motion/react`) for complex transitions or standard Tailwind `transition-all duration-500` for layout shifts.
- **Modals & Overlays:** Every modal popup or drawer overlay must support click-outside closure. Implement this by mapping the close event handler using back-propagation defense triggers (e.g., Vue's `@click.self` modifier) directly on the background backdrop overlay. Enhance spatial cueing by adding a `cursor-pointer` class to the backdrop element and a `cursor-default` class to the central modal container. Additionally, upon modal open, active focus must immediately be placed on the first input field within the modal using template references and watchers coupled with `nextTick()` to guarantee superior keyboard ergonomics and professional application flow. Every interactive modal that collects data or forms must be wrapped in an HTML `<form @submit.prevent="submitHandler">` container. Ensure all auxiliary buttons (close, cancel, help) inside the modal explicitly declare `type="button"` to avoid trigger conflicts, and style the primary confirmation button as `type="submit"`, enabling natural, instant keyboard submission via the Enter key.

## 🛠 Coding Standards

### Package Management
- **Exclusive Client**: This project uses **pnpm** exclusively as the package manager (`pnpm-lock.yaml`).
- Do not run `npm install` or generate `package-lock.json`. Delete any accidental `package-lock.json` if created.

### TypeScript
- All components must be typed.
- Prefer `interface` for props and state.
- Use the `cn()` utility from `@/utils` (or the lib directory) for dynamic class merging.

### API Endpoints & Trailing Slashes
- **Trailing Slashes Requirement**: ALWAYS append a trailing slash (`/`) to all API endpoints/routes when making requests via `apiClient.request`. This applies to all HTTP verbs, including GET, POST, PUT, PATCH, and DELETE (e.g. `/api/v1/brands/`, `/api/v1/brands/${id}/`, `/api/v1/auth/login/`, and `/api/v1/auth/register/`). Never omit the trailing slash.
- **PUT/PATCH Request Body Exclusions**: For update operations using PUT or PATCH, any un-editable fields like `slug` must NOT be sent in the request body payload. Always strip out un-editable fields such as `slug` from the `body` option on the request before dispatching it to the server.

### 🔑 Automatic Token Refresh & Security Node Authorization
- **Automatic Token Refresh**: All API integrations MUST run through the centralized `useApiClient` composable. It handles automatic JWT access token refresh using a queued interceptor pattern to resolve concurrent response race conditions.
- **Refresh Fallbacks**: The token-refresh interceptor automatically queries standard secure endpoints sequentially (`/api/v1/token/refresh/`, `/api/v1/auth/token/refresh/`, and `/api/v1/auth/refresh/`) with the body parameter `{ refresh: string }`.
- **Session Expiry Events**: If token-refresh fails, is unprovisioned, or credentials are completely logged out, the API client broadcasts a global `'techcore-auth-required'` event. All authenticated admin UI view components must listen to this event, trigger a user-friendly error notification, and open the Authorization Modal dashboard interface to configure active credentials.
- **Storage Strategy**: Access and refresh tokens are stored reactively across both Nuxt `useCookie` state containers and persistent `localStorage` browser instances (`techcore_admin_token` / `techcore_admin_refresh_token`) to guarantee secure synchronization between SSR server renderings and client executions.

### File Structure
- **Pages:** 
  - User-facing support pages: `/pages/support/*.vue`.
  - Corporate/Company pages: `/pages/*.vue` (About, Careers, Sustainability).
- **Components:** Logic-heavy layout pieces reside in `/components/layout/`.

### Icons
- Exclusively use `lucide-vue-next`.

## 📌 Active Context
- **Footer Structure:** The "Catalog" section has been renamed to **"Categories"** per user preference.
- **Search Logic:** The search bar remains functional and visible even in the compact scrolled state.
- **Support Ecosystem:** Fully implemented Help Center, Shipping, Returns, and Warranty pages with enterprise-grade copy.

## ✅ Definition of Done
Every task is governed by a strict set of completion criteria:
1. **Compilation & Types**: The application MUST build without warnings or errors via `pnpm build`, and both `lint_applet` and type-checking must pass cleanly.
2. **Structural Audit**: The agent MUST perform a formal structural audit over the codebase to ensure no architectural patterns were violated during execution, files conform to directory layouts, and files are named correctly.
3. **Clean Footprint**: Verify that no temporary files, unused assets, empty folders, or stray code elements are left behind in the workspace.
