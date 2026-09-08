<!-- File: /pages/admin/blog/posts/[id].vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  ChevronLeft, 
  Save, 
  Plus, 
  X, 
  Globe, 
  FileText, 
  Layers, 
  Tag, 
  User as UserIcon,
  AlertCircle,
  Upload,
  Trash2
} from 'lucide-vue-next';
import { useBlogService } from '@/composables/useBlogService';
import { useCategoryService } from '@/composables/useCategoryService';
import { useUserService } from '@/composables/useUserService';
import { useToast } from '@/composables/useToast';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import type { Category, BlogTag, UserItem } from '@/types';
import UiRichTextEditor from '@/components/ui/UiRichTextEditor.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/Button.vue';

definePageMeta({
  layout: 'admin'
});

const route = useRoute();
const router = useRouter();
const postId = route.params.id as string;
const isCreate = postId === 'create';

const blogService = useBlogService();
const categoryService = useCategoryService();
const userService = useUserService();
const { toastSuccess, toastError, handleApiError } = useToast();
const { hasPermission } = useAdminPermissions();

// Security Boundary Guard
const requiredPermission = isCreate ? 'blog_api.add_blogpost' : 'blog_api.change_blogpost';
if (!hasPermission(requiredPermission)) {
  navigateTo('/admin/forbidden');
}

const isResolving = ref(true);
const isSaving = ref(false);
const errorMsg = ref<string | null>(null);

// Form Fields
const title = ref('');
const content = ref('');
const authorId = ref<number | null>(null);
const featuredImage = ref('');
const originalFeaturedImage = ref('');
const featuredImageAltText = ref('');
const selectedCategories = ref<number[]>([]);
const selectedTags = ref<number[]>([]);
const seoTitle = ref('');
const seoDescription = ref('');
const seoFocusKeyword = ref('');
const seoNoindex = ref(false);
const seoNofollow = ref(false);

// File Upload Fields & Helpers
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
    featuredImage.value = previewObjectUrl.value;
  }
};

const triggerFileSelect = () => {
  fileInput.value?.click();
};

const removeSelectedFile = () => {
  featuredImageFile.value = null;
  featuredImage.value = originalFeaturedImage.value || '';
  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value);
    previewObjectUrl.value = null;
  }
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// Option Lists
const categoriesList = ref<Category[]>([]);
const tagsList = ref<BlogTag[]>([]);
const usersList = ref<UserItem[]>([]);

// Loading options
const loadOptions = async () => {
  try {
    const [catsRes, tagsRes, usersRes] = await Promise.all([
      categoryService.getCategoriesList({ page_size: 100 }),
      blogService.getBlogTags({ page_size: 100 }),
      userService.getUsers({ page_size: 100 })
    ]);
    categoriesList.value = catsRes.results;
    tagsList.value = tagsRes.results;
    usersList.value = usersRes.results;
  } catch (err) {
    console.error('Failed to load form options:', err);
  }
};

const fetchPostDetails = async () => {
  if (isCreate) {
    isResolving.value = false;
    return;
  }
  isResolving.value = true;
  errorMsg.value = null;
  try {
    const post = await blogService.getBlogPost(postId);
    title.value = post.title || '';
    content.value = post.content || '';
    authorId.value = post.author?.id || null;
    featuredImage.value = post.featured_image || '';
    originalFeaturedImage.value = post.featured_image || '';
    featuredImageAltText.value = post.featured_image_alt_text || '';
    selectedCategories.value = post.categories ? post.categories.map((c: any) => Number(c.id)) : [];
    selectedTags.value = post.tags ? post.tags.map((t: any) => Number(t.id)) : [];
    
    // SEO fields
    seoTitle.value = post.seo_title || '';
    seoDescription.value = post.seo_description || '';
    seoFocusKeyword.value = post.seo_focus_keyword || '';
    seoNoindex.value = !!post.seo_noindex;
    seoNofollow.value = !!post.seo_nofollow;
  } catch (err: any) {
    errorMsg.value = err.message || 'Failed to load blog post details.';
    toastError('Failed to load blog post details.');
  } finally {
    isResolving.value = false;
  }
};

onMounted(async () => {
  await Promise.all([
    loadOptions(),
    fetchPostDetails()
  ]);
});

const handleSave = async () => {
  if (!title.value.trim()) {
    toastError('Title is a required field.');
    return;
  }
  if (!authorId.value) {
    toastError('Please select an Author.');
    return;
  }

  isSaving.value = true;
  try {
    const payload = {
      title: title.value,
      content: content.value,
      author: authorId.value,
      featured_image: featuredImageFile.value,
      featured_image_alt_text: featuredImageAltText.value,
      categories: selectedCategories.value,
      tags: selectedTags.value,
      seo_title: seoTitle.value,
      seo_description: seoDescription.value,
      seo_focus_keyword: seoFocusKeyword.value,
      seo_noindex: seoNoindex.value,
      seo_nofollow: seoNofollow.value
    };

    if (isCreate) {
      await blogService.createBlogPost(payload);
      toastSuccess('Blog post created successfully.');
    } else {
      await blogService.updateBlogPost(postId, payload);
      toastSuccess('Blog post updated successfully.');
    }
    router.push('/admin/blog/posts/');
  } catch (err: any) {
    handleApiError(err);
  } finally {
    isSaving.value = false;
  }
};

const toggleCategory = (catId: string | number) => {
  const numericId = Number(catId);
  const index = selectedCategories.value.indexOf(numericId);
  if (index === -1) {
    selectedCategories.value.push(numericId);
  } else {
    selectedCategories.value.splice(index, 1);
  }
};

const toggleTag = (tagId: string | number) => {
  const numericId = Number(tagId);
  const index = selectedTags.value.indexOf(numericId);
  if (index === -1) {
    selectedTags.value.push(numericId);
  } else {
    selectedTags.value.splice(index, 1);
  }
};
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
    <!-- Loading State -->
    <div v-if="isResolving" class="flex flex-col items-center justify-center py-20 space-y-4">
      <span class="animate-spin border-4 border-primary/30 border-t-primary rounded-full w-12 h-12"></span>
      <p class="text-sm text-muted-foreground font-medium">{{ isCreate ? 'Preparing blog post composer...' : 'Resolving blog post metadata...' }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMsg" class="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-[2rem] p-8 text-center space-y-4">
      <AlertCircle class="w-12 h-12 text-rose-500 mx-auto" />
      <h3 class="text-lg font-bold text-rose-700 dark:text-rose-400">Data Resolution Faulted</h3>
      <p class="text-sm text-rose-600 dark:text-rose-400 max-w-md mx-auto">{{ errorMsg }}</p>
      <UiButton to="/admin/blog/posts/" variant="outline" class="mt-4">
        Return to Repository
      </UiButton>
    </div>

    <!-- Edit Form Content -->
    <template v-else>
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <NuxtLink to="/admin/blog/posts/" class="w-10 h-10 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
            <ChevronLeft class="w-5 h-5" />
          </NuxtLink>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">{{ isCreate ? 'New Publication' : 'Edit Configuration' }}</span>
              <span v-if="!isCreate" class="text-[10px] uppercase font-bold tracking-widest text-slate-400">ID: {{ postId }}</span>
            </div>
            <h1 class="text-3xl font-display font-extrabold tracking-tight">{{ isCreate ? 'Create Blog Post' : 'Edit Blog Post' }}</h1>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <UiButton to="/admin/blog/posts/" variant="outline">
            Cancel
          </UiButton>
          <UiButton 
            @click="handleSave"
            class="shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all gap-2"
            :disabled="isSaving"
          >
            <span v-if="isSaving" class="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4"></span>
            <Save v-else class="w-4 h-4" />
            {{ isSaving ? 'Saving...' : (isCreate ? 'Create Publication' : 'Patch Changes') }}
          </UiButton>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Body (Left side - 2 cols) -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Content Section -->
          <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm space-y-6">
            <h3 class="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-2 pb-4 border-b border-slate-100 dark:border-slate-900">
              <FileText class="w-5 h-5 text-primary" /> Core Information
            </h3>
            
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Post Title</label>
              <input 
                v-model="title" 
                type="text" 
                placeholder="Enter post title..." 
                class="w-full h-14 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
              />
            </div>

            <div class="space-y-2 pt-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1 mb-2 block">Formatted Content</label>
              <UiRichTextEditor 
                v-model="content" 
                placeholder="Compose the post body content..."
                min-height="min-h-[350px]"
              />
            </div>
          </div>

          <!-- SEO Configuration Section -->
          <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm space-y-6">
            <h3 class="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-2 pb-4 border-b border-slate-100 dark:border-slate-900">
              <Globe class="w-5 h-5 text-primary" /> Search Engine Optimization
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">SEO Meta Title</label>
                <input 
                  v-model="seoTitle" 
                  type="text" 
                  placeholder="Leave empty to fallback to Title"
                  class="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs"
                />
              </div>

              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">SEO Focus Keyword</label>
                <input 
                  v-model="seoFocusKeyword" 
                  type="text" 
                  placeholder="Primary search query target"
                  class="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">SEO Meta Description</label>
              <textarea 
                v-model="seoDescription" 
                rows="3" 
                placeholder="Summary snippet for search results list..."
                class="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs resize-none"
              ></textarea>
            </div>

            <!-- SEO Robot Toggles -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-900">
              <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-900">
                <div>
                  <h4 class="text-xs font-bold">Search Engine Index Exclusion (Noindex)</h4>
                  <p class="text-[10px] text-slate-400 font-medium">Prevent engines from indexing this post.</p>
                </div>
                <button 
                  @click="seoNoindex = !seoNoindex"
                  class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                  :class="seoNoindex ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'"
                >
                  <span 
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    :class="seoNoindex ? 'translate-x-5' : 'translate-x-0'"
                  />
                </button>
              </div>

              <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-900">
                <div>
                  <h4 class="text-xs font-bold">Inbound Link Tracking Suppression (Nofollow)</h4>
                  <p class="text-[10px] text-slate-400 font-medium">Do not pass authority to links inside this post.</p>
                </div>
                <button 
                  @click="seoNofollow = !seoNofollow"
                  class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                  :class="seoNofollow ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'"
                >
                  <span 
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    :class="seoNofollow ? 'translate-x-5' : 'translate-x-0'"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar (Right side - 1 col) -->
        <div class="space-y-8">
          <!-- Metadata Card -->
          <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm space-y-6">
            <h3 class="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-2 pb-4 border-b border-slate-100 dark:border-slate-900">
              <UserIcon class="w-5 h-5 text-primary" /> Authority Designation
            </h3>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Author Identity</label>
              <select 
                v-model="authorId" 
                class="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs"
              >
                <option :value="null" disabled>Select designated author...</option>
                <option v-for="user in usersList" :key="user.id" :value="user.id">
                  {{ user.full_name || user.username }} ({{ user.email }})
                </option>
              </select>
            </div>
          </div>

          <!-- Featured Asset Card -->
          <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm space-y-6">
            <h3 class="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-2 pb-4 border-b border-slate-100 dark:border-slate-900">
              <FileText class="w-5 h-5 text-primary" /> Visual Assets
            </h3>

            <!-- Upload Option -->
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Featured Image File</label>
              <div class="flex items-center gap-3">
                <UiButton 
                  type="button"
                  variant="outline"
                  class="rounded-xl h-10 px-4 font-bold text-xs border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 w-full flex items-center justify-center gap-2 cursor-pointer"
                  @click="triggerFileSelect"
                >
                  <Upload class="w-4 h-4 text-primary" />
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
                  class="h-10 px-3 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl shrink-0"
                  title="Remove Selected File"
                  @click="removeSelectedFile"
                >
                  <Trash2 class="w-4 h-4" />
                </UiButton>
              </div>
              <p v-if="featuredImageFile" class="text-[10px] font-bold text-emerald-600 truncate ml-1">
                Selected: {{ featuredImageFile.name }} ({{ (featuredImageFile.size / 1024).toFixed(1) }} KB)
              </p>
            </div>

            <!-- Asset Preview Box -->
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Asset Frame Preview</label>
              <div class="border border-slate-150 dark:border-slate-850 rounded-2xl overflow-hidden aspect-video bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-2 relative group">
                <img 
                  v-if="featuredImage" 
                  :src="featuredImage" 
                  :alt="featuredImageAltText" 
                  class="max-w-full max-h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                  @error="($event.target as HTMLImageElement).src = 'https://placehold.co/600x400/f8fafc/64748b?text=Invalid+Image+URL'"
                />
                <span v-else class="text-[10px] font-bold uppercase tracking-widest text-slate-400">No Asset Provided</span>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Alternative Image Text</label>
              <input 
                v-model="featuredImageAltText" 
                type="text" 
                placeholder="Alt description for accessibility compliance"
                class="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs"
              />
            </div>
          </div>

          <!-- Taxonomies & Categorizations -->
          <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm space-y-6">
            <h3 class="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-2 pb-4 border-b border-slate-100 dark:border-slate-900">
              <Layers class="w-5 h-5 text-primary" /> Categorization Domains
            </h3>

            <!-- Categories Checklist -->
            <div class="space-y-3">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1 mb-1 block">Categories</label>
              <div class="max-h-48 overflow-y-auto pr-2 space-y-2 border border-slate-100 dark:border-slate-900 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                <label 
                  v-for="cat in categoriesList" 
                  :key="cat.id" 
                  class="flex items-center gap-3 cursor-pointer p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors"
                >
                  <input 
                    type="checkbox" 
                    :checked="selectedCategories.includes(Number(cat.id))"
                    @change="toggleCategory(cat.id)"
                    class="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary"
                  />
                  <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">{{ cat.name }}</span>
                </label>
                <div v-if="categoriesList.length === 0" class="text-[10px] uppercase font-bold tracking-widest text-slate-400 text-center py-4">
                  No Categories Available
                </div>
              </div>
            </div>

            <!-- Tags Checklist -->
            <div class="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-900">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1 mb-1 block">Blog Tags</label>
              <div class="max-h-48 overflow-y-auto pr-2 space-y-2 border border-slate-100 dark:border-slate-900 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                <label 
                  v-for="tag in tagsList" 
                  :key="tag.id" 
                  class="flex items-center gap-3 cursor-pointer p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors"
                >
                  <input 
                    type="checkbox" 
                    :checked="selectedTags.includes(Number(tag.id))"
                    @change="toggleTag(tag.id)"
                    class="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary"
                  />
                  <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">{{ tag.name }}</span>
                </label>
                <div v-if="tagsList.length === 0" class="text-[10px] uppercase font-bold tracking-widest text-slate-400 text-center py-4">
                  No Tags Available
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
