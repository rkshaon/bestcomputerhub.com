<!-- File: /components/layout/HeaderMegaMenu.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import type { Category } from '@/types';
import HeaderCategorySubmenu from '@/components/layout/HeaderCategorySubmenu.vue';

const props = defineProps<{
  category: Category;
  allCategories: Category[];
  isOpen?: boolean;
  alignRight?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'keepOpen'): void;
}>();

const getSubCategories = (cat: Category): Category[] => {
  if (!cat) return [];
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
      c => c.id !== cat.id && (c.parentCategoryId === cat.id || c.parentCategoryId === cat.slug)
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
    :level="1"
    :is-open="isOpen"
    :align-right="alignRight"
    @keep-open="emit('keepOpen')"
    @close="emit('close')"
  />
</template>

