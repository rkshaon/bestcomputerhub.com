---
name: storefront-inline-editing
description: Technical guidelines and reference patterns for implementing inline editing on Storefront pages for authorized admin users.
---

# Storefront Inline Editing Skill

This skill provides comprehensive technical guidelines, reference architectures, and code patterns for implementing in-place, contextual **Storefront Inline Editing** for authorized administrative users.

## 1. Architectural Rules

- **Zero Exposure**: Normal customers/unauthenticated visitors must see a completely standard read-only storefront. Not a single edit icon, admin status indicator, or disabled button should be visible in the DOM.
- **Triple-Gated Client Authorization**:
  ```typescript
  const canEdit = computed(() => {
    return isAuthenticated.value && 
           (isOwner.value || isStaff.value) && 
           hasPermission('domain_api.change_domain_entity');
  });
  ```
- **Backend as Authoritative Boundary**: Client-side visibility is strictly for UX optimization. The DRF backend remains the sole authority for permission enforcement.
- **Strict Single-Field Payloads (PATCH)**: All updates must use the HTTP PATCH method and transmit only the edited field. Submitting complete resource payloads is prohibited to prevent collision and data overwrites.

---

## 2. Technical Implementation Guidelines

### A. Focus Loss Detection & Save-on-Blur (The Blur Strategy)

Inline fields must save automatically when the user finishes editing and clicks away (focus loss/blur). 

- **For Standard Input Fields**: Use Vue's `@blur` event or `@keydown.enter` to invoke the save handler.
- **For Custom Containers (Rich Text Editors)**: Focus loss detection on complex blocks requires tracking the `focusout` event on the outer container wrapper and evaluating the `relatedTarget` to ensure focus hasn't merely shifted to a sub-component within the editor toolbar.

#### Focusout Event Handler Pattern
```typescript
const handleFocusOut = (event: FocusEvent, field: 'description' | 'specifications') => {
  const container = event.currentTarget as HTMLElement | null;
  const relatedTarget = event.relatedTarget as HTMLElement | null;
  
  // If the focus moved to an element inside the editor (like toolbars or popups), do not save yet
  if (container && relatedTarget && container.contains(relatedTarget)) {
    return;
  }
  
  saveField(field);
};
```

---

### B. HTML Comparison & Dirty-State Check (HTML Equivalence)

Before invoking any API endpoint, check if the content was actually modified. For rich text/HTML blocks, simple string equality checks (`===`) can fail due to minor variations in formatting (such as line breaks, paragraph tags, or whitespace differences).

#### HTML Equivalency Helper Pattern
```typescript
const cleanHtmlForComparison = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
};

const isHtmlEquivalent = (h1: string, h2: string): boolean => {
  return cleanHtmlForComparison(h1) === cleanHtmlForComparison(h2);
};
```

Apply this comparison check before making a request:
```typescript
if (isHtmlEquivalent(editShortDescValue.value, targetProduct.short_description || '')) {
  editingField.value = null; // No changes made, exit edit mode silently
  return;
}
```

---

### C. Concurrency Guard & Submission Locking

To prevent duplicate API requests and handle latency gracefully:
1. Track the active field saving status using a reactive ref: `const isFieldSaving = ref<'name' | 'description' | null>(null)`.
2. Guard the save method against double execution:
   ```typescript
   if (isFieldSaving.value === field) return;
   ```
3. Disable input/editor interactions while saving is in progress.

---

### D. Error Resilience & Value Preservation

If an update fails (e.g., due to validation errors, network drops, or permission timeouts):
- Display the error using the project's centralized toast system: `handleApiError(err, 'Failed to save changes.')`.
- **Do not discard the user's edits**. Retain the active editing field and preserve the modified value so the user can fix any validation issues and try again.

---

## 3. Code Reference Implementation

Below is a complete reference pattern for a Vue 3 / Nuxt 4 script setup:

```vue
<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { Edit2, Loader2 } from 'lucide-vue-next';

const { product, updateProduct } = useProductService();
const { canEditProductFromStorefront } = useAdminPermissions();

// Edit State
const editingField = ref<'name' | 'short_description' | null>(null);
const isFieldSaving = ref<'name' | 'short_description' | null>(null);

const editNameValue = ref('');
const editShortDescValue = ref('');
const nameInputRef = ref<HTMLInputElement | null>(null);

const startEditing = (field: 'name' | 'short_description') => {
  if (!canEditProductFromStorefront.value) return;
  editingField.value = field;
  
  if (field === 'name') {
    editNameValue.value = product.value?.name || '';
    nextTick(() => nameInputRef.value?.focus());
  } else if (field === 'short_description') {
    editShortDescValue.value = product.value?.short_description || '';
  }
};

const cancelEditing = () => {
  editingField.value = null;
  isFieldSaving.value = null;
};

const saveField = async (field: 'name' | 'short_description') => {
  if (isFieldSaving.value === field) return;
  
  const targetProduct = product.value;
  if (!targetProduct) return;

  const payload: Partial<UpdateProductPayload> = {};
  let hasChanged = false;

  if (field === 'name') {
    const newVal = editNameValue.value.trim();
    if (newVal && newVal !== targetProduct.name) {
      payload.name = newVal;
      hasChanged = true;
    }
  } else if (field === 'short_description') {
    if (!isHtmlEquivalent(editShortDescValue.value, targetProduct.short_description || '')) {
      payload.short_description = editShortDescValue.value;
      hasChanged = true;
    }
  }

  if (!hasChanged) {
    editingField.value = null;
    return;
  }

  isFieldSaving.value = field;

  try {
    const updated = await updateProduct(targetProduct.id, payload);
    toastSuccess('Changes saved.');
    
    // Optimistically update local state
    if (product.value) {
      product.value[field] = updated[field];
    }
    editingField.value = null;
  } catch (err: any) {
    handleApiError(err, 'Failed to update product field.');
    // Let the user edit or retry; do not clear inputs
  } finally {
    isFieldSaving.value = null;
  }
};
</script>

<template>
  <div class="space-y-4">
    <!-- Editable Text Field -->
    <div class="relative">
      <template v-if="editingField === 'name'">
        <div class="flex items-center gap-2">
          <input 
            v-model="editNameValue"
            ref="nameInputRef"
            type="text"
            @blur="saveField('name')"
            @keydown.enter="saveField('name')"
            @keydown.esc="cancelEditing"
            :disabled="isFieldSaving === 'name'"
            class="w-full text-xl font-bold bg-background border rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Loader2 v-if="isFieldSaving === 'name'" class="w-4 h-4 animate-spin text-primary" />
        </div>
      </template>
      <template v-else>
        <h1 class="text-xl font-bold flex items-center gap-2">
          <span>{{ product.name }}</span>
          <button 
            v-if="canEditProductFromStorefront" 
            @click="startEditing('name')"
            class="p-1 rounded hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>
        </h1>
      </template>
    </div>

    <!-- Editable HTML / Rich Text Field -->
    <div class="space-y-1">
      <div class="flex items-center gap-2">
        <span class="text-xs uppercase font-bold text-muted-foreground">Description</span>
        <button 
          v-if="canEditProductFromStorefront && editingField !== 'short_description'"
          @click="startEditing('short_description')"
          class="p-1 rounded hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
        >
          <Edit2 class="w-3 h-3" />
        </button>
        <div v-else-if="isFieldSaving === 'short_description'" class="flex items-center gap-1 text-[10px] text-amber-500 font-bold uppercase tracking-wider">
          <Loader2 class="w-3 h-3 animate-spin" /> Saving...
        </div>
      </div>
      
      <div v-if="editingField === 'short_description'">
        <div @focusout="handleFocusOut($event, 'short_description')">
          <UiRichTextEditor 
            v-model="editShortDescValue"
            :disabled="isFieldSaving === 'short_description'"
          />
        </div>
      </div>
      <div v-else class="text-sm text-muted-foreground prose" v-html="product.short_description"></div>
    </div>
  </div>
</template>
