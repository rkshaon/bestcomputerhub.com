import { defineStore } from 'pinia';

export const useUIStore = defineStore('ui', {
  state: () => ({
    isCartOpen: false,
    isMobileMenuOpen: false,
    theme: 'light' as 'light' | 'dark' | 'system',
    themeMode: 'light' as 'light' | 'dark'
  }),
  actions: {
    toggleCart() {
      this.isCartOpen = !this.isCartOpen;
    },
    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    },
    setTheme(newTheme: 'light' | 'dark' | 'system') {
      this.theme = newTheme;
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme);
      }
      this.updateThemeMode();
    },
    updateThemeMode() {
      if (this.theme === 'system') {
        if (typeof window !== 'undefined') {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          this.themeMode = isDark ? 'dark' : 'light';
        } else {
          this.themeMode = 'light';
        }
      } else {
        this.themeMode = this.theme;
      }
      this.applyThemeClass();
    },
    applyThemeClass() {
      if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        if (this.themeMode === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    },
    initTheme() {
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
        if (savedTheme) {
          this.theme = savedTheme;
        } else {
          this.theme = 'system';
        }
        this.updateThemeMode();
      }
    }
  }
});
