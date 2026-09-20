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
  Tag
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
  HtmlTagRule,
  HtmlTagRuleDetail,
  HtmlTagRulesQueryParams,
  KeywordCategory,
  KeywordSeverity,
  UpdateHtmlTagRulePayload
} from '@/types'

const emit = defineEmits<{
  (e: 'refresh-summary'): void
  (e: 'open-create'): void
}>()

const route = useRoute()
const router = useRouter()
const contentSecurityService = useContentSecurityService()
const { hasPermission } = useAdminPermissions()

const canViewHtmlTags = computed(() => hasPermission('content_security.view_htmltagrule'))
const canAddHtmlTagRule = computed(() => hasPermission('content_security.add_htmltagrule'))
const canEditHtmlTagRule = computed(() => hasPermission('content_security.change_htmltagrule'))
const canDeleteHtmlTagRule = computed(() => hasPermission('content_security.delete_htmltagrule'))

// HTML Tag Rules Query/Data States
const isHtmlTagLoading = ref(false)
const htmlTagError = ref<string | null>(null)
const htmlTagSearchQuery = ref('')
const debouncedHtmlTagSearch = refDebounced(htmlTagSearchQuery, 300)
const htmlTagCategory = ref<string>('all')
const htmlTagSeverity = ref<string>('all')
const htmlTagIsActive = ref<string>('all')
const htmlTagIsEnabled = ref<string>('all')
const htmlTagOrdering = ref<string>('-created_at')
const htmlTagPage = ref(1)
const htmlTagPageSize = ref(10)
const htmlTagRulesData = ref<HtmlTagRule[]>([])
const htmlTagRulesCount = ref(0)
const htmlTagRulesPages = ref(1)

const htmlTagRuleColumns: UiTableColumn<HtmlTagRule>[] = [
  { key: 'tag', label: 'Tag Name', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-sm font-bold text-foreground' },
  { key: 'category', label: 'Category', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'severity', label: 'Severity', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_enabled', label: 'Enabled', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_active', label: 'Active', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'created_at', label: 'Created At', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'actions', label: 'Actions', align: 'right' as const, width: '80px', headerClass: 'px-4 py-3 text-right whitespace-nowrap', cellClass: 'px-4 py-3 text-right whitespace-nowrap' }
]

const resetHtmlTagFilters = () => {
  htmlTagSearchQuery.value = ''
  htmlTagCategory.value = 'all'
  htmlTagSeverity.value = 'all'
  htmlTagIsActive.value = 'all'
  htmlTagIsEnabled.value = 'all'
  htmlTagOrdering.value = '-created_at'
  htmlTagPage.value = 1
}

const fetchHtmlTagRules = async () => {
  if (!canViewHtmlTags.value) return
  
  isHtmlTagLoading.value = true
  htmlTagError.value = null

  try {
    const params: HtmlTagRulesQueryParams = {
      page: htmlTagPage.value,
      page_size: htmlTagPageSize.value,
      ordering: htmlTagOrdering.value
    }

    if (debouncedHtmlTagSearch.value.trim()) {
      params.search = debouncedHtmlTagSearch.value.trim()
    }
    if (htmlTagCategory.value !== 'all') {
      params.category = htmlTagCategory.value as KeywordCategory
    }
    if (htmlTagSeverity.value !== 'all') {
      params.severity = htmlTagSeverity.value as KeywordSeverity
    }
    if (htmlTagIsActive.value !== 'all') {
      params.is_active = htmlTagIsActive.value === 'true'
    }
    if (htmlTagIsEnabled.value !== 'all') {
      params.is_enabled = htmlTagIsEnabled.value === 'true'
    }

    const response = await contentSecurityService.getHtmlTagRules(params)
    htmlTagRulesData.value = response.results
    htmlTagRulesCount.value = response.count
    htmlTagRulesPages.value = response.pages
  } catch (err: any) {
    htmlTagError.value = extractErrorMessage(err, 'Failed to retrieve HTML tag rules.')
  } finally {
    isHtmlTagLoading.value = false
  }
}

watch(
  [
    debouncedHtmlTagSearch,
    htmlTagCategory,
    htmlTagSeverity,
    htmlTagIsActive,
    htmlTagIsEnabled,
    htmlTagOrdering,
    htmlTagPageSize
  ],
  () => {
    htmlTagPage.value = 1
    fetchHtmlTagRules()
  }
)

watch(htmlTagPage, () => {
  fetchHtmlTagRules()
})

onMounted(() => {
  fetchHtmlTagRules()
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

// Modal State: HTML Tag Rule Details (View, Edit & Delete)
const isHtmlTagDetailsLoading = ref(false)
const selectedHtmlTagRule = ref<HtmlTagRuleDetail | null>(null)
const editingHtmlTagRuleId = ref<number | null>(null)
const isSubmittingHtmlTagEdit = ref(false)
const isDeletingHtmlTagRule = ref(false)
const deletingHtmlTagRule = ref<{ id: number; name: string } | null>(null)

const htmlTagEditForm = ref<{
  tag_name: string
  category: KeywordCategory
  severity: KeywordSeverity
  is_enabled: boolean
  description: string
}>({
  tag_name: '',
  category: 'INJECTION',
  severity: 'HIGH',
  is_enabled: true,
  description: ''
})

const originalHtmlTagRuleData = ref<{
  tag_name: string
  category: KeywordCategory
  severity: KeywordSeverity
  is_enabled: boolean
  description: string
} | null>(null)

const htmlTagModalState = useAdminModalState<HtmlTagRuleDetail>({
  getItems: async (id) => {
    isHtmlTagDetailsLoading.value = true
    try {
      const details = await contentSecurityService.getHtmlTagRuleDetails(String(id))
      return details
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve HTML tag rule details.')
      toastError(msg)
      return null
    } finally {
      isHtmlTagDetailsLoading.value = false
    }
  },
  onResolveError: (id) => {
    toastError(`HTML Tag Rule #${id} could not be resolved.`)
    htmlTagModalState.closeModal({ replace: true })
  }
})

watch(() => htmlTagModalState.activeEntity.value, (newEntity) => {
  if (newEntity) {
    selectedHtmlTagRule.value = newEntity

    if (htmlTagModalState.isEdit.value) {
      if (!canEditHtmlTagRule.value) {
        toastError('You do not have permission to edit HTML tag rules.')
        htmlTagModalState.closeModal({ replace: true })
        return
      }
      editingHtmlTagRuleId.value = newEntity.id
      htmlTagEditForm.value = {
        tag_name: newEntity.tag || '',
        category: newEntity.category || 'INJECTION',
        severity: newEntity.severity || 'HIGH',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      }
      originalHtmlTagRuleData.value = {
        tag_name: newEntity.tag || '',
        category: newEntity.category || 'INJECTION',
        severity: newEntity.severity || 'HIGH',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      }
    }

    if (htmlTagModalState.isDelete.value) {
      if (!canDeleteHtmlTagRule.value) {
        toastError('You do not have permission to delete HTML tag rules.')
        htmlTagModalState.closeModal({ replace: true })
        return
      }
      if (!deletingHtmlTagRule.value) {
        deletingHtmlTagRule.value = {
          id: newEntity.id,
          name: newEntity.tag || `Rule #${newEntity.id}`
        }
      }
    }
  }
}, { immediate: true })

watch(() => htmlTagModalState.isView.value, (isView) => {
  if (!isView && !htmlTagModalState.isEdit.value && !htmlTagModalState.isDelete.value) {
    selectedHtmlTagRule.value = null
  }
}, { immediate: true })

watch(() => htmlTagModalState.isEdit.value, (isEdit) => {
  if (!isEdit) {
    editingHtmlTagRuleId.value = null
    originalHtmlTagRuleData.value = null
  }
}, { immediate: true })

watch(() => htmlTagModalState.isDelete.value, (isDelete) => {
  if (!isDelete) {
    deletingHtmlTagRule.value = null
  } else if (!canDeleteHtmlTagRule.value) {
    toastError('You do not have permission to delete HTML tag rules.')
    htmlTagModalState.closeModal({ replace: true })
  }
}, { immediate: true })

const openHtmlTagViewModal = (id: number | string) => {
  if (!canViewHtmlTags.value) {
    toastError('You do not have permission to view HTML tag rules.')
    return
  }
  htmlTagModalState.openView(id)
}

const closeHtmlTagViewModal = () => {
  htmlTagModalState.closeModal()
}

const openEditHtmlTagRuleModal = async (id: number | string) => {
  if (!canEditHtmlTagRule.value) {
    toastError('You do not have permission to edit HTML tag rules.')
    return
  }
  await htmlTagModalState.openEdit(id)
}

const closeHtmlTagEditModal = async () => {
  await htmlTagModalState.closeModal()
}

const openDeleteHtmlTagRuleModal = async (rule: { id: number; tag_name?: string }) => {
  if (!canDeleteHtmlTagRule.value) {
    toastError('You do not have permission to delete HTML tag rules.')
    return
  }
  deletingHtmlTagRule.value = {
    id: rule.id,
    name: rule.tag_name || `Rule #${rule.id}`
  }
  await htmlTagModalState.openDelete(rule.id)
}

const closeHtmlTagDeleteModal = async () => {
  await htmlTagModalState.closeModal()
}

const executeDeleteHtmlTagRule = async () => {
  if (!canDeleteHtmlTagRule.value) {
    toastError('You do not have permission to delete HTML tag rules.')
    return
  }

  const targetId = deletingHtmlTagRule.value?.id || htmlTagModalState.activeId.value
  if (!targetId) {
    toastError('HTML tag rule identifier missing.')
    return
  }

  if (isDeletingHtmlTagRule.value) return

  isDeletingHtmlTagRule.value = true
  try {
    await contentSecurityService.deleteHtmlTagRule(targetId)
    toastSuccess(`HTML tag rule "${deletingHtmlTagRule.value?.name || `#${targetId}`}" deleted successfully.`)
    await closeHtmlTagDeleteModal()
    await fetchHtmlTagRules()
    emit('refresh-summary')

    if (htmlTagRulesData.value.length === 0 && htmlTagPage.value > 1) {
      htmlTagPage.value = Math.max(1, htmlTagPage.value - 1)
      await fetchHtmlTagRules()
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to delete HTML tag rule.')
    toastError(msg)
  } finally {
    isDeletingHtmlTagRule.value = false
  }
}

const submitUpdateHtmlTagRule = async () => {
  if (!canEditHtmlTagRule.value) {
    toastError('You do not have permission to edit HTML tag rules.')
    return
  }

  if (!editingHtmlTagRuleId.value) {
    toastError('HTML tag rule identifier missing.')
    return
  }

  const trimmedName = htmlTagEditForm.value.tag_name.trim()
  if (!trimmedName) {
    toastError('Tag name is required.')
    return
  }

  const payload: UpdateHtmlTagRulePayload = {}
  const orig = originalHtmlTagRuleData.value
  const current = htmlTagEditForm.value

  if (orig) {
    if (trimmedName !== orig.tag_name.trim()) {
      payload.tag = trimmedName
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
    payload.tag = trimmedName
    payload.category = current.category
    payload.severity = current.severity
    payload.is_enabled = current.is_enabled
    payload.description = current.description.trim()
  }

  if (Object.keys(payload).length === 0) {
    toastInfo('No changes detected.')
    await closeHtmlTagEditModal()
    return
  }

  isSubmittingHtmlTagEdit.value = true
  try {
    const updated = await contentSecurityService.updateHtmlTagRule(editingHtmlTagRuleId.value, payload)
    toastSuccess('HTML tag rule updated successfully.')
    await closeHtmlTagEditModal()
    await fetchHtmlTagRules()
    emit('refresh-summary')

    if (selectedHtmlTagRule.value && String(selectedHtmlTagRule.value.id) === String(updated.id)) {
      selectedHtmlTagRule.value = updated
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to update HTML tag rule.')
    toastError(msg)
  } finally {
    isSubmittingHtmlTagEdit.value = false
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
            v-model="htmlTagSearchQuery"
            type="text" 
            placeholder="Search HTML tag names..." 
            class="w-full h-9 pl-9 pr-8 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
          <button 
            v-if="htmlTagSearchQuery" 
            @click="htmlTagSearchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <select 
          v-model="htmlTagCategory"
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
          v-model="htmlTagSeverity"
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
          @click="resetHtmlTagFilters"
          class="h-9 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors shrink-0 cursor-pointer"
        >
          Reset
        </button>
      </div>

      <div class="flex items-center gap-2">
        <select 
          v-model="htmlTagPageSize"
          class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none cursor-pointer"
        >
          <option :value="5">5 / page</option>
          <option :value="10">10 / page</option>
          <option :value="25">25 / page</option>
          <option :value="50">50 / page</option>
        </select>

        <select 
          v-model="htmlTagOrdering"
          class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none cursor-pointer"
        >
          <option value="-created_at">Newest First</option>
          <option value="created_at">Oldest First</option>
          <option value="tag">Tag Name (A-Z)</option>
          <option value="-tag">Tag Name (Z-A)</option>
        </select>

        <button 
          v-if="canAddHtmlTagRule"
          @click="emit('open-create')"
          class="h-9 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add HTML Tag Rule</span>
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="htmlTagError" class="p-4 mb-4 text-xs text-rose-700 bg-rose-100/50 border border-rose-200 rounded-xl dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900" role="alert">
      <span class="font-bold">Error:</span> {{ htmlTagError }}
    </div>

    <!-- HTML Tag Rules Table -->
    <div class="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
      <UiTable 
        :columns="htmlTagRuleColumns" 
        :data="htmlTagRulesData" 
        :loading="isHtmlTagLoading"
      >
        <template #cell(tag)="{ item }">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded border border-border">
              &lt;{{ item.tag || item.pattern }}&gt;
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
              @click="openHtmlTagViewModal(item.id)"
              title="View Rule Details"
              aria-label="View Rule Details"
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Eye class="w-3.5 h-3.5" />
            </button>
            <button 
              v-if="canEditHtmlTagRule"
              @click="openEditHtmlTagRuleModal(item.id)"
              title="Edit Rule"
              aria-label="Edit Rule"
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Edit3 class="w-3.5 h-3.5" />
            </button>
            <button 
              v-if="canDeleteHtmlTagRule"
              @click="openDeleteHtmlTagRuleModal(item)"
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
            <Tag class="w-8 h-8 text-muted-foreground mx-auto" />
            <p class="text-xs font-bold text-foreground">No HTML Tag Rules Found</p>
            <p class="text-[11px] text-muted-foreground">Adjust your filters or add a new HTML tag security rule.</p>
          </div>
        </template>
      </UiTable>

      <div class="p-3 border-t border-border flex items-center justify-between">
        <UiPagination 
          :current-page="htmlTagPage"
          :total-pages="htmlTagRulesPages"
          :total-count="htmlTagRulesCount"
          :items-per-page="htmlTagPageSize"
          @update:current-page="htmlTagPage = $event"
        />
      </div>
    </div>

    <!-- MODAL: VIEW HTML TAG RULE DETAILS -->
    <UiAdminModal
      :is-open="htmlTagModalState.isView.value"
      :title="isHtmlTagDetailsLoading ? 'Loading HTML Tag Rule...' : (selectedHtmlTagRule ? `HTML Tag Rule #${selectedHtmlTagRule.id}` : 'HTML Tag Rule Details')"
      subtitle="Comprehensive security inspection parameters and audit metadata."
      max-width="max-w-2xl"
      @close="closeHtmlTagViewModal"
    >
      <div v-if="isHtmlTagDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving HTML tag rule details from security registry...</p>
      </div>

      <div v-else-if="!selectedHtmlTagRule" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-foreground">Rule Details Not Available</p>
        <p class="text-xs text-muted-foreground">Could not load the requested HTML tag rule from the security engine.</p>
        <button 
          type="button"
          @click="closeHtmlTagViewModal"
          class="mt-2 h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

      <div v-else class="p-6 sm:p-8 space-y-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-muted/40 rounded-2xl border border-border">
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">HTML Tag Name</span>
            </div>
            <div class="font-mono text-base sm:text-lg font-bold text-foreground bg-background px-3 py-1.5 rounded-xl border border-border shadow-2xs inline-block break-all">
              &lt;{{ selectedHtmlTagRule.tag || selectedHtmlTagRule.pattern }}&gt;
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <span :class="cn('px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border', getSeverityBadge(selectedHtmlTagRule.severity))">
              {{ selectedHtmlTagRule.severity }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 bg-card border border-border rounded-xl space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</span>
            <p class="text-sm font-bold text-foreground">{{ selectedHtmlTagRule.category }}</p>
          </div>

          <div class="p-4 bg-card border border-border rounded-xl space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Operational Status</span>
            <div class="flex items-center gap-3">
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedHtmlTagRule.is_enabled 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedHtmlTagRule.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedHtmlTagRule.is_enabled ? 'Enabled' : 'Disabled' }}</span>
              </span>

              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedHtmlTagRule.is_active 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedHtmlTagRule.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedHtmlTagRule.is_active ? 'Active' : 'Inactive' }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rule Description & Rationale</span>
          <div class="bg-card border border-border rounded-xl p-4 text-xs font-medium text-foreground leading-relaxed">
            <p v-if="selectedHtmlTagRule.description?.trim()">{{ selectedHtmlTagRule.description }}</p>
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
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedHtmlTagRule.created_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedHtmlTagRule.updated_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Created By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedHtmlTagRule.created_by) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedHtmlTagRule.updated_by) }}</p>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            @click="closeHtmlTagViewModal"
            class="h-9 px-5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- MODAL: EDIT HTML TAG RULE -->
    <UiAdminModal
      :is-open="htmlTagModalState.isEdit.value"
      :title="editingHtmlTagRuleId ? `Edit HTML Tag Rule #${editingHtmlTagRuleId}` : 'Edit HTML Tag Rule'"
      subtitle="Modify HTML tag detection parameters and operational state."
      max-width="max-w-lg"
      @close="closeHtmlTagEditModal"
    >
      <form @submit.prevent="submitUpdateHtmlTagRule" class="p-6 space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Tag Name <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="htmlTagEditForm.tag_name"
            type="text" 
            placeholder="e.g. script, iframe, object"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="htmlTagEditForm.category"
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
              v-model="htmlTagEditForm.severity"
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
            v-model="htmlTagEditForm.description"
            rows="2"
            placeholder="Explain why this HTML tag is flagged..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground font-medium">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="htmlTagEditForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingHtmlTagEdit"
            @click="closeHtmlTagEditModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingHtmlTagEdit"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <RefreshCw v-if="isSubmittingHtmlTagEdit" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingHtmlTagEdit ? 'Saving...' : 'Save Changes' }}</span>
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- MODAL: DELETE CONFIRMATION -->
    <UiAdminModal
      :is-open="htmlTagModalState.isDelete.value"
      title="Delete HTML Tag Rule"
      subtitle="Are you sure you want to permanently delete this rule from the security engine?"
      max-width="max-w-md"
      @close="closeHtmlTagDeleteModal"
    >
      <div class="p-6 space-y-4">
        <div class="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="text-xs font-bold text-destructive">Irreversible Action</p>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Deleting HTML tag rule <strong class="text-foreground font-mono">&lt;{{ deletingHtmlTagRule?.name || `#${htmlTagModalState.activeId.value}` }}&gt;</strong> will remove its tag matching capabilities during catalog scans.
            </p>
          </div>
        </div>

        <div class="pt-2 flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isDeletingHtmlTagRule"
            @click="closeHtmlTagDeleteModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button" 
            :disabled="isDeletingHtmlTagRule"
            @click="executeDeleteHtmlTagRule"
            class="h-9 px-5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <RefreshCw v-if="isDeletingHtmlTagRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDeletingHtmlTagRule ? 'Deleting...' : 'Delete Rule' }}</span>
          </button>
        </div>
      </div>
    </UiAdminModal>
  </div>
</template>
