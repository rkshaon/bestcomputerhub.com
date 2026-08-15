<!-- File: /components/layout/HeaderMegaMenu.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import type { Category } from '@/types';
import { useCategoryService } from '@/composables/useCategoryService';
import HeaderCategorySubmenu from '@/components/layout/HeaderCategorySubmenu.vue';

const props = withDefaults(
  defineProps<{
    category: Category;
    allCategories: Category[];
    isOpen?: boolean;
    alignRight?: boolean;
    level?: number;
    flyoutLeft?: boolean;
  }>(),
  {
    level: 1,
    alignRight: false,
    flyoutLeft: false
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'keepOpen'): void;
}>();

const categoryService = useCategoryService();

const getSubCategories = (cat: Category): Category[] => {
  if (!cat) return [];
  const cached = categoryService.getChildrenForParent(cat.id);
  if (cached && cached.length > 0) {
    return cached;
  }
  if (cat.slug) {
    const cachedBySlug = categoryService.getChildrenForParent(cat.slug);
    if (cachedBySlug && cachedBySlug.length > 0) {
      return cachedBySlug;
    }
  }
  if (cat.children && Array.isArray(cat.children) && cat.children.length > 0) {
    return cat.children;
  }
  if (cat.subCategories && Array.isArray(cat.subCategories) && cat.subCategories.length > 0) {
    const list = props.allCategories || [];
    const matched = cat.subCategories
      .map(idOrSlug => list.find(c => c.id === idOrSlug || c.slug === idOrSlug))
      .filter((c): c is Category => !!c);
    if (matched.length > 0) return matched;
  }
  if (props.allCategories && props.allCategories.length > 0) {
    const parentMatches = props.allCategories.filter(
      c => c.id !== cat.id && (String(c.parentCategoryId) === String(cat.id) || c.parentCategoryId === cat.slug)
    );
    if (parentMatches.length > 0) return parentMatches;
  }
  return [];
};

const level1Items = computed(() => {
  return getSubCategories(props.category);
});
</script>

<template>
  <HeaderCategorySubmenu
    v-if="isOpen && level1Items.length > 0"
    :items="level1Items"
    :all-categories="allCategories"
    :level="level"
    :is-open="isOpen"
    :align-right="alignRight"
    :flyout-left="flyoutLeft"
    @keep-open="emit('keepOpen')"
    @close="emit('close')"
  />
</template>

