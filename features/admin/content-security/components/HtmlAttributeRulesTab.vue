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
  FileCode
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
  HtmlAttributeRule,
  HtmlAttributeRuleDetail,
  HtmlAttributeRulesQueryParams,
  KeywordCategory,
  KeywordSeverity,
  UpdateHtmlAttributeRulePayload
} from '@/types'

const emit = defineEmits<{
  (e: 'refresh-summary'): void
  (e: 'open-create'): void
}>()

const route = useRoute()
const router = useRouter()
const contentSecurityService = useContentSecurityService()
const { hasPermission } = useAdminPermissions()

const canViewHtmlAttributes = computed(() => hasPermission('content_security.view_htmlattributerule'))
const canAddHtmlAttributeRule = computed(() => hasPermission('content_security.add_htmlattributerule'))
const canEditHtmlAttributeRule = computed(() => hasPermission('content_security.change_htmlattributerule'))
const canDeleteHtmlAttributeRule = computed(() => hasPermission('content_security.delete_htmlattributerule'))

// HTML Attribute Rules Query/Data States
const isHtmlAttributeLoading = ref(false)
const htmlAttributeError = ref<string | null>(null)
const htmlAttributeSearchQuery = ref('')
const debouncedHtmlAttributeSearch = refDebounced(htmlAttributeSearchQuery, 300)
const htmlAttributeCategory = ref<string>('all')
const htmlAttributeSeverity = ref<string>('all')
const htmlAttributeIsActive = ref<string>('all')
const htmlAttributeIsEnabled = ref<string>('all')
const htmlAttributeOrdering = ref<string>('-created_at')
const htmlAttributePage = ref(1)
const htmlAttributePageSize = ref(10)
const htmlAttributeRulesData = ref<HtmlAttributeRule[]>([])
const htmlAttributeRulesCount = ref(0)
const htmlAttributeRulesPages = ref(1)

const htmlAttributeRuleColumns: UiTableColumn<HtmlAttributeRule>[] = [
  { key: 'attribute', label: 'Attribute Name', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-sm font-bold text-foreground' },
  { key: 'pattern', label: 'Attribute Value / Pattern', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 font-mono text-xs text-muted-foreground' },
  { key: 'category', label: 'Category', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'severity', label: 'Severity', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_enabled', label: 'Enabled', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'is_active', label: 'Active', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap' },
  { key: 'created_at', label: 'Created At', headerClass: 'px-4 py-3 whitespace-nowrap', cellClass: 'px-4 py-3 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'actions', label: 'Actions', align: 'right' as const, width: '80px', headerClass: 'px-4 py-3 text-right whitespace-nowrap', cellClass: 'px-4 py-3 text-right whitespace-nowrap' }
]

const resetHtmlAttributeFilters = () => {
  htmlAttributeSearchQuery.value = ''
  htmlAttributeCategory.value = 'all'
  htmlAttributeSeverity.value = 'all'
  htmlAttributeIsActive.value = 'all'
  htmlAttributeIsEnabled.value = 'all'
  htmlAttributeOrdering.value = '-created_at'
  htmlAttributePage.value = 1
}

const fetchHtmlAttributeRules = async () => {
  if (!canViewHtmlAttributes.value) return
  
  isHtmlAttributeLoading.value = true
  htmlAttributeError.value = null

  try {
    const params: HtmlAttributeRulesQueryParams = {
      page: htmlAttributePage.value,
      page_size: htmlAttributePageSize.value,
      ordering: htmlAttributeOrdering.value
    }

    if (debouncedHtmlAttributeSearch.value.trim()) {
      params.search = debouncedHtmlAttributeSearch.value.trim()
    }
    if (htmlAttributeCategory.value !== 'all') {
      params.category = htmlAttributeCategory.value as KeywordCategory
    }
    if (htmlAttributeSeverity.value !== 'all') {
      params.severity = htmlAttributeSeverity.value as KeywordSeverity
    }
    if (htmlAttributeIsActive.value !== 'all') {
      params.is_active = htmlAttributeIsActive.value === 'true'
    }
    if (htmlAttributeIsEnabled.value !== 'all') {
      params.is_enabled = htmlAttributeIsEnabled.value === 'true'
    }

    const response = await contentSecurityService.getHtmlAttributeRules(params)
    htmlAttributeRulesData.value = response.results
    htmlAttributeRulesCount.value = response.count
    htmlAttributeRulesPages.value = response.pages
  } catch (err: any) {
    htmlAttributeError.value = extractErrorMessage(err, 'Failed to retrieve HTML attribute rules.')
  } finally {
    isHtmlAttributeLoading.value = false
  }
}

watch(
  [
    debouncedHtmlAttributeSearch,
    htmlAttributeCategory,
    htmlAttributeSeverity,
    htmlAttributeIsActive,
    htmlAttributeIsEnabled,
    htmlAttributeOrdering,
    htmlAttributePageSize
  ],
  () => {
    htmlAttributePage.value = 1
    fetchHtmlAttributeRules()
  }
)

watch(htmlAttributePage, () => {
  fetchHtmlAttributeRules()
})

onMounted(() => {
  fetchHtmlAttributeRules()
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

// Modal State: HTML Attribute Rule Details (View, Edit & Delete)
const isHtmlAttributeDetailsLoading = ref(false)
const selectedHtmlAttributeRule = ref<HtmlAttributeRuleDetail | null>(null)
const editingHtmlAttributeRuleId = ref<number | null>(null)
const isSubmittingHtmlAttributeEdit = ref(false)
const isDeletingHtmlAttributeRule = ref(false)
const deletingHtmlAttributeRule = ref<{ id: number; name: string } | null>(null)

const htmlAttributeEditForm = ref<{
  attribute_name: string
  attribute_value: string
  category: KeywordCategory
  severity: KeywordSeverity
  is_enabled: boolean
  description: string
}>({
  attribute_name: '',
  attribute_value: '',
  category: 'INJECTION',
  severity: 'HIGH',
  is_enabled: true,
  description: ''
})

const originalHtmlAttributeRuleData = ref<{
  attribute_name: string
  attribute_value: string
  category: KeywordCategory
  severity: KeywordSeverity
  is_enabled: boolean
  description: string
} | null>(null)

const htmlAttributeModalState = useAdminModalState<HtmlAttributeRuleDetail>({
  getItems: async (id) => {
    isHtmlAttributeDetailsLoading.value = true
    try {
      const details = await contentSecurityService.getHtmlAttributeRuleDetails(String(id))
      return details
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve HTML attribute rule details.')
      toastError(msg)
      return null
    } finally {
      isHtmlAttributeDetailsLoading.value = false
    }
  },
  onResolveError: (id) => {
    toastError(`HTML Attribute Rule #${id} could not be resolved.`)
    htmlAttributeModalState.closeModal({ replace: true })
  }
})

watch(() => htmlAttributeModalState.activeEntity.value, (newEntity) => {
  if (newEntity) {
    selectedHtmlAttributeRule.value = newEntity

    if (htmlAttributeModalState.isEdit.value) {
      if (!canEditHtmlAttributeRule.value) {
        toastError('You do not have permission to edit HTML attribute rules.')
        htmlAttributeModalState.closeModal({ replace: true })
        return
      }
      editingHtmlAttributeRuleId.value = newEntity.id
      htmlAttributeEditForm.value = {
        attribute_name: newEntity.attribute || '',
        attribute_value: newEntity.pattern || '',
        category: newEntity.category || 'INJECTION',
        severity: newEntity.severity || 'HIGH',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      }
      originalHtmlAttributeRuleData.value = {
        attribute_name: newEntity.attribute || '',
        attribute_value: newEntity.pattern || '',
        category: newEntity.category || 'INJECTION',
        severity: newEntity.severity || 'HIGH',
        is_enabled: newEntity.is_enabled ?? true,
        description: newEntity.description || ''
      }
    }

    if (htmlAttributeModalState.isDelete.value) {
      if (!canDeleteHtmlAttributeRule.value) {
        toastError('You do not have permission to delete HTML attribute rules.')
        htmlAttributeModalState.closeModal({ replace: true })
        return
      }
      if (!deletingHtmlAttributeRule.value) {
        deletingHtmlAttributeRule.value = {
          id: newEntity.id,
          name: newEntity.attribute || `Rule #${newEntity.id}`
        }
      }
    }
  }
}, { immediate: true })

watch(() => htmlAttributeModalState.isView.value, (isView) => {
  if (!isView && !htmlAttributeModalState.isEdit.value && !htmlAttributeModalState.isDelete.value) {
    selectedHtmlAttributeRule.value = null
  }
}, { immediate: true })

watch(() => htmlAttributeModalState.isEdit.value, (isEdit) => {
  if (!isEdit) {
    editingHtmlAttributeRuleId.value = null
    originalHtmlAttributeRuleData.value = null
  }
}, { immediate: true })

watch(() => htmlAttributeModalState.isDelete.value, (isDelete) => {
  if (!isDelete) {
    deletingHtmlAttributeRule.value = null
  } else if (!canDeleteHtmlAttributeRule.value) {
    toastError('You do not have permission to delete HTML attribute rules.')
    htmlAttributeModalState.closeModal({ replace: true })
  }
}, { immediate: true })

const openHtmlAttributeViewModal = (id: number | string) => {
  if (!canViewHtmlAttributes.value) {
    toastError('You do not have permission to view HTML attribute rules.')
    return
  }
  htmlAttributeModalState.openView(id)
}

const closeHtmlAttributeViewModal = () => {
  htmlAttributeModalState.closeModal()
}

const openEditHtmlAttributeRuleModal = async (id: number | string) => {
  if (!canEditHtmlAttributeRule.value) {
    toastError('You do not have permission to edit HTML attribute rules.')
    return
  }
  await htmlAttributeModalState.openEdit(id)
}

const closeHtmlAttributeEditModal = async () => {
  await htmlAttributeModalState.closeModal()
}

const openDeleteHtmlAttributeRuleModal = async (rule: { id: number; attribute_name?: string }) => {
  if (!canDeleteHtmlAttributeRule.value) {
    toastError('You do not have permission to delete HTML attribute rules.')
    return
  }
  deletingHtmlAttributeRule.value = {
    id: rule.id,
    name: rule.attribute_name || `Rule #${rule.id}`
  }
  await htmlAttributeModalState.openDelete(rule.id)
}

const closeHtmlAttributeDeleteModal = async () => {
  await htmlAttributeModalState.closeModal()
}

const executeDeleteHtmlAttributeRule = async () => {
  if (!canDeleteHtmlAttributeRule.value) {
    toastError('You do not have permission to delete HTML attribute rules.')
    return
  }

  const targetId = deletingHtmlAttributeRule.value?.id || htmlAttributeModalState.activeId.value
  if (!targetId) {
    toastError('HTML attribute rule identifier missing.')
    return
  }

  if (isDeletingHtmlAttributeRule.value) return

  isDeletingHtmlAttributeRule.value = true
  try {
    await contentSecurityService.deleteHtmlAttributeRule(targetId)
    toastSuccess(`HTML attribute rule "${deletingHtmlAttributeRule.value?.name || `#${targetId}`}" deleted successfully.`)
    await closeHtmlAttributeDeleteModal()
    await fetchHtmlAttributeRules()
    emit('refresh-summary')

    if (htmlAttributeRulesData.value.length === 0 && htmlAttributePage.value > 1) {
      htmlAttributePage.value = Math.max(1, htmlAttributePage.value - 1)
      await fetchHtmlAttributeRules()
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to delete HTML attribute rule.')
    toastError(msg)
  } finally {
    isDeletingHtmlAttributeRule.value = false
  }
}

const submitUpdateHtmlAttributeRule = async () => {
  if (!canEditHtmlAttributeRule.value) {
    toastError('You do not have permission to edit HTML attribute rules.')
    return
  }

  if (!editingHtmlAttributeRuleId.value) {
    toastError('HTML attribute rule identifier missing.')
    return
  }

  const trimmedName = htmlAttributeEditForm.value.attribute_name.trim()
  if (!trimmedName) {
    toastError('Attribute name is required.')
    return
  }

  const payload: UpdateHtmlAttributeRulePayload = {}
  const orig = originalHtmlAttributeRuleData.value
  const current = htmlAttributeEditForm.value

  if (orig) {
    if (trimmedName !== orig.attribute_name.trim()) {
      payload.attribute = trimmedName
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
    payload.attribute = trimmedName
    payload.category = current.category
    payload.severity = current.severity
    payload.is_enabled = current.is_enabled
    payload.description = current.description.trim()
  }

  if (Object.keys(payload).length === 0) {
    toastInfo('No changes detected.')
    await closeHtmlAttributeEditModal()
    return
  }

  isSubmittingHtmlAttributeEdit.value = true
  try {
    const updated = await contentSecurityService.updateHtmlAttributeRule(editingHtmlAttributeRuleId.value, payload)
    toastSuccess('HTML attribute rule updated successfully.')
    await closeHtmlAttributeEditModal()
    await fetchHtmlAttributeRules()
    emit('refresh-summary')

    if (selectedHtmlAttributeRule.value && String(selectedHtmlAttributeRule.value.id) === String(updated.id)) {
      selectedHtmlAttributeRule.value = updated
    }
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to update HTML attribute rule.')
    toastError(msg)
  } finally {
    isSubmittingHtmlAttributeEdit.value = false
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
            v-model="htmlAttributeSearchQuery"
            type="text" 
            placeholder="Search attribute names or values..." 
            class="w-full h-9 pl-9 pr-8 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
          <button 
            v-if="htmlAttributeSearchQuery" 
            @click="htmlAttributeSearchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <select 
          v-model="htmlAttributeCategory"
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
          v-model="htmlAttributeSeverity"
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
          @click="resetHtmlAttributeFilters"
          class="h-9 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors shrink-0 cursor-pointer"
        >
          Reset
        </button>
      </div>

      <div class="flex items-center gap-2">
        <select 
          v-model="htmlAttributePageSize"
          class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none cursor-pointer"
        >
          <option :value="5">5 / page</option>
          <option :value="10">10 / page</option>
          <option :value="25">25 / page</option>
          <option :value="50">50 / page</option>
        </select>

        <select 
          v-model="htmlAttributeOrdering"
          class="h-9 px-2.5 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none cursor-pointer"
        >
          <option value="-created_at">Newest First</option>
          <option value="created_at">Oldest First</option>
          <option value="attribute_name">Attribute Name (A-Z)</option>
          <option value="-attribute_name">Attribute Name (Z-A)</option>
        </select>

        <button 
          v-if="canAddHtmlAttributeRule"
          @click="emit('open-create')"
          class="h-9 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add HTML Attribute Rule</span>
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="htmlAttributeError" class="p-4 mb-4 text-xs text-rose-700 bg-rose-100/50 border border-rose-200 rounded-xl dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900" role="alert">
      <span class="font-bold">Error:</span> {{ htmlAttributeError }}
    </div>

    <!-- HTML Attribute Rules Table -->
    <div class="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
      <UiTable 
        :columns="htmlAttributeRuleColumns" 
        :data="htmlAttributeRulesData" 
        :loading="isHtmlAttributeLoading"
      >
        <template #cell(attribute)="{ item }">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded border border-border">
              {{ item.attribute }}
            </span>
          </div>
        </template>

        <template #cell(pattern)="{ item }">
          <span class="font-mono text-xs text-muted-foreground truncate max-w-[200px] block">
            {{ item.pattern || '(any value)' }}
          </span>
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
              @click="openHtmlAttributeViewModal(item.id)"
              title="View Rule Details"
              aria-label="View Rule Details"
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Eye class="w-3.5 h-3.5" />
            </button>
            <button 
              v-if="canEditHtmlAttributeRule"
              @click="openEditHtmlAttributeRuleModal(item.id)"
              title="Edit Rule"
              aria-label="Edit Rule"
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Edit3 class="w-3.5 h-3.5" />
            </button>
            <button 
              v-if="canDeleteHtmlAttributeRule"
              @click="openDeleteHtmlAttributeRuleModal(item)"
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
            <FileCode class="w-8 h-8 text-muted-foreground mx-auto" />
            <p class="text-xs font-bold text-foreground">No HTML Attribute Rules Found</p>
            <p class="text-[11px] text-muted-foreground">Adjust your filters or add a new HTML attribute security rule.</p>
          </div>
        </template>
      </UiTable>

      <div class="p-3 border-t border-border flex items-center justify-between">
        <UiPagination 
          :current-page="htmlAttributePage"
          :total-pages="htmlAttributeRulesPages"
          :total-count="htmlAttributeRulesCount"
          :items-per-page="htmlAttributePageSize"
          @update:current-page="htmlAttributePage = $event"
        />
      </div>
    </div>

    <!-- MODAL: VIEW HTML ATTRIBUTE RULE DETAILS -->
    <UiAdminModal
      :is-open="htmlAttributeModalState.isView.value"
      :title="isHtmlAttributeDetailsLoading ? 'Loading HTML Attribute Rule...' : (selectedHtmlAttributeRule ? `HTML Attribute Rule #${selectedHtmlAttributeRule.id}` : 'HTML Attribute Rule Details')"
      subtitle="Comprehensive security inspection parameters and audit metadata."
      max-width="max-w-2xl"
      @close="closeHtmlAttributeViewModal"
    >
      <div v-if="isHtmlAttributeDetailsLoading" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving HTML attribute rule details from security registry...</p>
      </div>

      <div v-else-if="!selectedHtmlAttributeRule" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-foreground">Rule Details Not Available</p>
        <p class="text-xs text-muted-foreground">Could not load the requested HTML attribute rule from the security engine.</p>
        <button 
          type="button"
          @click="closeHtmlAttributeViewModal"
          class="mt-2 h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

      <div v-else class="p-6 sm:p-8 space-y-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-muted/40 rounded-2xl border border-border">
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Attribute Name & Value</span>
            </div>
            <div class="font-mono text-base sm:text-lg font-bold text-foreground bg-background px-3 py-1.5 rounded-xl border border-border shadow-2xs inline-block break-all">
              {{ selectedHtmlAttributeRule.attribute }}<span v-if="selectedHtmlAttributeRule.pattern && selectedHtmlAttributeRule.pattern !== selectedHtmlAttributeRule.attribute"> (Pattern: "{{ selectedHtmlAttributeRule.pattern }}")</span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <span :class="cn('px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border', getSeverityBadge(selectedHtmlAttributeRule.severity))">
              {{ selectedHtmlAttributeRule.severity }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 bg-card border border-border rounded-xl space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</span>
            <p class="text-sm font-bold text-foreground">{{ selectedHtmlAttributeRule.category }}</p>
          </div>

          <div class="p-4 bg-card border border-border rounded-xl space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Operational Status</span>
            <div class="flex items-center gap-3">
              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedHtmlAttributeRule.is_enabled 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedHtmlAttributeRule.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedHtmlAttributeRule.is_enabled ? 'Enabled' : 'Disabled' }}</span>
              </span>

              <span 
                :class="cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5',
                  selectedHtmlAttributeRule.is_active 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-muted text-muted-foreground border-border'
                )"
              >
                <span :class="cn('w-1.5 h-1.5 rounded-full', selectedHtmlAttributeRule.is_active ? 'bg-emerald-500' : 'bg-muted-foreground')"></span>
                <span>{{ selectedHtmlAttributeRule.is_active ? 'Active' : 'Inactive' }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rule Description & Rationale</span>
          <div class="bg-card border border-border rounded-xl p-4 text-xs font-medium text-foreground leading-relaxed">
            <p v-if="selectedHtmlAttributeRule.description?.trim()">{{ selectedHtmlAttributeRule.description }}</p>
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
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedHtmlAttributeRule.created_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Calendar class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated At:</span>
              </div>
              <p class="font-mono text-foreground font-medium pl-5">{{ formatDate(selectedHtmlAttributeRule.updated_at) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Created By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedHtmlAttributeRule.created_by) }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <User class="w-3.5 h-3.5" />
                <span class="font-semibold">Updated By:</span>
              </div>
              <p class="text-foreground font-medium pl-5">{{ formatUserInfo(selectedHtmlAttributeRule.updated_by) }}</p>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            @click="closeHtmlAttributeViewModal"
            class="h-9 px-5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </UiAdminModal>

    <!-- MODAL: EDIT HTML ATTRIBUTE RULE -->
    <UiAdminModal
      :is-open="htmlAttributeModalState.isEdit.value"
      :title="editingHtmlAttributeRuleId ? `Edit HTML Attribute Rule #${editingHtmlAttributeRuleId}` : 'Edit HTML Attribute Rule'"
      subtitle="Modify HTML attribute detection parameters and operational state."
      max-width="max-w-lg"
      @close="closeHtmlAttributeEditModal"
    >
      <form @submit.prevent="submitUpdateHtmlAttributeRule" class="p-6 space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Attribute Name <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="htmlAttributeEditForm.attribute_name"
            type="text" 
            placeholder="e.g. onerror or onload"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Attribute Value (Optional)</label>
          <input 
            v-model="htmlAttributeEditForm.attribute_value"
            type="text" 
            placeholder="e.g. alert(1) or leave empty for any value"
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="htmlAttributeEditForm.category"
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
              v-model="htmlAttributeEditForm.severity"
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
            v-model="htmlAttributeEditForm.description"
            rows="2"
            placeholder="Explain why this HTML attribute is flagged..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground font-medium">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="htmlAttributeEditForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmittingHtmlAttributeEdit"
            @click="closeHtmlAttributeEditModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmittingHtmlAttributeEdit"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <RefreshCw v-if="isSubmittingHtmlAttributeEdit" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmittingHtmlAttributeEdit ? 'Saving...' : 'Save Changes' }}</span>
          </button>
        </div>
      </form>
    </UiAdminModal>

    <!-- MODAL: DELETE CONFIRMATION -->
    <UiAdminModal
      :is-open="htmlAttributeModalState.isDelete.value"
      title="Delete HTML Attribute Rule"
      subtitle="Are you sure you want to permanently delete this rule from the security engine?"
      max-width="max-w-md"
      @close="closeHtmlAttributeDeleteModal"
    >
      <div class="p-6 space-y-4">
        <div class="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="text-xs font-bold text-destructive">Irreversible Action</p>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Deleting HTML attribute rule <strong class="text-foreground font-mono">{{ deletingHtmlAttributeRule?.name || `#${htmlAttributeModalState.activeId.value}` }}</strong> will remove its attribute matching capabilities during catalog scans.
            </p>
          </div>
        </div>

        <div class="pt-2 flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isDeletingHtmlAttributeRule"
            @click="closeHtmlAttributeDeleteModal"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button" 
            :disabled="isDeletingHtmlAttributeRule"
            @click="executeDeleteHtmlAttributeRule"
            class="h-9 px-5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            <RefreshCw v-if="isDeletingHtmlAttributeRule" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDeletingHtmlAttributeRule ? 'Deleting...' : 'Delete Rule' }}</span>
          </button>
        </div>
      </div>
    </UiAdminModal>
  </div>
</template>
