---
name: "url-driven-dialogs"
description: |
  Standardized URL-driven dialog lifecycle and modal management infrastructure for admin CRUD modules.

  Use this skill when:
  * Implementing or modifying any admin CRUD dialogs (Create, Edit, View, Delete, or custom modal operations).
  * Synchronizing dialog state with URL query parameters for shareability, refresh restoration, and browser history (Back/Forward).
  * Enforcing unified modal dismissal handling (Cancel button, X close button, backdrop/outside click, and Escape key).
---

# URL-Driven Dialog Lifecycle & Modal Management

## Overview

In the Best Computer Hub admin ecosystem, all CRUD dialogs (Create, Edit, View, Delete) must synchronize their state directly with the browser URL. The URL serves as the single source of truth for modal visibility, active operation, and target entity identification.

This architectural pattern guarantees:
1. **Shareable & Persistent URLs**: Modal states can be bookmarked or shared (e.g., `/admin/roles?modal=edit&id=15`).
2. **Refresh Restoration**: Reloading the page while a modal is open restores the modal and resolves its entity data.
3. **Browser History Navigation**: Pressing browser Back or Forward correctly transitions between modal states without broken UI state.
4. **Unified Dismissal Lifecycle**: All close methods (Cancel button, Close X button, clicking backdrop/outside, or pressing Escape) execute through a single canonical close handler (`closeModal()`).

---

## Shared Infrastructure Components

The pattern relies on two core building blocks:

### 1. `useAdminModalState<T>` Composable (`/composables/useAdminModalState.ts`)

Manages URL query parameter synchronization, entity auto-resolution by ID, and keyboard accessibility.

```ts
import { useAdminModalState } from '@/composables/useAdminModalState';

const modalState = useAdminModalState<Role>({
  modalParam: 'modal', // Query parameter for mode (default: 'modal')
  idParam: 'id',       // Query parameter for entity ID (default: 'id')
  getItems: (id) => roleService.getRoleById(Number(id)), // Async resolver or Ref array
  closeOnEscape: true   // Enable Escape key dismissal (default: true)
});
```

#### Exposed API
- **State Reactive Refs**: `isOpen`, `isCreate`, `isEdit`, `isView`, `isDelete`, `activeMode`, `activeId`, `activeEntity`, `isResolving`
- **Navigation Methods**: `openCreate()`, `openEdit(id)`, `openView(id)`, `openDelete(id)`, `openModal(mode, id)`
- **Canonical Close Handler**: `closeModal({ replace?: boolean })`

### 2. `<UiAdminModal />` Component (`/components/ui/UiAdminModal.vue`)

Reusable dialog overlay container that encapsulates backdrop styling, mousedown-outside tracking, animation, and close event emission.

```html
<UiAdminModal
  :is-open="modalState.isOpen.value"
  title="Edit Role"
  subtitle="Modify role permissions"
  max-width="max-w-2xl"
  :show-close-button="true"
  @close="modalState.closeModal()"
>
  <!-- Modal body and action buttons -->
</UiAdminModal>
```

#### Props
- `isOpen` (boolean, required): Controls modal rendering.
- `title` (string, optional): Header title text.
- `subtitle` (string, optional): Header subtitle text.
- `maxWidth` (string, default: `'max-w-2xl'`): Tailwind max-width class.
- `closeOnBackdrop` (boolean, default: `true`): Enables outside click dismissal.
- `closeOnEscape` (boolean, default: `true`): Listens for Escape key.
- `showCloseButton` (boolean, default: `true`): Displays top-right 'X' button.

---

## Unified Dismissal Rules

To prevent state desynchronization between the Vue component state and the URL query string:

1. **NO Local State Toggles for Closing**: Modals MUST NOT use local `isOpen = false` or custom close routines that fail to strip query parameters.
2. **Canonical Close Handler**: Every dismissal trigger must invoke `modalState.closeModal()`.
   - **Cancel Button**: `@click="modalState.closeModal()"`
   - **Close (X) Button**: `@close="modalState.closeModal()"`
   - **Backdrop / Outside Click**: Monitored by `<UiAdminModal />` via `mousedown` + `click` target validation, calling `@close`.
   - **Escape Key**: Monitored globally by `useAdminModalState` or `<UiAdminModal />`, calling `closeModal()`.
3. **Permission-Gated Dialog Triggers**: Dialog open methods and modal rendering MUST verify action permissions via `useAdminPermissions()`. Unprivileged users attempting to access modal URLs directly (e.g. `?modal=create` without create permission) should have the modal access blocked and query parameters cleared.

---

## Modal Data Hydration & Demand-Driven Fetching

1. **Lazy Fetching on Modal Activation**: Modal-specific API requests (such as detailed entity lookups or form options/permissions selection lists) must be executed ONLY when the modal transitions to an active state (`isEdit`, `isCreate`, `isView`), never on parent page load or component setup.
2. **Reuse Existing Data**: If complete entity data is already present in parent props or stores, reuse it rather than dispatching duplicate API calls. If list endpoints return partial fields, fetch full entity details when opening the Edit/View modal.

---

## Implementation Example for New CRUD Modules

When creating a new CRUD module (e.g., Users, Products, Categories, Orders):

```html
<script setup lang="ts">
import { useAdminModalState } from '@/composables/useAdminModalState';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import type { User } from '@/types';

const userService = useUserService();

// Initialize URL-driven modal state
const modalState = useAdminModalState<User>({
  getItems: (id) => userService.getUserById(String(id))
});

const handleSave = async () => {
  // Save logic...
  await modalState.closeModal();
};
</script>

<template>
  <div>
    <!-- Trigger Buttons -->
    <UiButton @click="modalState.openCreate()">Create User</UiButton>

    <!-- Shared Form / Edit Modal -->
    <UiAdminModal
      :is-open="modalState.isCreate.value || modalState.isEdit.value"
      :title="modalState.isEdit.value ? 'Edit User' : 'Create User'"
      @close="modalState.closeModal()"
    >
      <form @submit.prevent="handleSave" class="p-6 space-y-4">
        <!-- Form fields -->
        <div class="flex justify-end gap-3 pt-4">
          <UiButton type="button" variant="outline" @click="modalState.closeModal()">
            Cancel
          </UiButton>

          <UiButton type="submit">
            Save
          </UiButton>
        </div>
      </form>
    </UiAdminModal>
  </div>
</template>
```
