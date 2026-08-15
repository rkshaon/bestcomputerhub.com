<!-- File: /components/layout/HeaderMegaMenu.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { ChevronRight } from 'lucide-vue-next';
import type { Category } from '@/types';
import { useCategoryService } from '@/composables/useCategoryService';
import { cn } from '@/utils';
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
    level?: number;
    flyoutLeft?: boolean;
    targetElement?: HTMLElement | null;
  }>(),
  {
    level: 1,
    isOpen: false,
    alignRight: false,
    flyoutLeft: false,
    targetElement: null
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'keepOpen'): void;
}>();

const categoryService = useCategoryService();

// State for active child item at this level
const activeItemId = ref<string | null>(null);
const activeItemTop = ref<number>(0);
const flyoutLeftMap = ref<Record<string, boolean>>({});

const anchorRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const outerCardRef = ref<HTMLElement | null>(null);
const scrollContainerRef = ref<HTMLElement | null>(null);
const itemRefs = new Map<string, HTMLElement>();

const dropdownTop = ref<number>(0);
const dropdownLeft = ref<number>(0);
const maxScrollHeight = ref<number | null>(null);
const isMounted = ref(false);
let hoverTimer: ReturnType<typeof setTimeout> | null = null;

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

const setItemRef = (id: string, el: any) => {
  if (el) {
    itemRefs.set(id, (el as any).$el || el);
  } else {
    itemRefs.delete(id);
  }
};

const activeItem = computed(() => {
  if (!activeItemId.value) return null;
  return levelItems.value.find(i => String(i.id) === String(activeItemId.value)) || null;
});

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
  return spaceOnRight < flyoutWidth && spaceOnLeft > spaceOnRight;
};

const updatePosition = () => {
  if (typeof window === 'undefined') return;
  const target = props.targetElement || anchorRef.value?.parentElement;
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const dropdownWidth = 240;
  const margin = 12;

  if (props.level === 1) {
    dropdownTop.value = Math.round(rect.bottom + 1);

    if (props.alignRight || (rect.left + dropdownWidth > window.innerWidth - margin)) {
      dropdownLeft.value = Math.round(Math.max(margin, rect.right - dropdownWidth));
    } else {
      dropdownLeft.value = Math.round(Math.max(margin, rect.left));
    }

    const availableHeight = window.innerHeight - dropdownTop.value - margin;
    maxScrollHeight.value = availableHeight > 100 ? Math.floor(availableHeight) : null;
  } else {
    dropdownTop.value = Math.round(rect.top);
    if (props.flyoutLeft) {
      dropdownLeft.value = Math.round(Math.max(margin, rect.left - dropdownWidth - 2));
    } else {
      dropdownLeft.value = Math.round(Math.min(window.innerWidth - dropdownWidth - margin, rect.right + 2));
    }

    const availableHeight = window.innerHeight - dropdownTop.value - margin;
    maxScrollHeight.value = availableHeight > 100 ? Math.floor(availableHeight) : null;
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

const clearHoverTimer = () => {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
};

const handleItemHover = async (item: Category, event?: MouseEvent | FocusEvent) => {
  clearHoverTimer();
  emit('keepOpen');

  const isLoaded = categoryService.hasChildrenLoaded(item.id) || (item.slug ? categoryService.hasChildrenLoaded(item.slug) : false);
  if (item && item.has_children !== false && !isLoaded) {
    activeItemId.value = String(item.id);
    if (event && event.currentTarget && typeof window !== 'undefined') {
      flyoutLeftMap.value[String(item.id)] = checkFlyoutDirection(event.currentTarget as HTMLElement);
    }
    await categoryService.getCategoryChildrenBatch([item.id]);
  }

  const children = getChildren(item);
  if (children.length > 0) {
    activeItemId.value = String(item.id);
    if (event && event.currentTarget && typeof window !== 'undefined') {
      flyoutLeftMap.value[String(item.id)] = checkFlyoutDirection(event.currentTarget as HTMLElement);
    }
    nextTick(() => {
      updateActiveItemTop();
    });
  } else if (!categoryService.isChildrenLoading(item.id)) {
    activeItemId.value = null;
  }
};

const handleItemLeave = () => {
  clearHoverTimer();
  hoverTimer = setTimeout(() => {
    activeItemId.value = null;
    hoverTimer = null;
  }, 200);
};

const handlePanelMouseEnter = () => {
  clearHoverTimer();
  emit('keepOpen');
};

const handlePanelMouseLeave = () => {
  clearHoverTimer();
  hoverTimer = setTimeout(() => {
    activeItemId.value = null;
    hoverTimer = null;
    emit('close');
  }, 200);
};

const handleLinkClick = () => {
  clearHoverTimer();
  activeItemId.value = null;
  emit('close');
};

const handleChildSubmenuClose = () => {
  activeItemId.value = null;
};

const handleWindowEvents = () => {
  if (props.isOpen) {
    updatePosition();
    updateActiveItemTop();
  }
};

onMounted(() => {
  isMounted.value = true;
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleWindowEvents, { passive: true });
    window.addEventListener('scroll', handleWindowEvents, { passive: true });
  }
});

onUnmounted(() => {
  clearHoverTimer();
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleWindowEvents);
    window.removeEventListener('scroll', handleWindowEvents);
  }
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    nextTick(() => {
      updatePosition();
    });
  } else {
    clearHoverTimer();
    activeItemId.value = null;
  }
});

watch(levelItems, () => {
  if (props.isOpen) {
    nextTick(() => {
      updatePosition();
    });
  }
});
</script>

<template>
  <div ref="anchorRef" class="hidden" aria-hidden="true"></div>

  <!-- Teleport dropdown directly to body to guarantee fixed viewport positioning above all hero/page layers -->
  <Teleport to="body" v-if="isMounted && isOpen && levelItems.length > 0">
    <div
      ref="panelRef"
      class="fixed z-[100] transition-all duration-150 origin-top pointer-events-auto"
      :style="{
        top: `${dropdownTop}px`,
        left: `${dropdownLeft}px`,
        width: '240px'
      }"
      @mouseenter="handlePanelMouseEnter"
      @mouseleave="handlePanelMouseLeave"
    >
      <!-- Pointer Hover Bridge across navbar gap -->
      <div 
        v-if="level === 1" 
        class="absolute -top-3 inset-x-0 h-3 pointer-events-auto"
      ></div>
      <div 
        v-else 
        :class="cn(
          'absolute inset-y-0 w-3 pointer-events-auto',
          flyoutLeft ? '-right-3' : '-left-3'
        )"
      ></div>

      <!-- Root Dropdown Card Panel -->
      <div
        ref="outerCardRef"
        class="bg-card border border-border shadow-2xl rounded-xl text-card-foreground relative overflow-visible min-w-[210px] max-w-[270px]"
      >
        <div
          ref="scrollContainerRef"
          class="p-1.5 overflow-y-auto custom-submenu-scrollbar"
          :style="{ maxHeight: maxScrollHeight ? `${maxScrollHeight}px` : '420px' }"
          @scroll="updateActiveItemTop"
        >
          <ul class="space-y-0.5" role="menu">
            <li 
              v-for="item in levelItems" 
              :key="item.id" 
              :ref="el => setItemRef(String(item.id), el)"
              class="relative group/item"
              role="none"
              @mouseenter="handleItemHover(item, $event)"
              @mouseleave="handleItemLeave"
            >
              <NuxtLink
                :to="categoryService.getCategoryUrl(item, allCategories)"
                :class="cn(
                  'flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                  String(activeItemId) === String(item.id) 
                    ? 'bg-primary/10 text-primary font-bold' 
                    : 'text-foreground/85 hover:bg-muted/70 hover:text-foreground'
                )"
                role="menuitem"
                @focus="handleItemHover(item, $event)"
                @click="handleLinkClick"
              >
                <span class="truncate">{{ item.name }}</span>
                <ChevronRight 
                  v-if="hasChildren(item)"
                  :class="cn(
                    'w-3.5 h-3.5 transition-transform duration-150 shrink-0 ml-2',
                    categoryService.isChildrenLoading(item.id) 
                      ? 'animate-spin text-primary' 
                      : (String(activeItemId) === String(item.id) 
                          ? 'text-primary translate-x-0.5' 
                          : 'text-muted-foreground/60 group-hover/item:translate-x-0.5 group-hover/item:text-foreground')
                  )"
                />
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Recursive Child Flyout Panel for nested categories -->
        <HeaderCategorySubmenu
          v-if="activeItem && getChildren(activeItem).length > 0"
          :items="getChildren(activeItem)"
          :level="level + 1"
          :is-open="true"
          :flyout-left="flyoutLeftMap[String(activeItem.id)] || false"
          :custom-style="{ top: activeItemTop + 'px' }"
          @keep-open="handlePanelMouseEnter"
          @close="handleChildSubmenuClose"
        />
      </div>
    </div>
  </Teleport>
</template>
