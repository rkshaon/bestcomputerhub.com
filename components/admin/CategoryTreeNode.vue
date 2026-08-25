<script setup lang="ts">
import { ref, computed, inject, type Ref } from 'vue';
import { 
  ChevronRight, 
  ChevronDown, 
  Menu, 
  Info, 
  Edit2, 
  Trash2, 
  Loader2,
  GripVertical,
  ExternalLink
} from 'lucide-vue-next';
import type { Category } from '@/types';
import { useCategoryService } from '@/composables/useCategoryService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { cn, decodeHtmlEntities } from '@/utils';

const props = withDefaults(defineProps<{
  node: Category;
  depth?: number;
  treeMode?: 'category' | 'menu';
  togglingMenuSlug?: string | null;
  searchQuery?: string;
  selectedCategoryIds?: string[];
}>(), {
  depth: 0,
  treeMode: 'category',
  togglingMenuSlug: null,
  searchQuery: '',
  selectedCategoryIds: () => []
});

const emit = defineEmits<{
  (e: 'toggle-select', id: string | number): void;
  (e: 'toggle-menu', cat: Category): void;
  (e: 'view', cat: Category): void;
  (e: 'edit', cat: Category): void;
  (e: 'delete', cat: Category): void;
  (e: 'reorder', payload: { source: Category; target: Category }): void;
}>();

const categoryService = useCategoryService();

const draggedTreeNode = inject<Ref<Category | null>>('draggedTreeNode', ref(null));
const dragOverTreeNodeId = inject<Ref<string | null>>('dragOverTreeNodeId', ref(null));

const isExpanded = computed(() => categoryService.isNodeExpanded(props.node.id));
const isSelected = computed(() => {
  if (!props.selectedCategoryIds) return false;
  return props.selectedCategoryIds.includes(String(props.node.id));
});
const isLoadingChildren = ref(false);

// Lazy load children on expand
const toggleExpand = async () => {
  const willExpand = !categoryService.isNodeExpanded(props.node.id);
  categoryService.setNodeExpanded(props.node.id, willExpand, props.node.parentCategoryId);

  if (willExpand) {
    const parentId = props.node.id;
    if (!categoryService.hasChildrenLoaded(parentId)) {
      try {
        isLoadingChildren.value = true;
        await categoryService.getCategoryChildrenBatch([parentId]);
      } catch (err) {
        console.error(`Failed to load children for category ${parentId}`, err);
      } finally {
        isLoadingChildren.value = false;
      }
    }
  }
};

// Retrieve loaded children for this node
const rawChildren = computed(() => {
  if (categoryService.hasChildrenLoaded(props.node.id)) {
    return categoryService.getChildrenForParent(props.node.id);
  }
  if (props.node.children && props.node.children.length > 0) {
    return props.node.children;
  }
  return categoryService.getChildrenForParent(props.node.id);
});

// Filter children based on treeMode and searchQuery
const childCategories = computed(() => {
  let list = rawChildren.value;

  if (props.treeMode === 'menu') {
    list = list.filter(c => c.show_in_menu === true);
  }

  if (props.searchQuery) {
    const q = props.searchQuery.toLowerCase();
    list = list.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.slug.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }

  return list;
});

// Check whether node has potential or loaded children
const hasSubNodes = computed(() => {
  if (props.treeMode === 'menu') {
    return childCategories.value.length > 0 || (props.node.has_children && !categoryService.hasChildrenLoaded(props.node.id));
  }
  return Boolean(
    props.node.has_children || 
    (props.node.children && props.node.children.length > 0) || 
    (props.node.subCategories && props.node.subCategories.length > 0) ||
    childCategories.value.length > 0
  );
});

const isCurrentlyMenu = computed(() => props.node.show_in_menu === true || props.node.is_menu === true);
const isToggling = computed(() => props.togglingMenuSlug === props.node.slug);

const { hasPermission } = useAdminPermissions();
const canMarkCategoryAsMenu = computed(() => hasPermission('category_api.mark_category_as_menu'));
const canRemoveCategoryFromMenu = computed(() => hasPermission('category_api.remove_category_from_menu'));
const canToggleMenu = computed(() => isCurrentlyMenu.value ? canRemoveCategoryFromMenu.value : canMarkCategoryAsMenu.value);

const canViewCategory = computed(() => hasPermission(['store.view_category', 'view_category', 'categories.view_category', 'category_api.view_category']));
const canEditCategory = computed(() => hasPermission(['store.change_category', 'change_category', 'categories.change_category', 'category_api.change_category']));
const canDeleteCategory = computed(() => hasPermission(['store.delete_category', 'delete_category', 'categories.delete_category', 'category_api.delete_category']));

// Drag & Drop handlers for Tree node
const onNodeDragStart = (e: DragEvent) => {
  e.stopPropagation();
  draggedTreeNode.value = props.node;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(props.node.id));
  }
};

const onNodeDragOver = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
  if (draggedTreeNode.value && String(draggedTreeNode.value.id) !== String(props.node.id)) {
    dragOverTreeNodeId.value = String(props.node.id);
  }
};

const onNodeDragLeave = (e: DragEvent) => {
  e.stopPropagation();
  if (dragOverTreeNodeId.value === String(props.node.id)) {
    dragOverTreeNodeId.value = null;
  }
};

const onNodeDragEnd = (e: DragEvent) => {
  e.stopPropagation();
  draggedTreeNode.value = null;
  dragOverTreeNodeId.value = null;
};

const onNodeDrop = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const source = draggedTreeNode.value;
  const target = props.node;
  draggedTreeNode.value = null;
  dragOverTreeNodeId.value = null;

  if (!source || String(source.id) === String(target.id)) return;

  emit('reorder', { source, target });
};
</script>

<template>
  <div class="category-tree-node select-none">
    <!-- Node Row -->
    <div 
      draggable="true"
      @dragstart="onNodeDragStart"
      @dragover="onNodeDragOver"
      @dragleave="onNodeDragLeave"
      @drop="onNodeDrop"
      @dragend="onNodeDragEnd"
      :class="[
        'group flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-muted/60 transition-colors border cursor-grab active:cursor-grabbing',
        depth > 0 && 'my-0.5',
        draggedTreeNode?.id === node.id ? 'opacity-40 bg-muted/40' : '',
        dragOverTreeNodeId === String(node.id) ? 'border-primary/60 border-dashed bg-primary/5' : 'border-transparent hover:border-border/60'
      ]"
      :style="{ paddingLeft: `${depth * 20 + 8}px` }"
    >
      <!-- Left side: Expand icon, Category Icon, Name, Slug, Status Badge -->
      <div class="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
        <!-- Grip Handle Icon -->
        <GripVertical class="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/80 cursor-grab active:cursor-grabbing shrink-0" />

        <!-- Expand / Collapse button -->
        <button
          v-if="hasSubNodes"
          type="button"
          @click.stop="toggleExpand"
          class="w-6 h-6 rounded-md hover:bg-background border border-transparent hover:border-border flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          :title="isExpanded ? 'Collapse sub-categories' : 'Expand sub-categories'"
          :aria-label="isExpanded ? 'Collapse sub-categories' : 'Expand sub-categories'"
        >
          <Loader2 v-if="isLoadingChildren || categoryService.isChildrenLoading(node.id)" class="w-3.5 h-3.5 animate-spin text-primary" />
          <ChevronDown v-else-if="isExpanded" class="w-3.5 h-3.5" />
          <ChevronRight v-else class="w-3.5 h-3.5" />
        </button>
        <div v-else class="w-6 h-6 shrink-0 flex items-center justify-center">
          <span class="w-1.5 h-1.5 rounded-full bg-border"></span>
        </div>

        <!-- Selection Checkbox -->
        <input
          type="checkbox"
          :checked="isSelected"
          @click.stop
          @change="$emit('toggle-select', node.id)"
          class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer accent-primary shrink-0 mr-0.5"
          :aria-label="`Select ${decodeHtmlEntities(node.name)}`"
        />

        <!-- Category Emoji/Icon -->
        <div class="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 text-base shadow-2xs">
          <span>{{ node.icon || '📁' }}</span>
        </div>

        <!-- Title & Slug -->
        <div class="flex items-center gap-2 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
          <span class="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
            {{ decodeHtmlEntities(node.name) }}
          </span>
          <span class="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/40 uppercase tracking-wider font-semibold shrink-0">
            /{{ node.slug }}
          </span>
        </div>

        <!-- Menu Status Pill -->
        <div class="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-border/60 bg-background shrink-0">
          <span :class="cn(
            'w-2 h-2 rounded-full ring-2',
            isCurrentlyMenu
              ? 'bg-emerald-500 ring-emerald-500/10'
              : 'bg-muted-foreground/30 ring-muted-foreground/10'
          )"></span>
          <span class="text-[10px] font-bold uppercase tracking-wider" :class="isCurrentlyMenu ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'">
            {{ isCurrentlyMenu ? 'In Menu' : 'Hidden' }}
          </span>
        </div>
      </div>

      <!-- Right side: Actions -->
      <div class="flex items-center gap-1 shrink-0">
        <!-- View on Storefront -->
        <NuxtLink
          :to="categoryService.getCategoryUrl(node)"
          target="_blank"
          rel="noopener noreferrer"
          @click.stop
          class="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
          title="View on Storefront"
          aria-label="View category on storefront"
        >
          <ExternalLink class="w-3.5 h-3.5" />
        </NuxtLink>

        <!-- Mark / Remove from Menu Button -->
        <button
          v-if="canToggleMenu"
          type="button"
          @click.stop="$emit('toggle-menu', node)"
          :disabled="isToggling"
          :class="[
            'p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
            isCurrentlyMenu
              ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
          ]"
          :title="isCurrentlyMenu ? 'Remove from Menu' : 'Mark as Menu'"
          :aria-label="isCurrentlyMenu ? 'Remove from Menu' : 'Mark as Menu'"
        >
          <Loader2 v-if="isToggling" class="w-3.5 h-3.5 animate-spin text-primary" />
          <Menu v-else class="w-3.5 h-3.5" />
        </button>

        <!-- View / Inspect Button -->
        <button
          v-if="canViewCategory"
          type="button"
          @click.stop="$emit('view', node)"
          class="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all cursor-pointer"
          title="Inspect Node Properties"
          aria-label="Inspect category properties"
        >
          <Info class="w-3.5 h-3.5" />
        </button>

        <!-- Edit Button -->
        <button
          v-if="canEditCategory"
          type="button"
          @click.stop="$emit('edit', node)"
          class="p-1.5 text-muted-foreground hover:text-yellow-500 hover:bg-muted rounded-lg transition-all cursor-pointer"
          title="Modify Class Configurations"
          aria-label="Modify category configurations"
        >
          <Edit2 class="w-3.5 h-3.5" />
        </button>

        <!-- Delete Button -->
        <button
          v-if="canDeleteCategory"
          type="button"
          @click.stop="$emit('delete', node)"
          class="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-all cursor-pointer"
          title="Deregister Node"
          aria-label="Delete category node"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Sub-tree rendering -->
    <div v-if="isExpanded && childCategories.length > 0" class="relative border-l border-border/60 ml-4 pl-1">
      <CategoryTreeNode
        v-for="child in childCategories"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :tree-mode="treeMode"
        :toggling-menu-slug="togglingMenuSlug"
        :search-query="searchQuery"
        :selected-category-ids="selectedCategoryIds"
        @toggle-select="$emit('toggle-select', $event)"
        @toggle-menu="$emit('toggle-menu', $event)"
        @view="$emit('view', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @reorder="$emit('reorder', $event)"
      />
    </div>
  </div>
</template>
