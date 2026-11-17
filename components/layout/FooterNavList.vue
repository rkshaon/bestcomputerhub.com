<!-- File: /components/layout/FooterNavList.vue -->
<script setup lang="ts">
import { computed } from 'vue';

export interface FooterNavLinkItem {
  id: string | number;
  label: string;
  url: string | null;
  open_in_new_tab: boolean;
  children: FooterNavLinkItem[];
}

const props = withDefaults(defineProps<{
  items: FooterNavLinkItem[];
  depth?: number;
  alignClass?: 'text-left' | 'text-center' | 'text-right';
}>(), {
  depth: 0,
  alignClass: 'text-center'
});

const MAX_RENDER_DEPTH = 5;

const listClass = computed(() => {
  if (props.depth === 0) {
    return 'space-y-2.5 sm:space-y-3 px-0 mx-0 list-none';
  }
  if (props.alignClass === 'text-right') {
    return 'mt-1.5 space-y-1.5 pr-3 border-r border-header-border/60 list-none';
  }
  if (props.alignClass === 'text-left') {
    return 'mt-1.5 space-y-1.5 pl-3 border-l border-header-border/60 list-none';
  }
  return 'mt-1.5 space-y-1.5 px-0 mx-0 list-none opacity-90';
});

const itemTextClass = computed(() => {
  if (props.depth === 0) {
    return 'inline-block text-xs sm:text-sm text-header-muted-foreground transition-colors px-0 mx-0';
  }
  return 'inline-block text-[11px] sm:text-xs text-header-muted-foreground/85 transition-colors px-0 mx-0';
});

const getSafeUrl = (rawUrl: string | null | undefined): string | null => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === '#') return null;
  if (trimmed.startsWith('//')) return null;

  const collapsed = trimmed.replace(/[\u0000-\u0020]+/g, '').toLowerCase();
  const schemeMatch = collapsed.match(/^([a-z][a-z0-9+.-]*):/);
  if (schemeMatch && schemeMatch[1] && !['http', 'https', 'mailto', 'tel'].includes(schemeMatch[1])) {
    return null;
  }

  return trimmed;
};

const isExternalUrl = (url: string): boolean => {
  return /^(https?:|mailto:|tel:)/i.test(url);
};
</script>

<template>
  <ul :class="listClass">
    <li v-for="item in items" :key="item.id" class="px-0 mx-0">
      <template v-if="getSafeUrl(item.url)">
        <a
          v-if="isExternalUrl(getSafeUrl(item.url)!)"
          :href="getSafeUrl(item.url)!"
          :target="item.open_in_new_tab ? '_blank' : undefined"
          :rel="item.open_in_new_tab ? 'noopener noreferrer' : undefined"
          :class="[itemTextClass, 'hover:text-header-primary']"
        >
          {{ item.label }}
        </a>
        <NuxtLink
          v-else
          :to="getSafeUrl(item.url)!"
          :target="item.open_in_new_tab ? '_blank' : undefined"
          :rel="item.open_in_new_tab ? 'noopener noreferrer' : undefined"
          :class="[itemTextClass, 'hover:text-header-primary']"
        >
          {{ item.label }}
        </NuxtLink>
      </template>
      <span v-else :class="itemTextClass">
        {{ item.label }}
      </span>

      <FooterNavList
        v-if="depth < MAX_RENDER_DEPTH && item.children && item.children.length > 0"
        :items="item.children"
        :depth="depth + 1"
        :align-class="alignClass"
      />
    </li>
  </ul>
</template>
