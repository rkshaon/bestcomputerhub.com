<!-- File: /components/ui/UiRichTextEditor.vue -->
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Unlink,
  Table as TableIcon,
  Code as CodeIcon,
  RotateCcw,
  RemoveFormatting,
  Eye,
  Plus,
  Trash2,
  Paintbrush
} from 'lucide-vue-next';
import { cn } from '@/utils';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';

interface Props {
  modelValue?: string | Record<string, any> | null;
  label?: string;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
  allowTables?: boolean;
  error?: string;
  helperText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: 'Enter formatted content...',
  minHeight: 'min-h-[140px]',
  disabled: false,
  allowTables: true,
  error: '',
  helperText: ''
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'blur'): void;
  (e: 'focus'): void;
}>();

const editorRef = ref<HTMLDivElement | null>(null);
const isSourceMode = ref(false);
const rawHtml = ref('');
const isFocused = ref(false);

const normalizeContent = (val: string | Record<string, any> | null | undefined): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const entries = Object.entries(val);
    if (entries.length === 0) return '';
    const rows = entries
      .map(([k, v]) => `<tr><td class="font-bold border border-border p-2">${k}</td><td class="border border-border p-2">${v}</td></tr>`)
      .join('');
    return `<table class="w-full border-collapse border border-border"><thead><tr class="bg-muted/50"><th class="border border-border p-2 text-left font-bold">Attribute</th><th class="border border-border p-2 text-left font-bold">Specification</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  return String(val);
};

// Synchronize external modelValue changes to internal editor
const updateEditorContent = (content: string | Record<string, any> | null | undefined) => {
  const normalized = normalizeContent(content);
  rawHtml.value = normalized;
  if (editorRef.value && editorRef.value.innerHTML !== normalized) {
    editorRef.value.innerHTML = normalized;
  }
};

onMounted(() => {
  updateEditorContent(props.modelValue);
  if (typeof window !== 'undefined') {
    document.addEventListener('keydown', handleFormatPainterEscape);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('keydown', handleFormatPainterEscape);
  }
});

watch(
  () => props.modelValue,
  (newVal) => {
    const val = normalizeContent(newVal);
    if (editorRef.value && editorRef.value.innerHTML !== val) {
      editorRef.value.innerHTML = val;
    }
    if (rawHtml.value !== val) {
      rawHtml.value = val;
    }
  }
);

const handleInput = () => {
  if (editorRef.value) {
    const html = editorRef.value.innerHTML;
    const normalized = html === '<p><br></p>' || html === '<br>' ? '' : html;
    rawHtml.value = normalized;
    emit('update:modelValue', normalized);
  }
};

const handleRawHtmlInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement;
  rawHtml.value = target.value;
  emit('update:modelValue', target.value);
  if (editorRef.value) {
    editorRef.value.innerHTML = target.value;
  }
};

const execCommand = (command: string, value: string | undefined = undefined) => {
  if (props.disabled || isSourceMode.value) return;
  if (editorRef.value) {
    editorRef.value.focus();
  }
  document.execCommand(command, false, value);
  handleInput();
};

const formatBlock = (tag: string) => {
  execCommand('formatBlock', `<${tag}>`);
};

const setFontSize = (event: Event) => {
  const select = event.target as HTMLSelectElement;
  const size = select.value;
  if (!size) return;
  if (props.disabled || isSourceMode.value) return;

  if (editorRef.value) {
    editorRef.value.focus();
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    select.value = '';
    return;
  }

  const range = selection.getRangeAt(0);
  if (range.collapsed) {
    select.value = '';
    return;
  }

  const content = range.extractContents();
  const span = document.createElement('span');
  span.style.fontSize = size;
  span.appendChild(content);

  range.insertNode(span);

  selection.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(span);
  selection.addRange(newRange);

  handleInput();

  nextTick(() => {
    select.value = '';
  });
};

const setTextColor = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const color = input.value;
  if (!color) return;
  if (props.disabled || isSourceMode.value) return;

  if (editorRef.value) {
    editorRef.value.focus();
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return;

  let container: Node | null = range.commonAncestorContainer;
  if (container.nodeType === Node.TEXT_NODE) {
    container = container.parentNode;
  }

  if (container && container instanceof HTMLElement && container.nodeName === 'SPAN') {
    container.style.color = color;
    handleInput();
  } else {
    const content = range.extractContents();
    const span = document.createElement('span');
    span.style.color = color;
    span.appendChild(content);

    range.insertNode(span);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.addRange(newRange);

    handleInput();
  }

  nextTick(() => {
    input.value = '#000000';
  });
};

const resetTextColor = () => {
  if (props.disabled || isSourceMode.value) return;
  if (editorRef.value) {
    editorRef.value.focus();
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  let container: Node | null = selection.anchorNode;
  if (container && container.nodeType === Node.TEXT_NODE) {
    container = container.parentNode;
  }

  while (container && container !== editorRef.value) {
    if (container instanceof HTMLElement && container.nodeName === 'SPAN') {
      container.style.removeProperty('color');
      if (!container.getAttribute('style')?.trim()) {
        const parent = container.parentNode;
        while (container.firstChild) {
          parent?.insertBefore(container.firstChild, container);
        }
        parent?.removeChild(container);
      }
      handleInput();
      break;
    }
    container = container.parentNode;
  }
};

const getSelectedAnchor = (): HTMLAnchorElement | null => {
  const selection = window.getSelection();
  if (!selection || !selection.anchorNode) return null;
  let node: Node | null = selection.anchorNode;
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentNode;
  }
  while (node && node !== editorRef.value) {
    if (node.nodeName === 'A') {
      return node as HTMLAnchorElement;
    }
    node = node.parentNode;
  }
  return null;
};

const isLinkModalOpen = ref(false);
const linkModalUrl = ref('');
const linkInputRef = ref<HTMLInputElement | null>(null);
let savedRange: Range | null = null;
let targetAnchor: HTMLElement | null = null;

watch(isLinkModalOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      setTimeout(() => {
        linkInputRef.value?.focus();
        linkInputRef.value?.select();
      }, 50);
    });
  }
});

const insertLink = () => {
  if (props.disabled || isSourceMode.value) return;
  if (editorRef.value) {
    editorRef.value.focus();
  }

  targetAnchor = getSelectedAnchor();
  const existingHref = targetAnchor ? targetAnchor.getAttribute('href') || '' : '';
  linkModalUrl.value = existingHref;

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    savedRange = selection.getRangeAt(0);
  } else {
    savedRange = null;
  }

  isLinkModalOpen.value = true;
};

const handleSaveLink = () => {
  if (savedRange) {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
  }

  const trimmed = linkModalUrl.value.trim();
  if (!trimmed) {
    if (targetAnchor) {
      execCommand('unlink');
    }
  } else {
    if (targetAnchor) {
      targetAnchor.setAttribute('href', trimmed);
      handleInput();
    } else {
      execCommand('createLink', trimmed);
    }
  }

  isLinkModalOpen.value = false;
  targetAnchor = null;
  savedRange = null;
};

const handleCancelLink = () => {
  isLinkModalOpen.value = false;
  targetAnchor = null;
  savedRange = null;
};

const removeLink = () => {
  if (props.disabled || isSourceMode.value) return;
  if (editorRef.value) {
    editorRef.value.focus();
  }
  execCommand('unlink');
};

const insertTable = () => {
  if (props.disabled || isSourceMode.value) return;
  const tableHtml = `
<table class="w-full border-collapse my-2 text-xs">
  <thead>
    <tr class="border-b border-border bg-muted/50">
      <th class="p-2 text-left font-bold border border-border">Attribute</th>
      <th class="p-2 text-left font-bold border border-border">Specification</th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-b border-border">
      <td class="p-2 font-medium border border-border">Feature</td>
      <td class="p-2 border border-border">Value</td>
    </tr>
    <tr class="border-b border-border">
      <td class="p-2 font-medium border border-border">Dimension</td>
      <td class="p-2 border border-border">Value</td>
    </tr>
  </tbody>
</table>
<p><br></p>
`;
  execCommand('insertHTML', tableHtml);
};

const toggleSourceMode = () => {
  isSourceMode.value = !isSourceMode.value;
  if (!isSourceMode.value) {
    nextTick(() => {
      if (editorRef.value) {
        editorRef.value.innerHTML = rawHtml.value;
      }
    });
  }
};

const clearFormatting = () => {
  execCommand('removeFormat');
};

// Format Painter State & Logic
interface CapturedFormatting {
  fontSize: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
}

const isFormatPainterActive = ref(false);
const capturedFormatting = ref<CapturedFormatting | null>(null);

const toggleFormatPainter = () => {
  if (props.disabled || isSourceMode.value) return;

  if (isFormatPainterActive.value) {
    cancelFormatPainter();
    return;
  }

  if (editorRef.value) {
    editorRef.value.focus();
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    alert('Please select source text with the formatting you want to copy first.');
    return;
  }

  const range = selection.getRangeAt(0);
  let container: Node | null = range.commonAncestorContainer;
  if (container.nodeType === Node.TEXT_NODE) {
    container = container.parentNode;
  }

  let fontSize = '';
  let color = '';
  let bold = false;
  let italic = false;
  let underline = false;
  let strikethrough = false;

  let curr: Node | null = container;
  while (curr && curr !== editorRef.value) {
    if (curr instanceof HTMLElement) {
      if (!fontSize && curr.style.fontSize) fontSize = curr.style.fontSize;
      if (!color && curr.style.color) color = curr.style.color;
      if (curr.nodeName === 'B' || curr.nodeName === 'STRONG' || (curr instanceof HTMLElement && curr.style.fontWeight && parseInt(curr.style.fontWeight) >= 600)) {
        bold = true;
      }
      if (curr.nodeName === 'I' || curr.nodeName === 'EM' || (curr instanceof HTMLElement && curr.style.fontStyle === 'italic')) {
        italic = true;
      }
      if (curr.nodeName === 'U' || (curr instanceof HTMLElement && curr.style.textDecoration?.includes('underline'))) {
        underline = true;
      }
      if (curr.nodeName === 'S' || curr.nodeName === 'STRIKE' || curr.nodeName === 'DEL' || (curr instanceof HTMLElement && curr.style.textDecoration?.includes('line-through'))) {
        strikethrough = true;
      }
    }
    curr = curr.parentNode;
  }

  if (!bold) bold = document.queryCommandState('bold');
  if (!italic) italic = document.queryCommandState('italic');
  if (!underline) underline = document.queryCommandState('underline');
  if (!strikethrough) strikethrough = document.queryCommandState('strikeThrough');

  capturedFormatting.value = { fontSize, color, bold, italic, underline, strikethrough };
  isFormatPainterActive.value = true;
};

const cancelFormatPainter = () => {
  isFormatPainterActive.value = false;
  capturedFormatting.value = null;
};

const handleFormatPainterEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isFormatPainterActive.value) {
    cancelFormatPainter();
  }
};

const applyFormatPainterToSelection = () => {
  if (!isFormatPainterActive.value || !capturedFormatting.value) return;
  if (props.disabled || isSourceMode.value) return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  
  if (editorRef.value && !editorRef.value.contains(range.commonAncestorContainer)) {
    return;
  }

  const fmt = capturedFormatting.value;
  const content = range.extractContents();

  const walker = document.createTreeWalker(content, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node: Node) => {
      if (node instanceof HTMLElement) {
        if (['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL'].includes(node.nodeName)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        if (node.style.fontSize || node.style.color || node.style.fontWeight || node.style.fontStyle || node.style.textDecoration) {
          return NodeFilter.FILTER_ACCEPT;
        }
      }
      return NodeFilter.FILTER_SKIP;
    }
  });

  const nodesToClean: HTMLElement[] = [];
  let n: Node | null = walker.currentNode;
  while (n) {
    if (n instanceof HTMLElement) nodesToClean.push(n);
    n = walker.nextNode();
  }

  nodesToClean.forEach(node => {
    if (['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL'].includes(node.nodeName)) {
      const parent = node.parentNode;
      while (node.firstChild) {
        parent?.insertBefore(node.firstChild, node);
      }
      parent?.removeChild(node);
    } else {
      node.style.removeProperty('font-size');
      node.style.removeProperty('color');
      node.style.removeProperty('font-weight');
      node.style.removeProperty('font-style');
      node.style.removeProperty('text-decoration');
    }
  });

  let currentFrag: DocumentFragment | HTMLElement = content;

  if (fmt.bold) {
    const b = document.createElement('strong');
    b.appendChild(currentFrag);
    currentFrag = b;
  }
  if (fmt.italic) {
    const i = document.createElement('em');
    i.appendChild(currentFrag);
    currentFrag = i;
  }
  if (fmt.underline) {
    const u = document.createElement('u');
    u.appendChild(currentFrag);
    currentFrag = u;
  }
  if (fmt.strikethrough) {
    const s = document.createElement('s');
    s.appendChild(currentFrag);
    currentFrag = s;
  }

  const span = document.createElement('span');
  if (fmt.fontSize) span.style.fontSize = fmt.fontSize;
  if (fmt.color) span.style.color = fmt.color;
  span.appendChild(currentFrag);

  range.insertNode(span);

  selection.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(span);
  selection.addRange(newRange);

  handleInput();
};
</script>

<template>
  <div class="space-y-1.5 w-full">
    <!-- Header / Label Row -->
    <div v-if="label || $slots.label" class="flex items-center justify-between">
      <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <slot name="label">
          <span>{{ label }}</span>
        </slot>
      </label>
      <span v-if="error" class="text-destructive font-normal normal-case text-xs">{{ error }}</span>
    </div>

    <!-- Editor Outer Container -->
    <div
      :class="cn(
        'rounded-xl border bg-background relative transition-all flex flex-col',
        error ? 'border-destructive focus-within:ring-2 focus-within:ring-destructive/20' : 'border-input focus-within:ring-2 focus-within:ring-ring/20',
        disabled && 'opacity-60 pointer-events-none'
      )"
    >
      <!-- Editor Toolbar -->
      <div class="sticky top-0 z-20 p-1.5 bg-muted/95 dark:bg-muted/95 backdrop-blur-md border-b border-border flex items-center justify-between gap-1 select-none max-w-full overflow-x-auto scrollbar-none">
        <!-- Formatting Tools (Disabled in Source View) -->
        <div class="flex items-center gap-1 shrink-0 overflow-x-auto scrollbar-none" :class="{ 'opacity-40 pointer-events-none': isSourceMode }">
          <!-- Text Styling Group -->
          <div class="flex items-center bg-background/80 border border-border/60 rounded-lg p-0.5">
            <button
              type="button"
              @click.prevent="execCommand('bold')"
              title="Bold (Ctrl+B)"
              aria-label="Bold"
              class="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Bold class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click.prevent="execCommand('italic')"
              title="Italic (Ctrl+I)"
              aria-label="Italic"
              class="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Italic class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click.prevent="execCommand('underline')"
              title="Underline (Ctrl+U)"
              aria-label="Underline"
              class="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Underline class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click.prevent="execCommand('strikeThrough')"
              title="Strikethrough"
              aria-label="Strikethrough"
              class="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Strikethrough class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Font Size Dropdown -->
          <div class="flex items-center bg-background/80 border border-border/60 rounded-lg p-0.5">
            <select
              @change="setFontSize"
              title="Font Size"
              aria-label="Font Size"
              class="h-7 px-2 bg-transparent text-xs font-semibold text-muted-foreground hover:text-foreground outline-none cursor-pointer rounded"
            >
              <option value="" disabled selected>Size</option>
              <option value="12px">12px</option>
              <option value="14px">14px</option>
              <option value="16px">16px</option>
              <option value="18px">18px</option>
              <option value="20px">20px</option>
              <option value="24px">24px</option>
              <option value="28px">28px</option>
              <option value="32px">32px</option>
            </select>
          </div>

          <!-- Text Color Picker & Reset -->
          <div class="flex items-center gap-1 bg-background/80 border border-border/60 rounded-lg p-0.5">
            <label 
              title="Text Color"
              aria-label="Text Color"
              class="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer relative overflow-hidden"
            >
              <input
                type="color"
                @change="setTextColor"
                class="absolute -inset-2 w-12 h-12 opacity-0 cursor-pointer"
              />
              <span class="text-xs font-bold font-mono">A</span>
            </label>
            <button
              type="button"
              @click.prevent="resetTextColor"
              title="Reset Text Color"
              aria-label="Reset Text Color"
              class="px-1.5 h-7 flex items-center justify-center rounded text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>

          <!-- Headings & Structure -->
          <div class="flex items-center bg-background/80 border border-border/60 rounded-lg p-0.5">
            <button
              type="button"
              @click.prevent="formatBlock('h2')"
              title="Heading 2"
              aria-label="Heading 2"
              class="px-2 h-7 flex items-center justify-center rounded text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              H2
            </button>
            <button
              type="button"
              @click.prevent="formatBlock('h3')"
              title="Heading 3"
              aria-label="Heading 3"
              class="px-2 h-7 flex items-center justify-center rounded text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              H3
            </button>
            <button
              type="button"
              @click.prevent="formatBlock('p')"
              title="Paragraph"
              aria-label="Paragraph"
              class="px-2 h-7 flex items-center justify-center rounded text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              P
            </button>
          </div>

          <!-- Lists -->
          <div class="flex items-center bg-background/80 border border-border/60 rounded-lg p-0.5">
            <button
              type="button"
              @click.prevent="execCommand('insertUnorderedList')"
              title="Bullet List"
              aria-label="Bullet List"
              class="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <List class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click.prevent="execCommand('insertOrderedList')"
              title="Numbered List"
              aria-label="Numbered List"
              class="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ListOrdered class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Alignment -->
          <div class="hidden sm:flex items-center bg-background/80 border border-border/60 rounded-lg p-0.5">
            <button
              type="button"
              @click.prevent="execCommand('justifyLeft')"
              title="Align Left"
              aria-label="Align Left"
              class="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <AlignLeft class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click.prevent="execCommand('justifyCenter')"
              title="Align Center"
              aria-label="Align Center"
              class="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <AlignCenter class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click.prevent="execCommand('justifyRight')"
              title="Align Right"
              aria-label="Align Right"
              class="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <AlignRight class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Insert Link & Table -->
          <div class="flex items-center bg-background/80 border border-border/60 rounded-lg p-0.5">
            <button
              type="button"
              @click.prevent="toggleFormatPainter"
              :title="isFormatPainterActive ? 'Format Painter Active (Click again or Esc to cancel)' : 'Format Painter (Select source text first)'"
              :aria-label="isFormatPainterActive ? 'Format Painter Active' : 'Format Painter'"
              :class="cn(
                'w-7 h-7 flex items-center justify-center rounded transition-colors cursor-pointer',
                isFormatPainterActive
                  ? 'bg-primary text-primary-foreground shadow-xs animate-pulse'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )"
            >
              <Paintbrush class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click.prevent="insertLink"
              title="Insert / Edit Link"
              aria-label="Insert / Edit Link"
              class="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <LinkIcon class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click.prevent="removeLink"
              title="Remove Link"
              aria-label="Remove Link"
              class="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Unlink class="w-3.5 h-3.5" />
            </button>
            <button
              v-if="allowTables"
              type="button"
              @click.prevent="insertTable"
              title="Insert Table"
              aria-label="Insert Table"
              class="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <TableIcon class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click.prevent="clearFormatting"
              title="Clear Formatting"
              aria-label="Clear Formatting"
              class="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <RemoveFormatting class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Mode Toggle (Visual vs HTML Code) -->
        <div class="flex items-center">
          <button
            type="button"
            @click.prevent="toggleSourceMode"
            :title="isSourceMode ? 'Switch to Visual Editor' : 'Edit HTML Source Code'"
            :aria-label="isSourceMode ? 'Switch to Visual Editor' : 'Edit HTML Source Code'"
            :class="cn(
              'h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer',
              isSourceMode
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground hover:text-foreground border-border/80 hover:bg-muted'
            )"
          >
            <Eye v-if="isSourceMode" class="w-3.5 h-3.5" />
            <CodeIcon v-else class="w-3.5 h-3.5" />
            <span>{{ isSourceMode ? 'Visual' : 'HTML' }}</span>
          </button>
        </div>
      </div>

      <!-- Editor Content Area -->
      <div class="relative bg-background">
        <!-- Visual WYSIWYG Editable Area -->
        <div
          v-show="!isSourceMode"
          ref="editorRef"
          contenteditable="true"
          :class="cn(
            'p-3.5 outline-none prose prose-sm prose-slate dark:prose-invert max-w-none text-foreground text-xs leading-relaxed overflow-y-auto max-h-[400px]',
            minHeight,
            '[&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_table]:border [&_table]:border-border',
            '[&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:p-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-bold',
            '[&_td]:border [&_td]:border-border [&_td]:p-2 [&_td]:text-xs',
            '[&_a]:text-primary [&_a]:underline',
            '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5'
          )"
          @input="handleInput"
          @mouseup="applyFormatPainterToSelection"
          @focus="isFocused = true; emit('focus')"
          @blur="isFocused = false; emit('blur')"
        ></div>

        <!-- Raw HTML Source Editor Area -->
        <textarea
          v-if="isSourceMode"
          :value="rawHtml"
          :class="cn(
            'w-full p-3.5 bg-muted/20 text-foreground font-mono text-xs leading-relaxed outline-none border-0 resize-y block max-h-[400px]',
            minHeight
          )"
          placeholder="Enter raw HTML content (e.g. <table>, <p>, <ul>)..."
          @input="handleRawHtmlInput"
          @focus="isFocused = true; emit('focus')"
          @blur="isFocused = false; emit('blur')"
        ></textarea>
      </div>
    </div>

    <!-- Helper Text -->
    <p v-if="helperText" class="text-[11px] text-muted-foreground">
      {{ helperText }}
    </p>
  </div>

  <!-- Link Insertion/Editing Modal -->
  <UiAdminModal
    :is-open="isLinkModalOpen"
    maxWidth="max-w-md"
    title="Insert or Edit Link"
    subtitle="Enter the destination URL for the selected text."
    @close="handleCancelLink"
  >
    <div class="p-6 space-y-4">
      <div class="space-y-1.5">
        <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Link URL</label>
        <input
          ref="linkInputRef"
          v-model="linkModalUrl"
          type="url"
          placeholder="https://example.com"
          class="w-full text-xs bg-background border border-input rounded-xl px-3.5 h-10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground"
          @keydown.enter.prevent="handleSaveLink"
          @keydown.esc.prevent="handleCancelLink"
        />
        <p class="text-[11px] text-muted-foreground">Leave empty and save to remove an existing link.</p>
      </div>

      <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
        <button
          type="button"
          @click="handleCancelLink"
          class="h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleSaveLink"
          class="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Save Link
        </button>
      </div>
    </div>
  </UiAdminModal>
</template>
