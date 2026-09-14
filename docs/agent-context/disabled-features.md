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
*Date Registered*: September 14, 2026
