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
  ExternalLink
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
  RedirectRule,
  RedirectRuleDetail,
  RedirectRulesQueryParams,
  KeywordCategory,
  KeywordSeverity,
  UpdateRedirectRulePayload
} from '@/types'

const emit = defineEmits<{
  (e: 'refresh-summary'): void
  (e: 'open-create'): void
}>()

const route = useRoute()
const router = useRouter()
const contentSecurityService = useContentSecurityService()
const { hasPermission } = useAdminPermissions()

const canViewRedirects = computed(() => hasPermission('content_security.view_redirectrule'))
const canAddRedirectRule = computed(() => hasPermission('content_security.add_redirectrule'))
const canEditRedirectRule = computed(() => hasPermission('content_security.change_redirectrule'))
const canDeleteRedirectRule = computed(() => hasPermission('content_security.delete_redirectrule'))

// Redirect Rules Query/Data States
const isRedirectsLoading = ref(false)
const redirectsError = ref<string | null>(null)
const redirectSearchQuery = ref('')
const debouncedRedirectSearch = refDebounced(redirectSearchQuery, 300)
const redirectCategory = ref<string>('all')
const redirectSeverity = ref<string>('all')
const redirectIsActive = ref<string>('all')
const redirectIsEnabled = ref<string>('all')
const redirectOrdering = ref<string>('-created_at')
const redirectPage = ref(1)
const redirectPageSize = ref(10)
const redirectRulesData = ref<RedirectRule[]>([])
const redirectRulesCount = ref(0)
const redirectRulesPages = ref(1)

const redirectRuleColumns: UiTableColumn<RedirectRule>[] = [
  { key: 'pattern', label: 'Redirect Pattern / Heuristic', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-sm font-bold text-foreground' },
  { key: 'category', label: 'Category', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'severity', label: 'Severity', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_enabled', label: 'Enabled', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_active', label: 'Active', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'created_at', label: 'Created At', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'actions', label: 'Actions', align: 'right' as const, width: '80px', headerClass: 'px-4 py-3 text-right whitespace-nowrap', cellClass: 'px-4 py-3 text-right whitespace-nowrap' }
]

const resetRedirectFilters = () => {
  redirectSearchQuery.value = ''
  redirectCategory.value = 'all'
  redirectSeverity.value = 'all'
  redirectIsActive.value = 'all'
  redirectIsEnabled.value = 'all'
  redirectOrdering.value = '-created_at'
  redirectPage.value = 1
}

const fetchRedirectRules = async () => {
  if (!canViewRedirects.value) return
  
  isRedirectsLoading.value = true
  redirectsError.value = null

  try {
    const params: RedirectRulesQueryParams = {
      page: redirectPage.value,
      page_size: redirectPageSize.value,
      ordering: redirectOrdering.value
    }

    if (debouncedRedirectSearch.value.trim()) {
      params.search = debouncedRedirectSearch.value.trim()
    }
    if (redirectCategory.value !== 'all') {
      params.category = redirectCategory.value as KeywordCategory
    }
    if (redirectSeverity.value !== 'all') {
      params.severity = redirectSeverity.value as KeywordSeverity
    }
    if (redirectIsActive.value !== 'all') {
      params.is_active = redirectIsActive.value === 'true'
    }
    if (redirectIsEnabled.value !== 'all') {
      params.is_enabled = redirectIsEnabled.value === 'true'
    }

    const response = await contentSecurityService.getRedirectRules(params)
    redirectRulesData.value = response.results
    redirectRulesCount.value = response.count
    redirectRulesPages.value = response.pages
  } catch (err: any) {
    redirectsError.value = extractErrorMessage(err, 'Failed to retrieve redirect rules.')
  } finally {
    isRedirectsLoading.value = false
  }
}

watch(
  [
    debouncedRedirectSearch,
    redirectCategory,
    redirectSeverity,
    redirectIsActive,
    redirectIsEnabled,
    redirectOrdering,
    redirectPageSize
  ],
  () => {
    redirectPage.value = 1
    fetchRedirectRules()
  }
)

watch(redirectPage, () => {
  fetchRedirectRules()
})

onMounted(() => {
  fetchRedirectRules()
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

// Modal State: Redirect Rule Details (View, Edit & Delete)
const isRedirectDetailsLoading = ref(false)
const selectedRedirectRule = ref<RedirectRuleDetail | null>(null)
const editingRedirectRuleId = ref<number | null>(null)
const isSubmittingRedirectEdit = ref(false)
const isDeletingRedirectRule = ref(false)
const deletingRedirectRule = ref<{ id: number; pattern: string } | null>(null)

const redirectEditForm = ref<{
  pattern: string
  category: KeywordCategory
  severity: KeywordSeverity
  is_enabled: boolean
  description: string
}>({
  pattern: '',
  category: 'PHISHING',
  severity: 'HIGH',
  is_enabled: true,
  description: ''
})

const originalRedirectRuleData = ref<{
  pattern: string
  category: KeywordCategory
  severity: KeywordSeverity
  is_enabled: boolean
  description: string
} | null>(null)

const redirectModalState = useAdminModalState<RedirectRuleDetail>({
  getItems: async (id) => {
    isRedirectDetailsLoading.value = true
    try {
      const details = await contentSecurityService.getRedirectRuleDetails(String(id))
      return details
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve redirect rule details.')
      toastError(msg)
      return null
    } finally {
      isRedirectDetailsLoading.value = false
    }
  },
  onResolveError: (id) => {
    toastError(`Redirect Rule #${id} could not be resolved.`)
    redirectModalState.closeModal({ replace: true })
  }
})

watch(() => redirectModalState.activeEntity.value, (newEntity) => {
  if (newEntity) {
    selectedRedirectRule.value = newEntity

    if (redirectModalState.isEdit.value) {
      if (!canEditRedirectRule.value) {
        toastError('You do not have permission to edit redirect rules.')
        redirectModalState.closeModal({ replace: true })
        return
      }
      editingRedirectRuleId.value = newEntity.id
      redirectEditForm.value = {
        pattern: newEntity.pattern || '',
        category: newEntity.category || 'PHISHING',
        severity: newEntity.severity || 'HIGH',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      }
      originalRedirectRuleData.value = {
        pattern: newEntity.pattern || '',
        category: newEntity.category || 'PHISHING',
        severity: newEntity.severity || 'HIGH',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      }
    }

    if (redirectModalState.isDelete.value) {
      if (!canDeleteRedirectRule.value) {
        toastError('You do not have permission to delete redirect rules.')
        redirectModalState.closeModal({ replace: true })
        return
      }
      if (!deletingRedirectRule.value) {
        deletingRedirectRule.value = {
          id: newEntity.id,
          pattern: newEntity.pattern || `Rule #${newEntity.id}`
        }
      }
    }
  }
}, { immediate: true })

watch(() => redirectModalState.isView.value, (isView) => {
  if (!isView && !redirectModalState.isEdit.value && !redirectModalState.isDelete.value) {
    selectedRedirectRule.value = null
  }
}, { immediate: true })

watch(() => redirectModalState.isEdit.value, (isEdit) => {
  if (!isEdit) {
    editingRedirectRuleId.value = null
    originalRedirectRuleData.value = null
  }
}, { immediate: true })

watch(() => redirectModalState.isDelete.value, (isDelete) => {
  if (!isDelete) {
    deletingRedirectRule.value = null
  } else if (!canDeleteRedirectRule.value) {
    toastError('You do not have permission to delete redirect rules.')
    redirectModalState.closeModal({ replace: true })
  }
}, { immediate: true })

const openRedirectViewModal = (id: number | string) => {
  if (!canViewRedirects.value) {
    toastError('You do not have permission to view redirect rules.')
    return
  }
  redirectModalState.openView(id)
}

const closeRedirectViewModal = () => {
  redirectModalState.closeModal()
}

const openEditRedirectRuleModal = async (id: number | string) => {
  if (!canEditRedirectRule.value) {
    toastError('You do not have permission to edit redirect rules.')
    return
  }
  await redirectModalState.openEdit(id)
}

const closeRedirectEditModal = async () => {
  await redirectModalState.closeModal()
}

const openDeleteRedirectRuleModal = async (rule: { id: number; pattern?: string }) => {
  if (!canDeleteRedirectRule.value) {
    toastError('You do not have permission to delete redirect rules.')
    return
  }
  deletingRedirectRule.value = {
    id: rule.id,
    pattern: rule.pattern || `Rule #${rule.id}`
  }
  await redirectModalState.openDelete(rule.id)
}

const closeRedirectDeleteModal = async () => {
  await redirectModalState.closeModal()
}

const executeDeleteRedirectRule = async () => {
  if (!canDeleteRedirectRule.value) {
    toastError('You do not have permission to delete redirect rules.')
    return
  }

  const targetId = deletingRedirectRule.value?.id || redirectModalState.activeId.value
  if (!targetId) {
    toastError('Redirect rule identifier missing.')
    return
  }

  if (isDeletingRedirectRule.value) return

  isDeletingRedirectRule.value = true
  try {
    await contentSecurityService.deleteRedirectRule(targetId)
    toastSuccess(`Redirect rule "${deletingRedirectRule.value?.pattern || `#${targetId}`}" deleted successfully.`)
    await closeRedirectDeleteModal()
    await fetchRedirectRules()
    emit('refresh-summary')

    if (redirectRulesData.value.length === 0 && redirectPage.value > 1) {
      redirectPage.value = Math.max(1, redirectPage.value - 1)
      await fetchRedirectRules()
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to delete redirect rule.')
    toastError(msg)
  } finally {
    isDeletingRedirectRule.value = false
  }
}

const submitUpdateRedirectRule = async () => {
  if (!canEditRedirectRule.value) {
    toastError('You do not have permission to edit redirect rules.')
    return
  }

  if (!editingRedirectRuleId.value) {
    toastError('Redirect rule identifier missing.')
    return
  }

  const trimmedPattern = redirectEditForm.value.pattern.trim()
  if (!trimmedPattern) {
    toastError('Redirect pattern is required.')
    return
  }

  const payload: UpdateRedirectRulePayload = {}
  const orig = originalRedirectRuleData.value
  const current = redirectEditForm.value

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
    await closeRedirectEditModal()
    return
  }

  isSubmittingRedirectEdit.value = true
  try {
    const updated = await contentSecurityService.updateRedirectRule(editingRedirectRuleId.value, payload)
    toastSuccess('Redirect rule updated successfully.')
    await closeRedirectEditModal()
    await fetchRedirectRules()
    emit('refresh-summary')

    if (selectedRedirectRule.value && String(selectedRedirectRule.value.id) === String(updated.id)) {
      selectedRedirectRule.value = updated
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to update redirect rule.')
    toastError(msg)
  } finally {
    isSubmittingRedirectEdit.value = false
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
            v-model="redirectSearchQuery"
            type="text" 
            placeholder="Search redirect patterns or heuristics..." 
            class="w-full h-9 pl-9 pr-8 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
          <button 
            v-if="redirectSearchQuery" 
            @click="redirectSearchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <select 
          v-model="redirectCategory"
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
        </select>

        <select 
          v-model="redirectSeverity"
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
          @click="resetRedirectFilters"
          class="h-9 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors shrink-0 cursor-pointer"
        >
          Reset
        </button>
      </div>

      <div class="flex items-center gap-2">
        <select 
          v-model="redirectPageSize"
          class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none cursor-pointer"
        >
          <option :value="5">5 / page</option>
          <option :value="10">10 / page</option>
          <option :value="25">25 / page</option>
          <option :value="50">50 / page</option>
        </select>

        <select 
          v-model="redirectOrdering"
          class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none cursor-pointer"
        >
          <option value="-created_at">Newest First</option>
          <option value="created_at">Oldest First</option>
          <option value="pattern">Pattern (A-Z)</option>
          <option value="-pattern">Pattern (Z-A)</option>
        </select>

        <button 
          v-if="canAddRedirectRule"
          @click="emit('open-create')"
          class="h-9 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add Redirect Rule</span>
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="redirectsError" class="p-4 mb-4 text-xs text-rose-700 bg-rose-100/50 border border-rose-200 rounded-xl dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900" role="alert">
      <span class="font-bold">Error:</span> {{ redirectsError }}
    </div>

    <!-- Redirect Rules Table -->
    <div class="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
      <UiTable 
        :columns="redirectRuleColumns" 
        :data="redirectRulesData" 
        :loading="isRedirectsLoading"
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
              @click="openRedirectViewModal(item.id)"
              title="View Rule Details"
              aria-label="View Rule Details"
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Eye class="w-3.5 h-3.5" />
            </button>
            <button 
              v-if="canEditRedirectRule"
              @click="openEditRedirectRuleModal(item.id)"
              title="Edit Rule"
              aria-label="Edit Rule"
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Edit3 class="w-3.5 h-3.5" />
            </button>
            <button 
              v-if="canDeleteRedirectRule"
              @click="openDeleteRedirectRuleModal(item)"
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
            <ExternalLink class="w-8 h-8 text-muted-foreground mx-auto" />
            <p class="text-xs font-bold text-foreground">No Redirect Rules Found</p>
            <p class="text-[11px] text-muted-foreground">Adjust your filters or add a new redirect heuristic rule.</p>
          </div>
        </template>
      </UiTable>

      <div class="p-3 border-t border-border flex items-center justify-between">
        <UiPagination 
          :current-page="redirectPage"
          :total-pages="redirectRulesPages"
          :total-count="redirectRulesCount"
          :items-per-page="redirectPageSize"
          @update:current-page="redirectPage = $event"
        />
      </div>
    </div>

    <!-- MODAL: VIEW REDIRECT RULE DETAILS -->
    <UiAdminModal
      :is-open="redirectModalState.isView.value"
      :title="isRedirectDetailsLoading ? 'Loading Redirect Rule...' : (selectedRedirectRule ? `Redirect Rule #${selectedRedirectRule.id}` : 'Redirect Rule Details')"
      subtitle="Comprehensive security inspection parameters and audit metadata."
      max-width="max-w-2xl"
      @close="closeRedirectViewModal"
    >
      <div v-if="isRedirectDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving redirect rule details from security registry...</p>
      </div>

      <div v-else-if="!selectedRedirectRule" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-foreground">Rule Details Not Available</p>
        <p class="text-xs text-muted-foreground">Could not load the requested redirect rule from the security engine.</p>
        <button 
          type="button"
          @click="closeRedirectViewModal"
          class="mt-2 h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

      <div v-else class="p-6 sm:p-8 space-y-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-muted/40 rounded-2xl border border-border">
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Redirect Pattern</span>
            </div>
            <div class="font-mono text-base sm:text-lg font-bold text-foreground bg-background px-3 py-1.5 rounded-xl border border-border shadow-2xs inline-block break-all">
              {{ selectedRedirectRule.pattern }}
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <span :class="cn('px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border', getSeverityBadge(selectedRedirectRule.severity))">
              {{ selectedRedirectRule.severity }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 bg-card border border-border rounded-xl space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</span>
            <p class="text-sm font-bold text-foreground">{{ selectedRedirectRule.category }}</p>
          </div>

          <div class="p-4 bg-card border border-border rounded-xl space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Operational Status</span>
            <div class="flex items-center gap-3">
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedRedirectRule.is_enabled 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedRedirectRule.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedRedirectRule.is_enabled ? 'Enabled' : 'Disabled' }}</span>
              </span>

              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedRedirectRule.is_active 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedRedirectRule.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedRedirectRule.is_active ? 'Active' : 'Inactive' }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rule Description & Rationale</span>
          <div class="bg-card border border-border rounded-xl p-4 text-xs font-medium text-foreground leading-relaxed">
            <p v-if="selectedRedirectRule.description?.trim()">{{ selectedRedirectRule.description }}</p>
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
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedRedirectRule.created_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedRedirectRule.updated_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Created By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedRedirectRule.created_by) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedRedirectRule.updated_by) }}</p>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            @click="closeRedirectViewModal"
            class="h-9 px-5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- MODAL: EDIT REDIRECT RULE -->
    <UiAdminModal
      :is-open="redirectModalState.isEdit.value"
      :title="editingRedirectRuleId ? `Edit Redirect Rule #${editingRedirectRuleId}` : 'Edit Redirect Rule'"
      subtitle="Modify redirect heuristic pattern and detection operational state."
      max-width="max-w-lg"
      @close="closeRedirectEditModal"
    >
      <form @submit.prevent="submitUpdateRedirectRule" class="p-6 space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Pattern / Heuristic <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="redirectEditForm.pattern"
            type="text" 
            placeholder="e.g. window.location.href or meta refresh"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="redirectEditForm.category"
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
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
            <select 
              v-model="redirectEditForm.severity"
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
            v-model="redirectEditForm.description"
            rows="2"
            placeholder="Explain why this redirect pattern is flagged..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground font-medium">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="redirectEditForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingRedirectEdit"
            @click="closeRedirectEditModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingRedirectEdit"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <RefreshCw v-if="isSubmittingRedirectEdit" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingRedirectEdit ? 'Saving...' : 'Save Changes' }}</span>
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- MODAL: DELETE CONFIRMATION -->
    <UiAdminModal
      :is-open="redirectModalState.isDelete.value"
      title="Delete Redirect Rule"
      subtitle="Are you sure you want to permanently delete this rule from the security engine?"
      max-width="max-w-md"
      @close="closeRedirectDeleteModal"
    >
      <div class="p-6 space-y-4">
        <div class="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="text-xs font-bold text-destructive">Irreversible Action</p>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Deleting redirect rule <strong class="text-foreground font-mono">{{ deletingRedirectRule?.pattern || `#${redirectModalState.activeId.value}` }}</strong> will remove its heuristic matching capabilities during catalog scans.
            </p>
          </div>
        </div>

        <div class="pt-2 flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isDeletingRedirectRule"
            @click="closeRedirectDeleteModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button" 
            :disabled="isDeletingRedirectRule"
            @click="executeDeleteRedirectRule"
            class="h-9 px-5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <RefreshCw v-if="isDeletingRedirectRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDeletingRedirectRule ? 'Deleting...' : 'Delete Rule' }}</span>
          </button>
        </div>
      </div>
    </UiAdminModal>
  </div>
</template>
