<script setup lang="ts">
import ChangePasswordForm from '@/components/ChangePasswordForm.vue';
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <h2 class="text-2xl font-display font-bold">Security Settings</h2>
    
    <div class="bg-card border rounded-[2.5rem] p-8 md:p-10">
      <ChangePasswordForm />
    </div>
  </div>
</template>
