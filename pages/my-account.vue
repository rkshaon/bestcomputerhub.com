<script setup lang="ts">
import { 
  User, 
  Package, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ShieldCheck,
  Clock,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useEmailVerification } from '@/composables/useEmailVerification';
import { cn } from '@/utils';

useSeoMeta({
  title: 'My Account',
  description: 'Manage your profile, track orders, and update security settings at Best Computer Hub.'
});

const authStore = useAuthStore();
const { emailVerified, loadingResend, fetchStatus, resendEmail } = useEmailVerification();

onMounted(fetchStatus);

const handleLogout = async () => {
  const route = useRoute();
  await authStore.logout(route.fullPath);
};
</script>

<template>
  <div class="min-h-screen pb-20 bg-background">
    <!-- Account Header -->
    <section class="bg-background text-card-foreground pt-32 pb-20 overflow-hidden relative">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div class="container mx-auto px-4 relative">
        <div class="flex flex-col md:flex-row items-center gap-8">
          <div class="relative">
            <div class="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-border ring-4 ring-primary/20">
              <img :src="authStore.user?.avatar" :alt="authStore.user?.name" class="w-full h-full object-cover" />
            </div>
            <button class="absolute -bottom-2 -right-2 bg-primary text-white p-2.5 rounded-2xl shadow-xl hover:scale-110 transition-transform" title="Account settings" aria-label="Account settings">
              <Settings class="w-4 h-4" />
            </button>
          </div>
          
          <div class="text-center md:text-left space-y-2">
            <h1 class="text-4xl md:text-5xl font-display font-bold">{{ authStore.user?.name }}</h1>
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <span class="text-muted-foreground text-sm font-medium flex items-center gap-1.5">
                <Clock class="w-4 h-4" /> Member since {{ authStore.user?.joinedAt ? new Date(authStore.user.joinedAt).getFullYear() : '2023' }}
              </span>
              <span class="px-3 py-1 bg-muted rounded-full text-[10px] font-bold uppercase tracking-widest text-primary border border-border">
                Enterprise Member
              </span>
            </div>
          </div>

          <div v-if="emailVerified === false" class="flex items-center justify-center md:justify-start gap-2 pt-2">
            <UiBadge variant="warning">Email Not Verified</UiBadge>
            <UiButton variant="outline" size="sm" class="rounded-full text-xs font-bold" :disabled="loadingResend" @click="resendEmail">
              {{ loadingResend ? 'Sending...' : 'Resend Verification Email' }}
            </UiButton>
          </div>

          <div class="md:ml-auto flex items-center gap-4">
            <UiButton variant="outline" class="rounded-full" @click="handleLogout">
              <LogOut class="w-4 h-4 mr-2" /> Logout
            </UiButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Content Area -->
    <div class="container mx-auto px-4 -mt-10 relative z-10">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Sidebar Navigation -->
        <aside class="lg:w-80 shrink-0">
          <div class="bg-card border rounded-[2.5rem] overflow-hidden p-3 sticky top-24 shadow-sm">
            <nav class="space-y-1">
              <NuxtLink 
                to="/my-account/orders/"
                active-class="bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Package class="w-4 h-4" /> Order History <ChevronRight class="w-4 h-4 ml-auto opacity-40" />
              </NuxtLink>
              <NuxtLink 
                to="/my-account/"
                exact-active-class="bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <User class="w-4 h-4" /> Profile Settings <ChevronRight class="w-4 h-4 ml-auto opacity-40" />
              </NuxtLink>
              <NuxtLink 
                to="/my-account/security/"
                active-class="bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <ShieldCheck class="w-4 h-4" /> Security <ChevronRight class="w-4 h-4 ml-auto opacity-40" />
              </NuxtLink>
            </nav>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-grow">
          <NuxtPage />
        </main>
      </div>
    </div>
  </div>
</template>
