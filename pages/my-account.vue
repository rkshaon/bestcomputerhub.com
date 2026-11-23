<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import {
  User,
  Package,
  MapPin,
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useEmailVerification } from '@/composables/useEmailVerification';

useSeoMeta({
  title: 'My Account',
  description: 'Manage your profile, saved addresses, track orders, and update security settings at Best Computer Hub.'
});

const route = useRoute();
const authStore = useAuthStore();
const { emailVerified, loadingResend, fetchStatus, resendEmail, resetStatus } = useEmailVerification();

const displayName = computed(
  () => authStore.user?.full_name || authStore.user?.name || authStore.user?.username || 'My Account'
);

const isEmailVerified = computed<boolean | null>(() => {
  if (emailVerified.value !== null) return emailVerified.value;
  if (typeof authStore.user?.email_verified === 'boolean') return authStore.user.email_verified;
  return null;
});

onMounted(() => {
  if (authStore.isLoggedIn) {
    fetchStatus();
  }
});

watch(
  () => [authStore.isLoggedIn, authStore.user?.id, authStore.user?.email] as const,
  ([loggedIn, userId, email], [prevLoggedIn, prevUserId, prevEmail]) => {
    if (!loggedIn) {
      resetStatus();
      return;
    }
    if (loggedIn !== prevLoggedIn || userId !== prevUserId || email !== prevEmail) {
      fetchStatus();
    }
  }
);

const handleLogout = async () => {
  await authStore.logout(route.fullPath);
};
</script>

<template>
  <div class="min-h-screen pb-20 bg-background">
    <!-- Account Header -->
    <section class="bg-background text-card-foreground pt-28 pb-16 md:pt-32 md:pb-20 overflow-hidden relative">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]" aria-hidden="true"></div>
      <div class="container mx-auto px-4 relative">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="text-center md:text-left space-y-2">
            <h1 class="text-3xl sm:text-4xl font-display font-bold text-foreground">{{ displayName }}</h1>
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span v-if="authStore.user?.username" class="font-medium">@{{ authStore.user.username }}</span>
              <span v-if="authStore.user?.email" class="break-all">{{ authStore.user.email }}</span>
            </div>
            <div v-if="isEmailVerified === false && authStore.user?.email" class="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
              <UiBadge variant="warning">Email Not Verified</UiBadge>
              <UiButton
                variant="outline"
                size="sm"
                class="rounded-full text-xs font-bold"
                :disabled="loadingResend"
                @click="resendEmail"
              >
                {{ loadingResend ? 'Sending...' : 'Resend Verification Email' }}
              </UiButton>
            </div>
          </div>

          <div class="flex items-center justify-center md:justify-end shrink-0">
            <UiButton variant="outline" class="rounded-full" @click="handleLogout">
              <LogOut class="w-4 h-4 mr-2" aria-hidden="true" /> Logout
            </UiButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Content Area -->
    <div class="container mx-auto px-4 -mt-8 relative z-10">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Sidebar Navigation -->
        <aside class="lg:w-80 shrink-0">
          <div class="bg-card border border-border rounded-[2.5rem] overflow-hidden p-3 sticky top-24 shadow-sm">
            <nav class="space-y-1" aria-label="Account navigation">
              <NuxtLink
                to="/my-account/"
                exact-active-class="bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <User class="w-4 h-4 shrink-0" aria-hidden="true" /> Profile Settings <ChevronRight class="w-4 h-4 ml-auto opacity-40" aria-hidden="true" />
              </NuxtLink>
              <NuxtLink
                to="/my-account/orders/"
                active-class="bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Package class="w-4 h-4 shrink-0" aria-hidden="true" /> Order History <ChevronRight class="w-4 h-4 ml-auto opacity-40" aria-hidden="true" />
              </NuxtLink>
              <NuxtLink
                to="/my-account/addresses/"
                active-class="bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <MapPin class="w-4 h-4 shrink-0" aria-hidden="true" /> Saved Addresses <ChevronRight class="w-4 h-4 ml-auto opacity-40" aria-hidden="true" />
              </NuxtLink>
              <NuxtLink
                to="/my-account/security/"
                active-class="bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <ShieldCheck class="w-4 h-4 shrink-0" aria-hidden="true" /> Security <ChevronRight class="w-4 h-4 ml-auto opacity-40" aria-hidden="true" />
              </NuxtLink>
            </nav>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-grow min-w-0">
          <NuxtPage />
        </main>
      </div>
    </div>
  </div>
</template>
