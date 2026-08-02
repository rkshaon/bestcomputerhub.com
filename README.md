<!-- File: /README.md -->
<div align="center">
<img width="1200" height="475" alt="TechCore Enterprise Banner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# TechCore Enterprise

TechCore Enterprise is a high-performance, technical-premium hardware marketplace and B2B/B2C catalog platform built with Nuxt 3, Vue 3, Tailwind CSS, and Lucide Icons.

---

## 🛠 Technology Stack & Version Matrix

### **Core Frameworks & Runtime**
- **Framework**: [Nuxt 3](https://nuxt.com/) (`^4.4.6`) / [Vue 3](https://vuejs.org/) (`^3.5.34`)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (`~5.8.2`) with `vue-tsc` (`^3.3.1`)
- **Package Manager**: [pnpm](https://pnpm.io/) (`10.0.0`) *Strictly enforced*

### **Styling & Design System**
- **Tailwind CSS**: `^3.4.19` with `@nuxtjs/tailwindcss` (`^6.14.0`)
- **PostCSS Ecosystem**: `@tailwindcss/postcss` (`^4.3.0`), `postcss` (`^8.5.14`), `autoprefixer` (`^10.5.0`)
- **Utility Helpers**: `clsx` (`^2.1.1`), `tailwind-merge` (`^3.6.0`)
- **Icons**: `lucide-vue-next` (`^1.0.0`), `lucide-react` (`^0.546.0`)

### **State & Data Management**
- **State Store**: [Pinia](https://pinia.vuejs.org/) (`^3.0.4`) with `@pinia/nuxt` (`^0.11.3`)
- **Composables & Utilities**: `@vueuse/core` (`^14.3.0`), `@vueuse/nuxt` (`^14.3.0`)
- **Notifications**: `vue-sonner` (`^2.0.9`)

### **Graphics, Visualization & Motion**
- **Motion & Animations**: `motion` (`^12.39.0`)
- **Data Visualization**: `d3` (`^7.9.0`), `@types/d3` (`^7.4.3`)

### **Backend, API & Bundling**
- **Server Framework**: Express (`^4.21.2`), `@types/express` (`^4.17.21`)
- **AI Integration**: `@google/genai` (`^1.29.0`)
- **Build & Dev Tools**: Vite (`^6.2.3`), `esbuild` (`^0.25.0`), `tsx` (`^4.21.0`), `dotenv` (`^17.2.3`)

---

## 📁 Project Architecture Overview

```
├── AGENTS.md                  # Context file: AI agent instructions & coding guidelines
├── app.vue                    # Root Nuxt application component
├── assets/                    # Static styling assets & global styles
├── components/                # Reusable UI & layout components
│   ├── layout/                # Header, Footer, MegaMenu, Mobile Navigation
│   └── ui/                    # Core UI primitives (Buttons, Modals, Badges)
├── composables/               # Reactive business logic & API services
│   ├── useApiClient.ts        # Centralized HTTP client with JWT auto-refresh
│   ├── useProductService.ts   # Product catalog & search state
│   └── useCategoryService.ts  # Hardware taxonomy management
├── features/                  # Domain-specific feature modules
├── middleware/                # Nuxt route guards & auth checks
├── pages/                     # File-based routing pages
├── stores/                    # Pinia state stores
├── types/                     # Global TypeScript interfaces & PaginatedResponse<T>
└── utils/                     # Class merging (`cn()`) and helper utilities
```

---

## 🚀 Local Development Setup

### **Prerequisites**
- **Node.js**: `^18.18.0` or `>=20.0.0`
- **pnpm**: `10.0.0` (Run `corepack enable` or `npm install -g pnpm`)

### **Quickstart Commands**

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` and provide required keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start Development Server**:
   ```bash
   pnpm dev
   ```
   Access the local preview on `http://localhost:3000`.

4. **Linting & Type Checking**:
   ```bash
   pnpm lint
   ```

5. **Production Build**:
   ```bash
   pnpm build
   ```

---

## ⚡ Core Operational Rules
- **Package Manager**: Use `pnpm` exclusively. Do not run `npm` or `yarn`.
- **API Endpoints**: All API requests strictly require a trailing slash (`/`), e.g., `/api/v1/products/`.
- **Pagination**: All paginated responses adhere to the standard `PaginatedResponse<T>` schema.

