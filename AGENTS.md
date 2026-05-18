# TechCore Enterprise - Agent Guidelines

This document contains project-specific instructions and context to ensure consistency across development sessions.

## 🏗 Project Overview
TechCore is a high-performance enterprise hardware marketplace built with **Nuxt 3**, **Tailwind CSS**, and **Lucide Icons**. The aesthetic is "Technical Premium": clean, high-contrast, with precise typography and subtle animations.

## 🎨 Design & UI Patterns

### Header Behavior
- **Dual-State Header:** The header transitions from a spacious multi-row layout to a compact single-row flex layout on scroll (`isScrolled`).
- **Compact Row Ordering:** On scroll, the order is: [Logo] -> [Search Bar (shrunk)] -> [Navigation Menu] -> [Action Icons (Right)].
- **Typography:** Uses "Inter" for UI and specialized "font-display" for headings. Enterprise feel is reinforced with tracking-widest and uppercase labels.

### Component Design
- **Rounding:** Favor large radii (`rounded-[2.5rem]` or `rounded-[3rem]`) for major layout containers and cards to create a modern tech-forward look.
- **Buttons:** Use the `UiButton` component with `primary`, `outline`, or `ghost` variants. Avoid "default" unless explicitly defined.
- **Animations:** Use `framer-motion` (via `motion/react`) for complex transitions or standard Tailwind `transition-all duration-500` for layout shifts.

## 🛠 Coding Standards

### TypeScript
- All components must be typed.
- Prefer `interface` for props and state.
- Use the `cn()` utility from `@/utils` (or the lib directory) for dynamic class merging.

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
