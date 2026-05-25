<!-- File: /error.vue -->
<script setup lang="ts">
import { TriangleAlert, Home, RefreshCcw } from 'lucide-vue-next';

const props = defineProps({
  error: Object
});

const handleError = () => clearError({ redirect: '/' });
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-muted/20 p-6">
    <div class="max-w-md w-full text-center space-y-8">
      <div class="w-24 h-24 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
        <TriangleAlert class="w-12 h-12" />
      </div>
      
      <div class="space-y-4 text-balance">
        <h1 class="text-4xl font-display font-extrabold text-primary">
          {{ error?.statusCode === 404 ? 'Hardware Not Found' : 'Circuit Malfunction' }}
        </h1>
        <p class="text-muted-foreground">
          {{ error?.statusCode === 404 
            ? "We couldn't find the product or page you were looking for. It might have been discontinued or moved." 
            : "An unexpected system error occurred. Our engineers are investigating." 
          }}
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-4">
        <UiButton class="flex-grow rounded-xl gap-2" @click="handleError">
          <Home class="w-4 h-4" />
          Back to Home
        </UiButton>
        <UiButton variant="outline" class="flex-grow rounded-xl gap-2" @click="() => $router.back()">
          <RefreshCcw class="w-4 h-4" />
          Try Again
        </UiButton>
      </div>

      <p class="text-xs text-muted-foreground uppercase tracking-widest font-bold">
        Error Code: {{ error?.statusCode || 500 }}
      </p>
    </div>
  </div>
</template>
