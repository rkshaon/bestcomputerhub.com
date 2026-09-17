<!-- File: /pages/admin/blog/posts/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { 
  FileText, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  EyeOff,
  Globe,
  Layers,
  Tag,
  User as UserIcon,
  Upload,
  X,
  Loader2,
  Save,
  Filter,
  ChevronDown,
  Check
} from 'lucide-vue-next';
import { useBlogService } from '@/composables/useBlogService';
import { useCategoryService } from '@/composables/useCategoryService';
import { useUserService } from '@/composables/useUserService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { useInfinitePagination } from '@/composables/useInfinitePagination';
import { toastSuccess, toastError, handleApiError } from '@/composables/useToast';
import { cn, decodeHtmlEntities } from '@/utils';
import type { BlogPostItem, Category, BlogTag, UserItem } from '@/types';
import type { UiTableColumn } from '@/components/ui/UiTable.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiInfiniteScroll from '@/components/ui/UiInfiniteScroll.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/Button.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiRichTextEditor from '@/components/ui/UiRichTextEditor.vue';

definePageMeta({
  layout: false
});

const blogService = useBlogService();
const categoryService = useCategoryService();
const userService = useUserService();
const route = useRoute();
const router = useRouter();

// State management
const postsList = ref<BlogPostItem[]>([]);

// Modal setup
const modalState = useAdminModalState<any>({
  getItems: async (id) => {
    return await blogService.getBlogPost(Number(id));
  }
});

// Form state variables
const formTitle = ref('');
const formContent = ref('');
const formAuthorId = ref<number | null>(null);
const formFeaturedImage = ref('');
const originalFeaturedImage = ref('');
const formFeaturedImageAltText = ref('');
const formSelectedCategories = ref<number[]>([]);
const formSelectedTags = ref<number[]>([]);
const formSeoTitle = ref('');
const formSeoDescription = ref('');
const formSeoFocusKeyword = ref('');
const formSeoNoindex = ref(false);
const formSeoNofollow = ref(false);

const isSaving = ref(false);
const formError = ref<string | null>(null);

// Option lists
const categoriesList = ref<Category[]>([]);
const tagsList = ref<BlogTag[]>([]);
const usersList = ref<UserItem[]>([]);
const areOptionsLoaded = ref(false);

// File upload state variables
const featuredImageFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const previewObjectUrl = ref<string | null>(null);

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toastError('Featured image file size must not exceed 10MB.');
      return;
    }
    featuredImageFile.value = file;
    if (previewObjectUrl.value) {
      URL.revokeObjectURL(previewObjectUrl.value);
    }
    previewObjectUrl.value = URL.createObjectURL(file);
    formFeaturedImage.value = previewObjectUrl.value;
  }
};

const triggerFileSelect = () => {
  fileInput.value?.click();
};

const removeSelectedFile = () => {
  featuredImageFile.value = null;
  formFeaturedImage.value = originalFeaturedImage.value || '';
  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value);
    previewObjectUrl.value = null;
  }
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const toggleCategory = (catId: string | number) => {
  const numericId = Number(catId);
  const index = formSelectedCategories.value.indexOf(numericId);
  if (index === -1) {
    formSelectedCategories.value.push(numericId);
  } else {
    formSelectedCategories.value.splice(index, 1);
  }
};

const mappedCategories = computed(() => {
  if (!formSelectedCategories.value || formSelectedCategories.value.length === 0) {
    return [];
  }
  return formSelectedCategories.value.map(catId => {
    const numId = Number(catId);
    const fromEntity = modalState.activeEntity.value?.categories?.find((c: any) => Number(c.id) === numId);
    if (fromEntity && fromEntity.name) {
      return { id: numId, name: fromEntity.name };
    }
    const fromList = categoriesList.value.find((c: any) => Number(c.id) === numId);
    if (fromList && fromList.name) {
      return { id: numId, name: fromList.name };
    }
    const fromPagination = categoryPagination.items.value.find((c: any) => Number(c.id) === numId);
    if (fromPagination && fromPagination.name) {
      return { id: numId, name: fromPagination.name };
    }
    return { id: numId, name: `Category #${numId}` };
  });
});

const toggleTag = (tagId: string | number) => {
  const numericId = Number(tagId);
  const index = formSelectedTags.value.indexOf(numericId);
  if (index === -1) {
    formSelectedTags.value.push(numericId);
  } else {
    formSelectedTags.value.splice(index, 1);
  }
};

const loadOptions = async () => {
  if (areOptionsLoaded.value) return;
  try {
    const [catsRes, tagsRes, usersRes] = await Promise.all([
      categoryService.getCategoriesList({ page_size: 100 }),
      blogService.getBlogTags({ page_size: 100 }),
      userService.getUsers({ page_size: 100 })
    ]);
    categoriesList.value = catsRes.results;
    tagsList.value = tagsRes.results;
    usersList.value = usersRes.results;
    areOptionsLoaded.value = true;
  } catch (err) {
    console.error('Failed to load form options:', err);
  }
};

const resetForm = () => {
  formTitle.value = '';
  formContent.value = '';
  formAuthorId.value = null;
  formFeaturedImage.value = '';
  originalFeaturedImage.value = '';
  formFeaturedImageAltText.value = '';
  formSelectedCategories.value = [];
  formSelectedTags.value = [];
  formSeoTitle.value = '';
  formSeoDescription.value = '';
  formSeoFocusKeyword.value = '';
  formSeoNoindex.value = false;
  formSeoNofollow.value = false;
  formError.value = null;
  featuredImageFile.value = null;
  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value);
    previewObjectUrl.value = null;
  }
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// Watch modal state to populate/reset fields lazily
watch(
  [modalState.activeEntity, modalState.isCreate, modalState.isOpen],
  ([post, isCreate, isOpen]) => {
    if (!isOpen) {
      resetForm();
      return;
    }
    
    // Lazy workflow option loading
    loadOptions();

    if (isCreate) {
      resetForm();
    } else if (post) {
      formTitle.value = post.title || '';
      formContent.value = post.content || '';
      formAuthorId.value = post.author?.id || null;
      formFeaturedImage.value = post.featured_image || '';
      originalFeaturedImage.value = post.featured_image || '';
      formFeaturedImageAltText.value = post.featured_image_alt_text || '';
      formSelectedCategories.value = post.categories ? post.categories.map((c: any) => Number(c.id)) : [];
      formSelectedTags.value = post.tags ? post.tags.map((t: any) => Number(t.id)) : [];
      formSeoTitle.value = post.seo_title || '';
      formSeoDescription.value = post.seo_description || '';
      formSeoFocusKeyword.value = post.seo_focus_keyword || '';
      formSeoNoindex.value = !!post.seo_noindex;
      formSeoNofollow.value = !!post.seo_nofollow;
      featuredImageFile.value = null;
      formError.value = null;
      if (previewObjectUrl.value) {
        URL.revokeObjectURL(previewObjectUrl.value);
        previewObjectUrl.value = null;
      }
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    }
  },
  { immediate: true }
);

const handleSavePost = async () => {
  if (!formTitle.value.trim()) {
    formError.value = 'Title is a required field.';
    toastError('Title is a required field.');
    return;
  }
  if (!formAuthorId.value) {
    formError.value = 'Please select an Author.';
    toastError('Please select an Author.');
    return;
  }

  isSaving.value = true;
  formError.value = null;
  try {
    const payload = {
      title: formTitle.value,
      content: formContent.value,
      author: formAuthorId.value,
      featured_image: featuredImageFile.value,
      featured_image_alt_text: formFeaturedImageAltText.value,
      categories: formSelectedCategories.value,
      tags: formSelectedTags.value,
      seo_title: formSeoTitle.value,
      seo_description: formSeoDescription.value,
      seo_focus_keyword: formSeoFocusKeyword.value,
      seo_noindex: formSeoNoindex.value,
      seo_nofollow: formSeoNofollow.value
    };

    if (modalState.isCreate.value) {
      await blogService.createBlogPost(payload);
      toastSuccess('Blog post created successfully.');
    } else {
      await blogService.updateBlogPost(String(modalState.activeId.value), payload);
      toastSuccess('Blog post updated successfully.');
    }
    await modalState.closeModal();
    await fetchPosts();
  } catch (err: any) {
    formError.value = err.message || 'Failed to save blog post changes.';
    handleApiError(err, 'Failed to save blog post.');
  } finally {
    isSaving.value = false;
  }
};
const totalCount = ref<number>(0);
const isLoading = ref<boolean>(false);
const errorMsg = ref<string | null>(null);

// Parse initial category IDs from URL query (?categories=1,5,8 or ?category=1)
const parseCategoryIdsFromQuery = (queryVal: any): string[] => {
  if (!queryVal) return [];
  if (Array.isArray(queryVal)) {
    return queryVal
      .map(String)
      .flatMap(v => v.split(','))
      .map(s => s.trim())
      .filter(s => s && /^\d+$/.test(s));
  }
  return String(queryVal)
    .split(',')
    .map(s => s.trim())
    .filter(s => s && /^\d+$/.test(s));
};

const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const selectedCategoryIds = ref<string[]>(parseCategoryIdsFromQuery(route.query.categories || route.query.category));
const authorId = ref(route.query.author ? parseInt(String(route.query.author)) : undefined);
const tagId = ref(route.query.tag ? parseInt(String(route.query.tag)) : undefined);
const status = ref(route.query.status ? String(route.query.status) : undefined);
const publishedAfter = ref(route.query.published_after ? String(route.query.published_after) : undefined);
const publishedBefore = ref(route.query.published_before ? String(route.query.published_before) : undefined);

// Category search and infinite-scrolling picker options for List filter
const categorySearchQuery = ref('');
const isCategoryDropdownOpen = ref(false);
const categoryDropdownRef = ref<HTMLElement | null>(null);

const categoryPagination = useInfinitePagination<Category>({
  fetcher: async (params) => {
    return await categoryService.getCategoriesList({
      page: params.page,
      page_size: 10,
      search: params.search
    });
  },
  search: categorySearchQuery,
  pageSize: 10,
  dedupeKey: (c) => String(c.id),
  autoFetch: false
});

const toggleCategoryDropdown = () => {
  isCategoryDropdownOpen.value = !isCategoryDropdownOpen.value;
  if (isCategoryDropdownOpen.value && categoryPagination.items.value.length === 0) {
    categoryPagination.refresh();
  }
};

const closeCategoryDropdown = () => {
  isCategoryDropdownOpen.value = false;
};

const toggleCategorySelection = (categoryId: string | number) => {
  const idStr = String(categoryId);
  const index = selectedCategoryIds.value.indexOf(idStr);
  if (index > -1) {
    selectedCategoryIds.value.splice(index, 1);
  } else {
    selectedCategoryIds.value.push(idStr);
  }
};

const isCategorySelected = (categoryId: string | number) => {
  return selectedCategoryIds.value.includes(String(categoryId));
};

const clearCategorySelection = () => {
  selectedCategoryIds.value = [];
};

const activeCategoriesButtonLabel = computed(() => {
  if (selectedCategoryIds.value.length === 0) {
    return 'All Categories';
  }
  if (selectedCategoryIds.value.length === 1) {
    const singleId = selectedCategoryIds.value[0];
    const found = categoryPagination.items.value.find(c => String(c.id) === singleId)
      || categoriesList.value.find(c => String(c.id) === singleId);
    return found ? decodeHtmlEntities(found.name) : `Category #${singleId}`;
  }
  return `${selectedCategoryIds.value.length} Categories`;
});

const clearAllFilters = () => {
  searchQuery.value = '';
  selectedCategoryIds.value = [];
  authorId.value = undefined;
  tagId.value = undefined;
  status.value = undefined;
  publishedAfter.value = undefined;
  publishedBefore.value = undefined;
};

// Document click / keyboard listeners for category popover dismiss
const onDocumentClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement | null;
  if (isCategoryDropdownOpen.value && categoryDropdownRef.value && !categoryDropdownRef.value.contains(target)) {
    closeCategoryDropdown();
  }
};

const onDocumentKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isCategoryDropdownOpen.value) {
      closeCategoryDropdown();
    }
  }
};

const { hasPermission } = useAdminPermissions();

const fetchPosts = async () => {
  if (!hasPermission('blog_api.view_blogpost')) {
    errorMsg.value = 'Access denied. The blog_api.view_blogpost permission is required to view blog posts.';
    return;
  }

  isLoading.value = true;
  errorMsg.value = null;

  try {
    const categoriesParam = selectedCategoryIds.value.length > 0
      ? selectedCategoryIds.value.join(',')
      : undefined;

    const data = await blogService.getBlogPosts({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: debouncedSearchQuery.value || undefined,
      author: authorId.value,
      categories: categoriesParam,
      tag: tagId.value,
      status: status.value as 'DRAFT' | 'PUBLISHED' | undefined,
      published_after: publishedAfter.value,
      published_before: publishedBefore.value,
    });
    postsList.value = data.results;
    totalCount.value = data.count;

    router.replace({
      query: {
        ...route.query,
        page: currentPage.value !== 1 ? currentPage.value : undefined,
        pageSize: itemsPerPage.value !== 10 ? itemsPerPage.value : undefined,
        search: debouncedSearchQuery.value || undefined,
        author: authorId.value || undefined,
        categories: categoriesParam,
        category: undefined,
        tag: tagId.value || undefined,
        status: status.value || undefined,
        published_after: publishedAfter.value || undefined,
        published_before: publishedBefore.value || undefined,
      }
    });
  } catch (err: any) {
    errorMsg.value = blogService.errorMsg.value || 'Failed to retrieve blog posts.';
  } finally {
    isLoading.value = false;
  }
};

watch(
  [
    debouncedSearchQuery, 
    () => selectedCategoryIds.value.join(','), 
    authorId, 
    tagId, 
    status, 
    publishedAfter, 
    publishedBefore,
    itemsPerPage
  ], 
  () => {
    currentPage.value = 1;
    fetchPosts();
  }
);

onMounted(async () => {
  await fetchPosts();
  if (selectedCategoryIds.value.length > 0) {
    categoryPagination.refresh();
  }
  if (typeof window !== 'undefined') {
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onDocumentKeydown);
  }
});

const totalPages = computed(() => {
  return Math.ceil(totalCount.value / itemsPerPage.value) || 1;
});

const tableColumns: UiTableColumn<BlogPostItem>[] = [
  { key: 'featured_image', label: 'Image', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'title', label: 'Title', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'author', label: 'Author', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'status', label: 'Status', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'published_at', label: 'Published Date', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'created_at', label: 'Created Date', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'actions', label: 'Actions', headerClass: 'px-4 py-3 text-right', cellClass: 'px-4 py-2.5 text-right' },
];

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchPosts();
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '—';
  }
};

const isDeleting = ref<number | null>(null);

const handleDeletePost = async (post: BlogPostItem) => {
  if (!hasPermission('blog_api.delete_blogpost')) {
    toastError('You do not have permission to delete blog posts.');
    return;
  }

  const confirmMsg = `Verify Decommissioning: Are you sure you want to delete the blog post "${post.title}"? This action is permanent and cannot be undone.`;
  if (!confirm(confirmMsg)) {
    return;
  }

  isDeleting.value = post.id;
  try {
    await blogService.deleteBlogPost(post.id);
    toastSuccess(`Blog post "${post.title}" deleted successfully.`);
    
    // Adjust page if we deleted the last item on current page
    if (postsList.value.length === 1 && currentPage.value > 1) {
      currentPage.value -= 1;
    }
    await fetchPosts();
  } catch (err: any) {
    handleApiError(err, 'Failed to delete blog post.');
  } finally {
    isDeleting.value = null;
  }
};

const isUnpublishing = ref<number | null>(null);

const handleUnpublishPost = async (post: BlogPostItem) => {
  if (post.status !== 'PUBLISHED') {
    toastError('This blog post is not published.');
    return;
  }

  if (!hasPermission('blog_api.unpublish_blog_post')) {
    toastError('You do not have permission to unpublish blog posts.');
    return;
  }

  const confirmMsg = `Are you sure you want to unpublish the blog post "${post.title}"? It will revert to draft status.`;
  if (!confirm(confirmMsg)) {
    return;
  }

  isUnpublishing.value = post.id;
  try {
    const updatedPost = await blogService.unpublishBlogPost(post.id);
    toastSuccess(`Blog post "${post.title}" unpublished successfully.`);
    
    // Update state using the existing list-fetching/state pattern so the status is immediately correct
    const index = postsList.value.findIndex(p => p.id === post.id);
    if (index !== -1) {
      postsList.value[index] = updatedPost;
    } else {
      await fetchPosts();
    }
  } catch (err: any) {
    handleApiError(err, 'Failed to unpublish blog post.');
  } finally {
    isUnpublishing.value = null;
  }
};

const isPublishing = ref<number | null>(null);

const handlePublishPost = async (post: BlogPostItem) => {
  if (post.status === 'PUBLISHED') {
    toastError('This blog post is already published.');
    return;
  }

  if (!hasPermission('blog_api.publish_blog_post')) {
    toastError('You do not have permission to publish blog posts.');
    return;
  }

  const confirmMsg = `Are you sure you want to publish the blog post "${post.title}"? It will become visible to the public.`;
  if (!confirm(confirmMsg)) {
    return;
  }

  isPublishing.value = post.id;
  try {
    const updatedPost = await blogService.publishBlogPost(post.id);
    toastSuccess(`Blog post "${post.title}" published successfully.`);
    
    // Update state using the existing list-fetching/state pattern so the status is immediately correct
    const index = postsList.value.findIndex(p => p.id === post.id);
    if (index !== -1) {
      postsList.value[index] = updatedPost;
    } else {
      await fetchPosts();
    }
  } catch (err: any) {
    handleApiError(err, 'Failed to publish blog post.');
  } finally {
    isPublishing.value = null;
  }
};
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          Blog Posts
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton 
          variant="outline" 
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs cursor-pointer"
          @click="fetchPosts"
          :disabled="isLoading"
        >
          <RefreshCw :class="['w-3.5 h-3.5', isLoading && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>

        <UiButton 
          v-if="hasPermission('blog_api.add_blogpost')"
          @click="modalState.openCreate()"
          class="rounded-xl h-9 px-4 gap-1.5 shadow-md shadow-primary/20 bg-primary text-primary-foreground font-bold text-xs cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Create Blog Post</span>
        </UiButton>
      </div>
    </template>

    <div class="space-y-4">

      <!-- Filters -->
      <UiCard class="p-3.5 flex flex-wrap gap-3 items-center">
        <UiSearchInput v-model="searchQuery" placeholder="Search posts..." class="w-full sm:w-64" />
        
        <!-- Category Multi-Select Popover -->
        <div ref="categoryDropdownRef" class="relative">
          <button
            type="button"
            @click.stop="toggleCategoryDropdown"
            class="h-9 px-3 bg-background border border-input rounded-lg outline-none text-xs font-medium cursor-pointer text-foreground focus:ring-2 focus:ring-ring/20 transition-all flex items-center justify-between gap-2 min-w-[170px]"
            :class="selectedCategoryIds.length > 0 ? 'border-primary/50 text-foreground font-semibold' : 'text-muted-foreground'"
          >
            <div class="flex items-center gap-1.5 truncate">
              <Filter class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span class="truncate">{{ activeCategoriesButtonLabel }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <span 
                v-if="selectedCategoryIds.length > 0" 
                class="px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full leading-none"
              >
                {{ selectedCategoryIds.length }}
              </span>
              <ChevronDown :class="['w-3.5 h-3.5 transition-transform duration-200', isCategoryDropdownOpen && 'rotate-180']" />
            </div>
          </button>

          <!-- Category Options Popover Menu -->
          <div 
            v-if="isCategoryDropdownOpen"
            @click.stop
            class="absolute left-0 z-30 mt-1.5 w-72 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-lg p-2 text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
          >
            <!-- Category Search Input inside Popover -->
            <div class="relative mb-2">
              <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                v-model="categorySearchQuery"
                type="text"
                placeholder="Search categories..."
                class="w-full h-8 pl-8 pr-2.5 text-xs bg-muted/50 border border-input rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <!-- Clear / Select All action -->
            <div class="flex items-center justify-between px-1 py-1 mb-1 border-b border-border/60 text-[11px]">
              <span class="text-muted-foreground font-semibold">Filter by Category</span>
              <button
                v-if="selectedCategoryIds.length > 0"
                type="button"
                @click="clearCategorySelection"
                class="text-primary hover:underline font-bold cursor-pointer"
              >
                Clear all ({{ selectedCategoryIds.length }})
              </button>
            </div>

            <!-- Categories Infinite List -->
            <div class="max-h-60 overflow-y-auto space-y-0.5 p-0.5 scrollbar-thin">
              <button
                type="button"
                @click="clearCategorySelection"
                :class="[
                  'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer',
                  selectedCategoryIds.length === 0 ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                ]"
              >
                <span>All Categories</span>
                <Check v-if="selectedCategoryIds.length === 0" class="w-3.5 h-3.5 text-primary" />
              </button>

              <button
                v-for="cat in categoryPagination.items.value"
                :key="cat.id"
                type="button"
                @click="toggleCategorySelection(cat.id)"
                :class="[
                  'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer',
                  isCategorySelected(cat.id) ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                ]"
              >
                <span class="truncate">{{ decodeHtmlEntities(cat.name) }}</span>
                <div 
                  class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                  :class="isCategorySelected(cat.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background'"
                >
                  <Check v-if="isCategorySelected(cat.id)" class="w-3 h-3 stroke-[3]" />
                </div>
              </button>

              <!-- Loading spinner when initial loading -->
              <div v-if="categoryPagination.isLoading.value && categoryPagination.items.value.length === 0" class="py-4 text-center text-muted-foreground flex items-center justify-center gap-2 text-xs">
                <Loader2 class="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Loading categories...</span>
              </div>

              <!-- Infinite Scroll Sentinel for Next Category Pages -->
              <UiInfiniteScroll
                :has-more="categoryPagination.hasMore.value"
                :is-loading="categoryPagination.isFetchingNextPage.value"
                :error="categoryPagination.error.value"
                @load-more="categoryPagination.loadNextPage"
                @retry="categoryPagination.loadNextPage"
              />
            </div>
          </div>
        </div>

        <select v-model="status" class="h-9 px-3 text-sm border rounded-lg bg-background">
          <option :value="undefined">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>

        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-muted-foreground">From:</label>
          <input v-model="publishedAfter" type="datetime-local" class="h-9 px-3 text-sm border rounded-lg bg-background" />
        </div>
        
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-muted-foreground">To:</label>
          <input v-model="publishedBefore" type="datetime-local" class="h-9 px-3 text-sm border rounded-lg bg-background" />
        </div>

        <input v-model.number="authorId" type="number" placeholder="Author ID" class="h-9 px-3 text-sm border rounded-lg w-24 bg-background" />
        <input v-model.number="tagId" type="number" placeholder="Tag ID" class="h-9 px-3 text-sm border rounded-lg w-20 bg-background" />

        <!-- Clear all filters button -->
        <button
          v-if="searchQuery || selectedCategoryIds.length > 0 || authorId || tagId || status || publishedAfter || publishedBefore"
          type="button"
          @click="clearAllFilters"
          class="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          title="Clear all filters"
        >
          <X class="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </UiCard>

      <UiCard class="p-0">
        <UiTable :columns="tableColumns" :data="postsList" :loading="isLoading">
          <template #cell-featured_image="{ item: post }">
            <img v-if="post.featured_image" :src="post.featured_image" :alt="post.featured_image_alt_text || post.title" class="w-12 h-12 object-cover rounded-lg" />
            <span v-else class="text-muted-foreground">—</span>
          </template>
          <template #cell-author="{ item: post }">
            {{ post.author ? (post.author.full_name || post.author.username || '—') : '—' }}
          </template>
          <template #cell-published_at="{ item: post }">
            {{ formatDate(post.published_at) }}
          </template>
          <template #cell-created_at="{ item: post }">
            {{ formatDate(post.created_at) }}
          </template>
          <template #cell-actions="{ item: post }">
            <div class="flex items-center justify-end gap-2">
              <UiButton
                v-if="hasPermission('blog_api.change_blogpost')"
                @click="modalState.openEdit(post.id)"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 cursor-pointer"
                title="Edit Blog Post"
              >
                <Pencil class="w-4 h-4 text-primary" />
                <span class="sr-only">Edit</span>
              </UiButton>
              <UiButton
                v-if="post.status === 'PUBLISHED' && hasPermission('blog_api.unpublish_blog_post')"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0"
                title="Unpublish Blog Post"
                :disabled="isUnpublishing === post.id"
                @click="handleUnpublishPost(post)"
              >
                <span v-if="isUnpublishing === post.id" class="animate-spin border-2 border-amber-500/30 border-t-amber-500 rounded-full w-4 h-4"></span>
                <EyeOff v-else class="w-4 h-4 text-amber-500" />
                <span class="sr-only">Unpublish</span>
              </UiButton>
              <UiButton
                v-if="post.status !== 'PUBLISHED' && hasPermission('blog_api.publish_blog_post')"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0"
                title="Publish Blog Post"
                :disabled="isPublishing === post.id"
                @click="handlePublishPost(post)"
              >
                <span v-if="isPublishing === post.id" class="animate-spin border-2 border-emerald-500/30 border-t-emerald-500 rounded-full w-4 h-4"></span>
                <Eye class="w-4 h-4 text-emerald-500" />
                <span class="sr-only">Publish</span>
              </UiButton>
              <UiButton
                v-if="hasPermission('blog_api.delete_blogpost')"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0"
                title="Delete Blog Post"
                :disabled="isDeleting === post.id"
                @click="handleDeletePost(post)"
              >
                <span v-if="isDeleting === post.id" class="animate-spin border-2 border-rose-500/30 border-t-rose-500 rounded-full w-4 h-4"></span>
                <Trash2 class="w-4 h-4 text-rose-500" />
                <span class="sr-only">Delete</span>
              </UiButton>
            </div>
          </template>
          <template #empty>
            <div class="text-center py-8 text-muted-foreground space-y-3">
              <p>No blog posts found.</p>
              <UiButton
                v-if="searchQuery || selectedCategoryIds.length > 0 || authorId || tagId || status || publishedAfter || publishedBefore"
                variant="outline"
                size="sm"
                @click="clearAllFilters"
                class="text-xs cursor-pointer"
              >
                Clear all filters
              </UiButton>
            </div>
          </template>
        </UiTable>
      </UiCard>

      <UiPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-count="totalCount"
        :items-per-page="itemsPerPage"
        @update:current-page="handlePageChange"
      />
    </div>

    <!-- Create/Edit Blog Post Modal -->
    <UiAdminModal
      :is-open="modalState.isOpen.value && (modalState.isCreate.value || (modalState.isEdit.value && !!modalState.activeEntity.value))"
      max-width="max-w-5xl"
      :show-close-button="false"
      @close="modalState.closeModal()"
    >
      <form @submit.prevent="handleSavePost" class="w-full relative overflow-hidden flex flex-col cursor-default">
        <!-- Header -->
        <div class="p-6 border-b border-border flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-primary">Blog Management</span>
            <h3 class="text-xl font-display font-black tracking-tight text-foreground mt-0.5">
              {{ modalState.isCreate.value ? 'Create Blog Post' : 'Edit Blog Post' }}
            </h3>
          </div>
          <button 
            type="button" 
            @click="modalState.closeModal()" 
            class="w-9 h-9 border border-border rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div v-if="formError" class="p-3.5 bg-destructive/10 border border-destructive/20 flex items-start gap-3 rounded-xl text-destructive">
            <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
            <p class="text-xs font-semibold leading-relaxed">{{ formError }}</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Main Column (Title, Content, SEO) -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Title and Content -->
              <div class="space-y-4">
                <div class="space-y-2">
                  <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Post Title <span class="text-destructive">*</span></label>
                  <input 
                    v-model="formTitle" 
                    type="text" 
                    placeholder="Enter post title..." 
                    class="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                    required
                  />

                  <!-- Mapped Categories Chips (Immediately after Post Title) -->
                  <div 
                    v-if="mappedCategories.length > 0" 
                    class="flex flex-wrap items-center gap-1.5 pt-1"
                  >
                    <span
                      v-for="cat in mappedCategories"
                      :key="cat.id"
                      class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20 max-w-[240px] truncate"
                      :title="decodeHtmlEntities(cat.name)"
                    >
                      <Layers class="w-3 h-3 shrink-0 text-primary/70" />
                      <span class="truncate">{{ decodeHtmlEntities(cat.name) }}</span>
                    </span>
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1 mb-2 block">Formatted Content</label>
                  <UiRichTextEditor 
                    v-model="formContent" 
                    placeholder="Compose the post body content..."
                    min-height="min-h-[250px]"
                  />
                </div>
              </div>

              <!-- SEO Section -->
              <div class="border-t border-border pt-6 space-y-4">
                <h4 class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Globe class="w-4 h-4 text-primary" /> Search Engine Optimization
                </h4>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">SEO Meta Title</label>
                    <input 
                      v-model="formSeoTitle" 
                      type="text" 
                      placeholder="Leave empty to fallback to Title"
                      class="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-xs"
                    />
                  </div>

                  <div class="space-y-2">
                    <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">SEO Focus Keyword</label>
                    <input 
                      v-model="formSeoFocusKeyword" 
                      type="text" 
                      placeholder="Primary search query target"
                      class="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-xs"
                    />
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">SEO Meta Description</label>
                  <textarea 
                    v-model="formSeoDescription" 
                    rows="2" 
                    placeholder="Summary snippet for search results list..."
                    class="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-xs resize-none"
                  ></textarea>
                </div>

                <!-- SEO Robot Toggles -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div class="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-900">
                    <div>
                      <h4 class="text-xs font-bold">Exclude From Search (Noindex)</h4>
                      <p class="text-[10px] text-slate-400 font-medium">Prevent engines from indexing this post.</p>
                    </div>
                    <button 
                      type="button"
                      @click="formSeoNoindex = !formSeoNoindex"
                      class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      :class="formSeoNoindex ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'"
                    >
                      <span 
                        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                        :class="formSeoNoindex ? 'translate-x-5' : 'translate-x-0'"
                      />
                    </button>
                  </div>

                  <div class="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-900">
                    <div>
                      <h4 class="text-xs font-bold">Suppress Links (Nofollow)</h4>
                      <p class="text-[10px] text-slate-400 font-medium">Do not pass authority to links inside this post.</p>
                    </div>
                    <button 
                      type="button"
                      @click="formSeoNofollow = !formSeoNofollow"
                      class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      :class="formSeoNofollow ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'"
                    >
                      <span 
                        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                        :class="formSeoNofollow ? 'translate-x-5' : 'translate-x-0'"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar Column (Author, Asset, Taxonomy) -->
            <div class="space-y-6">
              <!-- Author Card -->
              <div class="space-y-4 border border-border p-5 rounded-2xl bg-card">
                <h4 class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <UserIcon class="w-4 h-4 text-primary" /> Authority Designation
                </h4>

                <div class="space-y-2">
                  <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Author Identity <span class="text-destructive">*</span></label>
                  <select 
                    v-model="formAuthorId" 
                    class="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-xs cursor-pointer"
                    required
                  >
                    <option :value="null" disabled>Select author...</option>
                    <option v-for="user in usersList" :key="user.id" :value="user.id">
                      {{ user.full_name || user.username }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Visual Assets Card -->
              <div class="space-y-4 border border-border p-5 rounded-2xl bg-card">
                <h4 class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <FileText class="w-4 h-4 text-primary" /> Visual Assets
                </h4>

                <div class="space-y-2">
                  <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Featured Image File</label>
                  <div class="flex items-center gap-2">
                    <UiButton 
                      type="button" 
                      variant="outline" 
                      class="rounded-xl h-9 px-3 font-bold text-xs border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 w-full flex items-center justify-center gap-2 cursor-pointer"
                      @click="triggerFileSelect"
                    >
                      <Upload class="w-3.5 h-3.5 text-primary" />
                      <span>{{ featuredImageFile ? 'Change File' : 'Select File' }}</span>
                    </UiButton>
                    <input 
                      ref="fileInput"
                      type="file" 
                      accept="image/*"
                      class="hidden" 
                      @change="handleFileSelect" 
                    />
                    <UiButton
                      v-if="featuredImageFile"
                      type="button"
                      variant="ghost"
                      class="h-9 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl shrink-0 cursor-pointer"
                      title="Remove Selected File"
                      @click="removeSelectedFile"
                    >
                      <Trash2 class="w-4 h-4" />
                    </UiButton>
                  </div>
                  <p v-if="featuredImageFile" class="text-[10px] font-bold text-emerald-600 truncate ml-1">
                    Selected: {{ featuredImageFile.name }}
                  </p>
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Asset Frame Preview</label>
                  <div class="border border-slate-150 dark:border-slate-850 rounded-xl overflow-hidden aspect-video bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-2 relative group">
                    <img 
                      v-if="formFeaturedImage" 
                      :src="formFeaturedImage" 
                      :alt="formFeaturedImageAltText" 
                      class="max-w-full max-h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                      @error="($event.target as HTMLImageElement).src = 'https://placehold.co/600x400/f8fafc/64748b?text=Invalid+Image+URL'"
                    />
                    <span v-else class="text-[10px] font-bold uppercase tracking-widest text-slate-400">No Asset Provided</span>
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Alternative Image Text</label>
                  <input 
                    v-model="formFeaturedImageAltText" 
                    type="text" 
                    placeholder="Alt description"
                    class="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-xs"
                  />
                </div>
              </div>

              <!-- Categorizations Card -->
              <div class="space-y-4 border border-border p-5 rounded-2xl bg-card">
                <h4 class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Layers class="w-4 h-4 text-primary" /> Categorization Domains
                </h4>

                <!-- Categories Checklist -->
                <div class="space-y-2">
                  <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1 block">Categories</label>
                  <div class="max-h-40 overflow-y-auto pr-1 space-y-1 border border-slate-100 dark:border-slate-900 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                    <label 
                      v-for="cat in categoriesList" 
                      :key="cat.id" 
                      class="flex items-center gap-2.5 cursor-pointer p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded transition-colors"
                    >
                      <input 
                        type="checkbox" 
                        :checked="formSelectedCategories.includes(Number(cat.id))"
                        @change="toggleCategory(cat.id)"
                        class="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary"
                      />
                      <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">{{ cat.name }}</span>
                    </label>
                    <div v-if="categoriesList.length === 0" class="text-[10px] uppercase font-bold tracking-widest text-slate-400 text-center py-2">
                      No Categories
                    </div>
                  </div>
                </div>

                <!-- Tags Checklist -->
                <div class="space-y-2">
                  <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1 block">Blog Tags</label>
                  <div class="max-h-40 overflow-y-auto pr-1 space-y-1 border border-slate-100 dark:border-slate-900 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                    <label 
                      v-for="tag in tagsList" 
                      :key="tag.id" 
                      class="flex items-center gap-2.5 cursor-pointer p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded transition-colors"
                    >
                      <input 
                        type="checkbox" 
                        :checked="formSelectedTags.includes(Number(tag.id))"
                        @change="toggleTag(tag.id)"
                        class="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary"
                      />
                      <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">{{ tag.name }}</span>
                    </label>
                    <div v-if="tagsList.length === 0" class="text-[10px] uppercase font-bold tracking-widest text-slate-400 text-center py-2">
                      No Tags
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-border bg-muted/20 flex items-center justify-end gap-3">
          <UiButton 
            type="button" 
            variant="outline" 
            class="rounded-xl h-9 px-4 font-bold text-xs cursor-pointer"
            @click="modalState.closeModal()"
            :disabled="isSaving"
          >
            Cancel
          </UiButton>
          <UiButton 
            type="submit" 
            variant="primary" 
            class="rounded-xl h-9 px-5 gap-2 font-bold text-xs cursor-pointer"
            :disabled="isSaving"
          >
            <Loader2 v-if="isSaving" class="w-3.5 h-3.5 animate-spin" />
            <Save v-else class="w-3.5 h-3.5" />
            <span>{{ isSaving ? 'Saving...' : (modalState.isCreate.value ? 'Create Blog Post' : 'Save Changes') }}</span>
          </UiButton>
        </div>
      </form>
    </UiAdminModal>
  </NuxtLayout>
</template>
