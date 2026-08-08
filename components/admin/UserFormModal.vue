<!-- File: /components/admin/UserFormModal.vue -->
<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { 
  UserPlus, 
  X, 
  Check, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff 
} from 'lucide-vue-next';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import Button from '@/components/ui/Button.vue';
import { useUserService } from '@/composables/useUserService';
import { useRoleService } from '@/composables/useRoleService';
import { useToast } from '@/composables/useToast';
import type { Role, CreateUserPayload } from '@/types';

interface Props {
  isOpen: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const userService = useUserService();
const roleService = useRoleService();
const { toastSuccess, toastError } = useToast();

// Form Fields
const firstName = ref('');
const middleName = ref('');
const lastName = ref('');
const email = ref('');
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const selectedGroupIds = ref<number[]>([]);

const showPassword = ref(false);
const showConfirmPassword = ref(false);
const formError = ref('');

// Roles list state
const rolesList = ref<Role[]>([]);
const isLoadingRoles = ref(false);

const loadAvailableRoles = async () => {
  isLoadingRoles.value = true;
  try {
    const res = await roleService.getRoles();
    rolesList.value = res.results || [];
  } catch (err) {
    // Graceful fallback from roleService
    rolesList.value = roleService.roles.value || [];
  } finally {
    isLoadingRoles.value = false;
  }
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    formError.value = '';
    firstName.value = '';
    middleName.value = '';
    lastName.value = '';
    email.value = '';
    username.value = '';
    password.value = '';
    confirmPassword.value = '';
    selectedGroupIds.value = [];
    showPassword.value = false;
    showConfirmPassword.value = false;

    loadAvailableRoles();
  }
}, { immediate: true });

const toggleRoleSelection = (roleId: number) => {
  if (selectedGroupIds.value.includes(roleId)) {
    selectedGroupIds.value = selectedGroupIds.value.filter(id => id !== roleId);
  } else {
    selectedGroupIds.value = [...selectedGroupIds.value, roleId];
  }
};

const handleSubmit = async () => {
  formError.value = '';

  // Validation
  if (!email.value.trim()) {
    formError.value = 'Email address is required.';
    return;
  }
  if (!username.value.trim()) {
    formError.value = 'Username is required.';
    return;
  }
  if (!password.value) {
    formError.value = 'Password is required.';
    return;
  }
  if (password.value !== confirmPassword.value) {
    formError.value = 'Passwords do not match.';
    return;
  }

  const payload: CreateUserPayload = {
    first_name: firstName.value.trim(),
    middle_name: middleName.value.trim(),
    last_name: lastName.value.trim(),
    email: email.value.trim(),
    username: username.value.trim(),
    password: password.value,
    confirm_password: confirmPassword.value,
    groups: selectedGroupIds.value
  };

  try {
    const newUser = await userService.createUser(payload);
    const displayName = newUser.full_name || newUser.username || newUser.email;
    toastSuccess(`User account "${displayName}" created successfully.`);
    emit('saved');
    emit('close');
  } catch (err: any) {
    let msg = 'Failed to create user account.';
    if (err?.data) {
      if (typeof err.data === 'string') msg = err.data;
      else if (err.data.detail) msg = err.data.detail;
      else if (typeof err.data === 'object') {
        const errors = Object.entries(err.data)
          .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        if (errors) msg = errors;
      }
    } else if (err?.message) {
      msg = err.message;
    }
    formError.value = msg;
    toastError('Please resolve errors in the form.');
  }
};
</script>

<template>
  <UiAdminModal 
    :is-open="isOpen" 
    max-width="max-w-3xl"
    :show-close-button="false"
    @close="emit('close')"
  >
    <div class="flex flex-col h-full max-h-[85vh]">
      
      <!-- Modal Header -->
      <div class="px-6 py-5 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <UserPlus class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-lg font-display font-extrabold text-foreground">
              Provision New User Account
            </h2>
            <p class="text-xs text-muted-foreground font-medium">
              Create a new user account, define credentials, and assign security groups.
            </p>
          </div>
        </div>

        <button 
          type="button" 
          @click="emit('close')"
          class="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div class="p-6 overflow-y-auto space-y-6 flex-1">
        
        <!-- Error Banner -->
        <div 
          v-if="formError || userService.error.value" 
          class="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-start gap-2.5 animate-in fade-in"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{{ formError || userService.error.value }}</span>
        </div>

        <form @submit.prevent="handleSubmit" id="create-user-form" class="space-y-6">
          
          <!-- Name Section -->
          <div class="space-y-4">
            <h3 class="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User class="w-3.5 h-3.5 text-primary" /> Personal Identification
            </h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- First Name -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-foreground">
                  First Name
                </label>
                <input 
                  v-model="firstName"
                  type="text"
                  placeholder="e.g. Sarah"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <!-- Middle Name -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-foreground">
                  Middle Name <span class="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                </label>
                <input 
                  v-model="middleName"
                  type="text"
                  placeholder="e.g. Jane"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <!-- Last Name -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-foreground">
                  Last Name
                </label>
                <input 
                  v-model="lastName"
                  type="text"
                  placeholder="e.g. Anderson"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          <!-- Account Credentials -->
          <div class="space-y-4 pt-2 border-t border-border">
            <h3 class="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Mail class="w-3.5 h-3.5 text-primary" /> Account Credentials
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Email -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-foreground">
                  Email Address <span class="text-destructive">*</span>
                </label>
                <div class="relative">
                  <input 
                    v-model="email"
                    type="email"
                    required
                    placeholder="user@techcore.io"
                    class="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <Mail class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <!-- Username -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-foreground">
                  Username <span class="text-destructive">*</span>
                </label>
                <div class="relative">
                  <input 
                    v-model="username"
                    type="text"
                    required
                    placeholder="sarah.anderson"
                    class="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <User class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Password -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-foreground">
                  Password <span class="text-destructive">*</span>
                </label>
                <div class="relative">
                  <input 
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    required
                    placeholder="••••••••••••"
                    class="w-full pl-9 pr-9 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <Lock class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <button 
                    type="button" 
                    @click.stop="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle password visibility"
                  >
                    <EyeOff v-if="showPassword" class="w-4 h-4" />
                    <Eye v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Confirm Password -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-foreground">
                  Confirm Password <span class="text-destructive">*</span>
                </label>
                <div class="relative">
                  <input 
                    v-model="confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    required
                    placeholder="••••••••••••"
                    class="w-full pl-9 pr-9 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <Lock class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <button 
                    type="button" 
                    @click.stop="showConfirmPassword = !showConfirmPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle confirm password visibility"
                  >
                    <EyeOff v-if="showConfirmPassword" class="w-4 h-4" />
                    <Eye v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Group / Role Assignment -->
          <div class="space-y-4 pt-2 border-t border-border">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck class="w-3.5 h-3.5 text-primary" /> Role & Group Assignment
                </h3>
                <p class="text-[11px] text-muted-foreground mt-0.5">
                  Assign one or multiple security groups to grant functional permissions.
                </p>
              </div>
              <span class="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                {{ selectedGroupIds.length }} Selected
              </span>
            </div>

            <!-- Loading Roles State -->
            <div v-if="isLoadingRoles" class="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 class="w-4 h-4 animate-spin text-primary" />
              <span>Loading available roles...</span>
            </div>

            <!-- Roles Grid -->
            <div v-else-if="rolesList.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div 
                v-for="role in rolesList" 
                :key="role.id"
                @click="toggleRoleSelection(role.id)"
                :class="[
                  'p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none',
                  selectedGroupIds.includes(role.id)
                    ? 'bg-primary/5 border-primary/40 ring-2 ring-primary/20'
                    : 'bg-card border-border hover:border-border/80 hover:bg-muted/30'
                ]"
              >
                <div 
                  :class="[
                    'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                    selectedGroupIds.includes(role.id)
                      ? 'bg-primary border-primary text-white'
                      : 'border-input bg-background'
                  ]"
                >
                  <Check v-if="selectedGroupIds.includes(role.id)" class="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xs font-bold text-foreground truncate">
                    {{ role.name }}
                  </div>
                  <div class="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {{ role.permissions ? `${role.permissions.length} permissions assigned` : 'Custom group scope' }}
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-xl">
              No security roles available in catalog.
            </div>
          </div>

        </form>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0 bg-muted/20">
        <Button 
          type="button" 
          variant="outline" 
          @click="emit('close')"
          :disabled="userService.isSubmitting.value"
        >
          Cancel
        </Button>

        <Button 
          type="submit" 
          form="create-user-form"
          variant="primary" 
          :disabled="userService.isSubmitting.value"
        >
          <Loader2 v-if="userService.isSubmitting.value" class="w-4 h-4 animate-spin" />
          <span>{{ userService.isSubmitting.value ? 'Provisioning...' : 'Provision User Account' }}</span>
        </Button>
      </div>

    </div>
  </UiAdminModal>
</template>
