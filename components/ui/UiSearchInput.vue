<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { cn } from '@/utils';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Search...'
  },
  class: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div :class="cn('relative flex items-center w-full', props.class)">
    <Search class="absolute left-4 w-5 h-5 text-muted-foreground/60 pointer-events-none" />
    <input 
      type="text" 
      :value="props.modelValue" 
      @input="onInput"
      :placeholder="props.placeholder"
      class="w-full h-12 pl-12 pr-4 bg-muted/20 border border-border/80 hover:border-border focus:border-primary/50 text-foreground text-sm font-medium rounded-xl outline-none transition-all placeholder:text-muted-foreground/45"
    />
  </div>
</template>
