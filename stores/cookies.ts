// File: /stores/cookies.ts
import { defineStore } from 'pinia';

export interface CookiePreferences {
  essential: boolean;
  analytical: boolean;
  marketing: boolean;
  performance: boolean;
  acceptedAt: string | null;
}

export const useCookieStore = defineStore('cookies', {
  state: () => ({
    preferences: {
      essential: true, // Always true
      analytical: false,
      marketing: false,
      performance: false,
      acceptedAt: null
    } as CookiePreferences,
    isBannerVisible: true
  }),
  actions: {
    acceptAll() {
      this.preferences = {
        essential: true,
        analytical: true,
        marketing: true,
        performance: true,
        acceptedAt: new Date().toISOString()
      };
      this.isBannerVisible = false;
      this.saveToStorage();
    },
    acceptEssential() {
      this.preferences = {
        essential: true,
        analytical: false,
        marketing: false,
        performance: false,
        acceptedAt: new Date().toISOString()
      };
      this.isBannerVisible = false;
      this.saveToStorage();
    },
    savePreferences(prefs: Partial<CookiePreferences>) {
      this.preferences = {
        ...this.preferences,
        ...prefs,
        essential: true, // Force essential
        acceptedAt: new Date().toISOString()
      };
      this.isBannerVisible = false;
      this.saveToStorage();
    },
    saveToStorage() {
      if (process.client) {
        localStorage.setItem('cookie-preferences', JSON.stringify(this.preferences));
      }
    },
    loadFromStorage() {
      if (process.client) {
        const saved = localStorage.getItem('cookie-preferences');
        if (saved) {
          try {
            this.preferences = JSON.parse(saved);
            this.isBannerVisible = false;
          } catch (e) {
            console.error('Failed to parse cookie preferences');
          }
        }
      }
    }
  }
});
