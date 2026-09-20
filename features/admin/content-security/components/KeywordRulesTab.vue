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
  ShieldAlert
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
  KeywordRule,
  KeywordRuleDetail,
  KeywordCategory,
  KeywordSeverity,
  KeywordMatchType,
  UpdateKeywordRulePayload
} from '@/types'

const emit = defineEmits<{
  (e: 'refresh-summary'): void
  (e: 'open-create'): void
}>()

const route = useRoute()
const router = useRouter()
const contentSecurityService = useContentSecurityService()
const { hasPermission } = useAdminPermissions()

const canViewKeywords = computed(() => hasPermission('content_security.view_keywordrule'))
const canAddKeywordRule = computed(() => hasPermission('content_security.add_keywordrule'))
const canEditKeywordRule = computed(() => hasPermission('content_security.change_keywordrule'))
const canDeleteKeywordRule = computed(() => hasPermission('content_security.delete_keywordrule'))

const isKeywordsLoading = computed(() => contentSecurityService.isLoading.value)
const keywordsError = computed(() => contentSecurityService.error.value)

// Keyword Rules Query/Data States
const keywordSearchQuery = ref('')
const debouncedKeywordSearch = refDebounced(keywordSearchQuery, 300)
const keywordCategory = ref<string>('all')
const keywordSeverity = ref<string>('all')
const keywordMatchType = ref<string>('all')
const keywordIsActive = ref<string>('all')
const keywordIsEnabled = ref<string>('all')
const keywordOrdering = ref<string>('-created_at')
const keywordPage = ref(1)
const keywordPageSize = ref(10)
const keywordRulesData = ref<KeywordRule[]>([])
const keywordRulesCount = ref(0)
const keywordRulesPages = ref(1)

const keywordRuleColumns: UiTableColumn<KeywordRule>[] = [
  { key: 'keyword', label: 'Keyword', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-sm font-bold text-foreground' },
  { key: 'category', label: 'Category', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'match_type', label: 'Match Type', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs' },
  { key: 'severity', label: 'Severity', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_enabled', label: 'Enabled', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_active', label: 'Active', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'created_at', label: 'Created At', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'actions', label: 'Actions', align: 'right' as const, width: '100px', headerClass: 'px-4 py-3 text-right whitespace-nowrap', cellClass: 'px-4 py-3 text-right whitespace-nowrap' }
]

const resetKeywordFilters = () => {
  keywordSearchQuery.value = ''
  keywordCategory.value = 'all'
  keywordSeverity.value = 'all'
  keywordMatchType.value = 'all'
  keywordIsActive.value = 'all'
  keywordIsEnabled.value = 'all'
  keywordOrdering.value = '-created_at'
  keywordPage.value = 1
}

const fetchKeywordRules = async () => {
  if (!canViewKeywords.value) return
  
  const params: any = {
    page: keywordPage.value,
    page_size: keywordPageSize.value,
    ordering: keywordOrdering.value
  }

  if (debouncedKeywordSearch.value.trim()) {
    params.search = debouncedKeywordSearch.value.trim()
  }
  if (keywordCategory.value !== 'all') {
    params.category = keywordCategory.value
  }
  if (keywordSeverity.value !== 'all') {
    params.severity = keywordSeverity.value
  }
  if (keywordMatchType.value !== 'all') {
    params.match_type = keywordMatchType.value
  }
  if (keywordIsActive.value !== 'all') {
    params.is_active = keywordIsActive.value === 'true'
  }
  if (keywordIsEnabled.value !== 'all') {
    params.is_enabled = keywordIsEnabled.value === 'true'
  }

  try {
    const response = await contentSecurityService.getKeywordRules(params)
    keywordRulesData.value = response.results
    keywordRulesCount.value = response.count
    keywordRulesPages.value = response.pages
  } catch (err: any) {
    // Handled in service
  }
}

// Watchers for fetch and query params
watch(
  [
    debouncedKeywordSearch,
    keywordCategory,
    keywordSeverity,
    keywordMatchType,
    keywordIsActive,
    keywordIsEnabled,
    keywordOrdering,
    keywordPageSize
  ],
  () => {
    keywordPage.value = 1
    fetchKeywordRules()
  }
)

watch(keywordPage, () => {
  fetchKeywordRules()
})

onMounted(() => {
  fetchKeywordRules()
})

// Helper formatters
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

// Modal State: Keyword Rule Details (View, Edit & Delete)
const isKeywordDetailsLoading = ref(false)
const selectedKeywordRule = ref<KeywordRuleDetail | null>(null)
const editingKeywordRuleId = ref<number | null>(null)
const isSubmittingKeywordEdit = ref(false)
const isDeletingKeywordRule = ref(false)
const deletingKeywordRule = ref<{ id: number; keyword: string } | null>(null)

const keywordEditForm = ref<{
  keyword: string
  category: KeywordCategory
  severity: KeywordSeverity
  match_type: KeywordMatchType
  is_enabled: boolean
  description: string
}>({
  keyword: '',
  category: 'SPAM',
  severity: 'HIGH',
  match_type: 'WORD',
  is_enabled: true,
  description: ''
})

const originalKeywordRuleData = ref<{
  keyword: string
  category: KeywordCategory
  severity: KeywordSeverity
  match_type: KeywordMatchType
  is_enabled: boolean
  description: string
} | null>(null)

const keywordModalState = useAdminModalState<KeywordRuleDetail>({
  getItems: async (id) => {
    isKeywordDetailsLoading.value = true
    try {
      const details = await contentSecurityService.getKeywordRuleDetails(String(id))
      return details
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve keyword rule details.')
      toastError(msg)
      return null
    } finally {
      isKeywordDetailsLoading.value = false
    }
  },
  onResolveError: (id) => {
    toastError(`Keyword Rule #${id} could not be resolved.`)
    keywordModalState.closeModal({ replace: true })
  }
})

watch(() => keywordModalState.activeEntity.value, (newEntity) => {
  if (newEntity) {
    selectedKeywordRule.value = newEntity

    if (keywordModalState.isEdit.value) {
      if (!canEditKeywordRule.value) {
        toastError('You do not have permission to edit keyword rules.')
        keywordModalState.closeModal({ replace: true })
        return
      }
      editingKeywordRuleId.value = newEntity.id
      keywordEditForm.value = {
        keyword: newEntity.keyword || '',
        category: newEntity.category || 'SPAM',
        severity: newEntity.severity || 'HIGH',
        match_type: newEntity.match_type || 'WORD',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      }
      originalKeywordRuleData.value = {
        keyword: newEntity.keyword || '',
        category: newEntity.category || 'SPAM',
        severity: newEntity.severity || 'HIGH',
        match_type: newEntity.match_type || 'WORD',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      }
    }

    if (keywordModalState.isDelete.value) {
      if (!canDeleteKeywordRule.value) {
        toastError('You do not have permission to delete keyword rules.')
        keywordModalState.closeModal({ replace: true })
        return
      }
      if (!deletingKeywordRule.value) {
        deletingKeywordRule.value = {
          id: newEntity.id,
          keyword: newEntity.keyword || `Rule #${newEntity.id}`
        }
      }
    }
  }
}, { immediate: true })

watch(() => keywordModalState.isView.value, (isView) => {
  if (!isView && !keywordModalState.isEdit.value && !keywordModalState.isDelete.value) {
    selectedKeywordRule.value = null
  }
}, { immediate: true })

watch(() => keywordModalState.isEdit.value, (isEdit) => {
  if (!isEdit) {
    editingKeywordRuleId.value = null
    originalKeywordRuleData.value = null
  }
}, { immediate: true })

watch(() => keywordModalState.isDelete.value, (isDelete) => {
  if (!isDelete) {
    deletingKeywordRule.value = null
  } else if (!canDeleteKeywordRule.value) {
    toastError('You do not have permission to delete keyword rules.')
    keywordModalState.closeModal({ replace: true })
  }
}, { immediate: true })

const openKeywordViewModal = (id: number | string) => {
  if (!canViewKeywords.value) {
    toastError('You do not have permission to view keyword rules.')
    return
  }
  keywordModalState.openView(id)
}

const closeKeywordViewModal = () => {
  keywordModalState.closeModal()
}

const openEditKeywordRuleModal = async (id: number | string) => {
  if (!canEditKeywordRule.value) {
    toastError('You do not have permission to edit keyword rules.')
    return
  }
  await keywordModalState.openEdit(id)
}

const closeKeywordEditModal = async () => {
  await keywordModalState.closeModal()
}

const openDeleteKeywordRuleModal = async (rule: { id: number; keyword?: string }) => {
  if (!canDeleteKeywordRule.value) {
    toastError('You do not have permission to delete keyword rules.')
    return
  }
  deletingKeywordRule.value = {
    id: rule.id,
    keyword: rule.keyword || `Rule #${rule.id}`
  }
  await keywordModalState.openDelete(rule.id)
}

const closeKeywordDeleteModal = async () => {
  await keywordModalState.closeModal()
}

const executeDeleteKeywordRule = async () => {
  if (!canDeleteKeywordRule.value) {
    toastError('You do not have permission to delete keyword rules.')
    return
  }

  const targetId = deletingKeywordRule.value?.id || keywordModalState.activeId.value
  if (!targetId) {
    toastError('Keyword rule identifier missing.')
    return
  }

  if (isDeletingKeywordRule.value) return

  isDeletingKeywordRule.value = true
  try {
    await contentSecurityService.deleteKeywordRule(targetId)
    toastSuccess(`Keyword rule "${deletingKeywordRule.value?.keyword || `#${targetId}`}" deleted successfully.`)
    await closeKeywordDeleteModal()
    await fetchKeywordRules()
    emit('refresh-summary')

    if (keywordRulesData.value.length === 0 && keywordPage.value > 1) {
      keywordPage.value = Math.max(1, keywordPage.value - 1)
      await fetchKeywordRules()
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to delete keyword rule.')
    toastError(msg)
  } finally {
    isDeletingKeywordRule.value = false
  }
}

const submitUpdateKeywordRule = async () => {
  if (!canEditKeywordRule.value) {
    toastError('You do not have permission to edit keyword rules.')
    return
  }

  if (!editingKeywordRuleId.value) {
    toastError('Keyword rule identifier missing.')
    return
  }

  const trimmedKeyword = keywordEditForm.value.keyword.trim()
  if (!trimmedKeyword) {
    toastError('Keyword is required.')
    return
  }

  const payload: UpdateKeywordRulePayload = {}
  const orig = originalKeywordRuleData.value
  const current = keywordEditForm.value

  if (orig) {
    if (trimmedKeyword !== orig.keyword.trim()) {
      payload.keyword = trimmedKeyword
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
    payload.keyword = trimmedKeyword
    payload.category = current.category
    payload.severity = current.severity
    payload.match_type = current.match_type
    payload.is_enabled = current.is_enabled
    payload.description = current.description.trim()
  }

  if (Object.keys(payload).length === 0) {
    toastInfo('No changes detected.')
    await closeKeywordEditModal()
    return
  }

  isSubmittingKeywordEdit.value = true
  try {
    const updated = await contentSecurityService.updateKeywordRule(editingKeywordRuleId.value, payload)
    toastSuccess('Keyword rule updated successfully.')
    await closeKeywordEditModal()
    await fetchKeywordRules()
    emit('refresh-summary')

    if (selectedKeywordRule.value && String(selectedKeywordRule.value.id) === String(updated.id)) {
      selectedKeywordRule.value = updated
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to update keyword rule.')
    toastError(msg)
  } finally {
    isSubmittingKeywordEdit.value = false
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
            v-model="keywordSearchQuery"
            type="text" 
            placeholder="Search keyword patterns..." 
            class="w-full h-9 pl-9 pr-8 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
          <button 
            v-if="keywordSearchQuery" 
            @click="keywordSearchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <select 
          v-model="keywordCategory"
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
          v-model="keywordSeverity"
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
          v-model="keywordMatchType"
          class="h-9 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
        >
          <option value="all">All Match Types</option>
          <option value="EXACT">Exact Match</option>
          <option value="WORD">Word Boundary</option>
          <option value="CONTAINS">Contains Substring</option>
          <option value="REGEX">Regular Expression</option>
        </select>

        <button 
          @click="resetKeywordFilters"
          class="h-9 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors shrink-0 cursor-pointer"
        >
          Reset
        </button>
      </div>

      <div class="flex items-center gap-2">
        <select 
          v-model="keywordPageSize"
          class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none cursor-pointer"
        >
          <option :value="5">5 / page</option>
          <option :value="10">10 / page</option>
          <option :value="25">25 / page</option>
          <option :value="50">50 / page</option>
        </select>

        <select 
          v-model="keywordOrdering"
          class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none cursor-pointer"
        >
          <option value="-created_at">Newest First</option>
          <option value="created_at">Oldest First</option>
          <option value="keyword">Keyword (A-Z)</option>
          <option value="-keyword">Keyword (Z-A)</option>
        </select>

        <button 
          v-if="canAddKeywordRule"
          @click="emit('open-create')"
          class="h-9 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add Keyword</span>
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="keywordsError" class="p-4 mb-4 text-xs text-rose-700 bg-rose-100/50 border border-rose-200 rounded-xl dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900" role="alert">
      <span class="font-bold">Error:</span> {{ keywordsError }}
    </div>

    <!-- Keyword Rules Table -->
    <div class="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
      <UiTable 
        :columns="keywordRuleColumns" 
        :data="keywordRulesData" 
        :loading="isKeywordsLoading"
      >
        <template #cell(keyword)="{ item }">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded border border-border">
              {{ item.keyword }}
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
              @click="openKeywordViewModal(item.id)"
              title="View Rule Details"
              aria-label="View Rule Details"
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Eye class="w-3.5 h-3.5" />
            </button>
            <button 
              v-if="canEditKeywordRule"
              @click="openEditKeywordRuleModal(item.id)"
              title="Edit Rule"
              aria-label="Edit Rule"
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Edit3 class="w-3.5 h-3.5" />
            </button>
            <button 
              v-if="canDeleteKeywordRule"
              @click="openDeleteKeywordRuleModal(item)"
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
            <ShieldAlert class="w-8 h-8 text-muted-foreground mx-auto" />
            <p class="text-xs font-bold text-foreground">No Keyword Rules Found</p>
            <p class="text-[11px] text-muted-foreground">Adjust your filters or add a new blacklisted keyword rule.</p>
          </div>
        </template>
      </UiTable>

      <div class="p-3 border-t border-border flex items-center justify-between">
        <UiPagination 
          :current-page="keywordPage"
          :total-pages="keywordRulesPages"
          :total-count="keywordRulesCount"
          :items-per-page="keywordPageSize"
          @update:current-page="keywordPage = $event"
        />
      </div>
    </div>

    <!-- MODAL: VIEW KEYWORD RULE DETAILS -->
    <UiAdminModal
      :is-open="keywordModalState.isView.value"
      :title="isKeywordDetailsLoading ? 'Loading Keyword Rule...' : (selectedKeywordRule ? `Keyword Rule #${selectedKeywordRule.id}` : 'Keyword Rule Details')"
      subtitle="Comprehensive security inspection parameters and audit metadata."
      max-width="max-w-2xl"
      @close="closeKeywordViewModal"
    >
      <div v-if="isKeywordDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving keyword rule details from security registry...</p>
      </div>

      <div v-else-if="!selectedKeywordRule" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-foreground">Rule Details Not Available</p>
        <p class="text-xs text-muted-foreground">Could not load the requested keyword rule from the security engine.</p>
        <button 
          type="button"
          @click="closeKeywordViewModal"
          class="mt-2 h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

      <div v-else class="p-6 sm:p-8 space-y-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-muted/40 rounded-2xl border border-border">
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Blocked Pattern</span>
            </div>
            <div class="font-mono text-base sm:text-lg font-bold text-foreground bg-background px-3 py-1.5 rounded-xl border border-border shadow-2xs inline-block break-all">
              {{ selectedKeywordRule.keyword }}
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <span :class="cn('px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border', getSeverityBadge(selectedKeywordRule.severity))">
              {{ selectedKeywordRule.severity }}
            </span>
            <span class="px-2.5 py-1 rounded-full bg-muted text-xs font-mono font-semibold text-foreground border border-border">
              {{ selectedKeywordRule.match_type }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 bg-card border border-border rounded-xl space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</span>
            <p class="text-sm font-bold text-foreground">{{ selectedKeywordRule.category }}</p>
          </div>

          <div class="p-4 bg-card border border-border rounded-xl space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Operational Status</span>
            <div class="flex items-center gap-3">
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedKeywordRule.is_enabled 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedKeywordRule.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedKeywordRule.is_enabled ? 'Enabled' : 'Disabled' }}</span>
              </span>

              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedKeywordRule.is_active 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedKeywordRule.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedKeywordRule.is_active ? 'Active' : 'Inactive' }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rule Description & Rationale</span>
          <div class="bg-card border border-border rounded-xl p-4 text-xs font-medium text-foreground leading-relaxed">
            <p v-if="selectedKeywordRule.description?.trim()">{{ selectedKeywordRule.description }}</p>
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
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedKeywordRule.created_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedKeywordRule.updated_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Created By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedKeywordRule.created_by) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedKeywordRule.updated_by) }}</p>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            @click="closeKeywordViewModal"
            class="h-9 px-5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- MODAL: EDIT KEYWORD RULE -->
    <UiAdminModal
      :is-open="keywordModalState.isEdit.value"
      :title="editingKeywordRuleId ? `Edit Keyword Rule #${editingKeywordRuleId}` : 'Edit Keyword Rule'"
      subtitle="Modify blacklisted keyword parameters and detection operational state."
      max-width="max-w-lg"
      @close="closeKeywordEditModal"
    >
      <form @submit.prevent="submitUpdateKeywordRule" class="p-6 space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Keyword / Pattern <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="keywordEditForm.keyword"
            type="text" 
            placeholder="e.g. free crypto giveaway"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="keywordEditForm.category"
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
              v-model="keywordEditForm.severity"
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
            v-model="keywordEditForm.match_type"
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
          >
            <option value="EXACT">Exact Match</option>
            <option value="WORD">Word Boundary</option>
            <option value="CONTAINS">Contains Substring</option>
            <option value="REGEX">Regular Expression</option>
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Description</label>
          <textarea 
            v-model="keywordEditForm.description"
            rows="2"
            placeholder="Explain why this keyword is blocked..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground font-medium">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="keywordEditForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingKeywordEdit"
            @click="closeKeywordEditModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingKeywordEdit"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <RefreshCw v-if="isSubmittingKeywordEdit" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingKeywordEdit ? 'Saving...' : 'Save Changes' }}</span>
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- MODAL: DELETE CONFIRMATION -->
    <UiAdminModal
      :is-open="keywordModalState.isDelete.value"
      title="Delete Keyword Rule"
      subtitle="Are you sure you want to permanently delete this rule from the security engine?"
      max-width="max-w-md"
      @close="closeKeywordDeleteModal"
    >
      <div class="p-6 space-y-4">
        <div class="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="text-xs font-bold text-destructive">Irreversible Action</p>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Deleting rule <strong class="text-foreground font-mono">{{ deletingKeywordRule?.keyword || `#${keywordModalState.activeId.value}` }}</strong> will remove its pattern matching capabilities during catalog scans.
            </p>
          </div>
        </div>

        <div class="pt-2 flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isDeletingKeywordRule"
            @click="closeKeywordDeleteModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button" 
            :disabled="isDeletingKeywordRule"
            @click="executeDeleteKeywordRule"
            class="h-9 px-5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <RefreshCw v-if="isDeletingKeywordRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDeletingKeywordRule ? 'Deleting...' : 'Delete Rule' }}</span>
          </button>
        </div>
      </div>
    </UiAdminModal>
  </div>
</template>
