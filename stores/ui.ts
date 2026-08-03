import { defineStore } from 'pinia';

export type ThemeMode = 'light' | 'dark' | 'system';

export const useUIStore = defineStore('ui', {
  state: () => ({
    themeMode: 'light' as ThemeMode,
    isCartOpen: false,
    isMobileMenuOpen: false,
    isSearchOpen: false,
  }),
  actions: {
    setTheme(mode: ThemeMode) {
      this.themeMode = mode;
      if (process.client) {
        localStorage.setItem('theme-preference', mode);
        this.applyTheme();
      }
    },
    applyTheme() {
      if (!process.client) return;

      const html = document.documentElement;
      let effectiveTheme = this.themeMode;

      if (this.themeMode === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      if (effectiveTheme === 'dark') {
        html.classList.add('dark');
        html.style.colorScheme = 'dark';
      } else {
        html.classList.remove('dark');
        html.style.colorScheme = 'light';
      }
    },
    initTheme() {
      if (process.client) {
        const savedTheme = localStorage.getItem('theme-preference') as ThemeMode | null;
        if (savedTheme) {
          this.themeMode = savedTheme;
        }
        this.applyTheme();

        // Listen for system changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
          if (this.themeMode === 'system') {
            this.applyTheme();
          }
        });
      }
    },
    toggleCart() {
      this.isCartOpen = !this.isCartOpen;
    },
    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    },
    toggleSearch() {
      this.isSearchOpen = !this.isSearchOpen;
    },
    closeMobileMenu() {
      this.isMobileMenuOpen = false;
    }
  }
});
