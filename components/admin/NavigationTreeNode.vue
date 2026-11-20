<!-- File: /components/admin/NavigationTreeNode.vue -->
<script setup lang="ts">
import { ref, computed, inject, type Ref } from 'vue';
import {
  ChevronRight,
  ChevronDown,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  FileText,
  Globe,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-vue-next';
import type { CmsNavigationItem, CmsPage } from '@/types/cms';
import { cn } from '@/utils';
import { normalizeCmsPath } from '@/utils/cms';

export interface NavigationTreeItem extends CmsNavigationItem {
  children: NavigationTreeItem[];
}

const props = withDefaults(defineProps<{
  node: NavigationTreeItem;
  depth?: number;
  siblingIndex: number;
  siblingCount: number;
  expandedIds: number[];
  pageLookup?: Record<number, Pick<CmsPage, 'id' | 'title' | 'slug'>>;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  isReordering?: boolean;
  hasActiveSearch?: boolean;
  togglingVisibilityId?: number | null;
}>(), {
  depth: 0,
  pageLookup: () => ({}),
  canCreate: false,
  canEdit: false,
  canDelete: false,
  isReordering: false,
  hasActiveSearch: false,
  togglingVisibilityId: null
});

const emit = defineEmits<{
  (e: 'toggle-expand', id: number): void;
  (e: 'add-child', item: NavigationTreeItem): void;
  (e: 'edit', item: NavigationTreeItem): void;
  (e: 'delete', item: NavigationTreeItem): void;
  (e: 'toggle-visibility', item: NavigationTreeItem): void;
  (e: 'move-sibling', payload: { item: NavigationTreeItem; direction: 'up' | 'down' }): void;
  (e: 'reorder-drop', payload: { source: NavigationTreeItem; target: NavigationTreeItem }): void;
}>();

const draggedNavItem = inject<Ref<NavigationTreeItem | null>>('draggedNavItem', ref(null));
const dragOverNavItemId = inject<Ref<number | null>>('dragOverNavItemId', ref(null));

const hasChildren = computed(() => props.node.children.length > 0);
const isExpanded = computed(() => props.hasActiveSearch || props.expandedIds.includes(props.node.id));
const canReorder = computed(() => props.canEdit && !props.isReordering && !props.hasActiveSearch);
const canMoveUp = computed(() => canReorder.value && props.siblingIndex > 0);
const canMoveDown = computed(() => canReorder.value && props.siblingIndex < props.siblingCount - 1);

const targetSummary = computed(() => {
  if (props.node.link_type === 'PAGE') {
    if (!props.node.page) return 'No CMS page assigned';
    const pageInfo = props.pageLookup[props.node.page];
    if (pageInfo) {
      const slugPath = pageInfo.slug?.trim() ? normalizeCmsPath(pageInfo.slug) : '';
      return slugPath ? `${pageInfo.title} (${slugPath})` : pageInfo.title;
    }
    return `CMS Page #${props.node.page}`;
  }
  return props.node.external_url || 'No URL specified';
});

const onDragStart = (e: DragEvent) => {
  if (!canReorder.value) {
    e.preventDefault();
    return;
  }
  e.stopPropagation();
  draggedNavItem.value = props.node;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(props.node.id));
  }
};

const onDragOver = (e: DragEvent) => {
  if (!canReorder.value) return;
  if (!draggedNavItem.value || draggedNavItem.value.id === props.node.id) return;
  if ((draggedNavItem.value.parent ?? null) !== (props.node.parent ?? null)) return;

  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
  dragOverNavItemId.value = props.node.id;
};

const onDragLeave = (e: DragEvent) => {
  e.stopPropagation();
  if (dragOverNavItemId.value === props.node.id) {
    dragOverNavItemId.value = null;
  }
};

const onDragEnd = (e: DragEvent) => {
  e.stopPropagation();
  draggedNavItem.value = null;
  dragOverNavItemId.value = null;
};

const onDrop = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const source = draggedNavItem.value;
  const target = props.node;
  draggedNavItem.value = null;
  dragOverNavItemId.value = null;

  if (!canReorder.value || !source || source.id === target.id) return;
  emit('reorder-drop', { source, target });
};
</script>

<template>
  <div class="navigation-tree-node select-none">
    <div
      :draggable="canReorder"
      @dragstart="onDragStart"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @dragend="onDragEnd"
      :class="cn(
        'group flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5 px-3 rounded-xl border transition-colors',
        depth > 0 && 'my-0.5',
        canReorder ? 'hover:bg-muted/60 cursor-grab active:cursor-grabbing' : 'hover:bg-muted/40',
        draggedNavItem?.id === node.id ? 'opacity-40 bg-muted/40' : '',
        dragOverNavItemId === node.id ? 'border-primary/60 border-dashed bg-primary/5' : 'border-transparent hover:border-border/60'
      )"
      :style="{ paddingLeft: `clamp(${depth * 8 + 8}px, ${depth * 1.5 + 0.75}rem, ${depth * 24 + 12}px)` }"
    >
      <!-- Left: Handle, Chevron, Title, Badges, Target -->
      <div class="flex items-start sm:items-center gap-2 min-w-0 flex-1">
        <GripVertical
          :class="cn(
            'w-3.5 h-3.5 shrink-0 mt-1 sm:mt-0 transition-colors',
            canReorder
              ? 'text-muted-foreground/40 group-hover:text-muted-foreground cursor-grab active:cursor-grabbing'
              : 'text-muted-foreground/20 cursor-not-allowed'
          )"
        />

        <button
          v-if="hasChildren"
          type="button"
          @click.stop="emit('toggle-expand', node.id)"
          class="w-6 h-6 rounded-md hover:bg-background border border-transparent hover:border-border flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground transition-all cursor-pointer mt-0.5 sm:mt-0"
          :title="isExpanded ? 'Collapse sub-items' : 'Expand sub-items'"
          :aria-label="isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`"
        >
          <ChevronDown v-if="isExpanded" class="w-3.5 h-3.5" />
          <ChevronRight v-else class="w-3.5 h-3.5" />
        </button>
        <div v-else class="w-6 h-6 shrink-0 flex items-center justify-center mt-0.5 sm:mt-0">
          <span class="w-1.5 h-1.5 rounded-full bg-border"></span>
        </div>

        <div class="min-w-0 flex-1 space-y-0.5">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span
              :class="cn(
                'font-bold text-xs sm:text-sm truncate',
                node.is_visible ? 'text-foreground' : 'text-muted-foreground line-through decoration-muted-foreground/50'
              )"
            >
              {{ node.label }}
            </span>

            <span
              :class="cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0',
                node.link_type === 'PAGE'
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-muted text-muted-foreground border-border'
              )"
            >
              <FileText v-if="node.link_type === 'PAGE'" class="w-2.5 h-2.5" />
              <Globe v-else class="w-2.5 h-2.5" />
              <span>{{ node.link_type === 'PAGE' ? 'Page' : 'External' }}</span>
            </span>

            <span
              v-if="!node.is_visible"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0"
            >
              <EyeOff class="w-2.5 h-2.5" />
              <span>Hidden</span>
            </span>

            <span
              v-if="node.open_in_new_tab"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border/60 shrink-0"
              title="Opens in a new browser tab"
            >
              <ExternalLink class="w-2.5 h-2.5" />
              <span>New tab</span>
            </span>

            <span
              v-if="hasChildren"
              class="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded shrink-0"
            >
              {{ node.children.length }} {{ node.children.length === 1 ? 'child' : 'children' }}
            </span>
          </div>

          <p class="text-[11px] text-muted-foreground font-mono truncate">
            {{ targetSummary }}
          </p>
        </div>
      </div>

      <!-- Right: Sibling Reorder + Quick Visibility + CRUD Actions -->
      <div class="flex items-center justify-end gap-1 shrink-0 pl-8 sm:pl-0">
        <button
          v-if="canEdit"
          type="button"
          :disabled="!canMoveUp"
          @click.stop="emit('move-sibling', { item: node, direction: 'up' })"
          class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          :title="hasActiveSearch ? 'Clear search to reorder siblings' : 'Move up'"
          :aria-label="`Move ${node.label} up`"
        >
          <ArrowUp class="w-3.5 h-3.5" />
        </button>

        <button
          v-if="canEdit"
          type="button"
          :disabled="!canMoveDown"
          @click.stop="emit('move-sibling', { item: node, direction: 'down' })"
          class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          :title="hasActiveSearch ? 'Clear search to reorder siblings' : 'Move down'"
          :aria-label="`Move ${node.label} down`"
        >
          <ArrowDown class="w-3.5 h-3.5" />
        </button>

        <button
          v-if="canEdit"
          type="button"
          :disabled="togglingVisibilityId === node.id || isReordering"
          @click.stop="emit('toggle-visibility', node)"
          :class="cn(
            'p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
            node.is_visible
              ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
              : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
          )"
          :title="node.is_visible ? 'Hide item' : 'Show item'"
          :aria-label="node.is_visible ? `Hide ${node.label}` : `Show ${node.label}`"
        >
          <Loader2 v-if="togglingVisibilityId === node.id" class="w-3.5 h-3.5 animate-spin text-primary" />
          <Eye v-else-if="node.is_visible" class="w-3.5 h-3.5" />
          <EyeOff v-else class="w-3.5 h-3.5" />
        </button>

        <button
          v-if="canCreate"
          type="button"
          @click.stop="emit('add-child', node)"
          class="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
          title="Add child item"
          :aria-label="`Add child item under ${node.label}`"
        >
          <Plus class="w-3.5 h-3.5" />
        </button>

        <button
          v-if="canEdit"
          type="button"
          @click.stop="emit('edit', node)"
          class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
          title="Edit item"
          :aria-label="`Edit ${node.label}`"
        >
          <Edit2 class="w-3.5 h-3.5" />
        </button>

        <button
          v-if="canDelete"
          type="button"
          @click.stop="emit('delete', node)"
          class="p-1.5 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
          title="Delete item"
          :aria-label="`Delete ${node.label}`"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Recursive Children -->
    <div
      v-if="isExpanded && node.children.length > 0"
      class="relative border-l border-border/60 ml-4 pl-1"
    >
      <NavigationTreeNode
        v-for="(child, idx) in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :sibling-index="idx"
        :sibling-count="node.children.length"
        :expanded-ids="expandedIds"
        :page-lookup="pageLookup"
        :can-create="canCreate"
        :can-edit="canEdit"
        :can-delete="canDelete"
        :is-reordering="isReordering"
        :has-active-search="hasActiveSearch"
        :toggling-visibility-id="togglingVisibilityId"
        @toggle-expand="emit('toggle-expand', $event)"
        @add-child="emit('add-child', $event)"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @toggle-visibility="emit('toggle-visibility', $event)"
        @move-sibling="emit('move-sibling', $event)"
        @reorder-drop="emit('reorder-drop', $event)"
      />
    </div>
  </div>
</template>
