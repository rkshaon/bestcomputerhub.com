<template>
  <UiAdminModal
    :is-open="isOpen"
    title="Run New Content Scan"
    :subtitle="subtitle"
    max-width="max-w-lg"
    @close="$emit('close')"
  >
    <div class="p-6 space-y-5">
      <!-- Scan Mode Selector -->
      <div class="space-y-1.5">
        <label class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scan Mode</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            @click="scanMode = 'specific'"
            :class="cn(
              'p-3 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center',
              scanMode === 'specific'
                ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-bold'
                : 'border-input bg-card hover:bg-muted/50 text-muted-foreground'
            )"
          >
            <FileText class="w-4 h-4" />
            <span class="text-xs font-semibold">Specific Item</span>
          </button>

          <button
            type="button"
            @click="scanMode = 'content_type'"
            :class="cn(
              'p-3 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center',
              scanMode === 'content_type'
                ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-bold'
                : 'border-input bg-card hover:bg-muted/50 text-muted-foreground'
            )"
          >
            <Layers class="w-4 h-4" />
            <span class="text-xs font-semibold">Entire Type</span>
          </button>

          <button
            type="button"
            @click="scanMode = 'everything'"
            :class="cn(
              'p-3 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center',
              scanMode === 'everything'
                ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-bold'
                : 'border-input bg-card hover:bg-muted/50 text-muted-foreground'
            )"
          >
            <Globe2 class="w-4 h-4" />
            <span class="text-xs font-semibold">Everything</span>
          </button>
        </div>
      </div>

      <!-- Mode 1: Specific Item Inputs -->
      <template v-if="scanMode === 'specific'">
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-muted-foreground uppercase">Target Item</label>
            <span v-if="isScanObjectsLoading" class="text-[11px] text-muted-foreground flex items-center gap-1">
              <Loader2 class="w-3 h-3 animate-spin" /> Searching...
            </span>
          </div>

          <div class="relative">
            <Search class="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
            <input
              v-model="scanObjectSearchQuery"
              type="text"
              class="w-full h-9 pl-8 pr-3 rounded-md border border-input text-xs bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              placeholder="Search products, categories, brands, or posts..."
            />
          </div>

          <div class="border border-input rounded-lg overflow-hidden bg-background relative flex flex-col">
            <div v-if="isScanObjectsLoading && availableScanObjects.length === 0" class="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 class="w-4 h-4 animate-spin" /> Searching...
            </div>
            <div v-else-if="availableScanObjects.length === 0" class="p-4 text-center text-xs text-muted-foreground">
              No items found. Try a different search term.
            </div>
            <ul v-else class="max-h-48 overflow-y-auto">
              <li
                v-for="obj in availableScanObjects"
                :key="`${obj.type}-${obj.id}`"
                @click="selectedScanObjectId = obj.id; selectedScanContentType = obj.type"
                :class="cn(
                  'px-3 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0',
                  String(selectedScanObjectId) === String(obj.id) && selectedScanContentType === obj.type ? 'bg-primary/5 border-l-2 border-l-primary text-primary' : 'border-l-2 border-l-transparent'
                )"
              >
                <div class="flex flex-col gap-0.5 max-w-[70%]">
                  <span class="font-medium truncate">{{ obj.label }}</span>
                  <span class="text-[10px] text-muted-foreground truncate">{{ obj.sublabel }}</span>
                </div>
                <UiBadge variant="secondary" class="text-[10px] whitespace-nowrap">{{ obj.typeLabel }}</UiBadge>
              </li>
            </ul>
          </div>
          <p v-if="selectedScanObjectId" class="text-[11px] text-muted-foreground font-mono">
            Selected: <strong class="text-foreground">{{ selectedScanContentType }} #{{ selectedScanObjectId }}</strong>
          </p>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-bold text-muted-foreground uppercase">Fields to Scan (Optional)</label>
          <input
            v-model="scanFieldsInput"
            type="text"
            class="w-full h-9 px-3 rounded-lg border border-input text-xs bg-background"
            placeholder="e.g., title, description"
          />
          <p class="text-[11px] text-muted-foreground">Leave empty to scan all default fields for this entity.</p>
        </div>
      </template>

      <!-- Mode 2: Entire Content Type Inputs -->
      <template v-else-if="scanMode === 'content_type'">
        <div class="space-y-1">
          <label class="text-xs font-bold text-muted-foreground uppercase">Content Type</label>
          <select
            v-model="selectedScanContentType"
            class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
          >
            <option v-for="type in supportedContentTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>

        <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
          <Info class="w-4 h-4 shrink-0 mt-0.5" />
          <span>Targeting all items of content type <strong>{{ selectedScanContentType }}</strong> across the store catalog.</span>
        </div>
      </template>

      <!-- Mode 3: Everything Inputs -->
      <template v-else-if="scanMode === 'everything'">
        <div class="bg-primary/5 border border-primary/15 rounded-xl p-4 space-y-2 text-xs">
          <div class="flex items-center gap-2 font-bold text-primary">
            <Globe2 class="w-4 h-4" />
            <span>Full System Content Security Inspection</span>
          </div>
          <p class="text-muted-foreground leading-relaxed">
            Targeting all supported content types across the system.
          </p>
        </div>
      </template>

      <!-- Actions -->
      <div class="pt-4 flex gap-3">
        <UiButton 
          variant="outline" 
          class="flex-1" 
          @click="$emit('close')"
        >
          Cancel
        </UiButton>
        <UiButton 
          class="flex-1" 
          :disabled="isSubmitting" 
          @click="submit"
        >
          {{ isSubmitting ? 'Initiating Scan...' : 'Run Content Scan' }}
        </UiButton>
      </div>
    </div>
  </UiAdminModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { refDebounced } from '@vueuse/core';
import { FileText, Layers, Globe2, Search, Loader2, Info } from 'lucide-vue-next';
import { cn } from '@/utils';
import { useProductService } from '@/composables/useProductService';
import { useCategoryService } from '@/composables/useCategoryService';
import { useBrandService } from '@/composables/useBrandService';
import { useBlogService } from '@/composables/useBlogService';
import { useContentSecurityService } from '@/composables/useContentSecurityService';
import { useToast } from '@/composables/useToast';
import type { ContentScanRunRequest } from '@/types';

interface Props {
  isOpen: boolean;
}

defineProps<Props>();
const emit = defineEmits(['close', 'completed']);

export type ScanMode = 'specific' | 'content_type' | 'everything';

const scanMode = ref<ScanMode>('specific');
const selectedScanContentType = ref<string>('Product');
const selectedScanObjectId = ref<string | number>('');
const scanFieldsInput = ref<string>('');

const availableScanObjects = ref<Array<{ id: string | number; label: string; sublabel?: string; type: string; typeLabel: string }>>([]);
const isScanObjectsLoading = ref(false);
const scanObjectSearchQuery = ref('');
const debouncedScanObjectQuery = refDebounced(scanObjectSearchQuery, 300);

const isSubmitting = ref(false);

const contentSecurityService = useContentSecurityService();
const { toastSuccess, toastError } = useToast();

const scanProductService = useProductService();
const scanCategoryService = useCategoryService();
const scanBrandService = useBrandService();
const scanBlogService = useBlogService();

const supportedContentTypes = computed(() => [
  { value: 'Product', label: 'Products' },
  { value: 'Category', label: 'Categories' },
  { value: 'Brand', label: 'Brands' },
  { value: 'Blog', label: 'Blog Posts' }
]);

const subtitle = computed(() => {
  switch (scanMode.value) {
    case 'specific': return 'Configure scan parameters for a specific content object';
    case 'content_type': return 'Configure scan parameters for an entire content type';
    case 'everything': return 'Configure system-wide scan across all content types';
    default: return '';
  }
});

const fetchAvailableScanObjects = async () => {
  if (scanMode.value !== 'specific') return;
  isScanObjectsLoading.value = true;
  
  try {
    const query = debouncedScanObjectQuery.value.trim();
    let list: Array<{ id: string | number; label: string; sublabel?: string; type: string; typeLabel: string }> = [];

    const [productsRes, categoriesRes, brandsRes, blogsRes] = await Promise.allSettled([
      scanProductService.getProductsList({ search: query, page_size: 10 }),
      scanCategoryService.getCategoriesList({ search: query, page_size: 10 }),
      scanBrandService.getBrandsList({ search: query }),
      scanBlogService.getPosts({ query })
    ]);

    if (productsRes.status === 'fulfilled') {
      list.push(...(productsRes.value.results || []).map(p => ({
        id: p.id,
        label: p.name || (p as any).title || `Product #${p.id}`,
        sublabel: p.slug ? `slug: ${p.slug}` : `ID: ${p.id}`,
        type: 'Product',
        typeLabel: 'Product'
      })));
    }
    
    if (categoriesRes.status === 'fulfilled') {
      list.push(...(categoriesRes.value.results || []).map(c => ({
        id: c.id,
        label: c.name || `Category #${c.id}`,
        sublabel: c.slug ? `slug: ${c.slug}` : `ID: ${c.id}`,
        type: 'Category',
        typeLabel: 'Category'
      })));
    }

    if (brandsRes.status === 'fulfilled') {
      const bData = (brandsRes.value as any).value || brandsRes.value || [];
      const brandList = Array.isArray(bData) ? bData : (bData.results || []);
      list.push(...brandList.map((b: any) => ({
        id: b.id,
        label: b.name || `Brand #${b.id}`,
        sublabel: b.slug ? `slug: ${b.slug}` : `ID: ${b.id}`,
        type: 'Brand',
        typeLabel: 'Brand'
      })));
    }

    if (blogsRes.status === 'fulfilled') {
      const pData = (blogsRes.value as any).value || blogsRes.value || [];
      const postList = Array.isArray(pData) ? pData : (pData.results || []);
      list.push(...postList.map((p: any) => ({
        id: p.id,
        label: p.title || `Post #${p.id}`,
        sublabel: p.slug ? `slug: ${p.slug}` : `ID: ${p.id}`,
        type: 'Blog',
        typeLabel: 'Blog Post'
      })));
    }

    availableScanObjects.value = list;
  } catch (err) {
    console.error('Failed to fetch scannable objects:', err);
    availableScanObjects.value = [];
  } finally {
    isScanObjectsLoading.value = false;
  }
};

watch([debouncedScanObjectQuery, scanMode], ([newQuery, newMode]) => {
  if (newMode === 'specific') {
    fetchAvailableScanObjects();
  }
});

const submit = async () => {
  if (isSubmitting.value) return;

  let payload: ContentScanRunRequest;

  if (scanMode.value === 'specific') {
    if (!selectedScanContentType.value || selectedScanObjectId.value === '' || selectedScanObjectId.value === null || selectedScanObjectId.value === undefined) {
      toastError('Please select a valid content type and target object to scan.');
      return;
    }

    payload = {
      scan_type: 'OBJECT',
      content_type: selectedScanContentType.value.trim().toUpperCase(),
      object_id: Number(selectedScanObjectId.value) || selectedScanObjectId.value
    };

    if (scanFieldsInput.value.trim()) {
      const fields = scanFieldsInput.value
        .split(',')
        .map((f: string) => f.trim())
        .filter((f: string) => f !== '');
      if (fields.length > 0) {
        payload.field_names = fields;
      }
    }
  } else if (scanMode.value === 'content_type') {
    if (!selectedScanContentType.value) {
      toastError('Please select a content type to scan.');
      return;
    }

    payload = {
      scan_type: 'CONTENT_TYPE',
      content_type: selectedScanContentType.value.trim().toUpperCase()
    };
  } else if (scanMode.value === 'everything') {
    payload = {
      scan_type: 'ALL'
    };
  } else {
    return;
  }

  isSubmitting.value = true;

  try {
    await contentSecurityService.runContentScan(payload);
    const successMsg = scanMode.value === 'everything'
      ? 'System-wide content security scan completed successfully.'
      : scanMode.value === 'content_type'
        ? `Content security scan for ${selectedScanContentType.value} completed successfully.`
        : 'Content security scan completed successfully.';
    toastSuccess(successMsg);
    emit('completed');
    emit('close');
  } catch (err: any) {
    toastError(err.message || 'Failed to run content scan.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>
