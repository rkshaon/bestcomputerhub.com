import { defineStore } from 'pinia';
import type { User } from '@/types';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isLoggedIn: false
  }),
  actions: {
    login(email: string) {
      this.user = {
        id: 'usr_mock_1',
        email,
        name: email.split('@')[0] || email,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80',
        role: email.includes('admin') ? 'admin' : 'customer',
        joinedAt: new Date().toISOString().split('T')[0] || '',
      };
      this.isLoggedIn = true;
      this.saveToStorage();
    },
    logout() {
      this.user = null;
      this.isLoggedIn = false;
      this.saveToStorage();
    },
    saveToStorage() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-user', JSON.stringify({ user: this.user, isLoggedIn: this.isLoggedIn }));
      }
    },
    loadFromStorage() {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('auth-user');
        if (saved) {
          try {
            const data = JSON.parse(saved);
            this.user = data.user;
            this.isLoggedIn = data.isLoggedIn;
          } catch (e) {
            console.error('Failed to parse auth storage');
          }
        }
      }
    }
  }
});
