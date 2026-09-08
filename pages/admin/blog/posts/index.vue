<!-- File: /pages/admin/blog/posts/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { FileText, Search, RefreshCw, AlertCircle, Plus } from 'lucide-vue-next';
import { useBlogService } from '@/composables/useBlogService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { cn } from '@/utils';
import type { BlogPostItem } from '@/types';
import type { UiTableColumn } from '@/components/ui/UiTable.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/Button.vue';

definePageMeta({
  layout: false
});

const blogService = useBlogService();
const route = useRoute();
const router = useRouter();

// State management
const postsList = ref<BlogPostItem[]>([]);
const totalCount = ref<number>(0);
const isLoading = ref<boolean>(false);
const errorMsg = ref<string | null>(null);

const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const authorId = ref(route.query.author ? parseInt(String(route.query.author)) : undefined);
const categoryId = ref(route.query.category ? parseInt(String(route.query.category)) : undefined);
const tagId = ref(route.query.tag ? parseInt(String(route.query.tag)) : undefined);
const status = ref(route.query.status ? String(route.query.status) : undefined);
const publishedAfter = ref(route.query.published_after ? String(route.query.published_after) : undefined);
const publishedBefore = ref(route.query.published_before ? String(route.query.published_before) : undefined);

const { hasPermission } = useAdminPermissions();

const fetchPosts = async () => {
  if (!hasPermission('blog_api.view_blogpost')) {
    errorMsg.value = 'Access denied. The blog_api.view_blogpost permission is required to view blog posts.';
    return;
  }

  isLoading.value = true;
  errorMsg.value = null;

  try {
    const data = await blogService.getBlogPosts({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: debouncedSearchQuery.value,
      author: authorId.value,
      category: categoryId.value,
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
        category: categoryId.value || undefined,
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

watch([debouncedSearchQuery, authorId, categoryId, tagId, status, publishedAfter, publishedBefore], () => {
  currentPage.value = 1;
  fetchPosts();
});

onMounted(() => {
  fetchPosts();
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
];

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchPosts();
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString();
};
</script>

<template>
  <NuxtLayout name="admin">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Blog Posts</h1>
        <div class="flex items-center gap-2">
          <UiButton v-if="hasPermission('blog_api.add_blogpost')" to="/admin/blog/posts/create/" class="gap-2">
            <Plus class="w-4 h-4" /> Create Blog Post
          </UiButton>
          <UiButton variant="outline" class="gap-2" @click="fetchPosts">
            <RefreshCw class="w-4 h-4" /> Refresh
          </UiButton>
        </div>
      </div>

      <!-- Filters -->
      <UiCard class="p-3.5 flex flex-wrap gap-3 items-center">
        <UiSearchInput v-model="searchQuery" placeholder="Search posts..." class="w-full sm:w-64" />
        
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
        <input v-model.number="categoryId" type="number" placeholder="Cat ID" class="h-9 px-3 text-sm border rounded-lg w-20 bg-background" />
        <input v-model.number="tagId" type="number" placeholder="Tag ID" class="h-9 px-3 text-sm border rounded-lg w-20 bg-background" />
      </UiCard>

      <UiCard class="p-0">
        <UiTable :columns="tableColumns" :data="postsList" :is-loading="isLoading">
          <template #cell-featured_image="{ item: post }">
            <img :src="post.featured_image" :alt="post.featured_image_alt_text" class="w-12 h-12 object-cover rounded-lg" />
          </template>
          <template #cell-author="{ item: post }">
            {{ post.author.full_name }}
          </template>
          <template #cell-published_at="{ item: post }">
            {{ formatDate(post.published_at) }}
          </template>
          <template #cell-created_at="{ item: post }">
            {{ formatDate(post.created_at) }}
          </template>
          <template #empty>
            <div class="text-center py-8 text-muted-foreground">No blog posts found.</div>
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
  </NuxtLayout>
</template>
