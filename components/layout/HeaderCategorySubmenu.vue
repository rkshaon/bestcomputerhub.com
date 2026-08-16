<!-- File: /components/layout/HeaderCategorySubmenu.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { ChevronRight } from 'lucide-vue-next';
import type { Category } from '@/types';
import { useMegaMenuV2 } from '@/composables/useMegaMenuV2';
import { cn } from '@/utils';

defineOptions({
  name: 'HeaderCategorySubmenu'
});

const props = withDefaults(
  defineProps<{
    /** Categories rendered at this level (already resolved by the parent) */
    items: Category[];
    /** Ancestor slugs of `items`, used only to build category URLs */
    ancestorSlugs?: string[];
    level?: number;
    isOpen?: boolean;
    alignRight?: boolean;
    flyoutLeft?: boolean;
    customStyle?: Record<string, string>;
  }>(),
  {
    ancestorSlugs: () => [],
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

const megaMenu = useMegaMenuV2();

const activeItemId = ref<string | null>(null);
const activeItemTop = ref(0);
const flyoutLeftMap = ref<Record<string, boolean>>({});
const maxScrollHeight = ref<number | null>(null);

const outerCardRef = ref<HTMLElement | null>(null);
const itemElements = new Map<string, HTMLElement>();

let hoverTimer: ReturnType<typeof setTimeout> | null = null;

const setItemRef = (id: string, el: unknown) => {
  const element = (el as { $el?: HTMLElement } | HTMLElement | null);
  if (!element) {
    itemElements.delete(id);
    return;
  }
  itemElements.set(id, (element as { $el?: HTMLElement }).$el ?? (element as HTMLElement));
};

const activeItem = computed<Category | null>(() => {
  if (!activeItemId.value) return null;
  return props.items.find(item => String(item.id) === activeItemId.value) ?? null;
});

/** Direct children of the hovered item, resolved by category ID */
const activeItemChildren = computed<Category[]>(() => {
  if (!activeItem.value) return [];
  return megaMenu.getChildren(activeItem.value.id);
});

const childAncestorSlugs = computed<string[]>(() => {
  if (!activeItem.value) return [];
  return [...props.ancestorSlugs, activeItem.value.slug];
});

const mayHaveChildren = (item: Category): boolean => {
  if (item.has_children === true) return true;
  return megaMenu.getChildren(item.id).length > 0;
};

const clearHoverTimer = () => {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
};

const shouldFlyoutLeft = (el: HTMLElement): boolean => {
  if (typeof window === 'undefined') return false;
  const rect = el.getBoundingClientRect();
  const flyoutWidth = 240;
  const margin = 16;
  const spaceOnRight = window.innerWidth - rect.right - margin;
  const spaceOnLeft = rect.left - margin;
  return spaceOnRight < flyoutWidth && spaceOnLeft > spaceOnRight;
};

const updateMaxScrollHeight = () => {
  if (typeof window === 'undefined' || !outerCardRef.value) return;
  const available = window.innerHeight - outerCardRef.value.getBoundingClientRect().top - 16;
  if (available > 0) {
    maxScrollHeight.value = Math.max(120, Math.floor(available));
  }
};

const updateActiveItemTop = () => {
  if (!activeItemId.value || !outerCardRef.value) return;
  const itemEl = itemElements.get(activeItemId.value);
  if (!itemEl) return;

  const cardRect = outerCardRef.value.getBoundingClientRect();
  const itemRect = itemEl.getBoundingClientRect();

  if (itemRect.bottom < cardRect.top || itemRect.top > cardRect.bottom) {
    activeItemId.value = null;
    return;
  }
  activeItemTop.value = Math.max(0, itemRect.top - cardRect.top);
};

const handleItemEnter = async (item: Category, event?: MouseEvent | FocusEvent) => {
  clearHoverTimer();
  emit('keepOpen');

  const itemId = String(item.id);
  activeItemId.value = itemId;

  const target = event?.currentTarget;
  if (target instanceof HTMLElement) {
    flyoutLeftMap.value = { ...flyoutLeftMap.value, [itemId]: shouldFlyoutLeft(target) };
  }
  await nextTick();
  updateActiveItemTop();

  if (item.has_children === false) {
    return;
  }

  // Lazily load the next level using the hovered category ID as the parent identifier
  await megaMenu.ensureChildren(item.id);

  if (activeItemId.value === itemId) {
    await nextTick();
    updateActiveItemTop();
  }
};

const handleItemLeave = () => {
  clearHoverTimer();
  hoverTimer = setTimeout(() => {
    activeItemId.value = null;
    hoverTimer = null;
  }, 200);
};

const handlePanelEnter = () => {
  clearHoverTimer();
  emit('keepOpen');
};

const handlePanelLeave = () => {
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

const handleViewportChange = () => {
  updateMaxScrollHeight();
  updateActiveItemTop();
};

onMounted(() => {
  nextTick(updateMaxScrollHeight);
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleViewportChange, { passive: true });
    window.addEventListener('scroll', handleViewportChange, { passive: true });
  }
});

onUnmounted(() => {
  clearHoverTimer();
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleViewportChange);
    window.removeEventListener('scroll', handleViewportChange);
  }
});

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      nextTick(updateMaxScrollHeight);
    } else {
      clearHoverTimer();
      activeItemId.value = null;
    }
  }
);
</script>

<template>
  <div
    v-if="isOpen && items.length > 0"
    :class="cn(
      'absolute z-[100] origin-top pointer-events-auto',
      level === 1
        ? (alignRight ? 'top-full right-0 pt-1.5' : 'top-full left-0 pt-1.5')
        : (flyoutLeft ? 'right-full top-0 pr-1.5' : 'left-full top-0 pl-1.5')
    )"
    :style="customStyle"
    @mouseenter="handlePanelEnter"
    @mouseleave="handlePanelLeave"
  >
    <!-- Hover bridge so the pointer gap does not dismiss the panel -->
    <div v-if="level === 1" class="absolute -top-3 inset-x-0 h-3 pointer-events-auto"></div>
    <div
      v-else
      :class="cn('absolute inset-y-0 w-3 pointer-events-auto', flyoutLeft ? '-right-3' : '-left-3')"
    ></div>

    <div
      ref="outerCardRef"
      class="bg-card border border-border shadow-2xl rounded-xl text-card-foreground relative overflow-visible min-w-[200px] max-w-[260px]"
    >
      <div
        class="p-1.5 overflow-y-auto custom-submenu-scrollbar"
        :style="{ maxHeight: maxScrollHeight ? `${maxScrollHeight}px` : '420px' }"
        @scroll="handleViewportChange"
      >
        <ul class="space-y-0.5">
          <li
            v-for="item in items"
            :key="item.id"
            :ref="el => setItemRef(String(item.id), el)"
            class="relative group/item"
            @mouseenter="handleItemEnter(item, $event)"
            @mouseleave="handleItemLeave"
          >
            <NuxtLink
              :to="megaMenu.buildCategoryUrl(ancestorSlugs, item)"
              :class="cn(
                'flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                activeItemId === String(item.id)
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-foreground/85 hover:bg-muted/70 hover:text-foreground'
              )"
              @focus="handleItemEnter(item, $event)"
              @click="handleLinkClick"
            >
              <span class="truncate">{{ item.name }}</span>
              <ChevronRight
                v-if="mayHaveChildren(item)"
                :class="cn(
                  'w-3.5 h-3.5 transition-transform duration-150 shrink-0 ml-2',
                  megaMenu.isLoadingChildren(item.id)
                    ? 'animate-spin text-primary'
                    : (activeItemId === String(item.id)
                      ? 'text-primary translate-x-0.5'
                      : 'text-muted-foreground/60 group-hover/item:translate-x-0.5 group-hover/item:text-foreground')
                )"
              />
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Next level, rendered outside the scroll container so it is never clipped -->
      <HeaderCategorySubmenu
        v-if="activeItem && activeItemChildren.length > 0"
        :items="activeItemChildren"
        :ancestor-slugs="childAncestorSlugs"
        :level="level + 1"
        :is-open="true"
        :flyout-left="flyoutLeftMap[String(activeItem.id)] === true"
        :custom-style="{ top: `${activeItemTop}px` }"
        @keep-open="handlePanelEnter"
        @close="activeItemId = null"
      />
    </div>
  </div>
</template>
