<!-- File: /features/admin/categories/components/CategoryFormModal.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { X, AlertCircle, Loader2 } from 'lucide-vue-next';
import UiRichTextEditor from '@/components/ui/UiRichTextEditor.vue';
import { useCategoryService } from '@/composables/useCategoryService';
import { toastSuccess, toastError, extractErrorMessage } from '@/composables/useToast';
import type { Category } from '@/types';

interface Props {
  isOpen: boolean;
  mode: 'create' | 'edit';
  category?: Category | null;
  categories?: Category[];
  isResolving?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  category: null,
  categories: () => [],
  isResolving: false
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const categoryService = useCategoryService();

const isSubmitPending = ref(false);
const formError = ref<string | null>(null);
const categoryNameInput = ref<HTMLInputElement | null>(null);

const formPayload = ref({
  id: '' as string | number,
  name: '',
  slug: '',
  short_description_title: '',
  short_description: '',
  description: '',
  parentCategoryId: '' as string | number,
  icon: '',
  image: '',
  order: 0,
  show_in_menu: true
});

const originalCategoryDetails = ref<{
  name: string;
  slug: string;
  short_description_title: string;
  short_description: string;
  description: string;
  parentCategoryId: string | number;
  icon: string;
  image: string;
  order: number;
  show_in_menu: boolean;
} | null>(null);

const parentCategoryOptions = computed(() => {
  const list = props.categories || [];
  return list.filter(c => !c.parentCategoryId && (props.mode !== 'edit' || String(c.id) !== String(formPayload.value.id)));
});

const populateForm = () => {
  formError.value = null;
  if (props.mode === 'create') {
    formPayload.value = {
      id: '',
      name: '',
      slug: '',
      short_description_title: '',
      short_description: '',
      description: '',
      parentCategoryId: '',
      icon: '📁',
      image: '',
      order: 0,
      show_in_menu: true
    };
    originalCategoryDetails.value = null;
  } else if (props.mode === 'edit' && props.category) {
    const cat = props.category;
    formPayload.value = {
      id: cat.id,
      name: cat.name || '',
      slug: cat.slug || '',
      short_description_title: cat.short_description_title || '',
      short_description: cat.short_description || '',
      description: cat.description || '',
      parentCategoryId: cat.parentCategoryId || '',
      icon: cat.icon || '📁',
      image: cat.image || '',
      order: cat.order ?? 0,
      show_in_menu: cat.show_in_menu ?? true
    };
    originalCategoryDetails.value = {
      name: cat.name || '',
      slug: cat.slug || '',
      short_description_title: cat.short_description_title || '',
      short_description: cat.short_description || '',
      description: cat.description || '',
      parentCategoryId: cat.parentCategoryId || '',
      icon: cat.icon || '📁',
      image: cat.image || '',
      order: cat.order ?? 0,
      show_in_menu: cat.show_in_menu ?? true
    };
  }
};

watch(
  [() => props.isOpen, () => props.category, () => props.mode],
  ([isOpen]) => {
    if (isOpen) {
      populateForm();
      nextTick(() => {
        categoryNameInput.value?.focus();
      });
    }
  },
  { immediate: true }
);

const generateCustomSlug = () => {
  if (props.mode === 'create') {
    formPayload.value.slug = formPayload.value.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
};

const submitCreateCategory = async () => {
  formError.value = null;
  if (!formPayload.value.name.trim()) {
    formError.value = 'Category Name is a required designation.';
    return;
  }
  if (!formPayload.value.slug.trim()) {
    formError.value = 'Category Identifier Code (Slug) is required.';
    return;
  }

  isSubmitPending.value = true;
  try {
    await categoryService.createCategory({
      name: formPayload.value.name.trim(),
      slug: formPayload.value.slug.trim(),
      short_description_title: formPayload.value.short_description_title?.trim() || '',
      short_description: formPayload.value.short_description?.trim() || '',
      description: formPayload.value.description,
      parentCategoryId: formPayload.value.parentCategoryId ? String(formPayload.value.parentCategoryId) : undefined,
      icon: formPayload.value.icon || undefined,
      image: formPayload.value.image || undefined,
      order: Number(formPayload.value.order) || 0
    });

    toastSuccess(`Category [${formPayload.value.name}] generated successfully.`);
    emit('saved');
    emit('close');
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Operation failed on category create.');
    formError.value = msg;
    toastError(msg);
  } finally {
    isSubmitPending.value = false;
  }
};

const submitUpdateCategory = async () => {
  formError.value = null;
  if (!formPayload.value.name.trim()) {
    formError.value = 'Category Name is a required designation.';
    return;
  }
  if (!formPayload.value.slug.trim()) {
    formError.value = 'Category Identifier Code (Slug) is required.';
    return;
  }

  isSubmitPending.value = true;

  const payload: any = {};
  if (originalCategoryDetails.value) {
    const orig = originalCategoryDetails.value;

    const currentName = formPayload.value.name.trim();
    if (currentName !== orig.name.trim()) {
      payload.name = currentName;
    }

    const currentSlug = formPayload.value.slug.trim().toLowerCase();
    if (currentSlug !== orig.slug.trim().toLowerCase()) {
      payload.slug = currentSlug;
    }

    const currentShortDescTitle = (formPayload.value.short_description_title || '').trim();
    const origShortDescTitle = (orig.short_description_title || '').trim();
    if (currentShortDescTitle !== origShortDescTitle) {
      payload.short_description_title = currentShortDescTitle;
    }

    const currentShortDesc = (formPayload.value.short_description || '').trim();
    const origShortDesc = (orig.short_description || '').trim();
    if (currentShortDesc !== origShortDesc) {
      payload.short_description = currentShortDesc;
    }

    const currentDesc = formPayload.value.description;
    if (currentDesc !== orig.description) {
      payload.description = currentDesc;
    }

    const currentParent = formPayload.value.parentCategoryId ? String(formPayload.value.parentCategoryId) : '';
    const origParent = orig.parentCategoryId ? String(orig.parentCategoryId) : '';
    if (currentParent !== origParent) {
      payload.parentCategoryId = currentParent || '';
    }

    const currentIcon = formPayload.value.icon || '';
    const origIcon = orig.icon || '';
    if (currentIcon !== origIcon) {
      payload.icon = currentIcon || '';
    }

    const currentImage = formPayload.value.image || '';
    const origImage = orig.image || '';
    if (currentImage !== origImage) {
      payload.image = currentImage || '';
    }

    const currentOrder = Number(formPayload.value.order) || 0;
    const origOrder = Number(orig.order) || 0;
    if (currentOrder !== origOrder) {
      payload.order = currentOrder;
    }

    const currentShow = formPayload.value.show_in_menu !== undefined ? Boolean(formPayload.value.show_in_menu) : true;
    const origShow = orig.show_in_menu !== undefined ? Boolean(orig.show_in_menu) : true;
    if (currentShow !== origShow) {
      payload.show_in_menu = currentShow;
    }
  } else {
    payload.name = formPayload.value.name.trim();
    payload.slug = formPayload.value.slug.trim();
    payload.short_description_title = (formPayload.value.short_description_title || '').trim();
    payload.short_description = (formPayload.value.short_description || '').trim();
    payload.description = formPayload.value.description;
    payload.parentCategoryId = formPayload.value.parentCategoryId ? String(formPayload.value.parentCategoryId) : undefined;
    payload.icon = formPayload.value.icon || undefined;
    payload.image = formPayload.value.image || undefined;
    payload.order = Number(formPayload.value.order) || 0;
    payload.show_in_menu = formPayload.value.show_in_menu;
  }

  if (Object.keys(payload).length === 0) {
    toastSuccess(`Category [${formPayload.value.name}] updated successfully.`);
    emit('saved');
    emit('close');
    isSubmitPending.value = false;
    return;
  }

  try {
    await categoryService.updateCategory(String(formPayload.value.id), payload);

    toastSuccess(`Category [${formPayload.value.name}] updated successfully.`);
    emit('saved');
    emit('close');
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Operation failed on category edit.');
    formError.value = msg;
    toastError(msg);
  } finally {
    isSubmitPending.value = false;
  }
};

const handleFormSubmit = () => {
  if (props.mode === 'create') {
    submitCreateCategory();
  } else {
    submitUpdateCategory();
  }
};
</script>

<template>
  <div v-if="isOpen" @click.self="emit('close')" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer">
    <form @submit.prevent="handleFormSubmit" class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col animate-in scale-in duration-300 cursor-default">
      
      <!-- Loading overlay inside edit modal -->
      <div v-if="mode === 'edit' && isResolving" class="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm z-40 flex items-center justify-center">
        <div class="flex flex-col items-center justify-center gap-3">
          <Loader2 class="w-8 h-8 animate-spin text-primary" />
          <p class="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Loading classification specs...</p>
        </div>
      </div>

      <div class="p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
        <div>
          <span v-if="mode === 'create'" class="text-[10px] uppercase font-bold tracking-[0.2em] text-primary">Administration Node Generator</span>
          <span v-else class="text-[10px] uppercase font-bold tracking-[0.2em] text-amber-500">Authorized Admin Override</span>
          <h3 class="text-2xl font-display font-black tracking-tight mt-0.5">
            {{ mode === 'create' ? 'Define New Category' : 'Modify Class Properties' }}
          </h3>
        </div>
        <button type="button" @click="emit('close')" aria-label="Close modal" class="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
        <div v-if="formError" class="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 flex items-start gap-3 rounded-2xl text-rose-600 dark:text-rose-400">
          <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
          <p class="text-xs font-semibold leading-relaxed">{{ formError }}</p>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Classification Name</label>
            <input 
              ref="categoryNameInput"
              v-model="formPayload.name" 
              @input="generateCustomSlug"
              type="text" 
              placeholder="e.g. Deep Learning Nodes" 
              class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50"
            />
          </div>

          <div class="space-y-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Identity Code label (Slug)</label>
            <input 
              v-model="formPayload.slug" 
              type="text" 
              placeholder="e.g. deep-learning-nodes" 
              class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-semibold text-slate-950 dark:text-slate-50 font-mono"
            />
            <p v-if="mode === 'create'" class="text-[10px] text-slate-400 ml-1">Unique alphanumeric label for router paths.</p>
            <p v-else class="text-[10px] text-slate-400 ml-1 font-medium">Caution: Modifying identity paths can override mapped products categorization.</p>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">
              {{ mode === 'create' ? 'Parent Category' : 'Parent Category Mapping' }}
            </label>
            <select 
              v-model="formPayload.parentCategoryId"
              class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-semibold text-slate-950 dark:text-slate-50 cursor-pointer"
            >
              <option value="">None (Top-Level Category Grouping)</option>
              <option v-for="catOption in parentCategoryOptions" :key="catOption.id" :value="catOption.id">
                Nested under: {{ catOption.name }}
              </option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Display Order Priority (Order)</label>
            <input 
              v-model="formPayload.order" 
              type="number" 
              placeholder="e.g. 10" 
              class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50"
            />
            <p class="text-[10px] text-slate-400 ml-1">Sort order priority index (lower values sort higher/first).</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Visual Symbol (Icon Emoji)</label>
              <input 
                v-model="formPayload.icon" 
                type="text" 
                placeholder="e.g. 📁, 💻, 🧠" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50 text-center"
              />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1 font-sans">
                {{ mode === 'create' ? 'Image representation URL' : 'Image Representation URL' }}
              </label>
              <input 
                v-model="formPayload.image" 
                type="text" 
                placeholder="https://images.unsplash.com/..." 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Short Description Title</label>
            <input 
              v-model="formPayload.short_description_title" 
              type="text" 
              placeholder="e.g. Featured Nodes" 
              class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50 animate-none"
              :disabled="isSubmitPending"
            />
            <p class="text-[10px] text-slate-400 ml-1">Optional title displayed above the short description on storefront listing banners.</p>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Short Description</label>
            <textarea 
              v-model="formPayload.short_description" 
              rows="3"
              placeholder="Brief introductory summary or excerpt for category listings and headers..."
              class="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-medium text-slate-950 dark:text-slate-50 placeholder:text-slate-400 resize-y"
              :disabled="isSubmitPending"
            ></textarea>
            <p class="text-[10px] text-slate-400 ml-1">Optional concise summary displayed on storefront header banners and category listings.</p>
          </div>

          <div class="space-y-2">
            <UiRichTextEditor
              v-model="formPayload.description"
              label="Operational Description / Memo"
              placeholder="Enterprise utility scope and catalog organization guidelines..."
              min-height="min-h-[140px]"
              :disabled="isSubmitPending"
              helper-text="Full category details with headings, bullet points, formatting, and paragraphs."
            />
          </div>
        </div>
      </div>

      <div class="p-8 border-t border-slate-100 dark:border-slate-900 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <button 
          type="button"
          @click="emit('close')" 
          class="px-5 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          :disabled="isSubmitPending"
          class="bg-primary text-primary-foreground hover:bg-primary/95 px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          <span v-if="isSubmitPending" class="animate-spin border-2 border-white/35 border-t-white rounded-full w-4 h-4 mr-1"></span>
          <template v-if="mode === 'create'">
            {{ isSubmitPending ? 'Compiling Record...' : 'Publish Taxonomy Node' }}
          </template>
          <template v-else>
            {{ isSubmitPending ? 'Applying Overrides...' : 'Apply Taxonomy Correction' }}
          </template>
        </button>
      </div>
    </form>
  </div>
</template>
