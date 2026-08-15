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
    allCategories: Category[];
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

// ==========================================
// [TEMPORARY DIAGNOSTICS] Runtime Inspection
// ==========================================
const isMounted = ref(false);
const diagnosticData = ref<Record<string, any>>({});

const runDiagnosticCheck = () => {
  if (typeof window === 'undefined') return;
  const targetEl = outerCardRef.value || panelRef.value;
  
  if (!targetEl) {
    diagnosticData.value = {
      mounted: isMounted.value,
      level: props.level,
      isOpen: props.isOpen,
      itemsLength: props.items?.length || 0,
      elementFound: false,
      message: 'Submenu DOM element not attached to ref'
    };
    console.warn('[MEGA_MENU_DIAGNOSTIC] Element not attached:', diagnosticData.value);
    return;
  }

  const rect = targetEl.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(targetEl);
  
  const inViewport = (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  let elementAtCenter: Element | null = null;
  let elementAtCenterTag = 'none';
  let isPanelCovered = false;

  if (rect.width > 0 && rect.height > 0 && centerX >= 0 && centerY >= 0) {
    elementAtCenter = document.elementFromPoint(centerX, centerY);
    if (elementAtCenter) {
      elementAtCenterTag = `${elementAtCenter.tagName.toLowerCase()}${elementAtCenter.id ? '#' + elementAtCenter.id : ''}${elementAtCenter.className ? '.' + String(elementAtCenter.className).split(' ')[0] : ''}`;
      isPanelCovered = !targetEl.contains(elementAtCenter) && elementAtCenter !== targetEl;
    }
  }

  const result = {
    mounted: isMounted.value,
    level: props.level,
    isOpen: props.isOpen,
    itemsLength: props.items?.length || 0,
    rect: {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      bottom: Math.round(rect.bottom),
      right: Math.round(rect.right)
    },
    computedStyles: {
      display: computedStyle.display,
      visibility: computedStyle.visibility,
      opacity: computedStyle.opacity,
      zIndex: computedStyle.zIndex,
      position: computedStyle.position,
      pointerEvents: computedStyle.pointerEvents
    },
    inViewport,
    elementAtCenter: elementAtCenterTag,
    isPanelCovered,
    itemsSample: props.items?.map(i => i.name) || []
  };

  diagnosticData.value = result;

  // Global window inspection handle
  (window as any).__MEGA_MENU_DIAGNOSTICS__ = (window as any).__MEGA_MENU_DIAGNOSTICS__ || {};
  (window as any).__MEGA_MENU_DIAGNOSTICS__[`level_${props.level}`] = result;

  console.group(`[MEGA_MENU_DIAGNOSTIC] Level ${props.level} (isOpen: ${props.isOpen}, items: ${props.items?.length})`);
  console.log('1. Mounted & Open State:', { mounted: isMounted.value, isOpen: props.isOpen, itemsCount: props.items?.length });
  console.log('2. BoundingClientRect:', result.rect);
  console.log('3. Computed Styles:', result.computedStyles);
  console.log('4. Viewport & Occlusion:', { inViewport, elementAtCenter: elementAtCenterTag, isPanelCovered });
  console.groupEnd();
};
// ==========================================

const setItemRef = (id: string, el: any) => {
  if (el) {
    itemRefs.set(id, (el as any).$el || el);
  } else {
    itemRefs.delete(id);
  }
};

const activeItem = computed(() => {
  if (!activeItemId.value) return null;
  return props.items.find(i => i.id === activeItemId.value) || null;
});

// Helper to check if a category has child categories or has_children flag
const hasChildren = (cat: Category): boolean => {
  if (!cat) return false;
  if (typeof cat.has_children === 'boolean') {
    return cat.has_children;
  }
  return getSubCategories(cat).length > 0;
};

// Helper to resolve child categories
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

  // If item has scrolled off top or bottom of container
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
    activeItemId.value = item.id;
    if (event && event.currentTarget && typeof window !== 'undefined') {
      const isLeft = checkFlyoutDirection(event.currentTarget as HTMLElement);
      flyoutLeftMap.value[item.id] = isLeft;
    }
    await categoryService.getCategoryChildrenBatch([item.id]);
  }

  const children = getSubCategories(item);
  if (children.length > 0) {
    activeItemId.value = item.id;

    if (event && event.currentTarget && typeof window !== 'undefined') {
      const isLeft = checkFlyoutDirection(event.currentTarget as HTMLElement);
      flyoutLeftMap.value[item.id] = isLeft;
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
  isMounted.value = true;
  nextTick(() => {
    updateMaxScrollHeight();
    runDiagnosticCheck();
  });
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleWindowResizeOrScroll, { passive: true });
    window.addEventListener('scroll', handleWindowResizeOrScroll, { passive: true });
  }
});

onUnmounted(() => {
  isMounted.value = false;
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
      runDiagnosticCheck();
    });
  } else {
    activeItemId.value = null;
  }
});

watch(() => props.items, () => {
  nextTick(() => {
    runDiagnosticCheck();
  });
}, { deep: true });
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

    <!-- Submenu Card Panel (with temporary diagnostic highlight: border-2 border-rose-500 shadow-rose-500/40) -->
    <div
      ref="outerCardRef"
      class="bg-card border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.35)] rounded-xl text-card-foreground relative overflow-visible min-w-[200px] max-w-[260px]"
    >
      <!-- [TEMPORARY DIAGNOSTIC HEADER BADGE] -->
      <div class="px-2 py-0.5 bg-rose-500/15 border-b border-rose-500/30 text-[10px] font-mono text-rose-500 font-bold flex items-center justify-between select-none">
        <span>[DIAG] Level {{ level }} ({{ items.length }} items)</span>
        <span>isOpen: {{ isOpen }}</span>
      </div>

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
            :ref="el => setItemRef(item.id, el)"
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
                v-if="hasChildren(item)"
                :class="cn(
                  'w-3.5 h-3.5 transition-transform duration-150 shrink-0 ml-2',
                  categoryService.isChildrenLoading(item.id) ? 'animate-spin text-primary' : (activeItemId === item.id ? 'text-primary translate-x-0.5' : 'text-muted-foreground/60 group-hover/item:translate-x-0.5 group-hover/item:text-foreground')
                )"
              />
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Recursive Child Flyout Panel -->
      <HeaderCategorySubmenu
        v-if="activeItem && getSubCategories(activeItem).length > 0"
        :items="getSubCategories(activeItem)"
        :all-categories="allCategories"
        :level="level + 1"
        :is-open="true"
        :flyout-left="flyoutLeftMap[activeItem.id] || false"
        :custom-style="{ top: activeItemTop + 'px' }"
        @keep-open="handlePanelMouseEnter"
        @close="handleLinkClick"
      />
    </div>
  </div>
</template>
