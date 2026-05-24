<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
    <!-- Header/Navigation Placeholder matching TechCore Enterprise Premium style -->
    <header class="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur transition-all duration-500">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div class="flex items-center gap-2">
          <div class="h-6 w-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-md shadow-cyan-500/20"></div>
          <span class="font-display text-sm uppercase tracking-widest font-black text-white bg-clip-text">TechCore Admin</span>
        </div>
        <div class="flex items-center gap-4">
          <!-- Auth Status Indicator / Configuration Switch -->
          <button
            type="button"
            @click="openAuthModal"
            class="group flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs font-mono transition-all hover:border-cyan-500 hover:bg-slate-950 cursor-pointer"
          >
            <div :class="tokenRegistered ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/30'" class="h-2 w-2 rounded-full animate-pulse shadow-sm animate-duration-1000"></div>
            <span class="text-slate-300 group-hover:text-white">{{ tokenRegistered ? 'Authorized Node' : 'Restricted Sandbox' }}</span>
            <Key class="h-3 w-3 text-slate-500 group-hover:text-cyan-400 transition" />
          </button>
          
          <div class="hidden sm:block text-xs uppercase tracking-widest text-slate-400 font-mono">
            System Node Active
          </div>
        </div>
      </div>
    </header>

    <!-- Main Workspace Container -->
    <main class="mx-auto max-w-7xl px-6 py-12">
      <!-- Section Title & Creation CTA -->
      <div class="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h1 class="font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Categories Taxonomy
          </h1>
          <p class="mt-2 text-sm text-slate-400">
            Provision and configure hierarchical inventory node classifications.
          </p>
        </div>
        <button
          id="btn-trigger-create"
          type="button"
          @click="openCreateModal"
          class="flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:bg-cyan-400 hover:shadow-cyan-400/35 active:scale-95 cursor-pointer"
        >
          <Plus class="h-4 w-4" />
          <span>New Category</span>
        </button>
      </div>

      <!-- Categories Data Management Layout -->
      <div class="rounded-[2.5rem] border border-slate-800 bg-slate-900/40 p-8 backdrop-blur-md">
        <!-- Toast Alerts Container (Built-in Dynamic Mechanism) -->
        <div v-if="toast" class="mb-6 flex items-center justify-between rounded-xl bg-slate-800 border-l-4 border-cyan-500 p-4 shadow-xl transition-all duration-300 ease-in-out">
          <div class="flex items-center gap-3">
            <CheckCircle v-if="toast.type === 'success'" class="h-5 w-5 text-cyan-400" />
            <XCircle v-else class="h-5 w-5 text-rose-500" />
            <span class="text-sm text-slate-200">{{ toast.message }}</span>
          </div>
          <button @click="toast = null" type="button" class="text-slate-400 hover:text-white transition">
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Filter Action Panel -->
        <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="relative w-full md:max-w-md">
            <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="search-input"
              type="text"
              v-model="searchTerm"
              @input="onSearchChanged"
              placeholder="Search categoric nodes..."
              class="w-full rounded-full border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div class="flex items-center gap-4">
            <label class="text-xs uppercase tracking-wider text-slate-500 font-mono">Sort Order:</label>
            <select
              id="sort-select"
              v-model="sortOrder"
              @change="fetchCategories"
              class="rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="name">Name (Ascending)</option>
              <option value="-name">Name (Descending)</option>
              <option value="slug">Slug (Ascending)</option>
              <option value="-slug">Slug (Descending)</option>
            </select>
          </div>
        </div>

        <!-- Categories Rendering State Section -->
        <div class="overflow-x-auto">
          <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-4">
            <div class="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
            <span class="text-xs uppercase tracking-widest text-slate-500 font-mono">Syncing Registry Nodes...</span>
          </div>

          <div v-else-if="categories.length === 0" class="flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-3xl py-20 text-center px-4">
            <Inbox class="mx-auto h-12 w-12 text-slate-700 mb-4" />
            <h3 class="text-lg font-semibold text-slate-300">No categoric nodes indexed</h3>
            <p class="mt-2 text-sm text-slate-500 max-w-sm">
              Your query returned empty or there are no categories recorded on the server system.
            </p>
          </div>

          <table v-else class="w-full border-collapse text-left">
            <thead>
              <tr class="border-b border-slate-800 text-xs font-semibold uppercase tracking-widest text-slate-500">
                <th class="py-4 pl-4 pr-3">Classification Node</th>
                <th class="py-4 px-3">Unique Slug</th>
                <th class="py-4 px-3">Description Context</th>
                <th class="py-4 px-3">Sub-Nodes</th>
                <th class="py-4 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/50 text-sm">
              <tr v-for="category in categories" :key="category.id" class="group hover:bg-slate-900/30 transition duration-300">
                <td class="py-5 pl-4 pr-3 font-medium text-white">
                  <div class="flex flex-col">
                    <span>{{ category.name }}</span>
                    <span v-if="getParentName(category)" class="mt-1 text-xs text-slate-500 flex items-center gap-1">
                      <CornerDownRight class="h-3 w-3" /> Child of {{ getParentName(category) }}
                    </span>
                  </div>
                </td>
                <td class="py-5 px-3 font-mono text-slate-400 text-xs">{{ category.slug }}</td>
                <td class="py-5 px-3 text-slate-400 max-w-xs truncate">{{ category.description || 'N/A' }}</td>
                <td class="py-5 px-3">
                  <span class="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-cyan-400">
                    {{ category.subCategories?.length || 0 }} sub-nodes
                  </span>
                </td>
                <td class="py-5 pr-4 text-right">
                  <button
                    type="button"
                    @click="deleteClassificationNode(category.id)"
                    class="rounded-full p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Administrative Classification Node Provisioning Modal Overlay -->
    <div
      v-if="isCreateModalOpen"
      id="category-provision-modal"
      @click.self="closeCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-all duration-300 cursor-pointer"
    >
      <div class="w-full max-w-xl rounded-[2.5rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl transition-all duration-500 cursor-default">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <h2 class="font-display text-xl font-bold text-white">
              Configure Category Node
            </h2>
            <p class="mt-1 text-xs text-slate-400">
              Inject a new category dimension into the central catalogue system.
            </p>
          </div>
          <button
            type="button"
            @click="closeCreateModal"
            class="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Interactive Form Controls -->
        <form @submit.prevent="submitClassificationForm" class="mt-6 flex flex-col gap-5">
          <!-- Classification Title Entry -->
          <div class="flex flex-col gap-1.5">
            <label for="category-name-field" class="text-xs uppercase tracking-wider text-slate-400 font-mono font-medium">Node Name *</label>
            <input
              id="category-name-field"
              ref="nameInputRef"
              type="text"
              v-model="form.name"
              @input="onNameInput"
              placeholder="e.g. Optical Storage Units"
              class="rounded-full border border-slate-800 bg-slate-950 px-5 py-3.5 text-sm text-slate-100 placeholder:text-slate-600 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              :class="{ 'border-rose-500 focus:border-rose-500 focus:ring-rose-500': fieldErrors.name }"
            />
            <p v-if="fieldErrors.name" class="text-xs text-rose-500 mt-1 pl-1">{{ fieldErrors.name }}</p>
          </div>

          <!-- Classification Unique Slug (Dynamic Generation with validation) -->
          <div class="flex flex-col gap-1.5">
            <label for="category-slug-field" class="text-xs uppercase tracking-wider text-slate-400 font-mono font-medium">Unique Slug *</label>
            <input
              id="category-slug-field"
              type="text"
              v-model="form.slug"
              placeholder="e.g. optical-storage-units"
              class="rounded-full border border-slate-800 bg-slate-950 px-5 py-3.5 text-sm font-mono text-xs text-cyan-400 placeholder:text-slate-600 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              :class="{ 'border-rose-500 focus:border-rose-500 focus:ring-rose-500': fieldErrors.slug }"
            />
            <p v-if="fieldErrors.slug" class="text-xs text-rose-500 mt-1 pl-1">{{ fieldErrors.slug }}</p>
          </div>

          <!-- Parent Node Dropdown Class -->
          <div class="flex flex-col gap-1.5">
            <label for="category-parent-field" class="text-xs uppercase tracking-wider text-slate-400 font-mono font-medium">Hierarchy Parent Node</label>
            <select
              id="category-parent-field"
              v-model="form.parent"
              class="rounded-full border border-slate-800 bg-slate-950 px-5 py-3.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option :value="null">None (Root Level Classification)</option>
              <option v-for="cat in parentDropdownOptions" :key="cat.id" :value="cat.id">
                {{ cat.name }} ({{ cat.slug }})
              </option>
            </select>
          </div>

          <!-- Description Textarea -->
          <div class="flex flex-col gap-1.5">
            <label for="category-description-field" class="text-xs uppercase tracking-wider text-slate-400 font-mono font-medium">Classification Narrative</label>
            <textarea
              id="category-description-field"
              v-model="form.description"
              rows="3"
              placeholder="Provide enterprise-level technical classification, context and usage instructions..."
              class="rounded-[1.5rem] border border-slate-800 bg-slate-950 px-5 py-3.5 text-sm text-slate-100 placeholder:text-slate-600 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
            ></textarea>
          </div>

          <!-- API Validation Generic Failures -->
          <p v-if="apiErrorMessage" class="text-xs text-rose-400 mt-1 bg-rose-950/20 border border-rose-900/30 p-3 rounded-xl">
            {{ apiErrorMessage }}
          </p>

          <!-- Action Controllers -->
          <div class="mt-4 flex items-center justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              @click="closeCreateModal"
              class="rounded-full border border-slate-800 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="flex items-center justify-center gap-2 rounded-full bg-cyan-500 px-8 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:bg-cyan-400 hover:shadow-cyan-400/30 active:scale-95 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
            >
              <div v-if="saving" class="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
              <span>{{ saving ? 'Provisioning...' : 'Publish Taxonomy' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    <!-- Administrative Node Security (Credentials/Token Configuration) Modal -->
    <div
      v-if="isAuthModalOpen"
      id="auth-provision-modal"
      @click.self="closeAuthModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-all duration-300 cursor-pointer"
    >
      <div class="w-full max-w-md rounded-[2.5rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl transition-all duration-500 cursor-default">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-5">
          <div class="flex items-center gap-2.5">
            <Key class="h-5 w-5 text-cyan-400" />
            <div>
              <h2 class="font-display text-xl font-bold text-white mb-0.5">
                Authorize Admin Node
              </h2>
              <p class="text-xs text-slate-400 mt-0">
                Register a secret session token for write authorization.
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="closeAuthModal"
            class="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <form @submit.prevent="saveAuthToken" class="mt-6 flex flex-col gap-5">
          <div class="flex flex-col gap-1.5">
            <label for="auth-token-field" class="text-xs uppercase tracking-wider text-slate-400 font-mono font-medium">Bearer Session Token / JWT *</label>
            <input
              id="auth-token-field"
              ref="authTokenInputRef"
              type="password"
              v-model="authTokenInput"
              placeholder="Paste your Authorization Header Bearer token..."
              class="w-full rounded-full border border-slate-800 bg-slate-950 px-5 py-3.5 text-xs font-mono text-cyan-400 placeholder:text-slate-700 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <p class="text-[10px] text-slate-500 leading-relaxed mt-1 pl-1">
              For example: <code class="text-cyan-600 font-mono">Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</code>. Once registered locally, all REST communication requests automatically append this block inside the authentication header frame.
            </p>
          </div>

          <!-- Actions -->
          <div class="mt-4 flex items-center justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              v-if="tokenRegistered"
              type="button"
              @click="clearAuthToken"
              class="rounded-full border border-rose-950/30 px-5 py-2.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-950/20 cursor-pointer mr-auto font-mono"
            >
              Clear Token
            </button>
            <button
              type="button"
              @click="closeAuthModal"
              class="rounded-full border border-slate-800 px-6 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-full bg-cyan-500 px-6 py-2.5 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 hover:shadow-cyan-400/35 cursor-pointer"
            >
              Save Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue';
import { useCategoryService } from '@/composables/useCategoryService';
import type { Category } from '@/types';
import {
  Plus,
  X,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  Inbox,
  CornerDownRight,
  Key
} from 'lucide-vue-next';

// Composable Registry instance
const categoryService = useCategoryService();

// Component Reactive state variables
const categories = ref<Category[]>([]);
const parentDropdownOptions = ref<Category[]>([]);
const isLoading = ref(false);
const saving = ref(false);
const searchTerm = ref('');
const sortOrder = ref('name');

// Authentication session token admin variables
const isAuthModalOpen = ref(false);
const tokenRegistered = ref(false);
const authTokenInput = ref('');
const authTokenInputRef = ref<HTMLInputElement | null>(null);

const checkTokenStatus = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('techcore_admin_token');
    tokenRegistered.value = !!token;
    if (token) {
      authTokenInput.value = token;
    } else {
      authTokenInput.value = '';
    }
  }
};

const openAuthModal = () => {
  checkTokenStatus();
  isAuthModalOpen.value = true;
};

const closeAuthModal = () => {
  isAuthModalOpen.value = false;
};

watch(isAuthModalOpen, async (newVal) => {
  if (newVal) {
    await nextTick();
    if (authTokenInputRef.value) {
      authTokenInputRef.value.focus();
    }
  }
});

const saveAuthToken = () => {
  if (typeof window !== 'undefined') {
    const freshToken = authTokenInput.value.trim();
    if (freshToken) {
      localStorage.setItem('techcore_admin_token', freshToken);
      triggerToast('success', 'Administrative Bearer session token configured live!');
    } else {
      localStorage.removeItem('techcore_admin_token');
      triggerToast('success', 'Credentials cleared successfully.');
    }
    checkTokenStatus();
    closeAuthModal();
    fetchCategories();
  }
};

const clearAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('techcore_admin_token');
    triggerToast('success', 'Administrative node credentials deleted.');
    checkTokenStatus();
    closeAuthModal();
    fetchCategories();
  }
};

// Searching / Auto Refresh logic
let searchTimeout: any = null;
const onSearchChanged = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchCategories();
  }, 350);
};

// Toast notification management types
interface ToastNotification {
  type: 'success' | 'error';
  message: string;
}
const toast = ref<ToastNotification | null>(null);

const triggerToast = (type: 'success' | 'error', message: string) => {
  toast.value = { type, message };
  setTimeout(() => {
    if (toast.value?.message === message) {
      toast.value = null;
    }
  }, 4000);
};

// Modal administration Controls
const isCreateModalOpen = ref(false);
const nameInputRef = ref<HTMLInputElement | null>(null);

// Form Reactive Fields State
interface CreateCategoryForm {
  name: string;
  slug: string;
  description: string;
  parent: string | number | null;
}

const form = reactive<CreateCategoryForm>({
  name: '',
  slug: '',
  description: '',
  parent: null
});

// Structural UI Validations and Inline Errors
const fieldErrors = reactive({
  name: '',
  slug: ''
});
const apiErrorMessage = ref<string | null>(null);

const openCreateModal = () => {
  resetFormState();
  isCreateModalOpen.value = true;
};

const closeCreateModal = () => {
  isCreateModalOpen.value = false;
};

// Watch Modal Status for instant visual focus trigger per UX rule
watch(isCreateModalOpen, async (newVal) => {
  if (newVal) {
    await nextTick();
    if (nameInputRef.value) {
      nameInputRef.value.focus();
    }
  }
});

const resetFormState = () => {
  form.name = '';
  form.slug = '';
  form.description = '';
  form.parent = null;
  fieldErrors.name = '';
  fieldErrors.slug = '';
  apiErrorMessage.value = null;
};

// Auto slug generation trigger on name change, strictly preserving lowercase strings
const onNameInput = () => {
  if (form.name) {
    form.slug = form.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  } else {
    form.slug = '';
  }
  // Clear error triggers on active user input
  if (form.name.trim()) fieldErrors.name = '';
};

// Parent Name mapping helper for table views
const getParentName = (category: Category): string => {
  if (!category.parentCategoryId) return '';
  const match = categories.value.find(c => c.id === category.parentCategoryId);
  return match ? match.name : '';
};

// Fetching Taxonomy classification list from server endpoint
const fetchCategories = async () => {
  isLoading.value = true;
  try {
    const res = await categoryService.getCategoriesList({
      search: searchTerm.value,
      ordering: sortOrder.value,
      page_size: 100 // Fetch a bulk set for administrative dropdowns and mapping
    });
    categories.value = res.results;
    // Populate parent selection list recursively
    parentDropdownOptions.value = res.results.filter(c => !c.parentCategoryId);
  } catch (err: any) {
    if (err.status === 401) {
      triggerToast('error', 'Taxonomy authentication validation failure (401).');
    } else {
      triggerToast('error', 'Taxonomy synchronization protocol failure.');
    }
  } finally {
    isLoading.value = false;
  }
};

// Delete classification node with defensive checks
const deleteClassificationNode = async (id: string) => {
  if (!confirm('Are you sure you want to delete this category classification node?')) return;
  
  isLoading.value = true;
  try {
    await categoryService.deleteCategory(id);
    triggerToast('success', 'Classification Node decommissioned successfully.');
    await fetchCategories();
  } catch (err: any) {
    triggerToast('error', err.message || 'Operation failed.');
  } finally {
    isLoading.value = false;
  }
};

// Submission Protocol Handler with precise data validation
const submitClassificationForm = async () => {
  // Reset inline warning signals
  fieldErrors.name = '';
  fieldErrors.slug = '';
  apiErrorMessage.value = null;

  let isValid = true;

  if (!form.name.trim()) {
    fieldErrors.name = 'Taxonomy classification requires a name.';
    isValid = false;
  }
  if (!form.slug.trim()) {
    fieldErrors.slug = 'Slug representation is required for catalog URLs.';
    isValid = false;
  } else if (!/^[a-z0-9-]+$/.test(form.slug)) {
    fieldErrors.slug = 'Slug format must contain lowercase alphanumeric characters and hyphens only.';
    isValid = false;
  }

  if (!isValid) return;

  saving.value = true;
  try {
    await categoryService.createCategory({
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      parent: form.parent
    });

    triggerToast('success', 'Taxonomy Classification configured live successfully!');
    closeCreateModal();
    await fetchCategories();
  } catch (err: any) {
    // Graceful field specific error dissection
    if (err.data && typeof err.data === 'object') {
      if (err.data.name) fieldErrors.name = Array.isArray(err.data.name) ? err.data.name[0] : err.data.name;
      if (err.data.slug) fieldErrors.slug = Array.isArray(err.data.slug) ? err.data.slug[0] : err.data.slug;
      if (err.data.parent) apiErrorMessage.value = Array.isArray(err.data.parent) ? err.data.parent[0] : err.data.parent;
    }
    
    // Check for standard authentication failures
    if (err.status === 401 || (err.data && err.data.detail && err.data.detail.toLowerCase().includes('credential'))) {
      apiErrorMessage.value = 'Security node validation failure: Bearer token is missing, expired, or invalid. Please configure your active Security Node credentials.';
      openAuthModal();
    } else {
      if (!fieldErrors.name && !fieldErrors.slug && !apiErrorMessage.value) {
        apiErrorMessage.value = err.message || 'Deployment rejected by authentication node or schema bounds.';
      }
    }
    triggerToast('error', 'Taxonomy registry update validation failure.');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  checkTokenStatus();
  fetchCategories();
});
</script>
