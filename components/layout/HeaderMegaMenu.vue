<!-- File: /components/layout/HeaderMegaMenu.vue -->
<script setup lang="ts">
import { computed, watch } from 'vue';
import type { Category } from '@/types';
import { useMegaMenuV2 } from '@/composables/useMegaMenuV2';
import { cn } from '@/utils';
import HeaderCategorySubmenu from '@/components/layout/HeaderCategorySubmenu.vue';

defineOptions({
  name: 'HeaderMegaMenu'
});

/**
 * Desktop mega menu.
 *
 * Root category -> hover (isOpen) -> category ID -> direct children -> submenu.
 * Deeper levels are loaded lazily by HeaderCategorySubmenu on hover.
 */
const props = withDefaults(
  defineProps<{
    /** Root (or overflow) category acting as the top-level menu item */
    category: Category;
    isOpen?: boolean;
    alignRight?: boolean;
    /** 1 = dropdown under the nav item, 2 = flyout beside a "More" list item */
    level?: number;
    flyoutLeft?: boolean;
  }>(),
  {
    isOpen: false,
    alignRight: false,
    level: 1,
    flyoutLeft: false
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'keepOpen'): void;
}>();

const megaMenu = useMegaMenuV2();

/** Direct children of this root category, resolved by category ID */
const directChildren = computed<Category[]>(() => megaMenu.getChildren(props.category.id));

const isLoadingFirstLevel = computed(
  () => megaMenu.isLoadingChildren(props.category.id) && directChildren.value.length === 0
);

watch(
  () => [props.isOpen, props.category.id] as const,
  async ([open]) => {
    if (!open || props.category.has_children === false) return;
    await megaMenu.ensureChildren(props.category.id);
  },
  { immediate: true }
);
</script>

<template>
  <div
    v-if="isOpen && isLoadingFirstLevel"
    :class="cn(
      'absolute z-[100] pointer-events-none',
      level === 1
        ? (alignRight ? 'top-full right-0 pt-1.5' : 'top-full left-0 pt-1.5')
        : (flyoutLeft ? 'right-full top-0 pr-1.5' : 'left-full top-0 pl-1.5')
    )"
  >
    <div
      class="bg-card border border-border shadow-2xl rounded-xl text-card-foreground min-w-[200px] px-3 py-3 flex items-center gap-2 text-xs text-muted-foreground"
    >
      <span class="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
      <span>Loading categories…</span>
    </div>
  </div>

  <HeaderCategorySubmenu
    v-else
    :items="directChildren"
    :ancestor-slugs="[category.slug]"
    :level="level"
    :is-open="isOpen"
    :align-right="alignRight"
    :flyout-left="flyoutLeft"
    @keep-open="emit('keepOpen')"
    @close="emit('close')"
  />
</template>
