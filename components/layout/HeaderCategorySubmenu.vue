<!-- File: /components/layout/HeaderCategorySubmenu.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
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
    level?: number;
    isOpen?: boolean;
    alignRight?: boolean;
    flyoutLeft?: boolean;
    customStyle?: Record<string, any>;
  }>(),
  {
    level: 1,
    isOpen: true,
    alignRight: false,
    flyoutLeft: false,
    customStyle: () => ({})
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'keepOpen'): void;
}>();

const categoryService = useCategoryService();

// State for active / hovered item at THIS level
const activeItemId = ref<string | null>(null);
const activeItemTop = ref<number>(0);
const flyoutLeftMap = ref<Record<string, boolean>>({});

const panelRef = ref<HTMLElement | null>(null);
const outerCardRef = ref<HTMLElement | null>(null);
const scrollContainerRef = ref<HTMLElement | null>(null);
const itemRefs = new Map<string, HTMLElement>();

const maxScrollHeight = ref<number | null>(null);
let hoverTimer: ReturnType<typeof setTimeout> | null = null;

const setItemRef = (id: string, el: any) => {
  if (el) {
    itemRefs.set(id, (el as any).$el || el);
  } else {
    itemRefs.delete(id);
  }
};

const activeItem = computed(() => {
  if (!activeItemId.value) return null;
  return props.items.find(i => String(i.id) === String(activeItemId.value)) || null;
});

// Single source of truth lookup for child categories
const getChildren = (cat: Category): Category[] => {
  if (!cat) return [];
  const children = categoryService.getChildrenForParent(cat.id);
  if (children && children.length > 0) return children;
  if (cat.slug) {
    const childrenBySlug = categoryService.getChildrenForParent(cat.slug);
    if (childrenBySlug && childrenBySlug.length > 0) return childrenBySlug;
  }
  return [];
};

// Check if category has children or can have children
const hasChildren = (cat: Category): boolean => {
  if (!cat) return false;
  if (typeof cat.has_children === 'boolean') {
    return cat.has_children;
  }
  return getChildren(cat).length > 0;
};

const checkFlyoutDirection = (el: HTMLElement): boolean => {
  if (typeof window === 'undefined') return false;
  const rect = el.getBoundingClientRect();
  const flyoutWidth = 240;
  const margin = 16;

  const spaceOnRight = window.innerWidth - rect.right - margin;
  const spaceOnLeft = rect.left - margin;

  if (spaceOnRight < flyoutWidth && spaceOnLeft > spaceOnRight) {
    return true; // Flyout to the LEFT
  }
  return false; // Flyout to the RIGHT
};

const updateMaxScrollHeight = () => {
  if (typeof window === 'undefined') return;
  const el = outerCardRef.value || panelRef.value;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const topPos = rect.top;
  const bottomMargin = 16;
  
  const available = window.innerHeight - topPos - bottomMargin;
  const minHeight = 120;
  
  if (available > 0) {
    maxScrollHeight.value = Math.max(minHeight, Math.floor(available));
  }
};

const updateActiveItemTop = () => {
  if (!activeItemId.value || !outerCardRef.value) return;
  const itemEl = itemRefs.get(activeItemId.value);
  if (!itemEl) return;

  const cardRect = outerCardRef.value.getBoundingClientRect();
  const itemRect = itemEl.getBoundingClientRect();

  if (itemRect.bottom < cardRect.top || itemRect.top > cardRect.bottom) {
    activeItemId.value = null;
    return;
  }

  activeItemTop.value = Math.max(0, itemRect.top - cardRect.top);
};

const handleScroll = () => {
  updateActiveItemTop();
  updateMaxScrollHeight();
};

const handleItemHover = async (item: Category, event?: MouseEvent | FocusEvent) => {
  if (hoverTimer) clearTimeout(hoverTimer);
  emit('keepOpen');

  // Lazy load direct children if has_children is true and not yet loaded in cache
  const isLoaded = categoryService.hasChildrenLoaded(item.id) || (item.slug ? categoryService.hasChildrenLoaded(item.slug) : false);
  if (item && item.has_children !== false && !isLoaded) {
    activeItemId.value = String(item.id);
    if (event && event.currentTarget && typeof window !== 'undefined') {
      const isLeft = checkFlyoutDirection(event.currentTarget as HTMLElement);
      flyoutLeftMap.value[String(item.id)] = isLeft;
    }
    await categoryService.getCategoryChildrenBatch([item.id]);
  }

  const children = getChildren(item);
  if (children.length > 0) {
    activeItemId.value = String(item.id);

    if (event && event.currentTarget && typeof window !== 'undefined') {
      const isLeft = checkFlyoutDirection(event.currentTarget as HTMLElement);
      flyoutLeftMap.value[String(item.id)] = isLeft;
    }
    nextTick(() => {
      updateActiveItemTop();
    });
  } else if (!categoryService.isChildrenLoading(item.id)) {
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

const handleWindowResizeOrScroll = () => {
  updateMaxScrollHeight();
  updateActiveItemTop();
};

onMounted(() => {
  nextTick(() => {
    updateMaxScrollHeight();
  });
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleWindowResizeOrScroll, { passive: true });
    window.addEventListener('scroll', handleWindowResizeOrScroll, { passive: true });
  }
});

onUnmounted(() => {
  if (hoverTimer) clearTimeout(hoverTimer);
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleWindowResizeOrScroll);
    window.removeEventListener('scroll', handleWindowResizeOrScroll);
  }
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    nextTick(() => {
      updateMaxScrollHeight();
    });
  } else {
    activeItemId.value = null;
  }
});
</script>

<template>
  <div
    ref="panelRef"
    v-if="isOpen && items.length > 0"
    :class="cn(
      'absolute z-50 transition-all duration-150 origin-top pointer-events-auto',
      level === 1 
        ? (alignRight ? 'top-full right-0 pt-1.5' : 'top-full left-0 pt-1.5')
        : (flyoutLeft ? 'right-full top-0 pr-1.5' : 'left-full top-0 pl-1.5')
    )"
    :style="customStyle"
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
        'absolute inset-y-0 w-3 pointer-events-auto',
        flyoutLeft ? '-right-3' : '-left-3'
      )"
    ></div>

    <!-- Submenu Card Panel -->
    <div
      ref="outerCardRef"
      class="bg-card border border-border shadow-2xl rounded-xl text-card-foreground relative overflow-visible min-w-[200px] max-w-[260px]"
    >
      <div
        ref="scrollContainerRef"
        class="p-1.5 overflow-y-auto custom-submenu-scrollbar"
        :style="{ maxHeight: maxScrollHeight ? `${maxScrollHeight}px` : undefined }"
        @scroll="handleScroll"
      >
        <ul class="space-y-0.5">
          <li 
            v-for="item in items" 
            :key="item.id" 
            :ref="el => setItemRef(String(item.id), el)"
            class="relative group/item"
            @mouseenter="handleItemHover(item, $event)"
            @mouseleave="handleItemLeave"
          >
            <NuxtLink
              :to="categoryService.getCategoryUrl(item)"
              :class="cn(
                'flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                String(activeItemId) === String(item.id) 
                  ? 'bg-primary/10 text-primary font-bold' 
                  : 'text-foreground/85 hover:bg-muted/70 hover:text-foreground'
              )"
              @focus="handleItemHover(item, $event)"
              @click="handleLinkClick"
            >
              <span class="truncate">{{ item.name }}</span>
              <ChevronRight 
                v-if="hasChildren(item)"
                :class="cn(
                  'w-3.5 h-3.5 transition-transform duration-150 shrink-0 ml-2',
                  categoryService.isChildrenLoading(item.id) ? 'animate-spin text-primary' : (String(activeItemId) === String(item.id) ? 'text-primary translate-x-0.5' : 'text-muted-foreground/60 group-hover/item:translate-x-0.5 group-hover/item:text-foreground')
                )"
              />
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Recursive Child Flyout Panel -->
      <HeaderCategorySubmenu
        v-if="activeItem && getChildren(activeItem).length > 0"
        :items="getChildren(activeItem)"
        :level="level + 1"
        :is-open="true"
        :flyout-left="flyoutLeftMap[String(activeItem.id)] || false"
        :custom-style="{ top: activeItemTop + 'px' }"
        @keep-open="handlePanelMouseEnter"
        @close="handleLinkClick"
      />
    </div>
  </div>
</template>
