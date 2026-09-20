<script setup lang="ts">
import { ref, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import UiAdminModal from '@/components/ui/UiAdminModal.vue'
import { useContentSecurityService } from '@/composables/useContentSecurityService'
import { toastSuccess, toastError, extractErrorMessage } from '@/composables/useToast'
import type {
  KeywordCategory,
  KeywordSeverity,
  KeywordMatchType,
  DomainMatchType,
  CreateKeywordRulePayload,
  CreateDomainRulePayload,
  CreateHiddenContentRulePayload,
  CreateObfuscationRulePayload,
  CreateRedirectRulePayload,
  CreateHtmlAttributeRulePayload,
  CreateHtmlTagRulePayload
} from '@/types'

type RuleType = 'keyword' | 'domain' | 'hidden_content' | 'obfuscation' | 'redirect' | 'attribute' | 'html'

const props = defineProps<{
  isOpen: boolean
  initialType?: RuleType
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', type: RuleType): void
}>()

const contentSecurityService = useContentSecurityService()

const selectedType = ref<RuleType>('keyword')
const isSubmitting = ref(false)

// Form states
const keywordForm = ref<{
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

const domainForm = ref<{
  domain: string
  category: KeywordCategory
  severity: KeywordSeverity
  match_type: DomainMatchType
  is_enabled: boolean
  description: string
}>({
  domain: '',
  category: 'MALWARE',
  severity: 'HIGH',
  match_type: 'SUBDOMAIN',
  is_enabled: true,
  description: ''
})

const hiddenContentForm = ref<{
  pattern: string
  category: KeywordCategory
  severity: KeywordSeverity
  is_enabled: boolean
  description: string
}>({
  pattern: '',
  category: 'HIDDEN_CONTENT',
  severity: 'HIGH',
  is_enabled: true,
  description: ''
})

const obfuscationForm = ref<{
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

const redirectForm = ref<{
  pattern: string
  category: KeywordCategory
  severity: KeywordSeverity
  is_enabled: boolean
  description: string
}>({
  pattern: '',
  category: 'REDIRECT',
  severity: 'HIGH',
  is_enabled: true,
  description: ''
})

const htmlAttributeForm = ref<{
  attribute: string
  category: KeywordCategory
  severity: KeywordSeverity
  is_enabled: boolean
  description: string
}>({
  attribute: '',
  category: 'INJECTION',
  severity: 'CRITICAL',
  is_enabled: true,
  description: ''
})

const htmlTagForm = ref<{
  tag: string
  category: KeywordCategory
  severity: KeywordSeverity
  is_enabled: boolean
  description: string
}>({
  tag: '',
  category: 'DANGEROUS_TAGS',
  severity: 'CRITICAL',
  is_enabled: true,
  description: ''
})

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.initialType) {
      selectedType.value = props.initialType
    }
    resetForms()
  }
})

const resetForms = () => {
  keywordForm.value = {
    keyword: '',
    category: 'SPAM',
    severity: 'HIGH',
    match_type: 'WORD',
    is_enabled: true,
    description: ''
  }
  domainForm.value = {
    domain: '',
    category: 'MALWARE',
    severity: 'HIGH',
    match_type: 'SUBDOMAIN',
    is_enabled: true,
    description: ''
  }
  hiddenContentForm.value = {
    pattern: '',
    category: 'HIDDEN_CONTENT',
    severity: 'HIGH',
    is_enabled: true,
    description: ''
  }
  obfuscationForm.value = {
    pattern: '',
    category: 'OBFUSCATION',
    severity: 'HIGH',
    is_enabled: true,
    description: ''
  }
  redirectForm.value = {
    pattern: '',
    category: 'REDIRECT',
    severity: 'HIGH',
    is_enabled: true,
    description: ''
  }
  htmlAttributeForm.value = {
    attribute: '',
    category: 'INJECTION',
    severity: 'CRITICAL',
    is_enabled: true,
    description: ''
  }
  htmlTagForm.value = {
    tag: '',
    category: 'DANGEROUS_TAGS',
    severity: 'CRITICAL',
    is_enabled: true,
    description: ''
  }
}

const handleClose = () => {
  if (isSubmitting.value) return
  emit('close')
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    if (selectedType.value === 'keyword') {
      const payload: CreateKeywordRulePayload = {
        keyword: keywordForm.value.keyword.trim(),
        category: keywordForm.value.category,
        severity: keywordForm.value.severity,
        match_type: keywordForm.value.match_type,
        is_enabled: keywordForm.value.is_enabled,
        description: keywordForm.value.description.trim() || undefined
      }
      const created = await contentSecurityService.createKeywordRule(payload)
      toastSuccess(`Keyword Rule "${created.keyword}" created successfully.`)
    } else if (selectedType.value === 'domain') {
      const payload: CreateDomainRulePayload = {
        domain: domainForm.value.domain.trim(),
        category: domainForm.value.category,
        severity: domainForm.value.severity,
        match_type: domainForm.value.match_type,
        is_enabled: domainForm.value.is_enabled,
        description: domainForm.value.description.trim() || undefined
      }
      const created = await contentSecurityService.createDomainRule(payload)
      toastSuccess(`Domain Rule "${created.domain}" created successfully.`)
    } else if (selectedType.value === 'hidden_content') {
      const payload: CreateHiddenContentRulePayload = {
        pattern: hiddenContentForm.value.pattern.trim(),
        category: hiddenContentForm.value.category,
        severity: hiddenContentForm.value.severity,
        is_enabled: hiddenContentForm.value.is_enabled,
        description: hiddenContentForm.value.description.trim() || undefined
      }
      await contentSecurityService.createHiddenContentRule(payload)
      toastSuccess('Hidden Content Rule created successfully.')
    } else if (selectedType.value === 'obfuscation') {
      const payload: CreateObfuscationRulePayload = {
        pattern: obfuscationForm.value.pattern.trim(),
        category: obfuscationForm.value.category,
        severity: obfuscationForm.value.severity,
        is_enabled: obfuscationForm.value.is_enabled,
        description: obfuscationForm.value.description.trim() || undefined
      }
      await contentSecurityService.createObfuscationRule(payload)
      toastSuccess('Obfuscation Rule created successfully.')
    } else if (selectedType.value === 'redirect') {
      const payload: CreateRedirectRulePayload = {
        pattern: redirectForm.value.pattern.trim(),
        category: redirectForm.value.category,
        severity: redirectForm.value.severity,
        is_enabled: redirectForm.value.is_enabled,
        description: redirectForm.value.description.trim() || undefined
      }
      await contentSecurityService.createRedirectRule(payload)
      toastSuccess('Redirect Rule created successfully.')
    } else if (selectedType.value === 'attribute') {
      const payload: CreateHtmlAttributeRulePayload = {
        attribute: htmlAttributeForm.value.attribute.trim(),
        category: htmlAttributeForm.value.category,
        severity: htmlAttributeForm.value.severity,
        is_enabled: htmlAttributeForm.value.is_enabled,
        description: htmlAttributeForm.value.description.trim() || undefined
      }
      await contentSecurityService.createHtmlAttributeRule(payload)
      toastSuccess('HTML Attribute Rule created successfully.')
    } else if (selectedType.value === 'html') {
      const payload: CreateHtmlTagRulePayload = {
        tag: htmlTagForm.value.tag.trim(),
        category: htmlTagForm.value.category,
        severity: htmlTagForm.value.severity,
        is_enabled: htmlTagForm.value.is_enabled,
        description: htmlTagForm.value.description.trim() || undefined
      }
      await contentSecurityService.createHtmlTagRule(payload)
      toastSuccess('HTML Tag Rule created successfully.')
    }

    emit('created', selectedType.value)
    emit('close')
  } catch (err: any) {
    const msg = extractErrorMessage(err, `Failed to create ${selectedType.value} rule.`)
    toastError(msg)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UiAdminModal
    :is-open="isOpen"
    title="Add Detection Rule"
    subtitle="Configure an automated detection rule for content scanning."
    max-width="max-w-lg"
    @close="handleClose"
  >
    <div class="p-6 space-y-4">
      <!-- Rule Type Selector -->
      <div class="space-y-1.5">
        <label class="text-xs font-bold text-foreground">Rule Type</label>
        <select 
          v-model="selectedType"
          :disabled="isSubmitting"
          class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
        >
          <option value="keyword">Blacklisted Keyword / Phrase</option>
          <option value="domain">Malicious / Phishing Domain</option>
          <option value="hidden_content">Hidden Content Rule</option>
          <option value="obfuscation">Obfuscation Detection Rule</option>
          <option value="redirect">Redirect Hijacking Rule</option>
          <option value="attribute">Dangerous Event Attribute</option>
          <option value="html">Dangerous HTML Tag</option>
        </select>
      </div>

      <!-- KEYWORD FORM -->
      <form v-if="selectedType === 'keyword'" @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Keyword / Pattern <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="keywordForm.keyword"
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
              v-model="keywordForm.category"
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
              v-model="keywordForm.severity"
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
            v-model="keywordForm.match_type"
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
            v-model="keywordForm.description"
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
            v-model="keywordForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmitting"
            @click="handleClose"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70"
          >
            <RefreshCw v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Creating...' : 'Create Keyword Rule' }}</span>
          </button>
        </div>
      </form>

      <!-- DOMAIN FORM -->
      <form v-else-if="selectedType === 'domain'" @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Domain Name / Host <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="domainForm.domain"
            type="text" 
            placeholder="e.g. casino-example.com"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="domainForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="MALWARE">Malware</option>
              <option value="PHISHING">Phishing</option>
              <option value="SCAM">Scam</option>
              <option value="SPAM">Spam</option>
              <option value="ADULT">Adult</option>
              <option value="GAMBLING">Gambling</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
            <select 
              v-model="domainForm.severity"
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
            v-model="domainForm.match_type"
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
          >
            <option value="EXACT">Exact Domain Only</option>
            <option value="SUBDOMAIN">Domain and All Subdomains</option>
            <option value="SUFFIX">Suffix Match</option>
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Description</label>
          <textarea 
            v-model="domainForm.description"
            rows="2"
            placeholder="Explain why this domain is blacklisted..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground font-medium">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="domainForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmitting"
            @click="handleClose"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70"
          >
            <RefreshCw v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Creating...' : 'Create Domain Rule' }}</span>
          </button>
        </div>
      </form>

      <!-- HIDDEN CONTENT FORM -->
      <form v-else-if="selectedType === 'hidden_content'" @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Pattern / Token <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="hiddenContentForm.pattern"
            type="text" 
            placeholder="e.g. font-size:0px;color:transparent;"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="hiddenContentForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="HIDDEN_CONTENT">Hidden Content</option>
              <option value="SPAM">Spam</option>
              <option value="OBFUSCATION">Obfuscation</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
            <select 
              v-model="hiddenContentForm.severity"
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
            v-model="hiddenContentForm.description"
            rows="2"
            placeholder="Explain why this hidden content technique is flagged..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground font-medium">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="hiddenContentForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmitting"
            @click="handleClose"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70"
          >
            <RefreshCw v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Creating...' : 'Create Hidden Content Rule' }}</span>
          </button>
        </div>
      </form>

      <!-- OBFUSCATION FORM -->
      <form v-else-if="selectedType === 'obfuscation'" @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Pattern / Token <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="obfuscationForm.pattern"
            type="text" 
            placeholder="e.g. data:text/html;base64"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="obfuscationForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="OBFUSCATION">Obfuscation</option>
              <option value="INJECTION">Injection</option>
              <option value="MALWARE">Malware</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
            <select 
              v-model="obfuscationForm.severity"
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
            v-model="obfuscationForm.description"
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
            v-model="obfuscationForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmitting"
            @click="handleClose"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70"
          >
            <RefreshCw v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Creating...' : 'Create Obfuscation Rule' }}</span>
          </button>
        </div>
      </form>

      <!-- REDIRECT FORM -->
      <form v-else-if="selectedType === 'redirect'" @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Pattern / Token <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="redirectForm.pattern"
            type="text" 
            placeholder="e.g. http-equiv=&quot;refresh&quot;"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="redirectForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="REDIRECT">Redirect</option>
              <option value="PHISHING">Phishing</option>
              <option value="SCAM">Scam</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
            <select 
              v-model="redirectForm.severity"
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
            v-model="redirectForm.description"
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
            v-model="redirectForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmitting"
            @click="handleClose"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70"
          >
            <RefreshCw v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Creating...' : 'Create Redirect Rule' }}</span>
          </button>
        </div>
      </form>

      <!-- HTML ATTRIBUTE FORM -->
      <form v-else-if="selectedType === 'attribute'" @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            Attribute / Pattern <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="htmlAttributeForm.attribute"
            type="text" 
            placeholder="e.g. onerror, onclick, onload, javascript:"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="htmlAttributeForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="INJECTION">Injection</option>
              <option value="PHISHING">Phishing</option>
              <option value="MALWARE">Malware</option>
              <option value="OBFUSCATION">Obfuscation</option>
              <option value="REDIRECT">Redirect</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
            <select 
              v-model="htmlAttributeForm.severity"
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
            v-model="htmlAttributeForm.description"
            rows="2"
            placeholder="Explain why this attribute pattern is flagged..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground font-medium">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="htmlAttributeForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmitting"
            @click="handleClose"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70"
          >
            <RefreshCw v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Creating...' : 'Create HTML Attribute Rule' }}</span>
          </button>
        </div>
      </form>

      <!-- HTML TAG FORM -->
      <form v-else-if="selectedType === 'html'" @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">
            HTML Tag Name <span class="text-rose-500">*</span>
          </label>
          <input 
            v-model="htmlTagForm.tag"
            type="text" 
            placeholder="e.g. script, iframe, object, embed"
            required
            class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-mono font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Category <span class="text-rose-500">*</span></label>
            <select 
              v-model="htmlTagForm.category"
              class="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option value="DANGEROUS_TAGS">Dangerous Tags</option>
              <option value="EMBEDDED_CONTENT">Embedded Content</option>
              <option value="PLUGIN_OBJECTS">Plugin Objects</option>
              <option value="DOM_HIJACKING">DOM Hijacking</option>
              <option value="INJECTION">Injection</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Severity <span class="text-rose-500">*</span></label>
            <select 
              v-model="htmlTagForm.severity"
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
            v-model="htmlTagForm.description"
            rows="2"
            placeholder="Explain why this HTML tag pattern is flagged..."
            class="w-full p-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20"
          ></textarea>
        </div>

        <div class="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p class="text-xs font-bold text-foreground">Rule Enabled</p>
            <p class="text-[10px] text-muted-foreground font-medium">Active rules are evaluated during content security scans</p>
          </div>
          <input 
            v-model="htmlTagForm.is_enabled"
            type="checkbox" 
            class="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button 
            type="button" 
            :disabled="isSubmitting"
            @click="handleClose"
            class="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70"
          >
            <RefreshCw v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Creating...' : 'Create HTML Tag Rule' }}</span>
          </button>
        </div>
      </form>
    </div>
  </UiAdminModal>
</template>
