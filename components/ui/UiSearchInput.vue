<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { cn } from '~/utils';

interface Props {
  modelValue?: string;
  placeholder?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Search...',
});

const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <div :class="cn('relative group w-full', props.class)">
    <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
    <input 
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      type="text" 
      :placeholder="placeholder" 
      class="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 transition-all text-xs font-medium"
    />
  </div>
</template>
