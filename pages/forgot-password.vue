<!-- File: /pages/forgot-password.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-vue-next';
import { cn } from '@/utils';

const email = ref('');
const isLoading = ref(false);
const isSubmitted = ref(false);
const error = ref('');

const handleResetRequest = async () => {
  if (!email.value) {
    error.value = 'Please enter your email address';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    // Simulate API call to send reset link
    await new Promise(resolve => setTimeout(resolve, 2000));
    isSubmitted.value = true;
  } catch (err) {
    error.value = 'Could not process your request. Please try again.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen pt-20 pb-12 flex flex-col justify-center bg-muted/20 relative overflow-hidden">
    <!-- Grid Background Decoration -->
    <div class="absolute inset-0 z-0 opacity-20 pointer-events-none">
      <div class="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
    </div>

    <!-- Background Glows -->
    <div class="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

    <div class="container mx-auto px-4 relative z-10">
      <div class="max-w-md mx-auto">
        <!-- Logo/Brand Header -->
        <div class="text-center mb-8 space-y-2">
          <NuxtLink to="/" class="inline-flex items-center gap-2 group mb-4">
            <div class="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
              <ShieldCheck class="w-6 h-6" />
            </div>
          </NuxtLink>
          <h1 class="text-3xl font-display font-extrabold tracking-tight">Recovery Access</h1>
          <p class="text-muted-foreground text-sm">We'll help you regain access to your enterprise account</p>
        </div>

        <!-- Success State -->
        <div v-if="isSubmitted" class="bg-background/80 backdrop-blur-xl border border-border/50 rounded-[2.5rem] shadow-2xl p-10 text-center space-y-6 animate-in fade-in zoom-in-95">
          <div class="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 class="w-10 h-10" />
          </div>
          <div class="space-y-2">
            <h2 class="text-2xl font-display font-bold">Check your inbox</h2>
            <p class="text-muted-foreground text-sm">
              We've sent a recovery link to <span class="text-foreground font-bold">{{ email }}</span>. The link will expire in 1 hour.
            </p>
          </div>
          <div class="pt-4 border-t border-border/50">
            <p class="text-xs text-muted-foreground mb-4 font-medium italic">Didn't receive the email? Check your spam folder or enterprise filter.</p>
            <NuxtLink to="/login" class="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline">
              <ArrowLeft class="w-4 h-4" /> Return to Sign In
            </NuxtLink>
          </div>
        </div>

        <!-- Request Form Card -->
        <div v-else class="bg-background/80 backdrop-blur-xl border border-border/50 rounded-[2.5rem] shadow-2xl p-8 md:p-10">
          <form @submit.prevent="handleResetRequest" class="space-y-6">
            <!-- Error Message -->
            <div v-if="error" class="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold p-3 rounded-xl animate-in fade-in slide-in-from-top-2">
              {{ error }}
            </div>

            <!-- Email Field -->
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Work Email Address</label>
              <div class="relative group">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Mail class="w-4 h-4" />
                </div>
                <input 
                  v-model="email"
                  type="email" 
                  placeholder="name@enterprise.com"
                  class="w-full h-14 bg-muted/30 border border-border/50 rounded-2xl pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all font-medium"
                  required
                />
              </div>
            </div>

            <p class="text-xs text-muted-foreground ml-1 leading-relaxed">
              For security reasons, recovery links are only sent to verified enterprise email domains authorized by TechCore.
            </p>

            <!-- Reset Button -->
            <UiButton 
              type="submit"
              class="w-full h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/20 gap-2 overflow-hidden relative"
              :disabled="isLoading"
            >
              <div v-if="isLoading" class="flex items-center gap-2">
                <Loader2 class="w-5 h-5 animate-spin" /> Sending Link...
              </div>
              <div v-else class="flex items-center gap-2">
                Send Recovery Instructions <ArrowRight class="w-5 h-5" />
              </div>
            </UiButton>

            <div class="text-center pt-2">
              <NuxtLink to="/login" class="inline-flex items-center gap-2 text-muted-foreground font-bold text-sm hover:text-primary transition-colors">
                <ArrowLeft class="w-4 h-4" /> Back to Sign In
              </NuxtLink>
            </div>
          </form>
        </div>

        <!-- Help Link -->
        <p class="text-center mt-10 text-sm text-muted-foreground font-medium">
          Locked out? 
          <NuxtLink to="/support/contact" class="text-primary font-bold hover:underline">Contact security desk</NuxtLink>
        </p>

        <!-- Trust Badge -->
        <div class="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale contrast-125">
          <div class="font-display font-extrabold text-xl tracking-tighter">TRUST<span class="text-primary">CORE</span></div>
          <div class="h-4 w-px bg-muted-foreground"></div>
          <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">ISO 27001<br/>Certified</div>
        </div>
      </div>
    </div>
  </div>
</template>
