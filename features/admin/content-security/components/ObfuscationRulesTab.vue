<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useRoute, useRouter } from '#app'
import {
  Search,
  X,
  Plus,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  AlertCircle,
  Calendar,
  User,
  Loader2,
  Code
} from 'lucide-vue-next'
import UiTable from '@/components/ui/UiTable.vue'
import UiPagination from '@/components/ui/UiPagination.vue'
import UiAdminModal from '@/components/ui/UiAdminModal.vue'
import { useContentSecurityService } from '@/composables/useContentSecurityService'
import { useAdminPermissions } from '@/composables/useAdminPermissions'
import { useAdminModalState } from '@/composables/useAdminModalState'
import { toastSuccess, toastInfo, toastWarning, toastError, extractErrorMessage } from '@/composables/useToast'
import { cn } from '@/utils'
import type { UiTableColumn } from '@/components/ui/UiTable.vue'
import type {
  ObfuscationRule,
  ObfuscationRuleDetail,
  ObfuscationRulesQueryParams,
  KeywordCategory,
  KeywordSeverity,
  UpdateObfuscationRulePayload
} from '@/types'

const emit = defineEmits<{
  (e: 'refresh-summary'): void
  (e: 'open-create'): void
}>()

const route = useRoute()
const router = useRouter()
const contentSecurityService = useContentSecurityService()
const { hasPermission } = useAdminPermissions()

const canViewObfuscation = computed(() => hasPermission('content_security.view_obfuscationrule'))
const canAddObfuscationRule = computed(() => hasPermission('content_security.add_obfuscationrule'))
const canEditObfuscationRule = computed(() => hasPermission('content_security.change_obfuscationrule'))
const canDeleteObfuscationRule = computed(() => hasPermission('content_security.delete_obfuscationrule'))

// Obfuscation Rules Query/Data States
const isObfuscationLoading = ref(false)
const obfuscationError = ref<string | null>(null)
const obfuscationSearchQuery = ref('')
const debouncedObfuscationSearch = refDebounced(obfuscationSearchQuery, 300)
const obfuscationCategory = ref<string>('all')
const obfuscationSeverity = ref<string>('all')
const obfuscationIsActive = ref<string>('all')
const obfuscationIsEnabled = ref<string>('all')
const obfuscationOrdering = ref<string>('-created_at')
const obfuscationPage = ref(1)
const obfuscationPageSize = ref(10)
const obfuscationRulesData = ref<ObfuscationRule[]>([])
const obfuscationRulesCount = ref(0)
const obfuscationRulesPages = ref(1)

const obfuscationRuleColumns: UiTableColumn<ObfuscationRule>[] = [
  { key: 'pattern', label: 'Obfuscation Pattern / Regex', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-sm font-bold text-foreground' },
  { key: 'category', label: 'Category', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'severity', label: 'Severity', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_enabled', label: 'Enabled', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_active', label: 'Active', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'created_at', label: 'Created At', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'actions', label: 'Actions', align: 'right' as const, width: '80px', headerClass: 'px-4 py-3 text-right whitespace-nowrap', cellClass: 'px-4 py-3 text-right whitespace-nowrap' }
]

const resetObfuscationFilters = () => {
  obfuscationSearchQuery.value = ''
  obfuscationCategory.value = 'all'
  obfuscationSeverity.value = 'all'
  obfuscationIsActive.value = 'all'
  obfuscationIsEnabled.value = 'all'
  obfuscationOrdering.value = '-created_at'
  obfuscationPage.value = 1
}

const fetchObfuscationRules = async () => {
  if (!canViewObfuscation.value) return
  
  isObfuscationLoading.value = true
  obfuscationError.value = null

  try {
    const params: ObfuscationRulesQueryParams = {
      page: obfuscationPage.value,
      page_size: obfuscationPageSize.value,
      ordering: obfuscationOrdering.value
    }

    if (debouncedObfuscationSearch.value.trim()) {
      params.search = debouncedObfuscationSearch.value.trim()
    }
    if (obfuscationCategory.value !== 'all') {
      params.category = obfuscationCategory.value as KeywordCategory
    }
    if (obfuscationSeverity.value !== 'all') {
      params.severity = obfuscationSeverity.value as KeywordSeverity
    }
    if (obfuscationIsActive.value !== 'all') {
      params.is_active = obfuscationIsActive.value === 'true'
    }
    if (obfuscationIsEnabled.value !== 'all') {
      params.is_enabled = obfuscationIsEnabled.value === 'true'
    }

    const response = await contentSecurityService.getObfuscationRules(params)
    obfuscationRulesData.value = response.results
    obfuscationRulesCount.value = response.count
    obfuscationRulesPages.value = response.pages
  } catch (err: any) {
    obfuscationError.value = extractErrorMessage(err, 'Failed to retrieve obfuscation rules.')
  } finally {
    isObfuscationLoading.value = false
  }
}

watch(
  [
    debouncedObfuscationSearch,
    obfuscationCategory,
    obfuscationSeverity,
    obfuscationIsActive,
    obfuscationIsEnabled,
    obfuscationOrdering,
    obfuscationPageSize
  ],
  () => {
    obfuscationPage.value = 1
    fetchObfuscationRules()
  }
)

watch(obfuscationPage, () => {
  fetchObfuscationRules()
})

onMounted(() => {
  fetchObfuscationRules()
})

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return String(dateStr)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(d)
  } catch {
    return String(dateStr)
  }
}

const formatUserInfo = (userVal: any): string => {
  if (!userVal) return 'N/A'
  if (typeof userVal === 'string') return userVal
  if (typeof userVal === 'number') return `User #${userVal}`
  if (typeof userVal === 'object') {
    if (userVal.first_name || userVal.last_name) {
      return `${userVal.first_name || ''} ${userVal.last_name || ''}`.trim()
    }
    if (userVal.username) return userVal.username
    if (userVal.email) return userVal.email
    if (userVal.id) return `User #${userVal.id}`
  }
  return 'N/A'
}

const getSeverityBadge = (severity?: string) => {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
    case 'HIGH':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
    case 'MEDIUM':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
    case 'LOW':
    case 'INFO':
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

// Modal State: Obfuscation Rule Details (View, Edit & Delete)
const isObfuscationDetailsLoading = ref(false)
const selectedObfuscationRule = ref<ObfuscationRuleDetail | null>(null)
const editingObfuscationRuleId = ref<number | null>(null)
const isSubmittingObfuscationEdit = ref(false)
const isDeletingObfuscationRule = ref(false)
const deletingObfuscationRule = ref<{ id: number; pattern: string } | null>(null)

const obfuscationEditForm = ref<{
  pattern: string
  category: KeywordCategory
  severity: KeywordSeverity
  is_enabled: boolean
  description: string
}>({
  pattern: '',
  category: 'OBFUSCATION',
  severity: 'HIGH',
  is_enabled: true,
  description: ''
})

const originalObfuscationRuleData = ref<{
  pattern: string
  category: KeywordCategory
  severity: KeywordSeverity
  is_enabled: boolean
  description: string
} | null>(null)

const obfuscationModalState = useAdminModalState<ObfuscationRuleDetail>({
  getItems: async (id) => {
    isObfuscationDetailsLoading.value = true
    try {
      const details = await contentSecurityService.getObfuscationRuleDetails(String(id))
      return details
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve obfuscation rule details.')
      toastError(msg)
      return null
    } finally {
      isObfuscationDetailsLoading.value = false
    }
  },
  onResolveError: (id) => {
    toastError(`Obfuscation Rule #${id} could not be resolved.`)
    obfuscationModalState.closeModal({ replace: true })
  }
})

watch(() => obfuscationModalState.activeEntity.value, (newEntity) => {
  if (newEntity) {
    selectedObfuscationRule.value = newEntity

    if (obfuscationModalState.isEdit.value) {
      if (!canEditObfuscationRule.value) {
        toastError('You do not have permission to edit obfuscation rules.')
        obfuscationModalState.closeModal({ replace: true })
        return
      }
      editingObfuscationRuleId.value = newEntity.id
      obfuscationEditForm.value = {
        pattern: newEntity.pattern || '',
        category: newEntity.category || 'OBFUSCATION',
        severity: newEntity.severity || 'HIGH',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      }
      originalObfuscationRuleData.value = {
        pattern: newEntity.pattern || '',
        category: newEntity.category || 'OBFUSCATION',
        severity: newEntity.severity || 'HIGH',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      }
    }

    if (obfuscationModalState.isDelete.value) {
      if (!canDeleteObfuscationRule.value) {
        toastError('You do not have permission to delete obfuscation rules.')
        obfuscationModalState.closeModal({ replace: true })
        return
      }
      if (!deletingObfuscationRule.value) {
        deletingObfuscationRule.value = {
          id: newEntity.id,
          pattern: newEntity.pattern || `Rule #${newEntity.id}`
        }
      }
    }
  }
}, { immediate: true })

watch(() => obfuscationModalState.isView.value, (isView) => {
  if (!isView && !obfuscationModalState.isEdit.value && !obfuscationModalState.isDelete.value) {
    selectedObfuscationRule.value = null
  }
}, { immediate: true })

watch(() => obfuscationModalState.isEdit.value, (isEdit) => {
  if (!isEdit) {
    editingObfuscationRuleId.value = null
    originalObfuscationRuleData.value = null
  }
}, { immediate: true })

watch(() => obfuscationModalState.isDelete.value, (isDelete) => {
  if (!isDelete) {
    deletingObfuscationRule.value = null
  } else if (!canDeleteObfuscationRule.value) {
    toastError('You do not have permission to delete obfuscation rules.')
    obfuscationModalState.closeModal({ replace: true })
  }
}, { immediate: true })

const openObfuscationViewModal = (id: number | string) => {
  if (!canViewObfuscation.value) {
    toastError('You do not have permission to view obfuscation rules.')
    return
  }
  obfuscationModalState.openView(id)
}

const closeObfuscationViewModal = () => {
  obfuscationModalState.closeModal()
}

const openEditObfuscationRuleModal = async (id: number | string) => {
  if (!canEditObfuscationRule.value) {
    toastError('You do not have permission to edit obfuscation rules.')
    return
  }
  await obfuscationModalState.openEdit(id)
}

const closeObfuscationEditModal = async () => {
  await obfuscationModalState.closeModal()
}

const openDeleteObfuscationRuleModal = async (rule: { id: number; pattern?: string }) => {
  if (!canDeleteObfuscationRule.value) {
    toastError('You do not have permission to delete obfuscation rules.')
    return
  }
  deletingObfuscationRule.value = {
    id: rule.id,
    pattern: rule.pattern || `Rule #${rule.id}`
  }
  await obfuscationModalState.openDelete(rule.id)
}

const closeObfuscationDeleteModal = async () => {
  await obfuscationModalState.closeModal()
}

const executeDeleteObfuscationRule = async () => {
  if (!canDeleteObfuscationRule.value) {
    toastError('You do not have permission to delete obfuscation rules.')
    return
  }

  const targetId = deletingObfuscationRule.value?.id || obfuscationModalState.activeId.value
  if (!targetId) {
    toastError('Obfuscation rule identifier missing.')
    return
  }

  if (isDeletingObfuscationRule.value) return

  isDeletingObfuscationRule.value = true
  try {
    await contentSecurityService.deleteObfuscationRule(targetId)
    toastSuccess(`Obfuscation rule "${deletingObfuscationRule.value?.pattern || `#${targetId}`}" deleted successfully.`)
    await closeObfuscationDeleteModal()
    await fetchObfuscationRules()
    emit('refresh-summary')

    if (obfuscationRulesData.value.length === 0 && obfuscationPage.value > 1) {
      obfuscationPage.value = Math.max(1, obfuscationPage.value - 1)
      await fetchObfuscationRules()
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to delete obfuscation rule.')
    toastError(msg)
  } finally {
    isDeletingObfuscationRule.value = false
  }
}

const submitUpdateObfuscationRule = async () => {
  if (!canEditObfuscationRule.value) {
    toastError('You do not have permission to edit obfuscation rules.')
    return
  }

  if (!editingObfuscationRuleId.value) {
    toastError('Obfuscation rule identifier missing.')
    return
  }

  const trimmedPattern = obfuscationEditForm.value.pattern.trim()
  if (!trimmedPattern) {
    toastError('Pattern / regex is required.')
    return
  }

  const payload: UpdateObfuscationRulePayload = {}
  const orig = originalObfuscationRuleData.value
  const current = obfuscationEditForm.value

  if (orig) {
    if (trimmedPattern !== orig.pattern.trim()) {
      payload.pattern = trimmedPattern
    }
    if (current.category !== orig.category) {
      payload.category = current.category
    }
    if (current.severity !== orig.severity) {
      payload.severity = current.severity
    }
    if (Boolean(current.is_enabled) !== Boolean(orig.is_enabled)) {
      payload.is_enabled = current.is_enabled
    }
    const currentDesc = current.description.trim()
    const origDesc = (orig.description || '').trim()
    if (currentDesc !== origDesc) {
      payload.description = currentDesc
    }
  } else {
    payload.pattern = trimmedPattern
    payload.category = current.category
    payload.severity = current.severity
    payload.is_enabled = current.is_enabled
    payload.description = current.description.trim()
  }

  if (Object.keys(payload).length === 0) {
    toastInfo('No changes detected.')
    await closeObfuscationEditModal()
    return
  }

  isSubmittingObfuscationEdit.value = true
  try {
    const updated = await contentSecurityService.updateObfuscationRule(editingObfuscationRuleId.value, payload)
    toastSuccess('Obfuscation rule updated successfully.')
    await closeObfuscationEditModal()
    await fetchObfuscationRules()
    emit('refresh-summary')

    if (selectedObfuscationRule.value && String(selectedObfuscationRule.value.id) === String(updated.id)) {
      selectedObfuscationRule.value = updated
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to update obfuscation rule.')
    toastError(msg)
  } finally {
    isSubmittingObfuscationEdit.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Filter Bar -->
    <div class="p-3 bg-card border border-border rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
      <div class="flex items-center gap-2 flex-1 min-w-[280px]">
        <div class="relative flex-1">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            v-model="obfuscationSearchQuery"
            type="text" 
            placeholder="Search obfuscation patterns..." 
            class="w-full h-9 pl-9 pr-8 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
          <button 
            v-if="obfuscationSearchQuery" 
            @click="obfuscationSearchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <select 
          v-model="obfuscationCategory"
          class="h-9 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
        >
          <option value="all">All Categories</option>
          <option value="SPAM">Spam</option>
          <option value="PHISHING">Phishing</option>
          <option value="MALWARE">Malware</option>
          <option value="SCAM">Scam</option>
          <option value="ADULT">Adult</option>
          <option value="DRUG">Drug</option>
          <option value="GAMBLING">Gambling</option>
          <option value="INJECTION">Injection</option>
          <option value="OBFUSCATION">Obfuscation</option>
        </select>

        <select 
          v-model="obfuscationSeverity"
          class="h-9 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
        >
          <option value="all">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
          <option value="INFO">Info</option>
        </select>

        <button 
          @click="resetObfuscationFilters"
          class="h-9 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors shrink-0 cursor-pointer"
        >
          Reset
        </button>
      </div>

      <div class="flex items-center gap-2">
        <select 
          v-model="obfuscationPageSize"
          class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none cursor-pointer"
        >
          <option :value="5">5 / page</option>
          <option :value="10">10 / page</option>
          <option :value="25">25 / page</option>
          <option :value="50">50 / page</option>
        </select>

        <select 
          v-model="obfuscationOrdering"
          class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none cursor-pointer"
        >
          <option value="-created_at">Newest First</option>
          <option value="created_at">Oldest First</option>
          <option value="pattern">Pattern (A-Z)</option>
          <option value="-pattern">Pattern (Z-A)</option>
        </select>

        <button 
          v-if="canAddObfuscationRule"
          @click="emit('open-create')"
          class="h-9 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add Obfuscation Rule</span>
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="obfuscationError" class="p-4 mb-4 text-xs text-rose-700 bg-rose-100/50 border border-rose-200 rounded-xl dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900" role="alert">
      <span class="font-bold">Error:</span> {{ obfuscationError }}
    </div>

    <!-- Obfuscation Rules Table -->
    <div class="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
      <UiTable 
        :columns="obfuscationRuleColumns" 
        :data="obfuscationRulesData" 
        :loading="isObfuscationLoading"
      >
        <template #cell(pattern)="{ item }">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded border border-border">
              {{ item.pattern }}
            </span>
          </div>
        </template>

        <template #cell(category)="{ item }">
          <span class="text-xs font-medium text-foreground">
            {{ item.category }}
          </span>
        </template>

        <template #cell(severity)="{ item }">
          <span :class="cn('px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border', getSeverityBadge(item.severity))">
            {{ item.severity }}
          </span>
        </template>

        <template #cell(is_enabled)="{ item }">
          <span :class="cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border', item.is_enabled ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-muted text-muted-foreground border-border')">
            {{ item.is_enabled ? 'Yes' : 'No' }}
          </span>
        </template>

        <template #cell(is_active)="{ item }">
          <span :class="cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border', item.is_active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-muted text-muted-foreground border-border')">
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </span>
        </template>

        <template #cell(created_at)="{ item }">
          <span class="text-xs font-mono text-muted-foreground">
            {{ formatDate(item.created_at) }}
          </span>
        </template>

        <template #cell(actions)="{ item }">
          <div class="flex items-center justify-end gap-1">
            <button 
              @click="openObfuscationViewModal(item.id)"
              title="View Rule Details"
              aria-label="View Rule Details"
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Eye class="w-3.5 h-3.5" />
            </button>
            <button 
              v-if="canEditObfuscationRule"
              @click="openEditObfuscationRuleModal(item.id)"
              title="Edit Rule"
              aria-label="Edit Rule"
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Edit3 class="w-3.5 h-3.5" />
            </button>
            <button 
              v-if="canDeleteObfuscationRule"
              @click="openDeleteObfuscationRuleModal(item)"
              title="Delete Rule"
              aria-label="Delete Rule"
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </template>

        <template #empty>
          <div class="p-8 text-center space-y-2">
            <Code class="w-8 h-8 text-muted-foreground mx-auto" />
            <p class="text-xs font-bold text-foreground">No Obfuscation Rules Found</p>
            <p class="text-[11px] text-muted-foreground">Adjust your filters or add a new obfuscation pattern rule.</p>
          </div>
        </template>
      </UiTable>

      <div class="p-3 border-t border-border flex items-center justify-between">
        <UiPagination 
          :current-page="obfuscationPage"
          :total-pages="obfuscationRulesPages"
          :total-count="obfuscationRulesCount"
          :items-per-page="obfuscationPageSize"
          @update:current-page="obfuscationPage = $event"
        />
      </div>
    </div>

    <!-- MODAL: VIEW OBFUSCATION RULE DETAILS -->
    <UiAdminModal
      :is-open="obfuscationModalState.isView.value"
      :title="isObfuscationDetailsLoading ? 'Loading Obfuscation Rule...' : (selectedObfuscationRule ? `Obfuscation Rule #${selectedObfuscationRule.id}` : 'Obfuscation Rule Details')"
      subtitle="Comprehensive security inspection parameters and audit metadata."
      max-width="max-w-2xl"
      @close="closeObfuscationViewModal"
    >
      <div v-if="isObfuscationDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving obfuscation rule details from security registry...</p>
      </div>

      <div v-else-if="!selectedObfuscationRule" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-foreground">Rule Details Not Available</p>
        <p class="text-xs text-muted-foreground">Could not load the requested obfuscation rule from the security engine.</p>
        <button 
          type="button"
          @click="closeObfuscationViewModal"
          class="mt-2 h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

      <div v-else class="p-6 sm:p-8 space-y-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-muted/40 rounded-2xl border border-border">
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Obfuscation Pattern / Regex</span>
            </div>
            <div class="font-mono text-base sm:text-lg font-bold text-foreground bg-background px-3 py-1.5 rounded-xl border border-border shadow-2xs inline-block break-all">
              {{ selectedObfuscationRule.pattern }}
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <span :class="cn('px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border', getSeverityBadge(selectedObfuscationRule.severity))">
              {{ selectedObfuscationRule.severity }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 bg-card border border-border rounded-xl space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</span>
            <p class="text-sm font-bold text-foreground">{{ selectedObfuscationRule.category }}</p>
          </div>

          <div class="p-4 bg-card border border-border rounded-xl space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Operational Status</span>
            <div class="flex items-center gap-3">
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedObfuscationRule.is_enabled 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedObfuscationRule.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedObfuscationRule.is_enabled ? 'Enabled' : 'Disabled' }}</span>
              </span>

              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedObfuscationRule.is_active 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedObfuscationRule.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedObfuscationRule.is_active ? 'Active' : 'Inactive' }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rule Description & Rationale</span>
          <div class="bg-card border border-border rounded-xl p-4 text-xs font-medium text-foreground leading-relaxed">
            <p v-if="selectedObfuscationRule.description?.trim()">{{ selectedObfuscationRule.description }}</p>
            <p v-else class="text-muted-foreground italic">No description provided for this rule.</p>
          </div>
        </div>

        <div class="space-y-2 pt-2 border-t border-border">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Audit & Lifecycle Metadata</span>
          <div class="bg-muted/30 border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Created At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedObfuscationRule.created_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedObfuscationRule.updated_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Created By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedObfuscationRule.created_by) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedObfuscationRule.updated_by) }}</p>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            @click="closeObfuscationViewModal"
            class="h-9 px-5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- MODAL: EDIT OBFUSCATION RULE -->
    <UiAdminModal
      :is-open="obfuscationModalState.isEdit.value"
      :title="editingObfuscationRuleId ? `Edit Obfuscation Rule #${editingObfuscationRuleId}` : 'Edit Obfuscation Rule'"
      subtitle="Modify obfuscation regex pattern and detection operational state."
      max-width="max-w-lg"
      @close="closeObfuscationEditModal"
    >
      <form @submit.prevent="submitUpdateObfuscationRule" class="p-6 space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Pattern / Regex <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="obfuscationEditForm.pattern"
            type="text" 
            placeholder="e.g. \\b(e|a|o)v(a|i)l\\b"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="obfuscationEditForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="SPAM">Spam</option>
              <option value="PHISHING">Phishing</option>
              <option value="MALWARE">Malware</option>
              <option value="SCAM">Scam</option>
              <option value="ADULT">Adult</option>
              <option value="DRUG">Drug</option>
              <option value="GAMBLING">Gambling</option>
              <option value="INJECTION">Injection</option>
              <option value="OBFUSCATION">Obfuscation</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
            <select 
              v-model="obfuscationEditForm.severity"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="INFO">Info</option>
            </select>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Description</label>
          <textarea 
            v-model="obfuscationEditForm.description"
            rows="2"
            placeholder="Explain why this obfuscation pattern is flagged..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground font-medium">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="obfuscationEditForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingObfuscationEdit"
            @click="closeObfuscationEditModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingObfuscationEdit"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <RefreshCw v-if="isSubmittingObfuscationEdit" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingObfuscationEdit ? 'Saving...' : 'Save Changes' }}</span>
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- MODAL: DELETE CONFIRMATION -->
    <UiAdminModal
      :is-open="obfuscationModalState.isDelete.value"
      title="Delete Obfuscation Rule"
      subtitle="Are you sure you want to permanently delete this rule from the security engine?"
      max-width="max-w-md"
      @close="closeObfuscationDeleteModal"
    >
      <div class="p-6 space-y-4">
        <div class="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="text-xs font-bold text-destructive">Irreversible Action</p>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Deleting obfuscation rule <strong class="text-foreground font-mono">{{ deletingObfuscationRule?.pattern || `#${obfuscationModalState.activeId.value}` }}</strong> will remove its regex pattern matching capabilities during catalog scans.
            </p>
          </div>
        </div>

        <div class="pt-2 flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isDeletingObfuscationRule"
            @click="closeObfuscationDeleteModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button" 
            :disabled="isDeletingObfuscationRule"
            @click="executeDeleteObfuscationRule"
            class="h-9 px-5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <RefreshCw v-if="isDeletingObfuscationRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDeletingObfuscationRule ? 'Deleting...' : 'Delete Rule' }}</span>
          </button>
        </div>
      </div>
    </UiAdminModal>
  </div>
</template>
