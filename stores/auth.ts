import { defineStore } from 'pinia';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'customer' | 'admin';
  joinedAt: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isLoggedIn: false,
  }),
  actions: {
    login(email: string) {
      // Mock login logic
      this.user = {
        id: 'usr_123456',
        name: 'Sarah Anderson',
        email: email,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&h=150&auto=format&fit=crop',
        role: 'customer',
        joinedAt: '2023-11-15'
      };
      this.isLoggedIn = true;
    },
    logout() {
      this.user = null;
      this.isLoggedIn = false;
    }
  }
});
