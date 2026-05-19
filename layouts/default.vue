<script setup lang="ts">
import { Shield } from 'lucide-vue-next';
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
    <!-- Navbar -->
    <header class="h-16 border-b border-slate-200/50 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md flex items-center px-6 justify-between sticky top-0 z-40">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/10">
          <Shield class="w-4.5 h-4.5" />
        </div>
        <span class="text-xs font-display font-black uppercase tracking-widest bg-gradient-to-r from-rose-600 to-indigo-600 bg-clip-text text-transparent">
          TechCore Enterprise
        </span>
      </div>
      <div>
        <NuxtLink to="/admin">
          <UiButton size="sm" variant="primary">
            Admin Console
          </UiButton>
        </NuxtLink>
      </div>
    </header>

    <!-- Content Slot -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="py-8 border-t border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-950/40 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
      &copy; 2026 TechCore Global Infrastructure & Defensive Security, Inc. All rights reserved.
    </footer>
  </div>
</template>
