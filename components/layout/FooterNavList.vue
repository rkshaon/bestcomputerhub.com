<!-- File: /components/layout/FooterNavList.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { resolveNavigationLink, resolveOriginFromUrl } from '@/utils/cms';

export interface FooterNavLinkItem {
  id: string | number;
  label: string;
  url: string | null;
  slug?: string | null;
  open_in_new_tab: boolean;
  children: FooterNavLinkItem[];
}

const props = withDefaults(defineProps<{
  items: FooterNavLinkItem[];
  depth?: number;
  alignClass?: 'text-left' | 'text-center' | 'text-right';
  currentOrigin?: string;
}>(), {
  depth: 0,
  alignClass: 'text-center'
});

const requestUrl = useRequestURL();
const runtimeConfig = useRuntimeConfig();
const siteConfig = useSiteConfig();

const resolvedCurrentOrigin = computed(() => {
  if (props.currentOrigin !== undefined) {
    return resolveOriginFromUrl(props.currentOrigin);
  }
  const fromRequest = resolveOriginFromUrl(requestUrl.origin);
  if (fromRequest) return fromRequest;
  const publicCfg = runtimeConfig.public as Record<string, any>;
  const fromAppUrl = resolveOriginFromUrl(publicCfg?.appUrl);
  if (fromAppUrl) return fromAppUrl;
  return resolveOriginFromUrl((siteConfig as Record<string, any>)?.url);
});

const MAX_RENDER_DEPTH = 5;

const listClass = computed(() => {
  if (props.depth === 0) {
    return 'space-y-0.5 lg:space-y-3 px-0 pr-14 sm:pr-0 mx-0 list-none';
  }
  if (props.alignClass === 'text-right') {
    return 'mt-1 lg:mt-1.5 space-y-0.5 lg:space-y-1.5 pl-3 lg:pl-0 lg:pr-3 border-l lg:border-l-0 lg:border-r border-header-border/60 list-none';
  }
  if (props.alignClass === 'text-left') {
    return 'mt-1 lg:mt-1.5 space-y-0.5 lg:space-y-1.5 pl-3 border-l border-header-border/60 list-none';
  }
  return 'mt-1 lg:mt-1.5 space-y-0.5 lg:space-y-1.5 pl-3 lg:pl-0 border-l lg:border-l-0 border-header-border/60 lg:opacity-90 list-none';
});

const linkClass = computed(() => {
  if (props.depth === 0) {
    return 'inline-flex items-center min-h-[40px] py-2 pr-2 lg:inline-block lg:min-h-0 lg:py-0 lg:pr-0 text-xs sm:text-sm text-header-foreground/90 lg:text-header-muted-foreground underline decoration-header-border/70 underline-offset-4 lg:no-underline hover:text-header-primary transition-colors px-0 mx-0';
  }
  return 'inline-flex items-center min-h-[40px] py-1.5 pr-2 lg:inline-block lg:min-h-0 lg:py-0 lg:pr-0 text-[11px] sm:text-xs text-header-foreground/85 lg:text-header-muted-foreground/85 underline decoration-header-border/60 underline-offset-4 lg:no-underline hover:text-header-primary transition-colors px-0 mx-0';
});

const staticTextClass = computed(() => {
  if (props.depth === 0) {
    return 'inline-flex items-center py-2 lg:inline-block lg:py-0 text-xs sm:text-sm text-header-muted-foreground/80 lg:text-header-muted-foreground cursor-default px-0 mx-0';
  }
  return 'inline-flex items-center py-1.5 lg:inline-block lg:py-0 text-[11px] sm:text-xs text-header-muted-foreground/75 lg:text-header-muted-foreground/85 cursor-default px-0 mx-0';
});

const getResolvedLink = (item: FooterNavLinkItem) => {
  return resolveNavigationLink(item, { currentOrigin: resolvedCurrentOrigin.value });
};
</script>

<template>
  <ul :class="listClass">
    <li v-for="item in items" :key="item.id" class="px-0 mx-0">
      <template v-if="getResolvedLink(item)">
        <a
          v-if="getResolvedLink(item)!.external"
          :href="getResolvedLink(item)!.href"
          :target="item.open_in_new_tab ? '_blank' : undefined"
          :rel="item.open_in_new_tab ? 'noopener noreferrer' : undefined"
          :class="linkClass"
        >
          {{ item.label }}
        </a>
        <NuxtLink
          v-else
          :to="getResolvedLink(item)!.href"
          :target="item.open_in_new_tab ? '_blank' : undefined"
          :rel="item.open_in_new_tab ? 'noopener noreferrer' : undefined"
          :class="linkClass"
        >
          {{ item.label }}
        </NuxtLink>
      </template>
      <span v-else :class="staticTextClass">
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
