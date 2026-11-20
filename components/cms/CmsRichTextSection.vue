<!-- File: /components/cms/CmsRichTextSection.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useRuntimeConfig } from '#app';
import { sanitizeCmsHtml, resolveOriginFromUrl } from '@/utils/cms';

interface Props {
  body?: string | null;
  alignment?: 'left' | 'center' | 'right' | string | null;
}

const props = withDefaults(defineProps<Props>(), {
  body: '',
  alignment: 'left'
});

const runtimeConfig = useRuntimeConfig();
const mediaOrigin = computed(() => {
  const publicCfg = runtimeConfig.public as Record<string, any>;
  return resolveOriginFromUrl(publicCfg?.mediaBase || publicCfg?.apiBase);
});

const sanitizedContent = computed(() =>
  sanitizeCmsHtml(props.body, { mediaOrigin: mediaOrigin.value })
);

const alignmentClass = computed(() => {
  const align = String(props.alignment || '').toLowerCase();
  switch (align) {
    case 'center':
      return 'text-center mx-auto';
    case 'right':
      return 'text-right ml-auto';
    case 'left':
    default:
      return 'text-left mr-auto';
  }
});
</script>

<template>
  <section v-if="sanitizedContent" class="cms-rich-text-section w-full py-4 sm:py-6">
    <div
      :class="[
        'cms-prose max-w-none transition-colors duration-200',
        alignmentClass
      ]"
      v-html="sanitizedContent"
    />
  </section>
</template>
