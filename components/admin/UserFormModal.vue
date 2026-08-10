<!-- File: /components/admin/UserFormModal.vue -->
<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { 
  UserPlus, 
  Edit as EditIcon, 
  X, 
  Check, 
  Plus,
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
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useToast } from '@/composables/useToast';
import type { Role, UserItem, CreateUserPayload, UpdateUserPayload } from '@/types';

interface Props {
  isOpen: boolean;
  isEdit?: boolean;
  isView?: boolean;
  isResolving?: boolean;
  user?: UserItem | null;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  isEdit: false,
  isView: false,
  isResolving: false,
  user: null
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const userService = useUserService();
const roleService = useRoleService();
const { canEditInModule, hasPermission } = useAdminPermissions();
const { toastSuccess, toastError, handleApiError } = useToast();

const canEditRoles = computed(() => canEditInModule('users'));
const canChangeUserPassword = computed(() => hasPermission('user_api.change_user_password'));
const canChangeUserEmail = computed(() => hasPermission('user_api.change_user_email'));
const canChangeUserUsername = computed(() => hasPermission('user_api.change_user_username'));
const canAssignUserRole = computed(() => hasPermission('user_api.assign_user_role'));
const canRemoveUserRole = computed(() => hasPermission('user_api.remove_user_role'));

// Form Fields
const firstName = ref('');
const middleName = ref('');
const lastName = ref('');
const email = ref('');
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const selectedGroupIds = ref<number[]>([]);
const initialGroupIds = ref<number[]>([]);

const showPassword = ref(false);
const showConfirmPassword = ref(false);
const formError = ref('');

// Roles list state
const rolesList = ref<Role[]>([]);
const isLoadingRoles = ref(false);

// Dedicated Email Edit Modal State
const isEmailModalOpen = ref(false);
const newEmail = ref('');
const emailModalError = ref('');
const isSubmittingEmail = ref(false);

const openEmailModal = () => {
  if (!canChangeUserEmail.value) return;
  newEmail.value = props.user?.email || email.value || '';
  emailModalError.value = '';
  isEmailModalOpen.value = true;
};

const closeEmailModal = () => {
  isEmailModalOpen.value = false;
  emailModalError.value = '';
};

const handleEmailSubmit = async () => {
  emailModalError.value = '';

  if (!canChangeUserEmail.value) {
    emailModalError.value = 'You do not have permission to change user email addresses.';
    return;
  }

  const trimmedEmail = newEmail.value.trim();

  if (!trimmedEmail) {
    emailModalError.value = 'Email address is required.';
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    emailModalError.value = 'Please enter a valid email address.';
    return;
  }

  if (!props.user?.id) {
    emailModalError.value = 'Target user record could not be resolved.';
    return;
  }

  isSubmittingEmail.value = true;
  try {
    const res = await userService.changeEmail(props.user.id, {
      email: trimmedEmail
    });
    email.value = trimmedEmail;
    const successMsg = (res && typeof res === 'object' && res.message) ? res.message : 'Email changed successfully.';
    toastSuccess(successMsg);
    emit('saved');
    closeEmailModal();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to change email address.');
    emailModalError.value = msg;
    handleApiError(err, 'Failed to change email address.');
  } finally {
    isSubmittingEmail.value = false;
  }
};

// Dedicated Username Edit Modal State
const isUsernameModalOpen = ref(false);
const newUsernameVal = ref('');
const usernameModalError = ref('');
const isSubmittingUsername = ref(false);

const openUsernameModal = () => {
  if (!canChangeUserUsername.value) return;
  newUsernameVal.value = props.user?.username || username.value || '';
  usernameModalError.value = '';
  isUsernameModalOpen.value = true;
};

const closeUsernameModal = () => {
  isUsernameModalOpen.value = false;
  usernameModalError.value = '';
};

const handleUsernameSubmit = async () => {
  usernameModalError.value = '';

  if (!canChangeUserUsername.value) {
    usernameModalError.value = 'You do not have permission to change usernames.';
    return;
  }

  const uVal = newUsernameVal.value.trim();
  if (!uVal) {
    usernameModalError.value = 'Username is required.';
    return;
  }

  if (!props.user?.id) {
    usernameModalError.value = 'Target user record could not be resolved.';
    return;
  }

  isSubmittingUsername.value = true;
  try {
    const res = await userService.changeUsername(props.user.id, {
      username: uVal
    });
    username.value = uVal;
    const successMsg = (res && typeof res === 'object' && res.message) ? res.message : 'Username changed successfully.';
    toastSuccess(successMsg);
    closeUsernameModal();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to change username.');
    usernameModalError.value = msg;
    handleApiError(err, 'Failed to change username.');
  } finally {
    isSubmittingUsername.value = false;
  }
};

// Dedicated Password Edit Modal State
const isPasswordModalOpen = ref(false);
const newPasswordVal = ref('');
const confirmPasswordVal = ref('');
const showNewPasswordVal = ref(false);
const showConfirmPasswordVal = ref(false);
const passwordModalError = ref('');
const isSubmittingPassword = ref(false);

const openPasswordModal = () => {
  if (!canChangeUserPassword.value) return;
  newPasswordVal.value = '';
  confirmPasswordVal.value = '';
  showNewPasswordVal.value = false;
  showConfirmPasswordVal.value = false;
  passwordModalError.value = '';
  isPasswordModalOpen.value = true;
};

const closePasswordModal = () => {
  isPasswordModalOpen.value = false;
  passwordModalError.value = '';
};

const handlePasswordSubmit = async () => {
  passwordModalError.value = '';

  if (!canChangeUserPassword.value) {
    passwordModalError.value = 'You do not have permission to change user passwords.';
    return;
  }
  
  const pwd = newPasswordVal.value;
  const cpwd = confirmPasswordVal.value;

  if (!pwd) {
    passwordModalError.value = 'New password is required.';
    return;
  }

  if (pwd !== cpwd) {
    passwordModalError.value = 'Passwords do not match.';
    return;
  }

  if (!props.user?.id) {
    passwordModalError.value = 'Target user record could not be resolved.';
    return;
  }

  isSubmittingPassword.value = true;
  try {
    const res = await userService.changeUserPassword(props.user.id, {
      password: pwd,
      confirm_password: cpwd
    });
    const successMsg = (res && typeof res === 'object' && res.message) ? res.message : 'Password changed successfully.';
    toastSuccess(successMsg);
    closePasswordModal();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to change password.');
    passwordModalError.value = msg;
    handleApiError(err, 'Failed to change password.');
  } finally {
    isSubmittingPassword.value = false;
  }
};

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

watch(
  [() => props.isOpen, () => props.user, () => props.isEdit, () => props.isView],
  () => {
    if (props.isOpen) {
      formError.value = '';
      showPassword.value = false;
      showConfirmPassword.value = false;

      if ((props.isEdit || props.isView) && props.user) {
        firstName.value = props.user.first_name || '';
        middleName.value = props.user.middle_name || '';
        lastName.value = props.user.last_name || '';

        // If first and last name are empty but full_name exists, derive from full_name
        if (!firstName.value && !lastName.value && props.user.full_name) {
          const parts = props.user.full_name.trim().split(/\s+/);
          if (parts.length === 1) {
            firstName.value = parts[0] || '';
          } else if (parts.length === 2) {
            firstName.value = parts[0] || '';
            lastName.value = parts[1] || '';
          } else if (parts.length > 2) {
            firstName.value = parts[0] || '';
            middleName.value = parts.slice(1, -1).join(' ');
            lastName.value = parts[parts.length - 1] || '';
          }
        }

        email.value = props.user.email || '';
        username.value = props.user.username || '';
        password.value = '';
        confirmPassword.value = '';

        if (props.user.groups && Array.isArray(props.user.groups)) {
          const gIds = props.user.groups.map(g => 
            typeof g === 'object' && g !== null ? (g as any).id : Number(g)
          ).filter(id => !isNaN(id));
          selectedGroupIds.value = [...gIds];
          initialGroupIds.value = [...gIds];
        } else {
          selectedGroupIds.value = [];
          initialGroupIds.value = [];
        }
      } else {
        firstName.value = '';
        middleName.value = '';
        lastName.value = '';
        email.value = '';
        username.value = '';
        password.value = '';
        confirmPassword.value = '';
        selectedGroupIds.value = [];
        initialGroupIds.value = [];
      }

      loadAvailableRoles();
    }
  },
  { immediate: true }
);

const assignedRoles = computed(() => {
  return rolesList.value.filter(role => selectedGroupIds.value.includes(role.id));
});

const availableRoles = computed(() => {
  return rolesList.value.filter(role => !selectedGroupIds.value.includes(role.id));
});

const loadingRoleId = ref<number | null>(null);

const addRole = async (roleId: number) => {
  if (props.isView || selectedGroupIds.value.includes(roleId) || loadingRoleId.value === roleId) return;

  if (!canAssignUserRole.value) {
    toastError('You do not have permission to assign roles.');
    return;
  }

  if (props.isEdit && props.user?.id) {
    loadingRoleId.value = roleId;
    try {
      await userService.assignRole(props.user.id, roleId);
      if (!selectedGroupIds.value.includes(roleId)) {
        selectedGroupIds.value = [...selectedGroupIds.value, roleId];
      }
      if (!initialGroupIds.value.includes(roleId)) {
        initialGroupIds.value = [...initialGroupIds.value, roleId];
      }
      const roleObj = rolesList.value.find(r => r.id === roleId);
      toastSuccess(`Role "${roleObj?.name || 'Role'}" assigned successfully.`);
    } catch (err: any) {
      handleApiError(err, 'Failed to assign role.');
    } finally {
      loadingRoleId.value = null;
    }
  } else {
    if (!selectedGroupIds.value.includes(roleId)) {
      selectedGroupIds.value = [...selectedGroupIds.value, roleId];
    }
  }
};

const removeRole = async (roleId: number) => {
  if (props.isView || !selectedGroupIds.value.includes(roleId) || loadingRoleId.value === roleId) return;

  if (!canRemoveUserRole.value) {
    toastError('You do not have permission to remove roles.');
    return;
  }

  if (props.isEdit && props.user?.id) {
    loadingRoleId.value = roleId;
    try {
      await userService.removeRole(props.user.id, roleId);
      selectedGroupIds.value = selectedGroupIds.value.filter(id => id !== roleId);
      initialGroupIds.value = initialGroupIds.value.filter(id => id !== roleId);
      const roleObj = rolesList.value.find(r => r.id === roleId);
      toastSuccess(`Role "${roleObj?.name || 'Role'}" removed successfully.`);
    } catch (err: any) {
      handleApiError(err, 'Failed to remove role.');
    } finally {
      loadingRoleId.value = null;
    }
  } else {
    selectedGroupIds.value = selectedGroupIds.value.filter(id => id !== roleId);
  }
};

const handleSubmit = async () => {
  if (props.isView) {
    emit('close');
    return;
  }
  formError.value = '';

  // Common Validations
  if (!email.value.trim()) {
    formError.value = 'Email address is required.';
    return;
  }
  if (!username.value.trim()) {
    formError.value = 'Username is required.';
    return;
  }

  if (props.isEdit) {
    if (!props.user) {
      formError.value = 'Target user record could not be resolved.';
      return;
    }

    const payload: UpdateUserPayload = {
      first_name: firstName.value.trim(),
      middle_name: middleName.value.trim(),
      last_name: lastName.value.trim(),
      username: username.value.trim()
    };

    try {
      await userService.updateUser(props.user.id, payload);
      const freshUser = await userService.getUserById(props.user.id);
      const displayName = freshUser.full_name || freshUser.username || freshUser.email;
      toastSuccess(`User account "${displayName}" updated successfully.`);
      emit('saved');
      emit('close');
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to update user account.');
      formError.value = msg;
      toastError(msg);
    }
  } else {
    // Create Mode
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
      const msg = extractErrorMessage(err, 'Failed to create user account.');
      formError.value = msg;
      toastError(msg);
    }
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
            <Eye v-if="isView" class="w-5 h-5" />
            <EditIcon v-else-if="isEdit" class="w-5 h-5" />
            <UserPlus v-else class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-lg font-display font-extrabold text-foreground">
              {{ isView ? 'User Account Details' : isEdit ? 'Edit User Account' : 'Provision New User Account' }}
            </h2>
            <p class="text-xs text-muted-foreground font-medium">
              {{ isView ? 'View complete personnel details, credentials, and role assignments in read-only mode.' : isEdit ? 'Modify personnel credentials, account details, and group assignments.' : 'Create a new user account, define credentials, and assign security groups.' }}
            </p>
          </div>
        </div>

        <button 
          type="button" 
          @click="emit('close')"
          class="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Close modal"
          aria-label="Close modal"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Resolving State -->
      <div v-if="isResolving" class="p-12 text-center space-y-3 my-auto">
        <Loader2 class="w-8 h-8 animate-spin text-primary mx-auto" />
        <p class="text-xs font-semibold text-muted-foreground">Loading user record details...</p>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div v-else class="p-6 overflow-y-auto space-y-6 flex-1">
        
        <!-- Error Banner -->
        <div 
          v-if="formError || userService.error.value" 
          class="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-start gap-2.5 animate-in fade-in"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{{ formError || userService.error.value }}</span>
        </div>

        <form @submit.prevent="handleSubmit" id="user-form" class="space-y-6">
          
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
                  :disabled="isView"
                  placeholder="e.g. Sarah"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-75 disabled:bg-muted/30"
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
                  :disabled="isView"
                  placeholder="e.g. Jane"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-75 disabled:bg-muted/30"
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
                  :disabled="isView"
                  placeholder="e.g. Anderson"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-75 disabled:bg-muted/30"
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
                  Email Address <span v-if="!isView && !isEdit" class="text-destructive">*</span>
                </label>
                <div class="relative">
                  <input 
                    v-model="email"
                    type="email"
                    :required="!isView && !isEdit"
                    :disabled="isView || isEdit"
                    placeholder="user@techcore.io"
                    class="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-75 disabled:bg-muted/30"
                  />
                  <Mail class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <!-- Username -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-foreground">
                  Username <span v-if="!isView" class="text-destructive">*</span>
                </label>
                <div class="relative">
                  <input 
                    v-model="username"
                    type="text"
                    :required="!isView"
                    :disabled="isView"
                    placeholder="sarah.anderson"
                    class="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-75 disabled:bg-muted/30"
                  />
                  <User class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div v-if="!isView" class="pt-2">
              <!-- For Edit mode, show dedicated action buttons if permitted -->
              <template v-if="isEdit">
                <div v-if="canChangeUserPassword || canChangeUserEmail || canChangeUserUsername" class="space-y-1.5">
                  <label class="text-xs font-semibold text-foreground">Security Credentials</label>
                  <div class="flex flex-wrap items-center gap-2">
                    <button
                      v-if="canChangeUserEmail"
                      type="button"
                      @click="openEmailModal"
                      class="px-4 py-2.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 border border-primary/20 hover:border-primary/30 rounded-xl transition-all flex items-center gap-2"
                    >
                      <Mail class="w-3.5 h-3.5" />
                      <span>Change Email</span>
                    </button>
                    <button
                      v-if="canChangeUserUsername"
                      type="button"
                      @click="openUsernameModal"
                      class="px-4 py-2.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 border border-primary/20 hover:border-primary/30 rounded-xl transition-all flex items-center gap-2"
                    >
                      <User class="w-3.5 h-3.5" />
                      <span>Change Username</span>
                    </button>
                    <button
                      v-if="canChangeUserPassword"
                      type="button"
                      @click="openPasswordModal"
                      class="px-4 py-2.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 border border-primary/20 hover:border-primary/30 rounded-xl transition-all flex items-center gap-2"
                    >
                      <Lock class="w-3.5 h-3.5" />
                      <span>Change Password</span>
                    </button>
                  </div>
                </div>
              </template>

              <!-- For Create mode, show inline password inputs -->
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      :required="!!password"
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
          </div>

          <!-- Group / Role Assignment -->
          <div class="space-y-6 pt-2 border-t border-border">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck class="w-3.5 h-3.5 text-primary" /> Role & Group Assignment
                </h3>
                <p class="text-[11px] text-muted-foreground mt-0.5">
                  {{ isView ? 'Security roles and permissions assigned to this user account.' : 'Manage security roles and permissions for this user account.' }}
                </p>
              </div>
              <span class="text-[10px] font-bold text-primary bg-primary/15 px-2.5 py-1 rounded-full border border-primary/20">
                {{ selectedGroupIds.length }} {{ selectedGroupIds.length === 1 ? 'Role Assigned' : 'Roles Assigned' }}
              </span>
            </div>

            <!-- Loading Roles State -->
            <div v-if="isLoadingRoles" class="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 class="w-4 h-4 animate-spin text-primary" />
              <span>Loading available roles...</span>
            </div>

            <template v-else-if="rolesList.length > 0">
              <!-- Currently Assigned Roles -->
              <div class="space-y-3">
                <div class="flex items-center justify-between text-xs font-bold text-foreground">
                  <span class="uppercase tracking-wider text-[11px] text-muted-foreground">
                    Currently Assigned Roles ({{ assignedRoles.length }})
                  </span>
                </div>

                <div v-if="assignedRoles.length > 0" class="grid grid-cols-1 gap-2.5">
                  <div 
                    v-for="role in assignedRoles" 
                    :key="role.id"
                    class="p-3.5 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-3 shadow-sm transition-all"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="text-xs font-bold text-foreground flex items-center gap-2">
                        <span>{{ role.name }}</span>
                        <span class="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">Assigned</span>
                      </div>
                      <div class="text-[10px] text-muted-foreground mt-0.5">
                        {{ role.permissions ? `${role.permissions.length} permissions assigned` : 'Custom group scope' }}
                      </div>
                    </div>
                    <button
                      v-if="canRemoveUserRole && !isView"
                      type="button"
                      :disabled="loadingRoleId === role.id"
                      @click="removeRole(role.id)"
                      class="p-1.5 rounded-lg border border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10 text-xs font-semibold flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
                      title="Remove role"
                      aria-label="Remove role"
                    >
                      <Loader2 v-if="loadingRoleId === role.id" class="w-3.5 h-3.5 animate-spin" />
                      <X v-else class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div v-else class="text-xs text-muted-foreground py-4 px-4 text-center border border-dashed border-border rounded-xl bg-muted/10">
                  {{ isView ? 'No security roles currently assigned.' : 'No roles currently assigned. Add a role below to grant permissions.' }}
                </div>
              </div>

              <!-- Available Roles -->
              <div v-if="!isView" class="space-y-3 pt-2">
                <div class="flex items-center justify-between text-xs font-bold text-foreground">
                  <span class="uppercase tracking-wider text-[11px] text-muted-foreground">
                    Available Roles ({{ availableRoles.length }})
                  </span>
                </div>

                <div v-if="availableRoles.length > 0" class="grid grid-cols-1 gap-2.5">
                  <div 
                    v-for="role in availableRoles" 
                    :key="role.id"
                    class="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-3 hover:border-border/80 transition-all"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="text-xs font-bold text-foreground flex items-center gap-2">
                        <span>{{ role.name }}</span>
                      </div>
                      <div class="text-[10px] text-muted-foreground mt-0.5">
                        {{ role.permissions ? `${role.permissions.length} permissions assigned` : 'Custom group scope' }}
                      </div>
                    </div>
                    <button
                      v-if="canAssignUserRole"
                      type="button"
                      :disabled="loadingRoleId === role.id"
                      @click="addRole(role.id)"
                      class="p-1.5 rounded-lg border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 text-xs font-semibold flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
                      title="Add role"
                      aria-label="Add role"
                    >
                      <Loader2 v-if="loadingRoleId === role.id" class="w-3.5 h-3.5 animate-spin" />
                      <Plus v-else class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div v-else class="text-xs text-muted-foreground py-4 px-4 text-center border border-dashed border-border rounded-xl bg-muted/10">
                  All available security roles are already assigned.
                </div>
              </div>
            </template>

            <div v-else class="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-xl">
              No security roles available in catalog.
            </div>
          </div>

        </form>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0 bg-muted/20">
        <template v-if="isView">
          <Button 
            type="button" 
            variant="outline" 
            @click="emit('close')"
          >
            Close
          </Button>
        </template>
        <template v-else>
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
            form="user-form"
            variant="primary" 
            :disabled="userService.isSubmitting.value || isResolving"
          >
            <Loader2 v-if="userService.isSubmitting.value" class="w-4 h-4 animate-spin" />
            <span>
              <template v-if="userService.isSubmitting.value">
                {{ isEdit ? 'Saving Changes...' : 'Provisioning...' }}
              </template>
              <template v-else>
                {{ isEdit ? 'Save Changes' : 'Provision User Account' }}
              </template>
            </span>
          </Button>
        </template>
      </div>

    </div>
  </UiAdminModal>

  <!-- Dedicated Edit Email Modal -->
  <UiAdminModal
    :is-open="isEmailModalOpen"
    max-width="max-w-md"
    :show-close-button="false"
    @close="closeEmailModal"
  >
    <div class="flex flex-col h-full">
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Mail class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-display font-extrabold text-foreground">
              Change Email
            </h3>
            <p class="text-[10px] text-muted-foreground font-medium">
              Change the primary email for this user account.
            </p>
          </div>
        </div>
        <button 
          type="button" 
          @click="closeEmailModal"
          class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Close modal"
          aria-label="Close modal"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-5 space-y-4">
        <!-- Error Banner -->
        <div 
          v-if="emailModalError" 
          class="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-start gap-2 animate-in fade-in"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{{ emailModalError }}</span>
        </div>

        <div class="space-y-3">
          <!-- Current Email -->
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current Email</span>
            <div class="px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-xs font-medium text-muted-foreground select-all break-all">
              {{ email }}
            </div>
          </div>

          <!-- New Email Input -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-foreground">
              New Email Address <span class="text-destructive">*</span>
            </label>
            <div class="relative">
              <input 
                v-model="newEmail"
                type="email"
                required
                placeholder="new-email@techcore.io"
                @keyup.enter="handleEmailSubmit"
                class="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <Mail class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3 border-t border-border flex items-center justify-end gap-2.5 bg-muted/20">
        <Button 
          type="button" 
          variant="outline" 
          @click="closeEmailModal"
          :disabled="isSubmittingEmail"
        >
          Cancel
        </Button>
        <Button 
          type="button" 
          variant="primary" 
          :disabled="isSubmittingEmail"
          @click="handleEmailSubmit"
        >
          <Loader2 v-if="isSubmittingEmail" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ isSubmittingEmail ? 'Changing Email...' : 'Change Email' }}</span>
        </Button>
      </div>
    </div>
  </UiAdminModal>

  <!-- Dedicated Change Password Modal -->
  <UiAdminModal
    :is-open="isPasswordModalOpen"
    max-width="max-w-md"
    :show-close-button="false"
    @close="closePasswordModal"
  >
    <div class="flex flex-col h-full">
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Lock class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-display font-extrabold text-foreground">
              Update Password
            </h3>
            <p class="text-[10px] text-muted-foreground font-medium">
              Change the access password for this user account.
            </p>
          </div>
        </div>
        <button 
          type="button" 
          @click="closePasswordModal"
          class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Close modal"
          aria-label="Close modal"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-5 space-y-4">
        <!-- Error Banner -->
        <div 
          v-if="passwordModalError" 
          class="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-start gap-2 animate-in fade-in"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{{ passwordModalError }}</span>
        </div>

        <div class="space-y-4">
          <!-- New Password Input -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-foreground">
              New Password <span class="text-destructive">*</span>
            </label>
            <div class="relative">
              <input 
                v-model="newPasswordVal"
                :type="showNewPasswordVal ? 'text' : 'password'"
                required
                placeholder="••••••••••••"
                @keyup.enter="handlePasswordSubmit"
                class="w-full pl-9 pr-9 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <Lock class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <button 
                type="button" 
                @click.stop="showNewPasswordVal = !showNewPasswordVal"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Toggle password visibility"
              >
                <EyeOff v-if="showNewPasswordVal" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Confirm Password Input -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-foreground">
              Confirm Password <span class="text-destructive">*</span>
            </label>
            <div class="relative">
              <input 
                v-model="confirmPasswordVal"
                :type="showConfirmPasswordVal ? 'text' : 'password'"
                required
                placeholder="••••••••••••"
                @keyup.enter="handlePasswordSubmit"
                class="w-full pl-9 pr-9 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <Lock class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <button 
                type="button" 
                @click.stop="showConfirmPasswordVal = !showConfirmPasswordVal"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Toggle confirm password visibility"
              >
                <EyeOff v-if="showConfirmPasswordVal" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3 border-t border-border flex items-center justify-end gap-2.5 bg-muted/20">
        <Button 
          type="button" 
          variant="outline" 
          @click="closePasswordModal"
          :disabled="isSubmittingPassword"
        >
          Cancel
        </Button>
        <Button 
          type="button" 
          variant="primary" 
          :disabled="isSubmittingPassword"
          @click="handlePasswordSubmit"
        >
          <Loader2 v-if="isSubmittingPassword" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ isSubmittingPassword ? 'Changing Password...' : 'Change Password' }}</span>
        </Button>
      </div>
    </div>
  </UiAdminModal>

  <!-- Dedicated Change Username Action Modal -->
  <UiAdminModal
    :is-open="isUsernameModalOpen"
    max-width="max-w-md"
    :show-close-button="false"
    @close="closeUsernameModal"
  >
    <div class="bg-card text-card-foreground rounded-2xl shadow-xl overflow-hidden border border-border">
      <!-- Modal Header -->
      <div class="p-5 border-b border-border flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <User class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-display font-extrabold text-foreground">
              Update Username
            </h3>
            <p class="text-[10px] text-muted-foreground font-medium">
              Change system handle for this user account.
            </p>
          </div>
        </div>
        <button 
          type="button" 
          @click="closeUsernameModal"
          class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Close modal"
          aria-label="Close modal"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-5 space-y-4">
        <!-- Error Banner -->
        <div 
          v-if="usernameModalError" 
          class="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-start gap-2 animate-in fade-in"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{{ usernameModalError }}</span>
        </div>

        <div class="space-y-4">
          <!-- Username Input -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-foreground">
              New Username <span class="text-destructive">*</span>
            </label>
            <div class="relative">
              <input 
                v-model="newUsernameVal"
                type="text"
                required
                placeholder="username"
                @keyup.enter="handleUsernameSubmit"
                class="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <User class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3 border-t border-border flex items-center justify-end gap-2.5 bg-muted/20">
        <Button 
          type="button" 
          variant="outline" 
          @click="closeUsernameModal"
          :disabled="isSubmittingUsername"
        >
          Cancel
        </Button>
        <Button 
          type="button" 
          variant="primary" 
          :disabled="isSubmittingUsername"
          @click="handleUsernameSubmit"
        >
          <Loader2 v-if="isSubmittingUsername" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ isSubmittingUsername ? 'Changing Username...' : 'Change Username' }}</span>
        </Button>
      </div>
    </div>
  </UiAdminModal>
</template>
