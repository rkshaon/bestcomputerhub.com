<!-- File: /pages/cookies.vue -->
<script setup lang="ts">
import { Cookie, ShieldCheck, PieChart, Target, Zap, ChevronRight, Info, Save } from 'lucide-vue-next';
import { useCookieStore } from '@/stores/cookies';
import { cn } from '@/utils';

const cookieStore = useCookieStore();

const tempPrefs = ref({
  analytical: cookieStore.preferences.analytical,
  marketing: cookieStore.preferences.marketing,
  performance: cookieStore.preferences.performance
});

const isSaved = ref(false);

const handleSave = () => {
  cookieStore.savePreferences({
    analytical: tempPrefs.value.analytical,
    marketing: tempPrefs.value.marketing,
    performance: tempPrefs.value.performance
  });
  isSaved.value = true;
  setTimeout(() => isSaved.value = false, 3000);
};

const cookieCategories = [
  {
    id: 'essential',
    title: 'Essential Cookies',
    description: 'Necessary for the website to function. They allow for essential features like secure login, cart management, and load balancing. These cannot be disabled.',
    icon: ShieldCheck,
    required: true,
    value: true
  },
  {
    id: 'performance',
    title: 'Performance & Functionality',
    description: 'Allows us to remember your preferences (like language or region) and provide enhanced features. Without these, some parts of the site may not function correctly.',
    icon: Zap,
    required: false,
    model: 'performance'
  },
  {
    id: 'analytical',
    title: 'Analytical & Statistics',
    description: 'Helps us understand how visitors interact with our catalog, which pages are most popular, and where we can improve the platform experience.',
    icon: PieChart,
    required: false,
    model: 'analytical'
  },
  {
    id: 'marketing',
    title: 'Marketing & Targeting',
    description: 'Used to deliver highly relevant hardware recommendations and advertisements based on your procurement interests and browsing patterns.',
    icon: Target,
    required: false,
    model: 'marketing'
  }
];
</script>

<template>
  <div class="min-h-screen pb-24">
    <!-- Header -->
    <section class="bg-black text-white pt-32 pb-20 border-b border-white/10 relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div class="container mx-auto px-4 relative">
        <div class="max-w-3xl space-y-4">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/20">
            <Cookie class="w-3 h-3" /> Preference Management
          </div>
          <h1 class="text-4xl md:text-7xl font-display font-extrabold tracking-tight">
            Cookie <span class="italic text-primary">Settings</span>
          </h1>
          <p class="text-lg text-white/50 max-w-xl">
            Customize your digital footprint. Our enterprise platform uses cookies to optimize your hardware sourcing journey.
          </p>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="container mx-auto px-4 py-20">
      <div class="max-w-4xl mx-auto space-y-12">
        <div class="grid grid-cols-1 gap-6">
          <div 
            v-for="category in cookieCategories" 
            :key="category.id"
            class="group bg-card border rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-8 transition-all hover:border-primary/20"
          >
            <div class="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
              <component :is="category.icon" class="w-8 h-8 text-muted-foreground" />
            </div>
            
            <div class="flex-grow space-y-2">
              <div class="flex items-center gap-3">
                <h3 class="text-2xl font-display font-bold">{{ category.title }}</h3>
                <span v-if="category.required" class="px-2 py-0.5 bg-muted text-[10px] uppercase font-bold tracking-widest rounded-full opacity-60">Required</span>
              </div>
              <p class="text-muted-foreground leading-relaxed">{{ category.description }}</p>
            </div>

            <div class="shrink-0 flex items-center gap-4">
              <div v-if="category.required" class="w-14 h-8 bg-primary rounded-full flex items-center justify-end px-1 opacity-50 cursor-not-allowed">
                <div class="w-6 h-6 bg-white rounded-full"></div>
              </div>
              <button 
                v-else
                @click="tempPrefs[category.model as keyof typeof tempPrefs] = !tempPrefs[category.model as keyof typeof tempPrefs]"
                :class="cn(
                  'w-14 h-8 rounded-full flex items-center transition-all duration-300 px-1',
                  tempPrefs[category.model as keyof typeof tempPrefs] ? 'bg-primary justify-end' : 'bg-muted justify-start'
                )"
              >
                <div class="w-6 h-6 bg-white rounded-full shadow-sm"></div>
              </button>
            </div>
          </div>
        </div>

        <!-- Action Bar -->
        <div class="pt-10 border-t flex flex-col md:flex-row items-center justify-between gap-8">
           <div class="flex items-center gap-3 text-muted-foreground">
             <div class="p-2 bg-muted rounded-full">
               <Info class="w-4 h-4" />
             </div>
             <p class="text-xs font-medium">Changes take effect immediately and are stored for 12 months.</p>
           </div>
           
           <div class="flex items-center gap-4 w-full md:w-auto">
             <UiButton 
               variant="outline" 
               class="flex-grow md:flex-grow-0 rounded-full h-14 px-10 font-bold"
               @click="tempPrefs = { analytical: false, marketing: false, performance: false }"
             >
                Reset
             </UiButton>
             <UiButton 
                class="flex-grow md:flex-grow-0 rounded-full h-14 px-12 font-extrabold shadow-lg shadow-primary/20 gap-2"
                @click="handleSave"
              >
                <template v-if="isSaved">
                  <ShieldCheck class="w-5 h-5" /> Saved Settings
                </template>
                <template v-else>
                  <Save class="w-5 h-5" /> Save Preferences
                </template>
             </UiButton>
           </div>
        </div>

        <!-- Footer Info -->
        <div class="p-12 bg-muted/30 rounded-[3.5rem] border border-dashed space-y-6 text-center">
           <h4 class="text-2xl font-display font-bold">Why do we use cookies?</h4>
           <p class="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
             To provide an enterprise-grade experience, we need to understand how our users interact with our global distribution network. Cookies allow us to optimize server loads, remember your regional catalog preferences, and ensure that our security protocols remain robust against modern threats.
           </p>
           <NuxtLink to="/privacy" class="text-primary font-bold inline-flex items-center gap-1 group">
             Read Full Privacy Policy <ChevronRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
           </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
button:disabled {
  cursor: not-allowed;
}
</style>
