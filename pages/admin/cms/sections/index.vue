<!-- File: /pages/admin/cms/sections/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { 
  Layers, 
  Plus, 
  RefreshCw, 
  Edit2, 
  Trash2, 
  AlertCircle,
  FileText,
  Loader2
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useCmsService } from '@/composables/useCmsService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { toastSuccess, toastError, extractErrorMessage } from '@/composables/useToast';
import type { GlobalSection, SectionTypeKey } from '@/types/cms';
import type { UiTableColumn } from '@/components/ui/UiTable.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiButton from '@/components/ui/Button.vue';
import UiCard from '@/components/ui/UiCard.vue';

definePageMeta({
  layout: false
});

const route = useRoute();
const router = useRouter();
const cmsService = useCmsService();
const { canViewModule, canCreateInModule, canEditInModule, canDeleteInModule } = useAdminPermissions();

const canView = computed(() => canViewModule('/admin/cms/sections'));
const canCreate = computed(() => canCreateInModule('/admin/cms/sections'));
const canEdit = computed(() => canEditInModule('/admin/cms/sections'));
const canDelete = computed(() => canDeleteInModule('/admin/cms/sections'));

const sectionsList = ref<GlobalSection[]>([]);
const totalCount = ref(0);
const totalPages = ref(1);
const isLoading = ref(false);
const fetchError = ref<string | null>(null);
const isDeleting = ref(false);
const isSubmitting = ref(false);
const formError = ref<string | null>(null);

const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

const newSectionForm = ref({
  name: '',
  code: '',
  section_type: 'hero_banner' as SectionTypeKey,
  contentJson: '{\n  "heading": "Welcome",\n  "subtitle": "Discover our new collection"\n}',
  is_active: true
});

const modalState = useAdminModalState<GlobalSection>({
  getItems: async (id) => {
    const res = await cmsService.getGlobalSections({ page_size: 100 });
    const found = (res.results || []).find(s => String(s.id) === String(id));
    if (!found) throw new Error('Section not found');
    return found;
  },
  onResolveError: (id) => {
    toastError(`Global Section #${id} could not be retrieved.`);
    modalState.closeModal({ replace: true });
  }
});

const selectedSection = computed(() => modalState.activeEntity.value);

const fetchSections = async () => {
  isLoading.value = true;
  fetchError.value = null;
  try {
    const res = await cmsService.getGlobalSections({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: debouncedSearchQuery.value || undefined
    });
    sectionsList.value = res.results || [];
    totalCount.value = res.count || 0;
    totalPages.value = res.pages || Math.ceil(totalCount.value / itemsPerPage.value) || 1;
  } catch (err: any) {
    fetchError.value = extractErrorMessage(err, 'Failed to retrieve global sections.');
  } finally {
    isLoading.value = false;
  }
};

const updateRouteAndFetch = () => {
  const query: Record<string, string | number | undefined> = {
    ...route.query,
    page: currentPage.value > 1 ? currentPage.value : undefined,
    pageSize: itemsPerPage.value !== 10 ? itemsPerPage.value : undefined,
    search: searchQuery.value.trim() || undefined
  };
  Object.keys(query).forEach((key) => {
    if (query[key] === undefined) delete query[key];
  });
  router.push({ query });
  fetchSections();
};

watch(debouncedSearchQuery, () => {
  currentPage.value = 1;
  updateRouteAndFetch();
});

watch(currentPage, () => {
  updateRouteAndFetch();
});

watch(() => modalState.isCreate.value, (isCr) => {
  if (isCr) {
    newSectionForm.value = {
      name: '',
      code: '',
      section_type: 'hero_banner',
      contentJson: '{\n  "heading": "Welcome"\n}',
      is_active: true
    };
    formError.value = null;
  }
});

const handleCreateSection = async () => {
  if (!newSectionForm.value.name.trim() || !newSectionForm.value.code.trim()) {
    formError.value = 'Name and code are required fields.';
    return;
  }

  let parsedContent: Record<string, any> = {};
  try {
    parsedContent = JSON.parse(newSectionForm.value.contentJson || '{}');
  } catch {
    formError.value = 'Invalid JSON format in content payload.';
    return;
  }

  if (!canCreate.value) {
    toastError('You do not have permission to create global sections.');
    return;
  }

  isSubmitting.value = true;
  formError.value = null;

  try {
    await cmsService.createGlobalSection({
      name: newSectionForm.value.name,
      code: newSectionForm.value.code,
      section_type: newSectionForm.value.section_type,
      content: parsedContent,
      is_active: newSectionForm.value.is_active
    });
    toastSuccess(`Global Section "${newSectionForm.value.name}" successfully created.`);
    modalState.closeModal();
    await fetchSections();
  } catch (err: any) {
    formError.value = extractErrorMessage(err, 'Failed to create global section.');
    toastError(formError.value);
  } finally {
    isSubmitting.value = false;
  }
};

const handleDeleteSection = async () => {
  const sec = selectedSection.value;
  if (!sec) return;
  if (!canDelete.value) {
    toastError('You do not have permission to delete global sections.');
    return;
  }
  isDeleting.value = true;
  try {
    await cmsService.deleteGlobalSection(sec.id);
    toastSuccess(`Global Section "${sec.name}" deleted.`);
    await modalState.closeModal();
    if (sectionsList.value.length === 1 && currentPage.value > 1) currentPage.value--;
    await fetchSections();
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to delete global section.'));
  } finally {
    isDeleting.value = false;
  }
};

const tableColumns = computed<UiTableColumn<GlobalSection>[]>(() => [
  { key: 'name', label: 'Section Name & Code', width: '300px' },
  { key: 'section_type', label: 'Type', width: '180px' },
  { key: 'updated_at', label: 'Last Updated', width: '180px' },
  { key: 'actions', label: 'Actions', width: '120px', align: 'right' }
]);

onMounted(async () => {
  if (canView.value) await fetchSections();
});
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          Global Sections
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex items-center gap-2">
        <UiButton variant="outline" class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs" @click="fetchSections" :disabled="isLoading">
          <RefreshCw :class="['w-3.5 h-3.5', isLoading && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>
        <UiButton v-if="canCreate" class="rounded-xl h-9 px-3.5 gap-1.5 shadow-md shadow-primary/10 bg-primary text-primary-foreground font-bold text-xs" @click="modalState.openCreate()">
          <Plus class="w-3.5 h-3.5" />
          <span>New Section</span>
        </UiButton>
      </div>
    </template>

    <div v-if="!canView" class="p-8 text-center bg-card border border-border rounded-2xl shadow-xs">
      <AlertCircle class="w-12 h-12 text-destructive mx-auto mb-3" />
      <h2 class="text-lg font-bold text-foreground mb-1">Access Restricted</h2>
      <p class="text-sm text-muted-foreground">You do not have permission to view Global Sections.</p>
    </div>

    <div v-else class="space-y-4 animate-in fade-in duration-500">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <UiSearchInput v-model="searchQuery" placeholder="Search global sections by name..." class="w-full sm:w-80" />
      </div>

      <div v-if="fetchError" class="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between text-destructive">
        <div class="flex items-center gap-3">
          <AlertCircle class="w-5 h-5 shrink-0" />
          <span class="text-xs font-medium">{{ fetchError }}</span>
        </div>
        <UiButton variant="outline" size="sm" class="h-8 text-xs border-destructive/30" @click="fetchSections">Retry</UiButton>
      </div>

      <div class="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <UiTable :columns="tableColumns" :data="sectionsList" :loading="isLoading" key-field="id" empty-text="No global sections found">
          <template #cell-name="{ item }">
            <div class="space-y-1 py-1">
              <p class="font-bold text-xs text-foreground">{{ item.name }}</p>
              <span class="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{{ item.code }}</span>
            </div>
          </template>
          <template #cell-section_type="{ item }">
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
              {{ item.section_type }}
            </span>
          </template>
          <template #cell-updated_at="{ item }">
            <span class="text-xs text-muted-foreground font-mono">{{ item.updated_at ? new Date(item.updated_at).toLocaleString() : '—' }}</span>
          </template>
          <template #cell-actions="{ item }">
            <div class="flex items-center justify-end gap-1">
              <UiButton v-if="canEdit" variant="ghost" size="sm" class="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg" title="Edit" @click="toastSuccess(`Editing ${item.name}`)">
                <Edit2 class="w-3.5 h-3.5" />
              </UiButton>
              <UiButton v-if="canDelete" variant="ghost" size="sm" class="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg" title="Delete" @click="modalState.openDelete(item.id)">
                <Trash2 class="w-3.5 h-3.5" />
              </UiButton>
            </div>
          </template>
        </UiTable>
        <div v-if="totalCount > 0" class="border-t border-border px-3.5 py-2 bg-card">
          <UiPagination v-model:current-page="currentPage" :total-pages="totalPages" :total-count="totalCount" :items-per-page="itemsPerPage" item-label="sections" />
        </div>
      </div>
    </div>

    <!-- Create Section Modal -->
    <UiAdminModal
      :is-open="modalState.isCreate.value"
      title="Create New Global Section"
      subtitle="Define section properties and default content schema."
      @close="modalState.closeModal()"
    >
      <div class="p-6 space-y-4">
        <div v-if="formError" class="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ formError }}</span>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Section Name *</label>
          <input 
            v-model="newSectionForm.name" 
            type="text" 
            placeholder="e.g. Homepage Hero" 
            class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Section Code *</label>
          <input 
            v-model="newSectionForm.code" 
            type="text" 
            placeholder="e.g. homepage_hero" 
            class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Section Type</label>
          <select 
            v-model="newSectionForm.section_type" 
            class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="hero_banner">Hero Banner</option>
            <option value="rich_text">Rich Text</option>
            <option value="product_collection">Product Collection</option>
            <option value="faq">FAQ</option>
            <option value="image_gallery">Image Gallery</option>
            <option value="cta">CTA</option>
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Content (JSON)</label>
          <textarea 
            v-model="newSectionForm.contentJson" 
            rows="5" 
            class="w-full p-3 rounded-xl border border-input bg-background font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          ></textarea>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <input id="section_active" v-model="newSectionForm.is_active" type="checkbox" class="rounded border-input text-primary focus:ring-primary/20 w-4 h-4" />
          <label for="section_active" class="text-xs font-semibold text-foreground select-none cursor-pointer">Active Section</label>
        </div>

        <div class="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <UiButton variant="outline" class="h-10 px-4 text-xs font-semibold rounded-xl" @click="modalState.closeModal()" :disabled="isSubmitting">Cancel</UiButton>
          <UiButton class="h-10 px-4 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-sm" @click="handleCreateSection" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin mr-1.5" />
            <span>Create Section</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>

    <!-- Delete Confirmation Modal -->
    <UiAdminModal :is-open="modalState.isDelete.value" title="Delete Global Section" subtitle="Are you sure you want to delete this global section?" @close="modalState.closeModal()">
      <div v-if="selectedSection" class="space-y-4 p-6">
        <div class="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
          <Layers class="w-6 h-6 text-destructive shrink-0" />
          <div>
            <p class="font-bold text-sm text-foreground">{{ selectedSection.name }}</p>
            <p class="text-xs text-muted-foreground font-mono">{{ selectedSection.code }}</p>
          </div>
        </div>
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <UiButton variant="outline" class="h-9 px-4 text-xs font-semibold rounded-xl" @click="modalState.closeModal()" :disabled="isDeleting">Cancel</UiButton>
          <UiButton variant="destructive" class="h-9 px-4 text-xs font-semibold rounded-xl" @click="handleDeleteSection" :disabled="isDeleting">Confirm Delete</UiButton>
        </div>
      </div>
    </UiAdminModal>
  </NuxtLayout>
</template>
