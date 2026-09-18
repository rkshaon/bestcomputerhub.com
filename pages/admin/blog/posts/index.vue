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
  Check,
  ExternalLink,
  Calendar,
  Clock
} from 'lucide-vue-next';
import { useBlogService } from '@/composables/useBlogService';
import { useCategoryService } from '@/composables/useCategoryService';
import { useUserService } from '@/composables/useUserService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { useInfinitePagination } from '@/composables/useInfinitePagination';
import { useAuthStore } from '@/stores/auth';
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
const authStore = useAuthStore();
const { hasPermission } = useAdminPermissions();
const route = useRoute();
const router = useRouter();

// State management
const postsList = ref<BlogPostItem[]>([]);

// Modal setup
const modalState = useAdminModalState<BlogPostItem>({
  getItems: async (id) => {
    return await blogService.getBlogPost(Number(id));
  },
  onResolveError: (id) => {
    toastError(`Blog post #${id} could not be resolved.`);
    modalState.closeModal({ replace: true });
  }
});

// Permissions
const canViewPost = computed(() => hasPermission('blog_api.view_blogpost'));
const canEditPost = computed(() => hasPermission('blog_api.change_blogpost'));
const canDeletePost = computed(() => hasPermission('blog_api.delete_blogpost'));

// Selected post for view modal
const selectedPost = computed<BlogPostItem | null>(() => modalState.activeEntity.value);

// Delete modal state
const selectedPostForDelete = ref<BlogPostItem | null>(null);
const isDeleting = ref(false);

const postToDelete = computed<BlogPostItem | null>(() => {
  return modalState.activeEntity.value || selectedPostForDelete.value || null;
});

watch(() => modalState.isDelete.value, (isOpen) => {
  if (isOpen && !canDeletePost.value) {
    toastError('You do not have permission to delete blog posts.');
    modalState.closeModal({ replace: true });
  }
  if (!isOpen) {
    if (!modalState.isView.value && !modalState.isEdit.value) {
      selectedPostForDelete.value = null;
    }
  }
}, { immediate: true });

// View Modal mapped categories
const viewMappedCategories = computed(() => {
  if (!selectedPost.value) return [];
  if (Array.isArray(selectedPost.value.categories) && selectedPost.value.categories.length > 0) {
    return selectedPost.value.categories.map((c: any) => {
      if (typeof c === 'object' && c !== null && c.name) {
        return { id: c.id, name: c.name, slug: c.slug };
      }
      const numId = Number(c);
      const fromList = categoriesList.value.find((cat: any) => Number(cat.id) === numId);
      if (fromList) return { id: numId, name: fromList.name, slug: fromList.slug };
      const fromPagination = categoryPagination.items.value.find((cat: any) => Number(cat.id) === numId);
      if (fromPagination) return { id: numId, name: fromPagination.name, slug: fromPagination.slug };
      return { id: numId, name: `Category #${numId}`, slug: '' };
    });
  }
  return [];
});

// View Modal mapped tags
const viewMappedTags = computed(() => {
  if (!selectedPost.value) return [];
  if (Array.isArray(selectedPost.value.tags) && selectedPost.value.tags.length > 0) {
    return selectedPost.value.tags.map((t: any) => {
      if (typeof t === 'object' && t !== null && t.name) {
        return { id: t.id, name: t.name, slug: t.slug };
      }
      const numId = Number(t);
      const fromList = tagsList.value.find((tag: any) => Number(tag.id) === numId);
      if (fromList) return { id: numId, name: fromList.name, slug: fromList.slug };
      return { id: numId, name: `Tag #${numId}`, slug: '' };
    });
  }
  return [];
});

const getStorefrontBlogUrl = (post?: BlogPostItem | null) => {
  if (!post || !post.slug) return '/blog/';
  return `/blog/${post.slug}/`;
};

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
const isOptionsLoading = ref(false);
const isAuthorManuallyModified = ref(false);

const postHasAuthor = (post: BlogPostItem | null | undefined): boolean => {
  if (!post || !post.author) return false;
  if (typeof post.author === 'object') {
    const aId = (post.author as any).id;
    if (aId !== undefined && aId !== null && aId !== '' && aId !== 0) {
      return true;
    }
    const username = (post.author as any).username;
    const email = (post.author as any).email;
    const fullName = (post.author as any).full_name;
    return Boolean((username && String(username).trim()) || (email && String(email).trim()) || (fullName && String(fullName).trim()));
  }
  return Boolean(post.author);
};

const isAuthorFieldVisible = computed(() => {
  if (modalState.isCreate.value) return true;
  if (modalState.isEdit.value) {
    return postHasAuthor(modalState.activeEntity.value);
  }
  return false;
});

const resolveDefaultAuthorId = (): number | null => {
  const currentUserId = authStore.user?.id;
  if (currentUserId === undefined || currentUserId === null || currentUserId === '') {
    return null;
  }
  const matchedUser = usersList.value.find(u => String(u.id) === String(currentUserId));
  if (matchedUser) {
    return Number(matchedUser.id);
  }
  const numId = Number(currentUserId);
  return isNaN(numId) ? null : numId;
};

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

// Modal Category Selector State
const isModalCategoryDropdownOpen = ref(false);
const modalCategoryDropdownRef = ref<HTMLElement | null>(null);
const modalCategoryDropdownTriggerRef = ref<HTMLButtonElement | null>(null);
const modalCategorySearchInputRef = ref<HTMLInputElement | null>(null);
const modalCategorySearchQuery = ref('');

const modalCategoryPagination = useInfinitePagination<Category>({
  fetcher: async (params) => {
    return await categoryService.getCategoriesList({
      page: params.page,
      page_size: 10,
      search: params.search
    });
  },
  search: modalCategorySearchQuery,
  pageSize: 10,
  dedupeKey: (c) => String(c.id),
  autoFetch: false
});

const toggleModalCategoryDropdown = async () => {
  isModalCategoryDropdownOpen.value = !isModalCategoryDropdownOpen.value;
  if (isModalCategoryDropdownOpen.value) {
    if (modalCategoryPagination.items.value.length === 0) {
      modalCategoryPagination.refresh();
    }
    await nextTick();
    modalCategorySearchInputRef.value?.focus();
  } else {
    modalCategoryDropdownTriggerRef.value?.focus();
  }
};

const closeModalCategoryDropdown = (restoreFocus = false) => {
  if (isModalCategoryDropdownOpen.value) {
    isModalCategoryDropdownOpen.value = false;
    if (restoreFocus) {
      nextTick(() => {
        modalCategoryDropdownTriggerRef.value?.focus();
      });
    }
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

const isRemovingCategoryId = ref<number | null>(null);

const removeModalCategorySelection = (categoryId: number) => {
  const index = formSelectedCategories.value.indexOf(categoryId);
  if (index > -1) {
    formSelectedCategories.value.splice(index, 1);
  }
};

const handleRemoveCategory = async (catId: number | string) => {
  const numericId = Number(catId);
  if (isRemovingCategoryId.value !== null) return;

  // In Create mode, simply remove from local form state
  if (modalState.isCreate.value) {
    removeModalCategorySelection(numericId);
    return;
  }

  // In Edit mode, execute the DELETE request against the API
  if (modalState.isEdit.value && modalState.activeId.value) {
    if (!hasPermission('blog_api.change_blogpost')) {
      toastError('Permission denied. You do not have permission to modify this blog post.');
      return;
    }

    isRemovingCategoryId.value = numericId;
    try {
      const postId = String(modalState.activeId.value);
      const res = await blogService.removeBlogPostCategory(postId, numericId);

      // Remove from active form selection
      removeModalCategorySelection(numericId);

      // Resolve updated categories list from response if provided, otherwise filter locally
      let updatedCategories: any[] = [];
      if (res && Array.isArray(res.categories)) {
        updatedCategories = res.categories;
      } else {
        const currentCategories = modalState.activeEntity.value?.categories || [];
        updatedCategories = currentCategories.filter((c: any) => Number(c.id) !== numericId);
      }

      if (modalState.activeEntity.value) {
        modalState.activeEntity.value = {
          ...modalState.activeEntity.value,
          categories: updatedCategories
        };
      }

      // Update post in table list if present
      const postIndex = postsList.value.findIndex(p => String(p.id) === postId);
      if (postIndex !== -1 && postsList.value[postIndex]) {
        postsList.value[postIndex] = {
          ...postsList.value[postIndex],
          categories: updatedCategories
        };
      }

      toastSuccess('Category removed from blog post.');
    } catch (err: any) {
      handleApiError(err, 'Failed to remove category from blog post.');
    } finally {
      isRemovingCategoryId.value = null;
    }
  }
};

const clearModalCategorySelection = () => {
  formSelectedCategories.value = [];
};

const getModalCategoryNameById = (id: number): string => {
  const fromEntity = modalState.activeEntity.value?.categories?.find((c: any) => Number(c.id) === id);
  if (fromEntity && fromEntity.name) return decodeHtmlEntities(fromEntity.name);
  const fromList = categoriesList.value.find((c: any) => Number(c.id) === id);
  if (fromList && fromList.name) return decodeHtmlEntities(fromList.name);
  const fromModalPagination = modalCategoryPagination.items.value.find((c: any) => Number(c.id) === id);
  if (fromModalPagination && fromModalPagination.name) return decodeHtmlEntities(fromModalPagination.name);
  const fromFilterPagination = categoryPagination.items.value.find((c: any) => Number(c.id) === id);
  if (fromFilterPagination && fromFilterPagination.name) return decodeHtmlEntities(fromFilterPagination.name);
  return `Category #${id}`;
};

const getCategoryNameById = getModalCategoryNameById;

const mappedCategories = computed(() => {
  if (!formSelectedCategories.value || formSelectedCategories.value.length === 0) {
    return [];
  }
  return formSelectedCategories.value.map(catId => {
    const numId = Number(catId);
    return {
      id: numId,
      name: getModalCategoryNameById(numId)
    };
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
  isOptionsLoading.value = true;
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

    // In Create mode, if the author has not been manually changed by the user, ensure the default author is set and matches options
    if (modalState.isCreate.value && !isAuthorManuallyModified.value) {
      const defaultAuthor = resolveDefaultAuthorId();
      if (defaultAuthor !== null) {
        formAuthorId.value = defaultAuthor;
      }
    }
  } catch (err) {
    console.error('Failed to load form options:', err);
  } finally {
    isOptionsLoading.value = false;
  }
};

const resetForm = () => {
  formTitle.value = '';
  formContent.value = '';
  isAuthorManuallyModified.value = false;
  formAuthorId.value = resolveDefaultAuthorId();
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
  isModalCategoryDropdownOpen.value = false;
  modalCategorySearchQuery.value = '';
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
  [modalState.activeEntity, modalState.isCreate, modalState.isEdit, modalState.isOpen],
  ([post, isCreate, isEdit, isOpen]) => {
    if (!isOpen) {
      resetForm();
      return;
    }
    
    // Lazy workflow option loading for create and edit
    if (isCreate || isEdit) {
      loadOptions();
      if (modalCategoryPagination.items.value.length === 0) {
        modalCategoryPagination.refresh();
      }
    }

    if (isCreate) {
      resetForm();
      // If user profile is not yet loaded in authStore, fetch it to resolve author
      if (!authStore.user && authStore.isLoggedIn) {
        authStore.fetchUserProfile().then(() => {
          if (modalState.isCreate.value && !isAuthorManuallyModified.value) {
            formAuthorId.value = resolveDefaultAuthorId();
          }
        }).catch(() => {});
      }
    } else if (isEdit && post) {
      isAuthorManuallyModified.value = false;
      formTitle.value = post.title || '';
      formContent.value = post.content || '';
      if (postHasAuthor(post)) {
        if (typeof post.author === 'object' && post.author !== null) {
          formAuthorId.value = post.author.id ? Number(post.author.id) : null;
        } else if (typeof post.author === 'number' || typeof post.author === 'string') {
          formAuthorId.value = Number(post.author) || null;
        } else {
          formAuthorId.value = null;
        }
      } else {
        formAuthorId.value = null;
      }
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
      isModalCategoryDropdownOpen.value = false;
      modalCategorySearchQuery.value = '';
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
  if (isAuthorFieldVisible.value && !formAuthorId.value) {
    formError.value = 'Please select an Author.';
    toastError('Please select an Author.');
    return;
  }

  isSaving.value = true;
  formError.value = null;
  try {
    const payload: Record<string, any> = {
      title: formTitle.value,
      content: formContent.value,
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

    // Include author only if creating, or if the post has an author and the field is visible
    if (modalState.isCreate.value || (modalState.isEdit.value && isAuthorFieldVisible.value && formAuthorId.value !== null)) {
      payload.author = formAuthorId.value;
    }

    if (modalState.isCreate.value) {
      const createdPost = await blogService.createBlogPost(payload);
      // Synchronize category assignment on newly created post if categories were selected
      if (createdPost?.id && formSelectedCategories.value.length > 0) {
        try {
          const catRes = await blogService.assignBlogPostCategories(createdPost.id, formSelectedCategories.value);
          if (catRes && Array.isArray(catRes.categories)) {
            createdPost.categories = catRes.categories;
          }
        } catch (catErr) {
          console.warn('Post created, but category assignment sync failed:', catErr);
        }
      }
      toastSuccess('Blog post created successfully.');
    } else {
      const postId = String(modalState.activeId.value);
      // 1. Keep the existing blog post update flow unchanged
      const updatedPost = await blogService.updateBlogPost(postId, payload);

      // 2. On save, call the category endpoint with the selected category IDs
      const catRes = await blogService.assignBlogPostCategories(postId, formSelectedCategories.value);

      // 3. After a successful request, update the local blog post state with the returned `categories` data
      let updatedCategories: any[] = [];
      if (catRes && Array.isArray(catRes.categories)) {
        updatedCategories = catRes.categories;
      } else if (catRes && Array.isArray(catRes)) {
        updatedCategories = catRes;
      } else if (updatedPost && Array.isArray(updatedPost.categories)) {
        updatedCategories = updatedPost.categories;
      }

      if (modalState.activeEntity.value) {
        modalState.activeEntity.value = {
          ...modalState.activeEntity.value,
          ...updatedPost,
          categories: updatedCategories.length > 0 ? updatedCategories : modalState.activeEntity.value.categories
        };
      }

      // Update the local posts list array immediately
      const postIndex = postsList.value.findIndex(p => String(p.id) === String(postId));
      const existingPost = postIndex !== -1 ? postsList.value[postIndex] : undefined;
      if (postIndex !== -1 && existingPost) {
        postsList.value[postIndex] = {
          ...existingPost,
          ...updatedPost,
          categories: updatedCategories.length > 0 ? updatedCategories : existingPost.categories
        };
      }

      toastSuccess('Blog post and categories updated successfully.');
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
const categoryDropdownTriggerRef = ref<HTMLButtonElement | null>(null);
const categorySearchInputRef = ref<HTMLInputElement | null>(null);

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

const toggleCategoryDropdown = async () => {
  isCategoryDropdownOpen.value = !isCategoryDropdownOpen.value;
  if (isCategoryDropdownOpen.value) {
    if (categoryPagination.items.value.length === 0) {
      categoryPagination.refresh();
    }
    await nextTick();
    categorySearchInputRef.value?.focus();
  } else {
    categoryDropdownTriggerRef.value?.focus();
  }
};

const closeCategoryDropdown = (restoreFocus = false) => {
  if (isCategoryDropdownOpen.value) {
    isCategoryDropdownOpen.value = false;
    if (restoreFocus) {
      nextTick(() => {
        categoryDropdownTriggerRef.value?.focus();
      });
    }
  }
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

const hasActiveFilters = computed(() => {
  return Boolean(
    (searchQuery.value && searchQuery.value.trim() !== '') ||
    selectedCategoryIds.value.length > 0 ||
    status.value !== undefined ||
    publishedAfter.value !== undefined ||
    publishedBefore.value !== undefined ||
    authorId.value !== undefined ||
    tagId.value !== undefined
  );
});

const clearAllFilters = () => {
  searchQuery.value = '';
  selectedCategoryIds.value = [];
  authorId.value = undefined;
  tagId.value = undefined;
  status.value = undefined;
  publishedAfter.value = undefined;
  publishedBefore.value = undefined;
  categorySearchQuery.value = '';
  currentPage.value = 1;
  fetchPosts();
};

// Document click / keyboard listeners for category popover dismiss
const onDocumentClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement | null;
  if (isCategoryDropdownOpen.value && categoryDropdownRef.value && !categoryDropdownRef.value.contains(target)) {
    closeCategoryDropdown();
  }
  if (isModalCategoryDropdownOpen.value && modalCategoryDropdownRef.value && !modalCategoryDropdownRef.value.contains(target)) {
    closeModalCategoryDropdown();
  }
};

const onDocumentKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isModalCategoryDropdownOpen.value) {
      closeModalCategoryDropdown(true);
      e.stopPropagation();
    } else if (isCategoryDropdownOpen.value) {
      closeCategoryDropdown(true);
      e.stopPropagation();
    }
  }
};

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

    const searchTerm = searchQuery.value.trim() || undefined;

    const data = await blogService.getBlogPosts({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: searchTerm,
      author: authorId.value,
      categories: categoriesParam,
      tag: tagId.value,
      status: status.value as 'DRAFT' | 'PUBLISHED' | undefined,
      published_after: publishedAfter.value,
      published_before: publishedBefore.value,
    });
    postsList.value = data.results;
    totalCount.value = data.count;

    const nextQuery: Record<string, any> = {};
    if (currentPage.value !== 1) nextQuery.page = currentPage.value;
    if (itemsPerPage.value !== 10) nextQuery.pageSize = itemsPerPage.value;
    if (searchTerm) nextQuery.search = searchTerm;
    if (authorId.value) nextQuery.author = authorId.value;
    if (categoriesParam) nextQuery.categories = categoriesParam;
    if (tagId.value) nextQuery.tag = tagId.value;
    if (status.value) nextQuery.status = status.value;
    if (publishedAfter.value) nextQuery.published_after = publishedAfter.value;
    if (publishedBefore.value) nextQuery.published_before = publishedBefore.value;
    if (route.query.modal) nextQuery.modal = route.query.modal;
    if (route.query.id) nextQuery.id = route.query.id;

    router.replace({ query: nextQuery });
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

const triggerDeleteModal = async (post: BlogPostItem) => {
  if (!canDeletePost.value) {
    toastError('You do not have permission to delete blog posts.');
    return;
  }
  selectedPostForDelete.value = post;
  await modalState.openDelete(post.id);
};

const executeDeletePost = async () => {
  const target = postToDelete.value;
  if (!target || !target.id) return;

  if (!canDeletePost.value) {
    toastError('You do not have permission to delete blog posts.');
    return;
  }

  if (isDeleting.value) return;
  isDeleting.value = true;

  try {
    await blogService.deleteBlogPost(target.id);
    toastSuccess(`Blog post "${decodeHtmlEntities(target.title)}" deleted successfully.`);
    await modalState.closeModal();
    selectedPostForDelete.value = null;
    
    // Adjust page if we deleted the last item on current page
    if (postsList.value.length === 1 && currentPage.value > 1) {
      currentPage.value -= 1;
    }
    await fetchPosts();
  } catch (err: any) {
    handleApiError(err, 'Failed to delete blog post.');
  } finally {
    isDeleting.value = false;
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
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <UiSearchInput v-model="searchQuery" placeholder="Search posts..." class="w-full sm:w-64" />
          
          <!-- Category Multi-Select Popover -->
          <div ref="categoryDropdownRef" class="relative">
            <button
              ref="categoryDropdownTriggerRef"
              type="button"
              @click.stop="toggleCategoryDropdown"
              :aria-expanded="isCategoryDropdownOpen"
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
              @keydown.esc.stop="closeCategoryDropdown(true)"
              class="absolute left-0 z-30 mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-lg p-2 text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
            >
              <!-- Category Search Input inside Popover -->
              <div class="relative mb-2">
                <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref="categorySearchInputRef"
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
                    'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer gap-2',
                    selectedCategoryIds.length === 0 ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                  ]"
                >
                  <div class="flex items-center gap-2 truncate min-w-0">
                    <div 
                      class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                      :class="selectedCategoryIds.length === 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'"
                    >
                      <Check v-if="selectedCategoryIds.length === 0" class="w-3 h-3 stroke-[3]" />
                    </div>
                    <span class="truncate">All Categories</span>
                  </div>
                </button>

                <button
                  v-for="cat in categoryPagination.items.value"
                  :key="cat.id"
                  type="button"
                  @click="toggleCategorySelection(cat.id)"
                  :class="[
                    'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer gap-2',
                    isCategorySelected(cat.id) ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                  ]"
                >
                  <div class="flex items-center gap-2 truncate min-w-0">
                    <div 
                      class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                      :class="isCategorySelected(cat.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'"
                    >
                      <Check v-if="isCategorySelected(cat.id)" class="w-3 h-3 stroke-[3]" />
                    </div>
                    <span class="truncate">{{ decodeHtmlEntities(cat.name) }}</span>
                  </div>
                  <span v-if="cat.slug" class="text-[10px] text-muted-foreground font-mono shrink-0 ml-1">
                    /{{ cat.slug }}
                  </span>
                </button>

                <!-- Empty Search / List State -->
                <div 
                  v-if="categoryPagination.items.value.length === 0 && !categoryPagination.isLoading.value" 
                  class="py-3 text-center text-muted-foreground text-xs"
                >
                  No categories found.
                </div>

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

          <select v-model="status" class="h-9 px-3 text-xs font-semibold border border-input rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer">
            <option :value="undefined">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>

          <div class="flex items-center gap-1.5">
            <label class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">From:</label>
            <input v-model="publishedAfter" type="datetime-local" class="h-9 px-2 text-xs border border-input rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
          
          <div class="flex items-center gap-1.5">
            <label class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">To:</label>
            <input v-model="publishedBefore" type="datetime-local" class="h-9 px-2 text-xs border border-input rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/20" />
          </div>

          <input v-model.number="authorId" type="number" placeholder="Author ID" class="h-9 px-2.5 text-xs border border-input rounded-lg w-24 bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/20" />
          <input v-model.number="tagId" type="number" placeholder="Tag ID" class="h-9 px-2.5 text-xs border border-input rounded-lg w-20 bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/20" />
        </div>

        <div class="flex items-center gap-2 self-end lg:self-center shrink-0">
          <!-- Reset / Clear Filters button -->
          <button
            v-if="hasActiveFilters"
            type="button"
            @click="clearAllFilters"
            class="h-9 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-border"
            title="Clear all filters"
            aria-label="Clear all filters"
          >
            <X class="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>

          <!-- Items per page selector -->
          <div class="flex items-center gap-1.5 border-l border-border pl-2.5">
            <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>
            <select 
              v-model="itemsPerPage"
              class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option :value="5">5 / page</option>
              <option :value="10">10 / page</option>
              <option :value="25">25 / page</option>
              <option :value="50">50 / page</option>
              <option :value="100">100 / page</option>
              <option :value="1000">1000 / page</option>
            </select>
          </div>
        </div>
      </div>

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
            <div class="flex items-center justify-end gap-1">
              <!-- View on Storefront -->
              <NuxtLink
                :to="getStorefrontBlogUrl(post)"
                target="_blank"
                rel="noopener noreferrer"
                class="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                title="View on Storefront"
                aria-label="View on Storefront"
              >
                <ExternalLink class="w-4 h-4" />
              </NuxtLink>

              <!-- View Blog Post Details -->
              <UiButton
                v-if="canViewPost"
                @click="modalState.openView(post.id)"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors inline-flex items-center justify-center"
                title="View Blog Post"
                aria-label="View blog post"
              >
                <Eye class="w-4 h-4" />
                <span class="sr-only">View</span>
              </UiButton>

              <!-- Edit Blog Post -->
              <UiButton
                v-if="canEditPost"
                @click="modalState.openEdit(post.id)"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors inline-flex items-center justify-center"
                title="Edit Blog Post"
                aria-label="Edit blog post"
              >
                <Pencil class="w-4 h-4 text-primary" />
                <span class="sr-only">Edit</span>
              </UiButton>

              <!-- Unpublish Blog Post -->
              <UiButton
                v-if="post.status === 'PUBLISHED' && hasPermission('blog_api.unpublish_blog_post')"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-amber-500 hover:bg-muted rounded-lg transition-colors inline-flex items-center justify-center"
                title="Unpublish Blog Post"
                aria-label="Unpublish blog post"
                :disabled="isUnpublishing === post.id"
                @click="handleUnpublishPost(post)"
              >
                <span v-if="isUnpublishing === post.id" class="animate-spin border-2 border-amber-500/30 border-t-amber-500 rounded-full w-4 h-4"></span>
                <EyeOff v-else class="w-4 h-4 text-amber-500" />
                <span class="sr-only">Unpublish</span>
              </UiButton>

              <!-- Publish Blog Post -->
              <UiButton
                v-if="post.status !== 'PUBLISHED' && hasPermission('blog_api.publish_blog_post')"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-emerald-500 hover:bg-muted rounded-lg transition-colors inline-flex items-center justify-center"
                title="Publish Blog Post"
                aria-label="Publish blog post"
                :disabled="isPublishing === post.id"
                @click="handlePublishPost(post)"
              >
                <span v-if="isPublishing === post.id" class="animate-spin border-2 border-emerald-500/30 border-t-emerald-500 rounded-full w-4 h-4"></span>
                <Eye class="w-4 h-4 text-emerald-500" />
                <span class="sr-only">Publish</span>
              </UiButton>

              <!-- Delete Blog Post -->
              <UiButton
                v-if="canDeletePost"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-rose-500 hover:bg-muted rounded-lg transition-colors inline-flex items-center justify-center"
                title="Delete Blog Post"
                aria-label="Delete blog post"
                @click="triggerDeleteModal(post)"
              >
                <Trash2 class="w-4 h-4 text-rose-500" />
                <span class="sr-only">Delete</span>
              </UiButton>
            </div>
          </template>
          <template #empty>
            <div class="text-center py-8 text-muted-foreground space-y-3">
              <p>No blog posts found.</p>
              <UiButton
                v-if="hasActiveFilters"
                variant="outline"
                size="sm"
                @click="clearAllFilters"
                class="text-xs cursor-pointer gap-1.5"
              >
                <X class="w-3.5 h-3.5" />
                <span>Clear Filters</span>
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
                      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20 max-w-[240px]"
                      :title="decodeHtmlEntities(cat.name)"
                    >
                      <Layers class="w-3 h-3 shrink-0 text-primary/70" />
                      <span class="truncate">{{ decodeHtmlEntities(cat.name) }}</span>
                      <button
                        type="button"
                        @click="handleRemoveCategory(cat.id)"
                        class="text-primary/70 hover:text-destructive hover:bg-destructive/10 rounded p-0.5 transition-colors cursor-pointer shrink-0 ml-0.5"
                        :title="`Remove ${decodeHtmlEntities(cat.name)}`"
                        :aria-label="`Remove ${decodeHtmlEntities(cat.name)}`"
                        :disabled="isRemovingCategoryId === Number(cat.id) || isSaving"
                      >
                        <Loader2 v-if="isRemovingCategoryId === Number(cat.id)" class="w-3 h-3 animate-spin text-destructive" />
                        <X v-else class="w-3 h-3" />
                      </button>
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
              <div v-if="isAuthorFieldVisible" class="space-y-4 border border-border p-5 rounded-2xl bg-card">
                <h4 class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <UserIcon class="w-4 h-4 text-primary" /> Authority Designation
                </h4>

                <div class="space-y-2">
                  <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Author Identity <span class="text-destructive">*</span></label>
                  <select 
                    v-model="formAuthorId" 
                    @change="isAuthorManuallyModified = true"
                    class="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-xs cursor-pointer"
                    :required="isAuthorFieldVisible"
                  >
                    <option :value="null" disabled>{{ isOptionsLoading ? 'Loading authors...' : 'Select author...' }}</option>
                    <option 
                      v-if="formAuthorId && !usersList.some(u => Number(u.id) === Number(formAuthorId)) && authStore.user && String(authStore.user.id) === String(formAuthorId)"
                      :value="formAuthorId"
                    >
                      {{ authStore.user.name || authStore.user.email }} (Current User)
                    </option>
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

                <!-- Assigned Categories Multi-Selector -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Categories</label>
                    <button 
                      v-if="formSelectedCategories.length > 0"
                      type="button"
                      @click="clearModalCategorySelection"
                      class="text-[10px] text-muted-foreground hover:text-destructive transition-colors font-semibold cursor-pointer"
                    >
                      Clear all ({{ formSelectedCategories.length }})
                    </button>
                  </div>

                  <!-- Selected Category Chips -->
                  <div v-if="formSelectedCategories.length > 0" class="flex flex-wrap gap-1.5 mb-1">
                    <span 
                      v-for="catId in formSelectedCategories" 
                      :key="catId"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-medium max-w-full"
                    >
                      <Layers class="w-3 h-3 shrink-0" />
                      <span class="truncate">{{ getModalCategoryNameById(catId) }}</span>
                      <button
                        type="button"
                        @click="handleRemoveCategory(catId)"
                        class="text-primary/70 hover:text-destructive hover:bg-destructive/10 rounded p-0.5 transition-colors cursor-pointer shrink-0 ml-0.5"
                        :title="`Remove ${getModalCategoryNameById(catId)}`"
                        :aria-label="`Remove ${getModalCategoryNameById(catId)}`"
                        :disabled="isRemovingCategoryId === Number(catId) || isSaving"
                      >
                        <Loader2 v-if="isRemovingCategoryId === Number(catId)" class="w-3 h-3 animate-spin text-destructive" />
                        <X v-else class="w-3 h-3" />
                      </button>
                    </span>
                  </div>

                  <!-- Category Dropdown Picker Trigger -->
                  <div ref="modalCategoryDropdownRef" class="relative">
                    <button
                      ref="modalCategoryDropdownTriggerRef"
                      type="button"
                      @click.stop="toggleModalCategoryDropdown"
                      :aria-expanded="isModalCategoryDropdownOpen"
                      :class="cn(
                        'w-full h-10 px-3 bg-background border border-input rounded-xl text-left text-xs font-medium transition-all flex items-center justify-between gap-2 cursor-pointer focus:ring-2 focus:ring-primary/20',
                        formSelectedCategories.length === 0 ? 'text-muted-foreground' : 'text-foreground'
                      )"
                      :disabled="isSaving"
                    >
                      <div class="flex items-center gap-2 truncate">
                        <Layers class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span class="truncate">
                          {{ formSelectedCategories.length === 0 ? 'Select categories...' : 'Add more categories...' }}
                        </span>
                      </div>
                      <ChevronDown :class="cn('w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0', isModalCategoryDropdownOpen && 'rotate-180')" />
                    </button>

                    <!-- Category Dropdown Popover with Search & Infinite Scroll -->
                    <div 
                      v-if="isModalCategoryDropdownOpen"
                      @click.stop
                      @keydown.esc.stop="closeModalCategoryDropdown(true)"
                      class="absolute left-0 top-full z-50 mt-1.5 w-full bg-card border border-border rounded-xl shadow-xl p-2.5 text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
                    >
                      <!-- Category Search Input -->
                      <div class="relative mb-2">
                        <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          ref="modalCategorySearchInputRef"
                          v-model="modalCategorySearchQuery"
                          type="text"
                          placeholder="Search categories..."
                          class="w-full h-8 pl-8 pr-3 bg-muted/40 border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary font-medium"
                        />
                      </div>

                      <!-- Scrollable Category List with Checkbox & Infinite Scroll -->
                      <div class="max-h-48 overflow-y-auto space-y-1 pr-1">
                        <div 
                          v-for="cat in modalCategoryPagination.items.value"
                          :key="cat.id"
                          @click="toggleCategory(cat.id)"
                          :class="cn(
                            'flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors',
                            formSelectedCategories.includes(Number(cat.id))
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'hover:bg-muted text-foreground'
                          )"
                        >
                          <div class="flex items-center gap-2 truncate">
                            <div :class="cn(
                              'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                              formSelectedCategories.includes(Number(cat.id))
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground/40 bg-background'
                            )">
                              <Check v-if="formSelectedCategories.includes(Number(cat.id))" class="w-3 h-3 stroke-[3]" />
                            </div>
                            <span class="truncate">{{ decodeHtmlEntities(cat.name) }}</span>
                          </div>
                          <span v-if="cat.slug" class="text-[10px] text-muted-foreground font-mono shrink-0 ml-1">
                            /{{ cat.slug }}
                          </span>
                        </div>

                        <!-- Empty Search / List State -->
                        <div 
                          v-if="modalCategoryPagination.items.value.length === 0 && !modalCategoryPagination.isLoading.value" 
                          class="py-3 text-center text-muted-foreground text-xs"
                        >
                          No categories found.
                        </div>

                        <!-- Loading State -->
                        <div 
                          v-if="modalCategoryPagination.isLoading.value && modalCategoryPagination.items.value.length === 0" 
                          class="py-3 text-center text-muted-foreground flex items-center justify-center gap-2 text-xs"
                        >
                          <Loader2 class="w-3.5 h-3.5 animate-spin text-primary" />
                          <span>Loading categories...</span>
                        </div>

                        <!-- Infinite Scroll Trigger Sentinel -->
                        <UiInfiniteScroll
                          v-if="modalCategoryPagination.items.value.length > 0"
                          :has-more="modalCategoryPagination.hasMore.value"
                          :is-loading="modalCategoryPagination.isFetchingNextPage.value"
                          :error="modalCategoryPagination.error.value"
                          @load-more="modalCategoryPagination.loadNextPage"
                          @retry="modalCategoryPagination.loadNextPage"
                        />
                      </div>
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

    <!-- View Blog Post Modal (Read-Only) -->
    <UiAdminModal 
      :is-open="modalState.isView.value" 
      max-width="max-w-3xl" 
      :show-close-button="false" 
      @close="modalState.closeModal()"
    >
      <div class="w-full relative overflow-hidden flex flex-col cursor-default">
        <!-- Header Banner -->
        <div class="px-6 py-5 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">Blog Post Details</span>
            <h3 class="text-xl font-display font-extrabold tracking-tight text-foreground mt-0.5">
              {{ modalState.isResolving.value ? 'Loading Blog Post...' : (decodeHtmlEntities(selectedPost?.title) || 'Blog Post Details') }}
            </h3>
          </div>
          <div class="flex items-center gap-2">
            <NuxtLink 
              v-if="!modalState.isResolving.value && selectedPost"
              :to="getStorefrontBlogUrl(selectedPost)"
              target="_blank"
              rel="noopener noreferrer"
              class="h-9 px-3.5 border border-input bg-background hover:bg-muted text-foreground rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View on Storefront"
            >
              <ExternalLink class="w-3.5 h-3.5" />
              <span>Storefront</span>
            </NuxtLink>
            <button 
              v-if="!modalState.isResolving.value && selectedPost && canEditPost"
              type="button"
              @click="modalState.openEdit(selectedPost.id)"
              class="h-9 px-3.5 border border-input bg-background hover:bg-muted text-foreground rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Edit Blog Post"
            >
              <Pencil class="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button 
              type="button"
              @click="modalState.closeModal()" 
              aria-label="Close dialog"
              class="w-9 h-9 border border-input rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Resolving / Loading State -->
        <div v-if="modalState.isResolving.value" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 class="w-8 h-8 animate-spin text-primary" />
          <p class="text-xs font-semibold text-muted-foreground">Retrieving blog post details & metadata...</p>
        </div>

        <!-- Error / Not Found State -->
        <div v-else-if="!selectedPost" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
          <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertCircle class="w-6 h-6" />
          </div>
          <p class="text-sm font-bold text-foreground">Blog Post Details Not Available</p>
          <p class="text-xs text-muted-foreground">Could not load the requested blog post from the server.</p>
          <button 
            type="button"
            @click="modalState.closeModal()"
            class="mt-2 h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        <!-- Read-Only Content Container -->
        <div v-else class="flex flex-col overflow-hidden">
          <!-- Scrollable Modal Body -->
          <div class="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
            <!-- Hero Card (Image, Title, Mapped Categories Chips immediately after title, Slug, Status) -->
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 bg-muted/40 rounded-2xl border border-border">
              <div class="w-24 h-24 sm:w-28 sm:h-28 bg-background border border-border rounded-xl flex items-center justify-center p-1.5 shadow-xs overflow-hidden shrink-0 relative">
                <img 
                  v-if="selectedPost.featured_image"
                  :src="selectedPost.featured_image" 
                  :alt="selectedPost.featured_image_alt_text || selectedPost.title" 
                  class="w-full h-full object-cover rounded-lg"
                  @error="($event.target as HTMLImageElement).src = 'https://placehold.co/600x400/f8fafc/64748b?text=No+Image'"
                />
                <div v-else class="flex flex-col items-center justify-center text-muted-foreground gap-1">
                  <FileText class="w-8 h-8 text-muted-foreground/50" />
                  <span class="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">No Image</span>
                </div>
              </div>

              <div class="flex-1 min-w-0 space-y-2 w-full">
                <!-- Post Title -->
                <h4 class="text-lg sm:text-xl font-bold font-display tracking-tight text-foreground leading-snug">
                  {{ decodeHtmlEntities(selectedPost.title) }}
                </h4>

                <!-- Mapped Categories Chips (Immediately after Post Title) -->
                <div 
                  v-if="viewMappedCategories.length > 0" 
                  class="flex flex-wrap items-center gap-1.5 pt-0.5"
                >
                  <span
                    v-for="cat in viewMappedCategories"
                    :key="cat.id"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20 max-w-[240px] truncate"
                    :title="decodeHtmlEntities(cat.name)"
                  >
                    <Layers class="w-3 h-3 shrink-0 text-primary/70" />
                    <span class="truncate">{{ decodeHtmlEntities(cat.name) }}</span>
                  </span>
                </div>

                <!-- Slug and Status Context -->
                <div class="flex items-center gap-2 flex-wrap text-xs pt-1">
                  <span class="font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-[11px]">
                    /{{ selectedPost.slug }}
                  </span>
                  <div class="flex items-center gap-1.5 ml-auto">
                    <span :class="cn(
                      'w-2 h-2 rounded-full',
                      selectedPost.status === 'PUBLISHED' ? 'bg-emerald-500' : 'bg-amber-500'
                    )"></span>
                    <span :class="cn(
                      'text-[10px] font-bold uppercase tracking-wider',
                      selectedPost.status === 'PUBLISHED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    )">
                      {{ selectedPost.status || 'DRAFT' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Core Metadata Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Post ID</span>
                <p class="text-base font-bold text-foreground font-mono">
                  #{{ selectedPost.id }}
                </p>
              </div>

              <div class="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Author</span>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <UserIcon class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <p class="text-xs font-bold text-foreground truncate" :title="selectedPost.author?.full_name || selectedPost.author?.username || 'Unassigned'">
                    {{ selectedPost.author?.full_name || selectedPost.author?.username || 'Unassigned' }}
                  </p>
                </div>
              </div>

              <div class="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Published Date</span>
                <p class="text-xs font-bold text-foreground font-mono">
                  {{ formatDate(selectedPost.published_at) }}
                </p>
              </div>

              <div class="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Created Date</span>
                <p class="text-xs font-bold text-foreground font-mono">
                  {{ formatDate(selectedPost.created_at) }}
                </p>
              </div>
            </div>

            <!-- Categorization & Tags Taxonomy Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- Assigned Categories -->
              <div class="p-4 bg-muted/20 border border-border rounded-xl space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Assigned Categories</span>
                <div v-if="viewMappedCategories.length > 0" class="flex flex-wrap gap-1.5 mt-1">
                  <span 
                    v-for="cat in viewMappedCategories" 
                    :key="cat.id"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-medium"
                  >
                    <Layers class="w-3 h-3" />
                    <span>{{ decodeHtmlEntities(cat.name) }}</span>
                    <span v-if="cat.slug" class="text-[10px] font-mono text-primary/70">/{{ cat.slug }}</span>
                  </span>
                </div>
                <p v-else class="text-xs text-muted-foreground italic mt-1">No categories assigned.</p>
              </div>

              <!-- Assigned Tags -->
              <div class="p-4 bg-muted/20 border border-border rounded-xl space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Assigned Tags</span>
                <div v-if="viewMappedTags.length > 0" class="flex flex-wrap gap-1.5 mt-1">
                  <span 
                    v-for="tag in viewMappedTags" 
                    :key="tag.id"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted text-muted-foreground border border-border rounded-lg text-xs font-medium"
                  >
                    <Tag class="w-3 h-3 text-muted-foreground/70" />
                    <span>{{ decodeHtmlEntities(tag.name) }}</span>
                  </span>
                </div>
                <p v-else class="text-xs text-muted-foreground italic mt-1">No tags assigned.</p>
              </div>
            </div>

            <!-- Excerpt / Summary (if available) -->
            <div v-if="selectedPost.excerpt" class="space-y-1.5 pt-2 border-t border-border/60">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Summary Excerpt</span>
              <div class="p-3.5 rounded-xl bg-muted/30 border border-border text-xs text-foreground font-medium leading-relaxed italic">
                {{ selectedPost.excerpt }}
              </div>
            </div>

            <!-- Post Body Content (Read-Only Rich Text) -->
            <div class="space-y-1.5 pt-4 border-t border-border/60">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Formatted Post Body</span>
              <div class="prose prose-sm prose-slate dark:prose-invert max-w-none text-xs text-foreground bg-muted/20 p-4 rounded-xl border border-border font-normal leading-relaxed max-h-72 overflow-y-auto">
                <div v-if="selectedPost.content" v-html="selectedPost.content"></div>
                <p v-else class="text-xs text-muted-foreground italic m-0">No post body content provided.</p>
              </div>
            </div>

            <!-- SEO Metadata Section -->
            <div class="space-y-3 pt-4 border-t border-border/60">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Globe class="w-3.5 h-3.5 text-primary" />
                <span>Search Engine Optimization (SEO)</span>
              </span>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="p-3 bg-muted/20 border border-border rounded-xl space-y-1">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">SEO Title</span>
                  <p class="text-xs font-semibold text-foreground">
                    {{ selectedPost.seo_title || decodeHtmlEntities(selectedPost.title) || '—' }}
                  </p>
                </div>

                <div class="p-3 bg-muted/20 border border-border rounded-xl space-y-1">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Focus Keyword</span>
                  <p class="text-xs font-semibold text-foreground">
                    {{ selectedPost.seo_focus_keyword || '—' }}
                  </p>
                </div>
              </div>

              <div class="p-3 bg-muted/20 border border-border rounded-xl space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Meta Description</span>
                <p class="text-xs font-normal text-foreground leading-relaxed">
                  {{ selectedPost.seo_description || '—' }}
                </p>
              </div>

              <!-- Indexing Directives -->
              <div class="flex items-center gap-3 pt-1">
                <span :class="cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-bold border',
                  selectedPost.seo_noindex 
                    ? 'bg-destructive/10 text-destructive border-destructive/20' 
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                )">
                  {{ selectedPost.seo_noindex ? 'Noindex (Excluded)' : 'Indexable' }}
                </span>
                <span :class="cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-bold border',
                  selectedPost.seo_nofollow 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                )">
                  {{ selectedPost.seo_nofollow ? 'Nofollow (Links Suppressed)' : 'Follow Links' }}
                </span>
              </div>
            </div>

            <!-- Audit & Governance -->
            <div class="pt-4 border-t border-border space-y-2.5 text-xs">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Audit & Governance</span>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="space-y-0.5">
                  <span class="text-[10px] text-muted-foreground font-semibold">Created At</span>
                  <p class="font-mono text-[11px] text-foreground">{{ formatDate(selectedPost.created_at) }}</p>
                </div>
                <div class="space-y-0.5">
                  <span class="text-[10px] text-muted-foreground font-semibold">Published At</span>
                  <p class="font-mono text-[11px] text-foreground">{{ formatDate(selectedPost.published_at) }}</p>
                </div>
                <div class="space-y-0.5">
                  <span class="text-[10px] text-muted-foreground font-semibold">Author</span>
                  <p class="font-mono text-[11px] text-foreground">{{ selectedPost.author?.username || '—' }}</p>
                </div>
                <div class="space-y-0.5">
                  <span class="text-[10px] text-muted-foreground font-semibold">Alt Text</span>
                  <p class="font-mono text-[11px] text-foreground truncate" :title="selectedPost.featured_image_alt_text || 'None'">
                    {{ selectedPost.featured_image_alt_text || 'None' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Control -->
          <div class="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-muted/20">
            <button 
              type="button"
              @click="modalState.closeModal()" 
              class="h-9 px-5 bg-foreground text-background hover:bg-foreground/90 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </UiAdminModal>

    <!-- Delete Confirmation Modal -->
    <UiAdminModal 
      :is-open="modalState.isDelete.value && (!!postToDelete || modalState.isResolving.value)"
      max-width="max-w-md"
      :show-close-button="false"
      @close="modalState.closeModal()"
    >
      <div class="p-6 space-y-6">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <Trash2 class="w-6 h-6" />
        </div>

        <div>
          <h3 class="text-lg font-bold text-foreground">Confirm Blog Post Deletion</h3>
          <p v-if="modalState.isResolving.value && !postToDelete" class="text-xs text-muted-foreground mt-1.5 flex items-center gap-2">
            <Loader2 class="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Resolving blog post details...</span>
          </p>
          <p v-else class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Are you sure you want to delete the blog post <span class="font-bold text-foreground">"{{ decodeHtmlEntities(postToDelete?.title || '') }}"</span>? This action is permanent and cannot be undone.
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <UiButton 
            variant="outline" 
            class="rounded-xl h-10 px-5 text-xs font-bold cursor-pointer"
            @click="modalState.closeModal()"
            :disabled="isDeleting || (modalState.isResolving.value && !postToDelete)"
          >
            Cancel
          </UiButton>

          <UiButton 
            class="rounded-xl h-10 px-5 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2 cursor-pointer"
            @click="executeDeletePost"
            :disabled="isDeleting || (modalState.isResolving.value && !postToDelete) || !postToDelete"
          >
            <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin" />
            <Trash2 v-else class="w-3.5 h-3.5" />
            <span>Delete Post</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>
  </NuxtLayout>
</template>
