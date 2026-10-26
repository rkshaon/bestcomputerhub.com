<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { ShieldCheck } from 'lucide-vue-next';

const authStore = useAuthStore();
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <h2 class="text-2xl font-display font-bold">Profile Details</h2>
    
    <div class="bg-card border rounded-[2.5rem] p-8 md:p-10 space-y-10">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</label>
          <input type="text" :value="authStore.user?.name" disabled class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none font-medium" />
        </div>
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
          <input type="email" :value="authStore.user?.email" disabled class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none font-medium" />
        </div>
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone Number</label>
          <input type="tel" :value="authStore.user?.phone || 'Not provided'" disabled class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none font-medium" />
        </div>
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Registration Date</label>
          <input type="text" :value="authStore.user?.joinedAt ? new Date(authStore.user.joinedAt).toLocaleDateString() : 'N/A'" disabled class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none font-medium" />
        </div>
      </div>

      <div class="pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-3 text-muted-foreground">
          <ShieldCheck class="w-5 h-5 text-primary" />
          <p class="text-xs font-medium">Profile editing is currently unavailable.</p>
        </div>
        <UiButton class="rounded-full px-8 h-12 font-bold" disabled>
          Save Changes
        </UiButton>
      </div>
    </div>
  </div>
</template>
