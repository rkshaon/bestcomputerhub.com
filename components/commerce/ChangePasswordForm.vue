<!-- File: /components/commerce/ChangePasswordForm.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { Eye, EyeOff } from 'lucide-vue-next';
import { useUserService } from '@/composables/useUserService';
import { useToast } from '@/composables/useToast';

const { changePassword, isSubmitting, error } = useUserService();
const { toastSuccess, toastError } = useToast();

const form = ref({
  old_password: '',
  new_password: '',
  confirm_new_password: ''
});

const showOld = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);

const handleSubmit = async () => {
  if (form.value.new_password !== form.value.confirm_new_password) {
    toastError('New password and confirmation do not match.');
    return;
  }
  
  try {
    await changePassword({
      old_password: form.value.old_password,
      new_password: form.value.new_password,
      confirm_new_password: form.value.confirm_new_password
    });
    toastSuccess('Password changed successfully.');
    form.value = { old_password: '', new_password: '', confirm_new_password: '' };
  } catch (err: any) {
    toastError(error.value || 'Failed to change password.');
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="space-y-2">
      <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current Password</label>
      <div class="relative">
        <input :type="showOld ? 'text' : 'password'" v-model="form.old_password" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 font-medium" required />
        <button type="button" @click="showOld = !showOld" class="absolute right-4 top-3.5 text-muted-foreground">
          <Eye v-if="!showOld" class="w-5 h-5" /><EyeOff v-else class="w-5 h-5" />
        </button>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-2">
        <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">New Password</label>
        <div class="relative">
          <input :type="showNew ? 'text' : 'password'" v-model="form.new_password" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 font-medium" required />
          <button type="button" @click="showNew = !showNew" class="absolute right-4 top-3.5 text-muted-foreground">
            <Eye v-if="!showNew" class="w-5 h-5" /><EyeOff v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
      <div class="space-y-2">
        <label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Confirm New Password</label>
        <div class="relative">
          <input :type="showConfirm ? 'text' : 'password'" v-model="form.confirm_new_password" class="w-full h-12 bg-muted/30 border rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary/20 font-medium" required />
          <button type="button" @click="showConfirm = !showConfirm" class="absolute right-4 top-3.5 text-muted-foreground">
            <Eye v-if="!showConfirm" class="w-5 h-5" /><EyeOff v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
    
    <div class="pt-4 flex justify-end">
      <UiButton type="submit" class="rounded-full px-8 h-12 font-bold shadow-lg shadow-primary/20" :disabled="isSubmitting">
        {{ isSubmitting ? 'Updating...' : 'Update Password' }}
      </UiButton>
    </div>
  </form>
</template>
