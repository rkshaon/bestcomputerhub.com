<!-- File: /components/ui/UiRichTextEditor.vue -->
<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
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
  Trash2
} from 'lucide-vue-next';
import { cn } from '@/utils';

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
    // Normalize empty content
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

const insertLink = () => {
  if (props.disabled || isSourceMode.value) return;
  if (editorRef.value) {
    editorRef.value.focus();
  }

  const existingAnchor = getSelectedAnchor();
  const existingHref = existingAnchor ? existingAnchor.getAttribute('href') || '' : '';

  const url = prompt('Enter the link URL (e.g. https://example.com):', existingHref);
  
  if (url === null) {
    return;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    if (existingAnchor) {
      execCommand('unlink');
    }
    return;
  }

  if (existingAnchor) {
    existingAnchor.setAttribute('href', trimmed);
    handleInput();
  } else {
    execCommand('createLink', trimmed);
  }
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
        'rounded-xl border bg-background overflow-hidden transition-all flex flex-col',
        error ? 'border-destructive focus-within:ring-2 focus-within:ring-destructive/20' : 'border-input focus-within:ring-2 focus-within:ring-ring/20',
        disabled && 'opacity-60 pointer-events-none'
      )"
    >
      <!-- Editor Toolbar -->
      <div class="p-1.5 bg-muted/40 border-b border-border flex items-center justify-between gap-1 select-none max-w-full overflow-x-auto scrollbar-none">
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
            'p-3.5 outline-none prose prose-sm prose-slate dark:prose-invert max-w-none text-foreground text-xs leading-relaxed overflow-y-auto',
            minHeight,
            '[&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_table]:border [&_table]:border-border',
            '[&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:p-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-bold',
            '[&_td]:border [&_td]:border-border [&_td]:p-2 [&_td]:text-xs',
            '[&_a]:text-primary [&_a]:underline',
            '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5'
          )"
          @input="handleInput"
          @focus="isFocused = true; emit('focus')"
          @blur="isFocused = false; emit('blur')"
        ></div>

        <!-- Raw HTML Source Editor Area -->
        <textarea
          v-if="isSourceMode"
          :value="rawHtml"
          :class="cn(
            'w-full p-3.5 bg-muted/20 text-foreground font-mono text-xs leading-relaxed outline-none border-0 resize-y block',
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
</template>
