<!-- File: /components/ui/UiAdminModal.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { X } from 'lucide-vue-next';

interface Props {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  maxWidth?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  teleport?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  title: '',
  subtitle: '',
  maxWidth: 'max-w-2xl',
  closeOnBackdrop: true,
  closeOnEscape: true,
  showCloseButton: true,
  teleport: true
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const backdropRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
let mouseDownTarget: EventTarget | null = null;

const handleMouseDown = (e: MouseEvent) => {
  mouseDownTarget = e.target;
};

const handleBackdropClick = (e: MouseEvent) => {
  if (!props.closeOnBackdrop) return;

  const targetNode = e.target as Node | null;
  const mouseDownNode = mouseDownTarget as Node | null;

  // A direct backdrop click occurs when both mousedown and click targets are the backdrop element itself
  const isDirectBackdropClick =
    backdropRef.value &&
    e.target === backdropRef.value &&
    mouseDownTarget === backdropRef.value;

  // Or if the targets are still connected to the document and lie strictly outside contentRef
  const isOutsideClick =
    backdropRef.value &&
    contentRef.value &&
    targetNode &&
    document.body.contains(targetNode) &&
    !contentRef.value.contains(targetNode) &&
    mouseDownNode &&
    document.body.contains(mouseDownNode) &&
    !contentRef.value.contains(mouseDownNode);

  if (isDirectBackdropClick || isOutsideClick) {
    emit('close');
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (props.isOpen && props.closeOnEscape && e.key === 'Escape') {
    emit('close');
  }
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown);
  }
});
</script>

<template>
  <Teleport to="body" :disabled="!teleport">
    <div 
      v-if="isOpen" 
      ref="backdropRef"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      @mousedown="handleMouseDown"
      @click="handleBackdropClick"
    >
      <div 
        ref="contentRef"
        :class="[
          'bg-card text-card-foreground border border-border w-full rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300',
          maxWidth
        ]"
      >
        <!-- Optional Standard Header -->
        <div v-if="title || showCloseButton" class="px-6 py-5 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
          <div>
            <h2 v-if="title" class="text-lg font-display font-extrabold text-foreground">
              {{ title }}
            </h2>
            <p v-if="subtitle" class="text-xs text-muted-foreground font-medium mt-0.5">
              {{ subtitle }}
            </p>
          </div>

          <button 
            v-if="showCloseButton"
            type="button"
            @click="emit('close')"
            aria-label="Close dialog"
            class="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-auto"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Slot Content -->
        <slot />
      </div>
    </div>
  </Teleport>
</template>
