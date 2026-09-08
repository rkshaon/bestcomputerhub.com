<!-- File: /pages/admin/blog/posts/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { FileText, Search, RefreshCw, AlertCircle } from 'lucide-vue-next';
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
      page_size: itemsPerPage.value
    });
    postsList.value = data.results;
    totalCount.value = data.count;

    router.replace({
      query: {
        ...route.query,
        page: currentPage.value !== 1 ? currentPage.value : undefined,
        pageSize: itemsPerPage.value !== 10 ? itemsPerPage.value : undefined
      }
    });
  } catch (err: any) {
    errorMsg.value = blogService.errorMsg.value || 'Failed to retrieve blog posts.';
  } finally {
    isLoading.value = false;
  }
};

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
        <UiButton variant="outline" class="gap-2" @click="fetchPosts">
          <RefreshCw class="w-4 h-4" /> Refresh
        </UiButton>
      </div>

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
