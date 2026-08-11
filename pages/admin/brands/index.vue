<!-- File: /pages/admin/brands/index.vue -->
<script setup lang="ts">
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  ChevronRight,
  ChevronLeft,
  Globe,
  Award,
  ShieldCheck,
  Zap,
  Tag,
  X,
  Check,
  AlertCircle,
  Clock,
  RotateCcw,
  Flag,
  RefreshCw
} from 'lucide-vue-next';
import { useBrandService } from '@/composables/useBrandService';
import { cn } from '@/utils';
import type { Brand } from '@/types';
import { toastSuccess, toastError, toastInfo, extractErrorMessage } from '@/composables/useToast';
import Button from '@/components/ui/Button.vue';

definePageMeta({
  layout: 'admin'
});

const brandService = useBrandService();

const route = useRoute();
const router = useRouter();

// State vectors initialized from URL query parameters
const brandsList = ref<Brand[]>([]);
const isLoading = ref(false);
const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const statusFilter = ref<'all' | 'active' | 'inactive'>((route.query.status as 'all' | 'active' | 'inactive') || 'all');
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 5 : 5);
const selectedBrand = ref<Brand | null>(null);

// Overlay controls
const isCreateModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isViewModalOpen = ref(false);
const isSubmitPending = ref(false);

// Focus input references
const partnerNameInput = ref<HTMLInputElement | null>(null);
const editPartnerNameInput = ref<HTMLInputElement | null>(null);

watch(isCreateModalOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
      partnerNameInput.value?.focus();
    });
  }
});

watch(isEditModalOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
      editPartnerNameInput.value?.focus();
    });
  }
});

// Form payload states
const formError = ref<string | null>(null);
const formPayload = ref({
  id: '',
  name: '',
  slug: '',
  description: '',
  is_active: true,
  display_order: 1
});

// Toast notification broker using global vue-sonner
const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  if (type === 'success') {
    toastSuccess(message);
  } else if (type === 'error') {
    toastError(message);
  } else {
    toastInfo(message);
  }
};

// Data integration lifecycles
const fetchRegistry = async () => {
  isLoading.value = true;
  try {
    const list = await brandService.getBrandsList();
    // Default the is_active if undefined
    brandsList.value = list.map(b => ({
      ...b,
      is_active: b.is_active !== undefined ? b.is_active : true
    }));
  } catch (error: any) {
    triggerToast(error.message || 'System error on catalog polling.', 'error');
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await fetchRegistry();
});

// Reactivity filters
const filteredBrands = computed(() => {
  return brandsList.value.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          b.slug.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          (b.description || '').toLowerCase().includes(searchQuery.value.toLowerCase());
    
    const matchesStatus = statusFilter.value === 'all' || 
                          (statusFilter.value === 'active' && b.is_active) ||
                          (statusFilter.value === 'inactive' && !b.is_active);
    
    return matchesSearch && matchesStatus;
  });
});

// Pagination computed bounds
const totalPages = computed(() => {
  return Math.ceil(filteredBrands.value.length / itemsPerPage.value) || 1;
});

const paginatedBrands = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredBrands.value.slice(start, end);
});

// Auto-reset page on search filter/page size trigger
watch([searchQuery, statusFilter, itemsPerPage], () => {
  currentPage.value = 1;
});

// Update URL parameters when state changes
watch([searchQuery, statusFilter, currentPage, itemsPerPage], () => {
  const query: Record<string, any> = { ...route.query };

  if (searchQuery.value) query.search = searchQuery.value;
  else delete query.search;

  if (statusFilter.value !== 'all') query.status = statusFilter.value;
  else delete query.status;

  if (currentPage.value !== 1) query.page = String(currentPage.value);
  else delete query.page;

  if (itemsPerPage.value !== 5) query.pageSize = String(itemsPerPage.value);
  else delete query.pageSize;

  router.replace({ query });
});

// Sync state from URL changes (such as browser Back / Forward navigation)
watch(() => route.query, (newQuery) => {
  const newSearch = newQuery.search ? String(newQuery.search) : '';
  if (searchQuery.value !== newSearch) searchQuery.value = newSearch;

  const newStatus = (newQuery.status as any) || 'all';
  if (statusFilter.value !== newStatus) statusFilter.value = newStatus;

  const newPage = newQuery.page ? parseInt(String(newQuery.page)) || 1 : 1;
  if (currentPage.value !== newPage) currentPage.value = newPage;

  const newPageSize = newQuery.pageSize ? parseInt(String(newQuery.pageSize)) || 5 : 5;
  if (itemsPerPage.value !== newPageSize) itemsPerPage.value = newPageSize;
});

// Form Helpers: Auto slug generator
const autoSlugify = () => {
  if (isCreateModalOpen.value) {
    formPayload.value.slug = formPayload.value.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove non-word/non-space
      .replace(/[\s_]+/g, '-') // Replace spaces/underscores with hyphen
      .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
  }
};

// Modal trigger utilities
const openCreateModal = () => {
  formPayload.value = { id: '', name: '', slug: '', description: '', is_active: true, display_order: 1 };
  formError.value = null;
  isCreateModalOpen.value = true;
};

const openEditModal = (brand: Brand) => {
  formPayload.value = {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    description: brand.description || '',
    is_active: brand.is_active !== false,
    display_order: brand.display_order !== undefined ? brand.display_order : 1
  };
  formError.value = null;
  isEditModalOpen.value = true;
};

const openViewModal = (brand: Brand) => {
  selectedBrand.value = brand;
  isViewModalOpen.value = true;
};

// Save operations
const handleCreateBrand = async () => {
  formError.value = null;
  if (!formPayload.value.name.trim()) {
    formError.value = 'Brand Designation Name is required.';
    return;
  }
  if (!formPayload.value.slug.trim()) {
    formError.value = 'Technical identity Slug is required.';
    return;
  }

  const parsedOrder = Number(formPayload.value.display_order);
  if (isNaN(parsedOrder) || parsedOrder <= 0 || !Number.isInteger(parsedOrder)) {
    formError.value = 'Display Order must be a positive integer.';
    return;
  }

  isSubmitPending.value = true;
  try {
    await brandService.createBrand({
      name: formPayload.value.name,
      slug: formPayload.value.slug,
      description: formPayload.value.description,
      is_active: formPayload.value.is_active,
      display_order: parsedOrder
    });
    
    isCreateModalOpen.value = false;
    triggerToast(`Partner [${formPayload.value.name}] initialized successfully.`);
    await fetchRegistry();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Operation failed on brand registration.');
    formError.value = msg;
    triggerToast(msg, 'error');
  } finally {
    isSubmitPending.value = false;
  }
};

const handleUpdateBrand = async () => {
  formError.value = null;
  if (!formPayload.value.name.trim()) {
    formError.value = 'Brand Designation Name is required.';
    return;
  }
  if (!formPayload.value.slug.trim()) {
    formError.value = 'Technical identity Slug is required.';
    return;
  }

  const parsedOrder = Number(formPayload.value.display_order);
  if (isNaN(parsedOrder) || parsedOrder <= 0 || !Number.isInteger(parsedOrder)) {
    formError.value = 'Display Order must be a positive integer.';
    return;
  }

  isSubmitPending.value = true;
  try {
    await brandService.updateBrand(formPayload.value.id, {
      name: formPayload.value.name,
      slug: formPayload.value.slug,
      description: formPayload.value.description,
      is_active: formPayload.value.is_active,
      display_order: parsedOrder
    });

    isEditModalOpen.value = false;
    triggerToast(`Partner [${formPayload.value.name}] profiles successfully updated.`);
    await fetchRegistry();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Operation failed on brand modification.');
    formError.value = msg;
    triggerToast(msg, 'error');
  } finally {
    isSubmitPending.value = false;
  }
};

const handleDeleteBrand = async (brand: Brand) => {
  const confirmMsg = `Verify Deletion: Are you sure you want to decommission [${brand.name}] from Best Computer Hub registries? All mapped inventory counts will stay, but mapping nodes will be unlinked.`;
  if (confirm(confirmMsg)) {
    try {
      await brandService.deleteBrand(brand.id);
      triggerToast(`Partner [${brand.name}] has been successfully deregistered.`, 'info');
      await fetchRegistry();
      if (currentPage.value > totalPages.value) {
        currentPage.value = Math.max(1, totalPages.value);
      }
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Deregister action aborted.');
      triggerToast(msg, 'error');
    }
  }
};

// Stats aggregates computed (safe fallbacks)
const statsRegistry = computed(() => {
  const total = brandsList.value.length;
  const activeCount = brandsList.value.filter(b => b.is_active !== false).length;
  const highPriority = brandsList.value.filter(b => b.productCount > 80).length;

  return [
    { label: 'Registered Brands', value: total, icon: Flag, color: 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' },
    { label: 'Active Domains', value: activeCount, icon: Globe, color: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' },
    { label: 'High Priority Nodes', value: highPriority, icon: Award, color: 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' },
  ];
});
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
    
    <!-- Top Action bar block -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-4xl font-display font-extrabold tracking-tight">Partnership Registry</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1 font-medium">Configure corporate hardware suppliers and technical entities.</p>
      </div>
      <div class="flex items-center gap-3">
        <Button 
          variant="outline" 
          class="rounded-2xl h-11 px-5 gap-2 border-border font-bold text-xs"
          @click="fetchRegistry"
          :disabled="isLoading"
        >
          <RefreshCw :class="['w-4 h-4', isLoading && 'animate-spin']" />
          <span>Refresh</span>
        </Button>

        <button 
          @click="openCreateModal"
          class="bg-primary text-primary-foreground hover:bg-primary/95 px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xl shadow-primary/25 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
        >
          <Plus class="w-4 h-4" /> Register New Partner
        </button>
      </div>
    </div>

    <!-- Interactive Stats row -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UiCard v-for="stat in statsRegistry" :key="stat.label" class="flex items-center gap-6 p-8">
        <div :class="cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner', stat.color)">
          <component :is="stat.icon" class="w-7 h-7" />
        </div>
        <div>
          <p class="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mb-1">{{ stat.label }}</p>
          <p class="text-3xl font-display font-black tracking-tight">{{ stat.value }}</p>
        </div>
      </UiCard>
    </div>

    <!-- Filters framework -->
    <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-4 flex flex-wrap items-center gap-4 shadow-sm">
      <div class="flex-1 min-w-[280px]">
        <UiSearchInput 
          v-model="searchQuery" 
          placeholder="Search partners database by name, description or slug..." 
          class="border-none bg-transparent"
        />
      </div>
      
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 pr-2 border-l border-slate-100 dark:border-slate-900 pl-4">
          <span class="text-[10px] uppercase font-bold tracking-widest text-slate-400">Node Filter:</span>
          <select 
            v-model="statusFilter"
            class="h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-[10px] font-bold uppercase tracking-widest cursor-pointer"
          >
            <option value="all">All Registries</option>
            <option value="active">Active Nodes Only</option>
            <option value="inactive">Deactivated Only</option>
          </select>
        </div>
        
        <button 
          @click="fetchRegistry" 
          class="p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-primary transition-colors cursor-pointer"
          title="Force Sync Protocols"
          aria-label="Sync registry"
        >
          <RotateCcw class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Loading, Empty, Error status layout handlers -->
    <div v-if="brandService.isLoading.value" class="h-64 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
      <span class="animate-spin border-4 border-primary/20 border-t-primary rounded-full w-10 h-10"></span>
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Querying Database Registry...</p>
    </div>

    <div v-else-if="brandService.errorMsg.value" class="h-64 flex flex-col items-center justify-center gap-4 p-6 text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
      <div class="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center">
        <AlertCircle class="w-6 h-6" />
      </div>
      <div>
        <p class="text-lg font-bold">Network Integration Malfunction</p>
        <p class="text-xs text-slate-400 max-w-md mx-auto mt-1">{{ brandService.errorMsg.value }}</p>
      </div>
      <button @click="fetchRegistry" class="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 text-xs px-4 py-2 rounded-xl font-bold hover:opacity-90">
        Re-verify Connection
      </button>
    </div>

    <!-- Paginated partner table -->
    <div v-else class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-900">
              <th class="px-8 py-5">Corporate Entity</th>
              <th class="px-6 py-5">Registry Identification</th>
              <th class="px-6 py-5">System status</th>
              <th class="px-6 py-5">Order</th>
              <th class="px-6 py-5">Production Mapped</th>
              <th class="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-900/50">
            <tr v-for="brand in paginatedBrands" :key="brand.id" class="group hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
              
              <!-- Brand Identity Column -->
              <td class="px-8 py-5">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center p-2 shadow-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <img :src="brand.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80'" :alt="brand.name" class="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300" />
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors leading-tight">{{ brand.name }}</h4>
                    <p class="text-xs text-slate-400 line-clamp-1 max-w-[280px] mt-0.5 italic leading-relaxed">"{{ brand.description || 'No database memo recorded.' }}"</p>
                  </div>
                </div>
              </td>

              <!-- Registry identification ID/Slug Column -->
              <td class="px-6 py-5">
                <span class="font-mono text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 uppercase tracking-wider font-semibold">
                  {{ brand.slug }}
                </span>
              </td>

              <!-- Status Lights Column -->
              <td class="px-6 py-5">
                <div class="flex items-center gap-2">
                  <span :class="cn(
                    'w-2 h-2 rounded-full ring-4',
                    brand.is_active !== false 
                      ? 'bg-emerald-500 ring-emerald-500/10' 
                      : 'bg-slate-300 dark:bg-slate-700 ring-slate-300/10 dark:ring-slate-700/10'
                  )"></span>
                  <span class="text-[10px] uppercase font-bold tracking-widest" :class="brand.is_active !== false ? 'text-emerald-500' : 'text-slate-400'">
                    {{ brand.is_active !== false ? 'Operational' : 'Suspended' }}
                  </span>
                </div>
              </td>

              <!-- Display Order Column -->
              <td class="px-6 py-5">
                <span class="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                  #{{ brand.display_order || 'Unassigned' }}
                </span>
              </td>

              <!-- Production counts statistics Column -->
              <td class="px-6 py-5">
                <div class="flex items-center gap-2">
                  <Tag class="w-3.5 h-3.5 text-slate-300" />
                  <span class="text-xs font-black text-slate-900 dark:text-slate-100">{{ brand.productCount || 0 }} Items</span>
                </div>
              </td>

              <!-- Action triggers Column -->
              <td class="px-8 py-5 text-right">
                <div class="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button 
                    @click="openViewModal(brand)" 
                    class="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                    title="Audit Technical Profile"
                    aria-label="View brand profile"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button 
                    @click="openEditModal(brand)" 
                    class="p-2 text-slate-400 hover:text-yellow-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                    title="Patch Registry Record"
                    aria-label="Edit brand record"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button 
                    @click="handleDeleteBrand(brand)" 
                    class="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                    title="Force Decommission Protocol"
                    aria-label="Delete brand"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty vector list layout -->
            <tr v-if="filteredBrands.length === 0">
              <td colspan="6" class="px-8 py-16 text-center h-64">
                <div class="flex flex-col items-center justify-center gap-4 text-slate-400">
                  <div class="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    <Search class="w-7 h-7 text-slate-300" />
                  </div>
                  <div>
                    <p class="font-display font-medium text-lg text-slate-900 dark:text-slate-100">Zero Registries Found</p>
                    <p class="text-xs max-w-sm mx-auto mt-1">No hardware partners matched the filter [{{ searchQuery || 'None' }}]. Extend the taxonomy index or verify parameters.</p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer System -->
      <div class="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Showing <span class="text-slate-800 dark:text-slate-200 font-black">{{ Math.min(filteredBrands.length, (currentPage - 1) * itemsPerPage + 1) }} - {{ Math.min(filteredBrands.length, currentPage * itemsPerPage) }}</span> 
            of <span class="text-slate-800 dark:text-slate-200 font-black">{{ filteredBrands.length }}</span> registries.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>
          
          <div class="flex items-center gap-1 font-mono text-xs font-bold">
            <button 
              v-for="p in totalPages" 
              :key="p" 
              @click="currentPage = p"
              :class="cn(
                'w-10 h-10 rounded-xl font-bold transition-all cursor-pointer text-xs',
                currentPage === p 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                  : 'border border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500'
              )"
            >
              {{ p }}
            </button>
          </div>

          <button 
            @click="currentPage++" 
            :disabled="currentPage === totalPages"
            class="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 1: Create New Partner -->
    <div v-if="isCreateModalOpen" @click.self="isCreateModalOpen = false" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer">
      <form @submit.prevent="handleCreateBrand" class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col animate-in scale-in duration-300 cursor-default">
        
        <!-- Header Banner -->
        <div class="p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-primary">System Authentication Protocol</span>
            <h3 class="text-2xl font-display font-black tracking-tight mt-0.5">Integrate Hardware Partner</h3>
          </div>
          <button type="button" @click="isCreateModalOpen = false" class="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Scrollable content -->
        <div class="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
          
          <div v-if="formError" class="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 flex items-start gap-3 rounded-2xl text-rose-600 dark:text-rose-400">
            <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
            <p class="text-xs font-semibold leading-relaxed">{{ formError }}</p>
          </div>

          <!-- Fields -->
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Partner Long Name</label>
              <input 
                ref="partnerNameInput"
                v-model="formPayload.name" 
                @input="autoSlugify"
                type="text" 
                placeholder="e.g. NVIDIA Corporation" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50"
              />
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Registry Code identifier (Slug/DNS)</label>
              <input 
                v-model="formPayload.slug" 
                type="text" 
                placeholder="e.g. nvidia" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-semibold text-slate-950 dark:text-slate-50 font-mono"
              />
              <p class="text-[10px] text-slate-400 ml-1">Unique alphanumeric router label. Hyphens allowed.</p>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Partner Operational Profile / Memo</label>
              <textarea 
                v-model="formPayload.description" 
                rows="4" 
                placeholder="Detailed technical layout and partnership scope notes..." 
                class="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-medium leading-relaxed"
              ></textarea>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Display Sort Order Priority</label>
              <input 
                v-model="formPayload.display_order" 
                type="number" 
                min="1"
                step="1"
                placeholder="e.g. 1" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50"
              />
              <p class="text-[10px] text-slate-400 ml-1">A positive integer determining the visual sequencing order of brands.</p>
            </div>

            <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <p class="text-xs font-bold">Operational Priority Status</p>
                <p class="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Toggle catalog routing compliance</p>
              </div>
              <button 
                type="button" 
                @click="formPayload.is_active = !formPayload.is_active"
                :class="cn(
                  'w-14 h-8 rounded-full p-1 transition-colors duration-300 pointer-events-auto',
                  formPayload.is_active ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                )"
              >
                <div :class="cn(
                  'w-6 h-6 rounded-full bg-white transition-transform duration-300 shadow-sm flex items-center justify-center',
                  formPayload.is_active ? 'translate-x-6' : 'translate-x-0'
                )">
                  <span class="text-[8px] font-black text-slate-900">{{ formPayload.is_active ? 'ON' : 'OFF' }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Control Action bar -->
        <div class="p-8 border-t border-slate-100 dark:border-slate-900 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            type="button"
            @click="isCreateModalOpen = false" 
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
            {{ isSubmitPending ? 'Saving Record...' : 'Publish Partner Profile' }}
          </button>
        </div>
      </form>
    </div>

    <!-- MODAL 2: Edit Brand Details -->
    <div v-if="isEditModalOpen" @click.self="isEditModalOpen = false" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer">
      <form @submit.prevent="handleUpdateBrand" class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col animate-in scale-in duration-300 cursor-default">
        
        <!-- Header Banner -->
        <div class="p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-amber-500">Authorized Admin Override</span>
            <h3 class="text-2xl font-display font-black tracking-tight mt-0.5">Modify Partner Profile</h3>
          </div>
          <button type="button" @click="isEditModalOpen = false" class="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Scrollable content -->
        <div class="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
          
          <div v-if="formError" class="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 flex items-start gap-3 rounded-2xl text-rose-600 dark:text-rose-400">
            <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
            <p class="text-xs font-semibold leading-relaxed">{{ formError }}</p>
          </div>

          <!-- Fields -->
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Partner Long Name</label>
              <input 
                ref="editPartnerNameInput"
                v-model="formPayload.name" 
                type="text" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50"
              />
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Registry Code identifier (Slug/DNS)</label>
              <input 
                v-model="formPayload.slug" 
                type="text" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-semibold text-slate-950 dark:text-slate-50 font-mono"
              />
              <p class="text-[10px] text-slate-400 ml-1 font-medium">Caution: Modifying DNS codes might interrupt visual product routers temporarily.</p>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Partner Operational Profile / Memo</label>
              <textarea 
                v-model="formPayload.description" 
                rows="4" 
                class="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-medium leading-relaxed"
              ></textarea>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Display Sort Order Priority</label>
              <input 
                v-model="formPayload.display_order" 
                type="number" 
                min="1"
                step="1"
                placeholder="e.g. 1" 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm font-bold text-slate-950 dark:text-slate-50"
              />
              <p class="text-[10px] text-slate-400 ml-1">A positive integer determining the visual sequencing order of brands.</p>
            </div>

            <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <p class="text-xs font-bold font-display">Operational Priority Status</p>
                <p class="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Toggle catalog routing compliance</p>
              </div>
              <button 
                type="button" 
                @click="formPayload.is_active = !formPayload.is_active"
                :class="cn(
                  'w-14 h-8 rounded-full p-1 transition-colors duration-300 pointer-events-auto',
                  formPayload.is_active ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                )"
              >
                <div :class="cn(
                  'w-6 h-6 rounded-full bg-white transition-transform duration-300 shadow-sm flex items-center justify-center',
                  formPayload.is_active ? 'translate-x-6' : 'translate-x-0'
                )">
                  <span class="text-[8px] font-black text-slate-900">{{ formPayload.is_active ? 'ON' : 'OFF' }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Control Action bar -->
        <div class="p-8 border-t border-slate-100 dark:border-slate-900 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            type="button"
            @click="isEditModalOpen = false" 
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
            {{ isSubmitPending ? 'Applying Overrides...' : 'Patch Partner Profile' }}
          </button>
        </div>
      </form>
    </div>

    <!-- MODAL 3: Read-Only Audit Profile (Details View) -->
    <div v-if="isViewModalOpen && selectedBrand" @click.self="isViewModalOpen = false" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer">
      <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col animate-in scale-in duration-300 cursor-default">
        
        <!-- Header Banner -->
        <div class="p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">Institutional Registry Viewer</span>
            <h3 class="text-2xl font-display font-black tracking-tight mt-0.5">Partner Audit Card</h3>
          </div>
          <button @click="isViewModalOpen = false" class="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Profile Metadata Container -->
        <div class="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
          
          <div class="flex items-center gap-5 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/85">
            <div class="w-20 h-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center p-3 shadow-md overflow-hidden shrink-0">
              <img :src="selectedBrand.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80'" :alt="selectedBrand.name" class="w-full h-full object-contain" />
            </div>
            <div>
              <h4 class="text-lg font-black font-display tracking-tight text-slate-900 dark:text-slate-100 leading-tight">{{ selectedBrand.name }}</h4>
              <p class="text-xs font-mono text-primary font-bold mt-1 uppercase tracking-wider">{{ selectedBrand.slug }}</p>
              <div class="flex items-center gap-1.5 mt-2">
                <span :class="cn(
                  'w-1.5 h-1.5 rounded-full',
                  selectedBrand.is_active !== false ? 'bg-emerald-500' : 'bg-slate-400'
                )"></span>
                <span class="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  {{ selectedBrand.is_active !== false ? 'Active Operational status' : 'Suspended' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Technical Specs -->
          <div class="space-y-4">
            <p class="text-[10px] uppercase font-bold tracking-widest text-slate-400">Database Record Memo</p>
            <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50/50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-900 italic">
              "{{ selectedBrand.description || 'No database memo recorded for this hardware partner.' }}"
            </p>

            <div class="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-900">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Internal UUID</span>
                <span class="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{{ selectedBrand.id }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Inventory Units</span>
                <span class="text-xs font-mono font-extrabold text-slate-900 dark:text-white">{{ selectedBrand.productCount || 0 }} products</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Database Compliance Level</span>
                <span class="text-xs font-mono font-bold text-emerald-500 flex items-center gap-1">
                  <ShieldCheck class="w-3.5 h-3.5" /> SECURE MATCH
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Display Sequencer Order</span>
                <span class="text-xs font-mono font-bold text-slate-900 dark:text-white">{{ selectedBrand.display_order || 'Unassigned' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Control -->
        <div class="p-8 border-t border-slate-100 dark:border-slate-900 flex items-center justify-end bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            @click="isViewModalOpen = false" 
            class="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-6 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
