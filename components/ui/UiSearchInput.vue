<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { cn } from '@/utils';

interface Props {
  modelValue: string;
  placeholder?: string;
  icon?: any;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search operations...',
  icon: Search
});

defineEmits(['update:modelValue']);
</script>

<template>
  <div class="relative group">
    <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
      <component :is="icon" class="w-4 h-4" />
    </div>
    <input 
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :class="cn(
        'w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium',
        $attrs.class as string
      )"
    />
  </div>
</template>
