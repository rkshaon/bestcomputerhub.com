<!-- File: /components/ui/UiSearchInput.vue -->
<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { cn } from '@/utils';
import { markRaw } from 'vue';

interface Props {
  modelValue: string;
  placeholder?: string;
  icon?: any;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search operations...'
});

const displayIcon = computed(() => props.icon || Search);

defineEmits(['update:modelValue']);
</script>

<template>
  <div class="relative group">
    <div class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
      <component :is="displayIcon" class="w-4 h-4" />
    </div>
    <input 
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :class="cn(
        'w-full h-12 pl-12 pr-4 bg-muted/50 border border-input rounded-2xl outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm font-medium',
        $attrs.class as string
      )"
    />
  </div>
</template>
