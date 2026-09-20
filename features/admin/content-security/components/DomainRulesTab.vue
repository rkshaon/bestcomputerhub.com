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
  Globe
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
  DomainRule,
  DomainRuleDetail,
  DomainRulesQueryParams,
  DomainMatchType,
  KeywordCategory,
  KeywordSeverity,
  UpdateDomainRulePayload
} from '@/types'

const emit = defineEmits<{
  (e: 'refresh-summary'): void
  (e: 'open-create'): void
}>()

const route = useRoute()
const router = useRouter()
const contentSecurityService = useContentSecurityService()
const { hasPermission } = useAdminPermissions()

const canViewDomains = computed(() => hasPermission('content_security.view_domainrule'))
const canAddDomainRule = computed(() => hasPermission('content_security.add_domainrule'))
const canEditDomainRule = computed(() => hasPermission('content_security.change_domainrule'))
const canDeleteDomainRule = computed(() => hasPermission('content_security.delete_domainrule'))

// Domain Rules Query/Data States
const isDomainsLoading = ref(false)
const domainsError = ref<string | null>(null)
const domainSearchQuery = ref('')
const debouncedDomainSearch = refDebounced(domainSearchQuery, 300)
const domainCategory = ref<string>('all')
const domainSeverity = ref<string>('all')
const domainMatchType = ref<string>('all')
const domainIsActive = ref<string>('all')
const domainIsEnabled = ref<string>('all')
const domainOrdering = ref<string>('-created_at')
const domainPage = ref(1)
const domainPageSize = ref(10)
const domainRulesData = ref<DomainRule[]>([])
const domainRulesCount = ref(0)
const domainRulesPages = ref(1)

const domainRuleColumns: UiTableColumn<DomainRule>[] = [
  { key: 'domain', label: 'Domain', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-sm font-bold text-foreground' },
  { key: 'category', label: 'Category', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'match_type', label: 'Match Type', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs' },
  { key: 'severity', label: 'Severity', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_enabled', label: 'Enabled', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_active', label: 'Active', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'created_at', label: 'Created At', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'actions', label: 'Actions', align: 'right' as const, width: '100px', headerClass: 'px-4 py-3 text-right whitespace-nowrap', cellClass: 'px-4 py-3 text-right whitespace-nowrap' }
]

const resetDomainFilters = () => {
  domainSearchQuery.value = ''
  domainCategory.value = 'all'
  domainSeverity.value = 'all'
  domainMatchType.value = 'all'
  domainIsActive.value = 'all'
  domainIsEnabled.value = 'all'
  domainOrdering.value = '-created_at'
  domainPage.value = 1
}

const fetchDomainRules = async () => {
  if (!canViewDomains.value) return
  
  isDomainsLoading.value = true
  domainsError.value = null

  try {
    const params: DomainRulesQueryParams = {
      page: domainPage.value,
      page_size: domainPageSize.value,
      ordering: domainOrdering.value
    }

    if (debouncedDomainSearch.value.trim()) {
      params.search = debouncedDomainSearch.value.trim()
    }
    if (domainCategory.value !== 'all') {
      params.category = domainCategory.value as KeywordCategory
    }
    if (domainSeverity.value !== 'all') {
      params.severity = domainSeverity.value as KeywordSeverity
    }
    if (domainMatchType.value !== 'all') {
      params.match_type = domainMatchType.value as DomainMatchType
    }
    if (domainIsActive.value !== 'all') {
      params.is_active = domainIsActive.value === 'true'
    }
    if (domainIsEnabled.value !== 'all') {
      params.is_enabled = domainIsEnabled.value === 'true'
    }

    const response = await contentSecurityService.getDomainRules(params)
    domainRulesData.value = response.results
    domainRulesCount.value = response.count
    domainRulesPages.value = response.pages
  } catch (err: any) {
    domainsError.value = extractErrorMessage(err, 'Failed to retrieve domain rules.')
  } finally {
    isDomainsLoading.value = false
  }
}

watch(
  [
    debouncedDomainSearch,
    domainCategory,
    domainSeverity,
    domainMatchType,
    domainIsActive,
    domainIsEnabled,
    domainOrdering,
    domainPageSize
  ],
  () => {
    domainPage.value = 1
    fetchDomainRules()
  }
)

watch(domainPage, () => {
  fetchDomainRules()
})

onMounted(() => {
  fetchDomainRules()
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

// Modal State: Domain Rule Details (View, Edit & Delete)
const isDomainDetailsLoading = ref(false)
const selectedDomainRule = ref<DomainRuleDetail | null>(null)
const editingDomainRuleId = ref<number | null>(null)
const isSubmittingDomainEdit = ref(false)
const isDeletingDomainRule = ref(false)
const deletingDomainRule = ref<{ id: number; domain: string } | null>(null)

const domainEditForm = ref<{
  domain: string
  category: KeywordCategory
  severity: KeywordSeverity
  match_type: DomainMatchType
  is_enabled: boolean
  description: string
}>({
  domain: '',
  category: 'PHISHING',
  severity: 'HIGH',
  match_type: 'SUBDOMAIN',
  is_enabled: true,
  description: ''
})

const originalDomainRuleData = ref<{
  domain: string
  category: KeywordCategory
  severity: KeywordSeverity
  match_type: DomainMatchType
  is_enabled: boolean
  description: string
} | null>(null)

const domainModalState = useAdminModalState<DomainRuleDetail>({
  getItems: async (id) => {
    isDomainDetailsLoading.value = true
    try {
      const details = await contentSecurityService.getDomainRuleDetails(String(id))
      return details
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve domain rule details.')
      toastError(msg)
      return null
    } finally {
      isDomainDetailsLoading.value = false
    }
  },
  onResolveError: (id) => {
    toastError(`Domain Rule #${id} could not be resolved.`)
    domainModalState.closeModal({ replace: true })
  }
})

watch(() => domainModalState.activeEntity.value, (newEntity) => {
  if (newEntity) {
    selectedDomainRule.value = newEntity

    if (domainModalState.isEdit.value) {
      if (!canEditDomainRule.value) {
        toastError('You do not have permission to edit domain rules.')
        domainModalState.closeModal({ replace: true })
        return
      }
      editingDomainRuleId.value = newEntity.id
      domainEditForm.value = {
        domain: newEntity.domain || '',
        category: newEntity.category || 'PHISHING',
        severity: newEntity.severity || 'HIGH',
        match_type: newEntity.match_type || 'SUBDOMAIN',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      }
      originalDomainRuleData.value = {
        domain: newEntity.domain || '',
        category: newEntity.category || 'PHISHING',
        severity: newEntity.severity || 'HIGH',
        match_type: newEntity.match_type || 'SUBDOMAIN',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      }
    }

    if (domainModalState.isDelete.value) {
      if (!canDeleteDomainRule.value) {
        toastError('You do not have permission to delete domain rules.')
        domainModalState.closeModal({ replace: true })
        return
      }
      if (!deletingDomainRule.value) {
        deletingDomainRule.value = {
          id: newEntity.id,
          domain: newEntity.domain || `Rule #${newEntity.id}`
        }
      }
    }
  }
}, { immediate: true })

watch(() => domainModalState.isView.value, (isView) => {
  if (!isView && !domainModalState.isEdit.value && !domainModalState.isDelete.value) {
    selectedDomainRule.value = null
  }
}, { immediate: true })

watch(() => domainModalState.isEdit.value, (isEdit) => {
  if (!isEdit) {
    editingDomainRuleId.value = null
    originalDomainRuleData.value = null
  }
}, { immediate: true })

watch(() => domainModalState.isDelete.value, (isDelete) => {
  if (!isDelete) {
    deletingDomainRule.value = null
  } else if (!canDeleteDomainRule.value) {
    toastError('You do not have permission to delete domain rules.')
    domainModalState.closeModal({ replace: true })
  }
}, { immediate: true })

const openDomainViewModal = (id: number | string) => {
  if (!canViewDomains.value) {
    toastError('You do not have permission to view domain rules.')
    return
  }
  domainModalState.openView(id)
}

const closeDomainViewModal = () => {
  domainModalState.closeModal()
}

const openEditDomainRuleModal = async (id: number | string) => {
  if (!canEditDomainRule.value) {
    toastError('You do not have permission to edit domain rules.')
    return
  }
  await domainModalState.openEdit(id)
}

const closeDomainEditModal = async () => {
  await domainModalState.closeModal()
}

const openDeleteDomainRuleModal = async (rule: { id: number; domain?: string }) => {
  if (!canDeleteDomainRule.value) {
    toastError('You do not have permission to delete domain rules.')
    return
  }
  deletingDomainRule.value = {
    id: rule.id,
    domain: rule.domain || `Rule #${rule.id}`
  }
  await domainModalState.openDelete(rule.id)
}

const closeDomainDeleteModal = async () => {
  await domainModalState.closeModal()
}

const executeDeleteDomainRule = async () => {
  if (!canDeleteDomainRule.value) {
    toastError('You do not have permission to delete domain rules.')
    return
  }

  const targetId = deletingDomainRule.value?.id || domainModalState.activeId.value
  if (!targetId) {
    toastError('Domain rule identifier missing.')
    return
  }

  if (isDeletingDomainRule.value) return

  isDeletingDomainRule.value = true
  try {
    await contentSecurityService.deleteDomainRule(targetId)
    toastSuccess(`Domain rule "${deletingDomainRule.value?.domain || `#${targetId}`}" deleted successfully.`)
    await closeDomainDeleteModal()
    await fetchDomainRules()
    emit('refresh-summary')

    if (domainRulesData.value.length === 0 && domainPage.value > 1) {
      domainPage.value = Math.max(1, domainPage.value - 1)
      await fetchDomainRules()
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to delete domain rule.')
    toastError(msg)
  } finally {
    isDeletingDomainRule.value = false
  }
}

const submitUpdateDomainRule = async () => {
  if (!canEditDomainRule.value) {
    toastError('You do not have permission to edit domain rules.')
    return
  }

  if (!editingDomainRuleId.value) {
    toastError('Domain rule identifier missing.')
    return
  }

  const trimmedDomain = domainEditForm.value.domain.trim()
  if (!trimmedDomain) {
    toastError('Domain is required.')
    return
  }

  const payload: UpdateDomainRulePayload = {}
  const orig = originalDomainRuleData.value
  const current = domainEditForm.value

  if (orig) {
    if (trimmedDomain !== orig.domain.trim()) {
      payload.domain = trimmedDomain
    }
    if (current.category !== orig.category) {
      payload.category = current.category
    }
    if (current.severity !== orig.severity) {
      payload.severity = current.severity
    }
    if (current.match_type !== orig.match_type) {
      payload.match_type = current.match_type
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
    payload.domain = trimmedDomain
    payload.category = current.category
    payload.severity = current.severity
    payload.match_type = current.match_type
    payload.is_enabled = current.is_enabled
    payload.description = current.description.trim()
  }

  if (Object.keys(payload).length === 0) {
    toastInfo('No changes detected.')
    await closeDomainEditModal()
    return
  }

  isSubmittingDomainEdit.value = true
  try {
    const updated = await contentSecurityService.updateDomainRule(editingDomainRuleId.value, payload)
    toastSuccess('Domain rule updated successfully.')
    await closeDomainEditModal()
    await fetchDomainRules()
    emit('refresh-summary')

    if (selectedDomainRule.value && String(selectedDomainRule.value.id) === String(updated.id)) {
      selectedDomainRule.value = updated
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to update domain rule.')
    toastError(msg)
  } finally {
    isSubmittingDomainEdit.value = false
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
            v-model="domainSearchQuery"
            type="text" 
            placeholder="Search domain patterns..." 
            class="w-full h-9 pl-9 pr-8 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
          <button 
            v-if="domainSearchQuery" 
            @click="domainSearchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <select 
          v-model="domainCategory"
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
          v-model="domainSeverity"
          class="h-9 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
        >
          <option value="all">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
          <option value="INFO">Info</option>
        </select>

        <select 
          v-model="domainMatchType"
          class="h-9 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
        >
          <option value="all">All Match Types</option>
          <option value="EXACT">Exact Host</option>
          <option value="SUBDOMAIN">Subdomains & Host</option>
          <option value="SUFFIX">TLD / Suffix</option>
          <option value="REGEX">Regular Expression</option>
        </select>

        <button 
          @click="resetDomainFilters"
          class="h-9 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors shrink-0 cursor-pointer"
        >
          Reset
        </button>
      </div>

      <div class="flex items-center gap-2">
        <select 
          v-model="domainPageSize"
          class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none cursor-pointer"
        >
          <option :value="5">5 / page</option>
          <option :value="10">10 / page</option>
          <option :value="25">25 / page</option>
          <option :value="50">50 / page</option>
        </select>

        <select 
          v-model="domainOrdering"
          class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none cursor-pointer"
        >
          <option value="-created_at">Newest First</option>
          <option value="created_at">Oldest First</option>
          <option value="domain">Domain (A-Z)</option>
          <option value="-domain">Domain (Z-A)</option>
        </select>

        <button 
          v-if="canAddDomainRule"
          @click="emit('open-create')"
          class="h-9 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add Domain</span>
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="domainsError" class="p-4 mb-4 text-xs text-rose-700 bg-rose-100/50 border border-rose-200 rounded-xl dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900" role="alert">
      <span class="font-bold">Error:</span> {{ domainsError }}
    </div>

    <!-- Domain Rules Table -->
    <div class="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
      <UiTable 
        :columns="domainRuleColumns" 
        :data="domainRulesData" 
        :loading="isDomainsLoading"
      >
        <template #cell(domain)="{ item }">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded border border-border">
              {{ item.domain }}
            </span>
          </div>
        </template>

        <template #cell(category)="{ item }">
          <span class="text-xs font-medium text-foreground">
            {{ item.category }}
          </span>
        </template>

        <template #cell(match_type)="{ item }">
          <span class="px-2 py-0.5 rounded-full bg-muted text-[10px] font-mono font-semibold text-foreground border border-border">
            {{ item.match_type }}
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
              @click="openDomainViewModal(item.id)"
              title="View Rule Details"
              aria-label="View Rule Details"
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Eye class="w-3.5 h-3.5" />
            </button>
            <button 
              v-if="canEditDomainRule"
              @click="openEditDomainRuleModal(item.id)"
              title="Edit Rule"
              aria-label="Edit Rule"
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Edit3 class="w-3.5 h-3.5" />
            </button>
            <button 
              v-if="canDeleteDomainRule"
              @click="openDeleteDomainRuleModal(item)"
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
            <Globe class="w-8 h-8 text-muted-foreground mx-auto" />
            <p class="text-xs font-bold text-foreground">No Domain Rules Found</p>
            <p class="text-[11px] text-muted-foreground">Adjust your filters or add a new domain blacklisting rule.</p>
          </div>
        </template>
      </UiTable>

      <div class="p-3 border-t border-border flex items-center justify-between">
        <UiPagination 
          :current-page="domainPage"
          :total-pages="domainRulesPages"
          :total-count="domainRulesCount"
          :items-per-page="domainPageSize"
          @update:current-page="domainPage = $event"
        />
      </div>
    </div>

    <!-- MODAL: VIEW DOMAIN RULE DETAILS -->
    <UiAdminModal
      :is-open="domainModalState.isView.value"
      :title="isDomainDetailsLoading ? 'Loading Domain Rule...' : (selectedDomainRule ? `Domain Rule #${selectedDomainRule.id}` : 'Domain Rule Details')"
      subtitle="Comprehensive security inspection parameters and audit metadata."
      max-width="max-w-2xl"
      @close="closeDomainViewModal"
    >
      <div v-if="isDomainDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving domain rule details from security registry...</p>
      </div>

      <div v-else-if="!selectedDomainRule" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-foreground">Rule Details Not Available</p>
        <p class="text-xs text-muted-foreground">Could not load the requested domain rule from the security engine.</p>
        <button 
          type="button"
          @click="closeDomainViewModal"
          class="mt-2 h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

      <div v-else class="p-6 sm:p-8 space-y-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-muted/40 rounded-2xl border border-border">
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Blocked Domain</span>
            </div>
            <div class="font-mono text-base sm:text-lg font-bold text-foreground bg-background px-3 py-1.5 rounded-xl border border-border shadow-2xs inline-block break-all">
              {{ selectedDomainRule.domain }}
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <span :class="cn('px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border', getSeverityBadge(selectedDomainRule.severity))">
              {{ selectedDomainRule.severity }}
            </span>
            <span class="px-2.5 py-1 rounded-full bg-muted text-xs font-mono font-semibold text-foreground border border-border">
              {{ selectedDomainRule.match_type }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 bg-card border border-border rounded-xl space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</span>
            <p class="text-sm font-bold text-foreground">{{ selectedDomainRule.category }}</p>
          </div>

          <div class="p-4 bg-card border border-border rounded-xl space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Operational Status</span>
            <div class="flex items-center gap-3">
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedDomainRule.is_enabled 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedDomainRule.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedDomainRule.is_enabled ? 'Enabled' : 'Disabled' }}</span>
              </span>

              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedDomainRule.is_active 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedDomainRule.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedDomainRule.is_active ? 'Active' : 'Inactive' }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rule Description & Rationale</span>
          <div class="bg-card border border-border rounded-xl p-4 text-xs font-medium text-foreground leading-relaxed">
            <p v-if="selectedDomainRule.description?.trim()">{{ selectedDomainRule.description }}</p>
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
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedDomainRule.created_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedDomainRule.updated_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Created By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedDomainRule.created_by) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedDomainRule.updated_by) }}</p>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            @click="closeDomainViewModal"
            class="h-9 px-5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- MODAL: EDIT DOMAIN RULE -->
    <UiAdminModal
      :is-open="domainModalState.isEdit.value"
      :title="editingDomainRuleId ? `Edit Domain Rule #${editingDomainRuleId}` : 'Edit Domain Rule'"
      subtitle="Modify blacklisted domain parameters and detection operational state."
      max-width="max-w-lg"
      @close="closeDomainEditModal"
    >
      <form @submit.prevent="submitUpdateDomainRule" class="p-6 space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Domain / Pattern <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="domainEditForm.domain"
            type="text" 
            placeholder="e.g. suspicious-site.com"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="domainEditForm.category"
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
              v-model="domainEditForm.severity"
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
          <label class="text-xs font-bold text-foreground">Match Type <span class="text-rose-500">*</span></label>
          <select 
            v-model="domainEditForm.match_type"
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
          >
            <option value="EXACT">Exact Host</option>
            <option value="SUBDOMAIN">Subdomains & Host</option>
            <option value="SUFFIX">TLD / Suffix</option>
            <option value="REGEX">Regular Expression</option>
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Description</label>
          <textarea 
            v-model="domainEditForm.description"
            rows="2"
            placeholder="Explain why this domain is blocked..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground font-medium">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="domainEditForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingDomainEdit"
            @click="closeDomainEditModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingDomainEdit"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <RefreshCw v-if="isSubmittingDomainEdit" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingDomainEdit ? 'Saving...' : 'Save Changes' }}</span>
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- MODAL: DELETE CONFIRMATION -->
    <UiAdminModal
      :is-open="domainModalState.isDelete.value"
      title="Delete Domain Rule"
      subtitle="Are you sure you want to permanently delete this rule from the security engine?"
      max-width="max-w-md"
      @close="closeDomainDeleteModal"
    >
      <div class="p-6 space-y-4">
        <div class="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="text-xs font-bold text-destructive">Irreversible Action</p>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Deleting domain rule <strong class="text-foreground font-mono">{{ deletingDomainRule?.domain || `#${domainModalState.activeId.value}` }}</strong> will remove its domain matching capabilities during catalog scans.
            </p>
          </div>
        </div>

        <div class="pt-2 flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isDeletingDomainRule"
            @click="closeDomainDeleteModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button" 
            :disabled="isDeletingDomainRule"
            @click="executeDeleteDomainRule"
            class="h-9 px-5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <RefreshCw v-if="isDeletingDomainRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDeletingDomainRule ? 'Deleting...' : 'Delete Rule' }}</span>
          </button>
        </div>
      </div>
    </UiAdminModal>
  </div>
</template>
