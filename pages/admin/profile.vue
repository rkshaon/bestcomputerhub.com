<!-- File: /pages/admin/profile.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  User as UserIcon, 
  ShieldCheck, 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  Mail, 
  Calendar, 
  Users, 
  Loader2,
  LockKeyhole,
  X,
  AlertCircle
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useUserService } from '@/composables/useUserService';
import { useToast, extractErrorMessage } from '@/composables/useToast';
import UiCard from '@/components/ui/UiCard.vue';
import Button from '@/components/ui/Button.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';

definePageMeta({
  layout: 'admin'
});

const authStore = useAuthStore();
const userService = useUserService();
const { toastSuccess, toastError, handleApiError } = useToast();

const isLoading = ref(true);
const isSubmittingProfile = ref(false);
const isSubmittingPassword = ref(false);

// Form Fields
const firstName = ref('');
const middleName = ref('');
const lastName = ref('');
const username = ref('');
const email = ref('');

// Password Fields
const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const initials = computed(() => {
  const userName = authStore.user?.name;
  if (!userName) return 'A';
  const parts = userName.trim().split(/\s+/);
  const firstPart = parts[0];
  const lastPart = parts[parts.length - 1];
  if (!firstPart) return 'A';
  if (parts.length === 1) return firstPart.substring(0, 2).toUpperCase();
  if (!lastPart) return firstPart.substring(0, 1).toUpperCase();
  return (firstPart.substring(0, 1) + lastPart.substring(0, 1)).toUpperCase();
});

const joinDateFormatted = computed(() => {
  if (!authStore.user?.joinedAt) return '';
  try {
    const d = new Date(authStore.user.joinedAt);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return authStore.user.joinedAt;
  }
});

const loadUserData = async () => {
  isLoading.value = true;
  try {
    // 1. Authoritative profile retrieval
    await authStore.fetchUserProfile();
    
    // 2. Fetch detailed record via userService if ID is present
    const userId = authStore.user?.id;
    if (userId) {
      const details = await userService.getUserById(userId);
      
      firstName.value = details.first_name || '';
      middleName.value = details.middle_name || '';
      lastName.value = details.last_name || '';
      username.value = details.username || '';
      email.value = details.email || '';
      
      // Derive name if first and last name are empty
      if (!firstName.value && !lastName.value && authStore.user?.name) {
        const parts = authStore.user.name.trim().split(/\s+/);
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
    }
  } catch (err) {
    handleApiError(err, 'Failed to fetch account profile details.');
  } finally {
    isLoading.value = false;
  }
};

const handleProfileSubmit = async () => {
  if (!authStore.user?.id) return;
  
  if (!username.value.trim()) {
    toastError('Username is required.');
    return;
  }
  
  isSubmittingProfile.value = true;
  try {
    const payload = {
      first_name: firstName.value.trim(),
      middle_name: middleName.value.trim(),
      last_name: lastName.value.trim(),
      username: username.value.trim()
    };
    
    await userService.updateSelfProfile(payload);
    
    // Fetch user profile again to update authStore state across the interface
    await authStore.fetchUserProfile();
    
    toastSuccess('Profile details updated successfully.');
    await loadUserData();
  } catch (err) {
    handleApiError(err, 'Failed to update profile.');
  } finally {
    isSubmittingProfile.value = false;
  }
};

const isPasswordModalOpen = ref(false);
const passwordModalError = ref('');

const openPasswordModal = () => {
  oldPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  showOldPassword.value = false;
  showNewPassword.value = false;
  showConfirmPassword.value = false;
  passwordModalError.value = '';
  isPasswordModalOpen.value = true;
};

const closePasswordModal = () => {
  isPasswordModalOpen.value = false;
  passwordModalError.value = '';
  oldPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  showOldPassword.value = false;
  showNewPassword.value = false;
  showConfirmPassword.value = false;
};

const handlePasswordSubmit = async () => {
  passwordModalError.value = '';
  
  const trimmedOld = oldPassword.value;
  const trimmedNew = newPassword.value;
  const trimmedConfirm = confirmPassword.value;
  
  if (!trimmedOld) {
    passwordModalError.value = 'Old password is required.';
    return;
  }

  if (!trimmedNew) {
    passwordModalError.value = 'New password is required.';
    return;
  }
  
  if (trimmedNew.length < 8) {
    passwordModalError.value = 'Password must be at least 8 characters long.';
    return;
  }
  
  if (trimmedNew !== trimmedConfirm) {
    passwordModalError.value = 'New password and confirm password do not match.';
    return;
  }
  
  isSubmittingPassword.value = true;
  try {
    await userService.changePassword({
      old_password: trimmedOld,
      new_password: trimmedNew,
      confirm_new_password: trimmedConfirm
    });
    
    toastSuccess('Account password changed successfully.');
    closePasswordModal();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to update password.');
    passwordModalError.value = msg;
    handleApiError(err, 'Failed to update password.');
  } finally {
    isSubmittingPassword.value = false;
  }
};

onMounted(async () => {
  await authStore.initialize();
  await loadUserData();
});
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <!-- Header Section -->
    <div>
      <h1 class="text-3xl font-display font-extrabold tracking-tight text-foreground">My Profile</h1>
      <p class="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Manage your account settings, personal details, and security configuration.</p>
    </div>

    <!-- Loading Skeleton State -->
    <div v-if="isLoading" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-1">
        <UiCard class="h-96 animate-pulse bg-muted/50" />
      </div>
      <div class="lg:col-span-2 space-y-8">
        <UiCard class="h-80 animate-pulse bg-muted/50" />
        <UiCard class="h-64 animate-pulse bg-muted/50" />
      </div>
    </div>

    <!-- Active Profile State -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Profile / User Details Sidebar Card -->
      <div class="lg:col-span-1 space-y-6">
        <UiCard variant="default" padding="lg" class="relative overflow-hidden border border-border">
          <!-- Subtle top gradient decoration -->
          <div class="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-primary/5 to-transparent"></div>
          
          <div class="flex flex-col items-center text-center space-y-6 relative z-10">
            <!-- Initials / Avatar placeholder -->
            <div class="relative">
              <div class="w-28 h-28 rounded-full overflow-hidden border-4 border-background shadow-md flex items-center justify-center bg-primary text-primary-foreground text-3xl font-display font-bold">
                <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" :alt="authStore.user?.name" class="w-full h-full object-cover" />
                <span v-else>{{ initials }}</span>
              </div>
              <div class="absolute bottom-0 right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-background shadow-md">
                <div class="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>

            <!-- Profile Info Header -->
            <div class="space-y-2">
              <span class="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/25 rounded-full text-[10px] font-bold uppercase tracking-widest inline-block">
                {{ authStore.user?.role || 'Super Admin' }}
              </span>
              <h2 class="text-xl font-display font-bold text-foreground">
                {{ authStore.user?.name || 'Administrator' }}
              </h2>
              <p class="text-slate-500 dark:text-slate-400 text-xs font-semibold select-all break-all">
                @{{ username || 'admin' }}
              </p>
            </div>

            <!-- Meta details list -->
            <div class="w-full pt-5 border-t border-border space-y-3.5 text-left text-xs">
              <div class="flex justify-between items-center">
                <span class="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Mail class="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Email</span>
                </span>
                <span class="font-medium text-foreground select-all break-all text-right max-w-[150px] truncate">
                  {{ authStore.user?.email || email }}
                </span>
              </div>

              <div class="flex justify-between items-center" v-if="joinDateFormatted">
                <span class="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Calendar class="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Registry Date</span>
                </span>
                <span class="font-medium text-foreground text-right">
                  {{ joinDateFormatted }}
                </span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <ShieldCheck class="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Clearance</span>
                </span>
                <span class="text-[10px] font-extrabold uppercase tracking-widest text-[#0ea5e9] dark:text-[#38bdf8] flex items-center gap-0.5">
                  Active Administrator
                </span>
              </div>
            </div>

            <!-- User Groups & Permissions -->
            <div class="w-full pt-5 border-t border-border text-left space-y-4">
              <!-- Groups -->
              <div v-if="authStore.user?.groups && authStore.user.groups.length > 0" class="space-y-2">
                <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users class="w-3.5 h-3.5" />
                  <span>Assigned Groups</span>
                </h4>
                <div class="flex flex-wrap gap-1.5">
                  <span 
                    v-for="group in authStore.user.groups" 
                    :key="typeof group === 'object' ? group.name : group"
                    class="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-semibold border border-border"
                  >
                    {{ typeof group === 'object' ? group.name : group }}
                  </span>
                </div>
              </div>

              <!-- Permissions -->
              <div v-if="authStore.user?.permissions && authStore.user.permissions.length > 0" class="space-y-2">
                <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck class="w-3.5 h-3.5" />
                  <span>Key Permissions</span>
                </h4>
                <div class="flex flex-wrap gap-1">
                  <span 
                    v-for="perm in authStore.user.permissions.slice(0, 12)" 
                    :key="typeof perm === 'object' ? perm.codename : perm"
                    class="px-1.5 py-0.5 rounded bg-primary/5 text-primary border border-primary/10 text-[9px] font-mono font-medium"
                    :title="typeof perm === 'object' ? perm.name : perm"
                  >
                    {{ typeof perm === 'object' ? perm.codename : perm }}
                  </span>
                  <span 
                    v-if="authStore.user.permissions.length > 12"
                    class="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[9px] font-medium"
                  >
                    +{{ authStore.user.permissions.length - 12 }} more
                  </span>
                </div>
              </div>
            </div>
          </div>
        </UiCard>
      </div>

      <!-- Detail Editing Area -->
      <div class="lg:col-span-2 space-y-8">
        <!-- 1. Edit Profile Information -->
        <UiCard variant="default" padding="lg" class="border border-border">
          <div class="space-y-6">
            <!-- Header -->
            <div class="border-b border-border pb-4 flex items-center gap-3">
              <div class="p-2 rounded-xl bg-primary/10 text-primary">
                <UserIcon class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-base font-display font-bold text-foreground">Personal Details</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">Update your editable identity information inside the core directory.</p>
              </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleProfileSubmit" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-foreground">First Name</label>
                  <input 
                    v-model="firstName" 
                    type="text" 
                    placeholder="Enter first name"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-foreground">Middle Name</label>
                  <input 
                    v-model="middleName" 
                    type="text" 
                    placeholder="Enter middle name"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-foreground">Last Name</label>
                  <input 
                    v-model="lastName" 
                    type="text" 
                    placeholder="Enter last name"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-foreground">Username <span class="text-destructive">*</span></label>
                  <input 
                    v-model="username" 
                    type="text" 
                    required
                    placeholder="Enter username"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-foreground">Email Address</label>
                  <div class="relative">
                    <input 
                      v-model="email" 
                      type="email" 
                      disabled
                      placeholder="email@techcore.io"
                      class="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-input bg-muted/40 text-muted-foreground text-xs cursor-not-allowed"
                    />
                    <Mail class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p class="text-[10px] text-muted-foreground italic mt-1">Email address is read-only and cannot be changed from the profile page.</p>
                </div>
              </div>

              <div class="flex items-center justify-end pt-2">
                <Button 
                  type="submit" 
                  variant="primary"
                  :disabled="isSubmittingProfile"
                  class="flex items-center gap-2 text-xs font-semibold px-4 py-2"
                >
                  <Loader2 v-if="isSubmittingProfile" class="w-3.5 h-3.5 animate-spin" />
                  <Save v-else class="w-3.5 h-3.5" />
                  <span>{{ isSubmittingProfile ? 'Saving Details...' : 'Save Profile' }}</span>
                </Button>
              </div>
            </form>
          </div>
        </UiCard>

        <!-- 2. Security / Password Update Section -->
        <UiCard variant="default" padding="lg" class="border border-border">
          <div class="space-y-6">
            <!-- Header -->
            <div class="border-b border-border pb-4 flex items-center gap-3">
              <div class="p-2 rounded-xl bg-primary/10 text-primary">
                <LockKeyhole class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-base font-display font-bold text-foreground">Security Credentials</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">Change your secure account access credentials independently.</p>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="space-y-1">
                <p class="text-xs font-semibold text-foreground">Account Password</p>
                <p class="text-xs text-muted-foreground">Keep your account secure by updating your password regularly.</p>
              </div>
              <Button 
                type="button" 
                variant="primary"
                @click="openPasswordModal"
                class="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 self-start sm:self-auto"
              >
                <Lock class="w-3.5 h-3.5" />
                <span>Change Password</span>
              </Button>
            </div>
          </div>
        </UiCard>
      </div>
    </div>
  </div>

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
              Change your personal access password.
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
          <!-- Old Password Input -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-foreground">
              Old Password <span class="text-destructive">*</span>
            </label>
            <div class="relative">
              <input 
                v-model="oldPassword"
                :type="showOldPassword ? 'text' : 'password'"
                required
                placeholder="••••••••••••"
                @keyup.enter="handlePasswordSubmit"
                class="w-full pl-9 pr-9 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <Lock class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <button 
                type="button" 
                @click.stop="showOldPassword = !showOldPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title="Toggle old password visibility"
                aria-label="Toggle old password visibility"
              >
                <EyeOff v-if="showOldPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- New Password Input -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-foreground">
              New Password <span class="text-destructive">*</span>
            </label>
            <div class="relative">
              <input 
                v-model="newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                required
                placeholder="••••••••••••"
                @keyup.enter="handlePasswordSubmit"
                class="w-full pl-9 pr-9 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <Lock class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <button 
                type="button" 
                @click.stop="showNewPassword = !showNewPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title="Toggle new password visibility"
                aria-label="Toggle new password visibility"
              >
                <EyeOff v-if="showNewPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Confirm New Password Input -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-foreground">
              Confirm New Password <span class="text-destructive">*</span>
            </label>
            <div class="relative">
              <input 
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                placeholder="••••••••••••"
                @keyup.enter="handlePasswordSubmit"
                class="w-full pl-9 pr-9 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <Lock class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <button 
                type="button" 
                @click.stop="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title="Toggle confirm new password visibility"
                aria-label="Toggle confirm new password visibility"
              >
                <EyeOff v-if="showConfirmPassword" class="w-4 h-4" />
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
          <span>{{ isSubmittingPassword ? 'Updating...' : 'Update Password' }}</span>
        </Button>
      </div>
    </div>
  </UiAdminModal>
</template>
