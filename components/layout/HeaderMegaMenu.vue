<!-- File: /components/layout/HeaderMegaMenu.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import type { Category } from '@/types';
import { useCategoryService } from '@/composables/useCategoryService';
import HeaderCategorySubmenu from '@/components/layout/HeaderCategorySubmenu.vue';

defineOptions({
  name: 'HeaderMegaMenu'
});

const props = withDefaults(
  defineProps<{
    category: Category;
    allCategories?: Category[];
    isOpen?: boolean;
    alignRight?: boolean;
  }>(),
  {
    isOpen: false,
    alignRight: false
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'keepOpen'): void;
}>();

const categoryService = useCategoryService();

const levelItems = computed(() => {
  if (!props.category) return [];
  // Single source of truth from category service
  const children = categoryService.getChildrenForParent(props.category.id);
  if (children && children.length > 0) {
    return children;
  }
  if (props.category.slug) {
    const childrenBySlug = categoryService.getChildrenForParent(props.category.slug);
    if (childrenBySlug && childrenBySlug.length > 0) {
      return childrenBySlug;
    }
  }
  return [];
});
</script>

<template>
  <HeaderCategorySubmenu
    :items="levelItems"
    :level="1"
    :is-open="isOpen"
    :align-right="alignRight"
    @keep-open="emit('keepOpen')"
    @close="emit('close')"
  />
</template>
