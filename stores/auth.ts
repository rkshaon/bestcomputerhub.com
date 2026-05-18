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
    user: {
      id: 'usr_123456',
      name: 'Sarah Anderson',
      email: 'sarah.a@enterprise.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&h=150&auto=format&fit=crop',
      role: 'customer',
      joinedAt: '2023-11-15'
    } as User | null,
    isLoggedIn: true,
  }),
  actions: {
    logout() {
      this.user = null;
      this.isLoggedIn = false;
    }
  }
});
