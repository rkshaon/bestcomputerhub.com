<!-- File: /pages/admin/forbidden.vue -->
<script setup lang="ts">
import { ShieldAlert, ArrowLeft } from 'lucide-vue-next';

definePageMeta({
  layout: 'admin'
});

useSeoMeta({
  title: 'Access Denied - Admin',
  robots: 'noindex, nofollow'
});
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center p-6">
    <div class="bg-card border border-border rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-lg animate-in fade-in duration-300 space-y-6">
      <div class="w-16 h-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
        <ShieldAlert class="w-8 h-8" />
      </div>

      <div class="space-y-2">
        <h1 class="text-2xl font-display font-extrabold text-foreground">
          Access Denied (403)
        </h1>
        <p class="text-xs text-muted-foreground leading-relaxed">
          You do not have the required security permissions to view this administrative resource. Please contact your system administrator if you believe this is an error.
        </p>
      </div>

      <div class="pt-4 border-t border-border/60">
        <NuxtLink to="/admin">
          <UiButton class="w-full rounded-2xl h-11 font-bold text-xs gap-2">
            <ArrowLeft class="w-4 h-4" />
            <span>Return to Dashboard</span>
          </UiButton>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
