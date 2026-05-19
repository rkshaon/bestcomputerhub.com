import { defineStore } from 'pinia';

export const useUIStore = defineStore('ui', {
  state: () => ({
    themeMode: 'system' as 'light' | 'dark' | 'system',
    isSidebarOpen: true,
  }),
  actions: {
    setTheme(theme: 'light' | 'dark' | 'system') {
      this.themeMode = theme;
      if (process.client) {
        localStorage.setItem('theme-mode', theme);
        this.applyTheme();
      }
    },
    applyTheme() {
      if (!process.client) return;
      
      const isDark = 
        this.themeMode === 'dark' || 
        (this.themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    initTheme() {
      if (!process.client) return;
      const saved = localStorage.getItem('theme-mode') as 'light' | 'dark' | 'system' | null;
      this.themeMode = saved || 'system';
      this.applyTheme();
      
      // Setup reactive listener for system preference change
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      try {
        mediaQuery.addEventListener('change', () => {
          if (this.themeMode === 'system') {
            this.applyTheme();
          }
        });
      } catch (e) {
        // Fallback for older browsers
        mediaQuery.addListener(() => {
          if (this.themeMode === 'system') {
            this.applyTheme();
          }
        });
      }
    },
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
    }
  }
});
