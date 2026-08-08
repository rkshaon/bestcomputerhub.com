<!-- File: /pages/admin/staff/index.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: [
    function () {
      return navigateTo('/admin/users', { replace: true });
    }
  ]
});
</script>

<template>
  <div class="p-8 text-center text-xs text-muted-foreground">
    Redirecting to User Accounts & Access Governance...
  </div>
</template>
