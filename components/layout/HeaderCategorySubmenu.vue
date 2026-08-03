<!-- File: /components/layout/HeaderCategorySubmenu.vue -->
<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { ChevronRight } from 'lucide-vue-next';
import type { Category } from '@/types';
import { useCategoryService } from '@/composables/useCategoryService';
import { cn } from '@/utils';

defineOptions({
  name: 'HeaderCategorySubmenu'
});

const props = withDefaults(
  defineProps<{
    items: Category[];
    allCategories: Category[];
    level?: number;
    isOpen?: boolean;
    alignRight?: boolean;
  }>(),
  {
    level: 1,
    isOpen: true,
    alignRight: false
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'keepOpen'): void;
}>();

const categoryService = useCategoryService();

// State for active / hovered item at THIS level
const activeItemId = ref<string | null>(null);
const flyoutPositionLeft = ref<boolean>(false);

let hoverTimer: ReturnType<typeof setTimeout> | null = null;

// Helper to resolve child categories
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

const handleItemHover = (item: Category, event?: MouseEvent | FocusEvent) => {
  if (hoverTimer) clearTimeout(hoverTimer);
  emit('keepOpen');

  const children = getSubCategories(item);
  if (children.length > 0) {
    activeItemId.value = item.id;

    // Viewport boundary collision check for flyouts (level >= 2)
    if (event && event.currentTarget && typeof window !== 'undefined') {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const flyoutWidth = 220;
      if (rect.right + flyoutWidth > window.innerWidth - 16) {
        flyoutPositionLeft.value = true;
      } else {
        flyoutPositionLeft.value = false;
      }
    }
  } else {
    activeItemId.value = null;
  }
};

const handleItemLeave = () => {
  if (hoverTimer) clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => {
    activeItemId.value = null;
  }, 180);
};

const handlePanelMouseEnter = () => {
  if (hoverTimer) clearTimeout(hoverTimer);
  emit('keepOpen');
};

const handlePanelMouseLeave = () => {
  if (hoverTimer) clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => {
    activeItemId.value = null;
    emit('close');
  }, 180);
};

const handleLinkClick = () => {
  activeItemId.value = null;
  emit('close');
};

onUnmounted(() => {
  if (hoverTimer) clearTimeout(hoverTimer);
});
</script>

<template>
  <div
    v-if="isOpen && items.length > 0"
    :class="cn(
      'absolute z-50 transition-all duration-150 origin-top pointer-events-auto',
      level === 1 
        ? (alignRight ? 'top-full right-0 pt-1.5' : 'top-full left-0 pt-1.5')
        : (flyoutPositionLeft ? 'top-0 right-full pr-1.5' : 'top-0 left-full pl-1.5')
    )"
    @mouseenter="handlePanelMouseEnter"
    @mouseleave="handlePanelMouseLeave"
  >
    <!-- Pointer Hover Bridge to prevent gap flicker -->
    <div 
      v-if="level === 1" 
      class="absolute -top-2 inset-x-0 h-2 pointer-events-auto"
    ></div>
    <div 
      v-else 
      :class="cn(
        'absolute inset-y-0 w-2 pointer-events-auto',
        flyoutPositionLeft ? '-right-2' : '-left-2'
      )"
    ></div>

    <!-- Submenu Card Panel -->
    <div
      class="bg-card/98 backdrop-blur-xl border border-border/80 shadow-2xl rounded-xl p-1.5 min-w-[200px] max-w-[260px] text-foreground relative overflow-visible"
    >
      <ul class="space-y-0.5">
        <li 
          v-for="item in items" 
          :key="item.id" 
          class="relative group/item"
          @mouseenter="handleItemHover(item, $event)"
          @mouseleave="handleItemLeave"
        >
          <NuxtLink
            :to="categoryService.getCategoryUrl(item, allCategories)"
            :class="cn(
              'flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
              activeItemId === item.id 
                ? 'bg-primary/10 text-primary font-bold' 
                : 'text-foreground/85 hover:bg-muted/70 hover:text-foreground'
            )"
            @focus="handleItemHover(item, $event)"
            @click="handleLinkClick"
          >
            <span class="truncate">{{ item.name }}</span>
            <ChevronRight 
              v-if="getSubCategories(item).length > 0"
              :class="cn(
                'w-3.5 h-3.5 transition-transform duration-150 shrink-0 ml-2',
                activeItemId === item.id ? 'text-primary translate-x-0.5' : 'text-muted-foreground/60 group-hover/item:translate-x-0.5 group-hover/item:text-foreground'
              )"
            />
          </NuxtLink>

          <!-- Recursive Child Flyout Panel -->
          <HeaderCategorySubmenu
            v-if="getSubCategories(item).length > 0 && activeItemId === item.id"
            :items="getSubCategories(item)"
            :all-categories="allCategories"
            :level="level + 1"
            :is-open="activeItemId === item.id"
            @keep-open="handlePanelMouseEnter"
            @close="handleLinkClick"
          />
        </li>
      </ul>
    </div>
  </div>
</template>
