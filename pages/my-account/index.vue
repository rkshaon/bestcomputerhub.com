<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue';
import { Pencil, CheckCircle2, AlertCircle, Loader2, Mail, X, Check } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useUserService } from '@/composables/useUserService';
import { useEmailVerification } from '@/composables/useEmailVerification';
import { useToast, extractErrorMessage } from '@/composables/useToast';
import type { UpdateSelfProfilePayload } from '@/types';

const authStore = useAuthStore();
const userService = useUserService();
const { emailVerified, loadingStatus, loadingResend, fetchStatus, resendEmail } = useEmailVerification();
const { toastSuccess, handleApiError } = useToast();

const isEditing = ref(false);
const isLoadingProfile = ref(false);
const isSubmitting = ref(false);
const firstNameInputRef = ref<HTMLInputElement | null>(null);

const form = reactive({
  first_name: '',
  middle_name: '',
  last_name: '',
  username: '',
  email: ''
});

const fieldErrors = reactive<Record<'first_name' | 'middle_name' | 'last_name' | 'username' | 'email', string>>({
  first_name: '',
  middle_name: '',
  last_name: '',
  username: '',
  email: ''
});

const formError = ref<string | null>(null);

const syncFormFromUser = () => {
  const user = authStore.user;
  form.first_name = user?.first_name ?? '';
  form.middle_name = user?.middle_name ?? '';
  form.last_name = user?.last_name ?? '';
  form.username = user?.username ?? '';
  form.email = user?.email ?? '';
};

const clearErrors = () => {
  fieldErrors.first_name = '';
  fieldErrors.middle_name = '';
  fieldErrors.last_name = '';
  fieldErrors.username = '';
  fieldErrors.email = '';
  formError.value = null;
};

const isEmailVerified = computed<boolean | null>(() => {
  if (emailVerified.value !== null) return emailVerified.value;
  if (typeof authStore.user?.email_verified === 'boolean') return authStore.user.email_verified;
  return null;
});

onMounted(async () => {
  if (!authStore.user || authStore.user.username === undefined) {
    isLoadingProfile.value = true;
    try {
      await authStore.fetchUserProfile();
    } catch (err) {
      handleApiError(err, 'Failed to load profile details.');
    } finally {
      isLoadingProfile.value = false;
    }
  }
  syncFormFromUser();
});

watch(
  () => authStore.user,
  () => {
    if (!isEditing.value) {
      syncFormFromUser();
    }
  },
  { deep: true }
);

const startEditing = async () => {
  syncFormFromUser();
  clearErrors();
  isEditing.value = true;
  await nextTick();
  firstNameInputRef.value?.focus();
};

const cancelEditing = () => {
  syncFormFromUser();
  clearErrors();
  isEditing.value = false;
};

const validateForm = (): boolean => {
  clearErrors();
  let valid = true;

  const trimmedUsername = form.username.trim();
  if (!trimmedUsername) {
    fieldErrors.username = 'Username is required.';
    valid = false;
  } else if (trimmedUsername.length > 150) {
    fieldErrors.username = 'Username must be 150 characters or fewer.';
    valid = false;
  }

  if (form.first_name.trim().length > 255) {
    fieldErrors.first_name = 'First name must be 255 characters or fewer.';
    valid = false;
  }
  if (form.middle_name.trim().length > 255) {
    fieldErrors.middle_name = 'Middle name must be 255 characters or fewer.';
    valid = false;
  }
  if (form.last_name.trim().length > 255) {
    fieldErrors.last_name = 'Last name must be 255 characters or fewer.';
    valid = false;
  }

  const trimmedEmail = form.email.trim();
  const hadOriginalEmail = !!(authStore.user?.email || '').trim();
  if (!trimmedEmail && hadOriginalEmail) {
    fieldErrors.email = 'Email address is required.';
    valid = false;
  } else if (trimmedEmail) {
    if (trimmedEmail.length > 254) {
      fieldErrors.email = 'Email address must be 254 characters or fewer.';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      fieldErrors.email = 'Please enter a valid email address.';
      valid = false;
    }
  }

  return valid;
};

const applyServerErrors = (err: any) => {
  const data = err?.data || err?.response?._data;
  if (data && typeof data === 'object') {
    const keys: Array<'first_name' | 'middle_name' | 'last_name' | 'username' | 'email'> = [
      'first_name',
      'middle_name',
      'last_name',
      'username',
      'email'
    ];
    for (const key of keys) {
      const raw = (data as Record<string, unknown>)[key];
      if (Array.isArray(raw) && raw.length > 0) {
        fieldErrors[key] = String(raw[0]);
      } else if (typeof raw === 'string' && raw.trim()) {
        fieldErrors[key] = raw;
      }
    }
  }
  formError.value = extractErrorMessage(err, 'Failed to update profile details.');
};

const handleSave = async () => {
  if (isSubmitting.value) return;
  if (!validateForm()) return;

  isSubmitting.value = true;
  clearErrors();

  try {
    const payload: UpdateSelfProfilePayload = {
      first_name: form.first_name.trim(),
      middle_name: form.middle_name.trim(),
      last_name: form.last_name.trim(),
      username: form.username.trim()
    };

    const trimmedEmail = form.email.trim();
    if (trimmedEmail) {
      payload.email = trimmedEmail;
    }

    await userService.updateSelfProfile(payload);
    await authStore.fetchUserProfile();
    await fetchStatus();
    syncFormFromUser();

    isEditing.value = false;
    toastSuccess('Profile updated successfully.');
  } catch (err: any) {
    applyServerErrors(err);
    handleApiError(err, 'Failed to update profile details.');
  } finally {
    isSubmitting.value = false;
  }
};

const inputClass = (hasError?: string) => [
  'w-full h-12 bg-background border rounded-xl px-4 text-sm font-medium text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
  hasError ? 'border-destructive focus-visible:ring-destructive/30' : 'border-input'
];
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h2 class="text-2xl font-display font-bold">Profile Details</h2>
      <UiButton
        v-if="!isEditing && !isLoadingProfile"
        type="button"
        variant="outline"
        class="rounded-full gap-2 font-bold"
        @click="startEditing"
      >
        <Pencil class="w-4 h-4" aria-hidden="true" />
        Edit Profile
      </UiButton>
    </div>

    <div v-if="isLoadingProfile" class="bg-card border border-border rounded-[2.5rem] p-10 flex items-center justify-center">
      <UiLoader size="md" show-label label="Loading profile details..." />
    </div>

    <div v-else class="bg-card text-card-foreground border border-border rounded-[2.5rem] p-6 sm:p-8 md:p-10 space-y-8">
      <!-- Read-only View -->
      <template v-if="!isEditing">
        <dl class="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div class="space-y-1.5">
            <dt class="text-xs font-bold uppercase tracking-widest text-muted-foreground">First Name</dt>
            <dd class="text-base font-medium text-foreground">
              {{ authStore.user?.first_name || 'Not provided' }}
            </dd>
          </div>

          <div class="space-y-1.5">
            <dt class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Middle Name</dt>
            <dd class="text-base font-medium text-foreground">
              {{ authStore.user?.middle_name || 'Not provided' }}
            </dd>
          </div>

          <div class="space-y-1.5">
            <dt class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Last Name</dt>
            <dd class="text-base font-medium text-foreground">
              {{ authStore.user?.last_name || 'Not provided' }}
            </dd>
          </div>

          <div class="space-y-1.5">
            <dt class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Username</dt>
            <dd class="text-base font-medium text-foreground">
              {{ authStore.user?.username || 'Not provided' }}
            </dd>
          </div>

          <div class="space-y-2 md:col-span-2 pt-2 border-t border-border">
            <dt class="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Mail class="w-3.5 h-3.5" aria-hidden="true" />
              Email Address
            </dt>
            <dd class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-3">
                <span class="text-base font-medium text-foreground break-all">
                  {{ authStore.user?.email || 'Not provided' }}
                </span>
                <UiBadge v-if="authStore.user?.email && isEmailVerified === true" variant="success" size="sm" class="gap-1">
                  <CheckCircle2 class="w-3.5 h-3.5" aria-hidden="true" />
                  Verified
                </UiBadge>
                <UiBadge v-else-if="authStore.user?.email && isEmailVerified === false" variant="warning" size="sm" class="gap-1">
                  <AlertCircle class="w-3.5 h-3.5" aria-hidden="true" />
                  Not Verified
                </UiBadge>
                <span v-else-if="authStore.user?.email && loadingStatus" class="text-xs text-muted-foreground">
                  Checking verification status...
                </span>
              </div>

              <UiButton
                v-if="authStore.user?.email && isEmailVerified === false"
                type="button"
                variant="outline"
                size="sm"
                class="rounded-full font-bold"
                :disabled="loadingResend"
                @click="resendEmail"
              >
                <Loader2 v-if="loadingResend" class="w-3.5 h-3.5 mr-1.5 animate-spin" aria-hidden="true" />
                {{ loadingResend ? 'Sending...' : 'Resend Verification Email' }}
              </UiButton>
            </dd>
          </div>
        </dl>
      </template>

      <!-- Editing Form -->
      <form v-else class="space-y-6" novalidate @submit.prevent="handleSave">
        <div
          v-if="formError"
          class="p-4 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive text-sm font-medium flex items-start gap-2.5"
          role="alert"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{{ formError }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="space-y-2">
            <label for="profile-first-name" class="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              First Name
            </label>
            <input
              id="profile-first-name"
              ref="firstNameInputRef"
              v-model="form.first_name"
              type="text"
              autocomplete="given-name"
              maxlength="255"
              :disabled="isSubmitting"
              :aria-invalid="!!fieldErrors.first_name"
              :aria-describedby="fieldErrors.first_name ? 'profile-first-name-error' : undefined"
              :class="inputClass(fieldErrors.first_name)"
              placeholder="Enter first name"
            />
            <p v-if="fieldErrors.first_name" id="profile-first-name-error" class="text-xs font-medium text-destructive">
              {{ fieldErrors.first_name }}
            </p>
          </div>

          <div class="space-y-2">
            <label for="profile-middle-name" class="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Middle Name
            </label>
            <input
              id="profile-middle-name"
              v-model="form.middle_name"
              type="text"
              autocomplete="additional-name"
              maxlength="255"
              :disabled="isSubmitting"
              :aria-invalid="!!fieldErrors.middle_name"
              :aria-describedby="fieldErrors.middle_name ? 'profile-middle-name-error' : undefined"
              :class="inputClass(fieldErrors.middle_name)"
              placeholder="Enter middle name (optional)"
            />
            <p v-if="fieldErrors.middle_name" id="profile-middle-name-error" class="text-xs font-medium text-destructive">
              {{ fieldErrors.middle_name }}
            </p>
          </div>

          <div class="space-y-2">
            <label for="profile-last-name" class="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Last Name
            </label>
            <input
              id="profile-last-name"
              v-model="form.last_name"
              type="text"
              autocomplete="family-name"
              maxlength="255"
              :disabled="isSubmitting"
              :aria-invalid="!!fieldErrors.last_name"
              :aria-describedby="fieldErrors.last_name ? 'profile-last-name-error' : undefined"
              :class="inputClass(fieldErrors.last_name)"
              placeholder="Enter last name"
            />
            <p v-if="fieldErrors.last_name" id="profile-last-name-error" class="text-xs font-medium text-destructive">
              {{ fieldErrors.last_name }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label for="profile-username" class="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Username <span class="text-destructive" aria-hidden="true">*</span>
            </label>
            <input
              id="profile-username"
              v-model="form.username"
              type="text"
              autocomplete="username"
              required
              maxlength="150"
              :disabled="isSubmitting"
              :aria-invalid="!!fieldErrors.username"
              :aria-describedby="fieldErrors.username ? 'profile-username-error' : undefined"
              :class="inputClass(fieldErrors.username)"
              placeholder="Enter username"
            />
            <p v-if="fieldErrors.username" id="profile-username-error" class="text-xs font-medium text-destructive">
              {{ fieldErrors.username }}
            </p>
          </div>

          <div class="space-y-2">
            <label for="profile-email" class="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Email Address
            </label>
            <input
              id="profile-email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              maxlength="254"
              :disabled="isSubmitting"
              :aria-invalid="!!fieldErrors.email"
              :aria-describedby="fieldErrors.email ? 'profile-email-error' : undefined"
              :class="inputClass(fieldErrors.email)"
              placeholder="Enter email address"
            />
            <p v-if="fieldErrors.email" id="profile-email-error" class="text-xs font-medium text-destructive">
              {{ fieldErrors.email }}
            </p>
          </div>
        </div>

        <div class="pt-6 border-t border-border flex flex-wrap items-center justify-end gap-3">
          <UiButton
            type="button"
            variant="outline"
            class="rounded-full px-6 h-11 font-bold gap-2"
            :disabled="isSubmitting"
            @click="cancelEditing"
          >
            <X class="w-4 h-4" aria-hidden="true" />
            Cancel
          </UiButton>
          <UiButton
            type="submit"
            variant="primary"
            class="rounded-full px-8 h-11 font-bold gap-2"
            :disabled="isSubmitting"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" aria-hidden="true" />
            <Check v-else class="w-4 h-4" aria-hidden="true" />
            {{ isSubmitting ? 'Saving Changes...' : 'Save Changes' }}
          </UiButton>
        </div>
      </form>
    </div>
  </div>
</template>
