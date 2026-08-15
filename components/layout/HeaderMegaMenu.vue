<!-- File: /components/layout/HeaderMegaMenu.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import type { Category } from '@/types';
import { useCategoryService } from '@/composables/useCategoryService';
import HeaderCategorySubmenu from '@/components/layout/HeaderCategorySubmenu.vue';

const props = withDefaults(
  defineProps<{
    category: Category;
    allCategories?: Category[];
    isOpen?: boolean;
    alignRight?: boolean;
    level?: number;
    flyoutLeft?: boolean;
  }>(),
  {
    level: 1,
    isOpen: false,
    alignRight: false,
    flyoutLeft: false
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'keepOpen'): void;
}>();

const categoryService = useCategoryService();

const levelItems = computed(() => {
  if (!props.category) return [];
  // Use frontend relationship model as single source of truth
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

// [TEMPORARY DIAGNOSTIC]
watch(() => props.isOpen, (open) => {
  if (open) {
    console.log('[RUNTIME DIAGNOSTIC HeaderMegaMenu]', {
      categoryId: props.category?.id,
      categorySlug: props.category?.slug,
      categoryName: props.category?.name,
      isOpen: props.isOpen,
      childrenFromService: categoryService.getChildrenForParent(props.category?.id)?.length,
      levelItemsLength: levelItems.value?.length
    });
  }
});
</script>

<template>
  <HeaderCategorySubmenu
    v-if="isOpen && levelItems.length > 0"
    :items="levelItems"
    :level="level"
    :is-open="isOpen"
    :align-right="alignRight"
    :flyout-left="flyoutLeft"
    @keep-open="emit('keepOpen')"
    @close="emit('close')"
  />
</template>
