// File: /composables/useAdminModalState.ts
import { ref, computed, watch, unref, type Ref, type MaybeRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export type ModalMode = 'create' | 'edit' | 'view' | 'delete' | string;

export interface UseAdminModalStateOptions<T = any> {
  /**
   * Key for the modal mode query parameter in the URL. Defaults to 'modal'.
   */
  modalParam?: string;

  /**
   * Key for the entity ID query parameter in the URL. Defaults to 'id'.
   */
  idParam?: string;

  /**
   * Optional function or source array to find/fetch an entity by ID.
   * Can be an async function `(id) => Promise<T | null>` or a ref/computed array of items `Ref<T[]>`.
   */
  getItems?: MaybeRef<T[]> | ((id: string | number) => T | null | Promise<T | null>);

  /**
   * Custom field extractor for item ID when `getItems` is an array. Defaults to `item.id`.
   */
  getItemId?: (item: T) => string | number;

  /**
   * Callback invoked when entity resolution fails for an ID in the URL.
   */
  onResolveError?: (id: string | number, error?: any) => void;
}

export function useAdminModalState<T = any>(options: UseAdminModalStateOptions<T> = {}) {
  const route = useRoute();
  const router = useRouter();

  const modalParamKey = options.modalParam || 'modal';
  const idParamKey = options.idParam || 'id';
  const getItemId = options.getItemId || ((item: any) => item?.id);

  const activeEntity = ref<T | null>(null) as Ref<T | null>;
  const isResolving = ref(false);

  // Active mode from URL
  const activeMode = computed<ModalMode | null>(() => {
    const val = route.query[modalParamKey];
    return typeof val === 'string' && val.trim() ? val.trim() : null;
  });

  // Active ID from URL
  const activeId = computed<string | number | null>(() => {
    const val = route.query[idParamKey];
    if (val === undefined || val === null || val === '') return null;
    if (typeof val === 'string' && !isNaN(Number(val))) return Number(val);
    return typeof val === 'string' ? val : null;
  });

  // Boolean flags for easy UI binding
  const isOpen = computed(() => activeMode.value !== null);
  const isCreate = computed(() => activeMode.value === 'create');
  const isEdit = computed(() => activeMode.value === 'edit');
  const isView = computed(() => activeMode.value === 'view');
  const isDelete = computed(() => activeMode.value === 'delete');

  // Open modal helper
  const openModal = async (
    mode: ModalMode,
    id?: string | number | null,
    navOptions: { replace?: boolean } = {}
  ) => {
    const query = { ...route.query };

    query[modalParamKey] = mode;

    if (id !== undefined && id !== null && id !== '') {
      query[idParamKey] = String(id);
    } else {
      delete query[idParamKey];
    }

    if (navOptions.replace) {
      await router.replace({ query });
    } else {
      await router.push({ query });
    }
  };

  const openCreate = (replace = false) => openModal('create', null, { replace });
  const openEdit = (id: string | number, replace = false) => openModal('edit', id, { replace });
  const openView = (id: string | number, replace = false) => openModal('view', id, { replace });
  const openDelete = (id: string | number, replace = false) => openModal('delete', id, { replace });

  // Close modal helper
  const closeModal = async (navOptions: { replace?: boolean } = {}) => {
    const query = { ...route.query };
    delete query[modalParamKey];
    delete query[idParamKey];

    activeEntity.value = null;

    if (navOptions.replace) {
      await router.replace({ query });
    } else {
      await router.push({ query });
    }
  };

  // Entity resolution logic
  const resolveEntity = async () => {
    const id = activeId.value;
    if (!id || !options.getItems) {
      activeEntity.value = null;
      return;
    }

    isResolving.value = true;

    try {
      const source = options.getItems;

      if (typeof source === 'function') {
        const result = await source(id);
        if (result) {
          activeEntity.value = result;
        } else {
          activeEntity.value = null;
          if (options.onResolveError) {
            options.onResolveError(id);
          }
        }
      } else {
        const items = unref(source);
        if (Array.isArray(items) && items.length > 0) {
          const found = items.find(item => getItemId(item) == id);
          if (found) {
            activeEntity.value = found;
          } else {
            activeEntity.value = null;
            if (options.onResolveError) {
              options.onResolveError(id);
            }
          }
        }
      }
    } catch (err) {
      activeEntity.value = null;
      if (options.onResolveError) {
        options.onResolveError(id, err);
      }
    } finally {
      isResolving.value = false;
    }
  };

  // Watch for changes in route parameters or getItems source to keep activeEntity synchronized
  watch(
    [activeMode, activeId, () => (typeof options.getItems !== 'function' ? unref(options.getItems) : null)],
    () => {
      if (activeId.value !== null && activeMode.value !== null && activeMode.value !== 'create') {
        resolveEntity();
      } else if (activeMode.value === 'create') {
        activeEntity.value = null;
      } else {
        activeEntity.value = null;
      }
    },
    { immediate: true, deep: true }
  );

  return {
    activeMode,
    activeId,
    activeEntity,
    isResolving,
    isOpen,
    isCreate,
    isEdit,
    isView,
    isDelete,
    openModal,
    openCreate,
    openEdit,
    openView,
    openDelete,
    closeModal,
    resolveEntity
  };
}
