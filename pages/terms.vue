<!-- File: /pages/terms.vue -->
<script setup lang="ts">
import { Scale, Gavel, TriangleAlert, CreditCard, RefreshCw, Truck, ChevronRight, FileCheck } from 'lucide-vue-next';

const lastUpdated = 'May 18, 2026';

const sections = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    icon: Scale,
    content: 'By accessing or using the Best Computer Hub platforms, you agree to be bound by these Terms of Service. If you are using our services on behalf of an organization, you agree to these terms for that organization and represent that you have the authority to bind that organization to these terms.'
  },
  {
    id: 'accounts',
    title: 'User Accounts',
    icon: FileCheck,
    content: 'Users must provide accurate, complete, and current information when creating an account. You are responsible for safeguarding the password and for any activities or actions under your account. Best Computer Hub reserves the right to suspend accounts engaged in suspicious or fraudulent activity without prior notice.'
  },
  {
    id: 'payments',
    title: 'Pricing & Payments',
    icon: CreditCard,
    content: 'Hardware prices are subject to global market volatility and may change without notice. All payments are processed securely; however, we reserve the right to cancel orders if we detect fraudulent activity or unauthorized payment methods.'
  },
  {
    id: 'shipping',
    title: 'Shipping & Logistics',
    icon: Truck,
    content: 'We utilize a distributed logistics network for hardware fulfillment. While we aim for rapid delivery, shipping dates are estimates. High-performance components may require specialized handling and may be subject to regional compliance checks.'
  },
  {
    id: 'returns',
    title: 'Returns & Warranties',
    icon: RefreshCw,
    content: 'Hardware manufacturers provide the primary warranties. Best Computer Hub offers a 14-day technical assessment window for DOA (Dead on Arrival) hardware components. Custom-configured hardware systems and opened semiconductor components may have restricted return eligibility.'
  }
];
</script>

<template>
  <div class="min-h-screen pb-24">
    <!-- Header -->
    <section class="bg-black text-white pt-32 pb-20 border-b border-white/10 relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div class="container mx-auto px-4 relative">
        <div class="max-w-3xl space-y-4">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/20">
            <Gavel class="w-3 h-3" /> Legal Framework
          </div>
          <h1 class="text-4xl md:text-7xl font-display font-extrabold tracking-tight">
            Terms of <span class="italic text-primary">Service</span>
          </h1>
          <p class="text-lg text-white/50 max-w-xl">
            Governing the procurement, distribution, and utilization of enterprise-grade hardware and components.
          </p>
          <div class="pt-4 flex items-center gap-4 text-xs font-bold text-white/30 uppercase tracking-widest">
            <span>Last Amended: {{ lastUpdated }}</span>
            <span class="w-1 h-1 bg-white/20 rounded-full"></span>
            <span>Ref: TC-2026-X1</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Content -->
    <section class="container mx-auto px-4 py-20">
      <div class="flex flex-col lg:flex-row gap-20">
        <!-- Sidebar Jump Links -->
        <aside class="lg:w-64 shrink-0">
          <div class="sticky top-24 space-y-6">
            <p class="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Legal Sections</p>
            <nav class="space-y-1">
              <a 
                v-for="section in sections" 
                :key="section.id"
                :href="`#${section.id}`"
                class="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-all text-sm font-medium group"
              >
                <ChevronRight class="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 -ml-2 transition-all" />
                {{ section.title }}
              </a>
            </nav>
            
            <div class="p-6 bg-amber-500/5 rounded-[2rem] border border-amber-500/10 space-y-4">
              <div class="flex items-center gap-2 text-amber-600">
                <TriangleAlert class="w-4 h-4" />
                <p class="text-xs font-bold uppercase tracking-tight">Critical Note</p>
              </div>
              <p class="text-xs text-muted-foreground leading-relaxed">Violating these terms may result in immediate suspension of enterprise procurement privileges.</p>
            </div>
          </div>
        </aside>

        <!-- Main Text -->
        <article class="flex-grow max-w-3xl space-y-20">
          <div v-for="section in sections" :key="section.id" :id="section.id" class="space-y-6 scroll-mt-32">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <component :is="section.icon" class="w-6 h-6 text-muted-foreground" />
              </div>
              <h2 class="text-3xl font-display font-bold">{{ section.title }}</h2>
            </div>
            
            <div class="prose prose-slate max-w-none text-muted-foreground leading-relaxed">
              <p class="text-lg">{{ section.content }}</p>
            </div>
          </div>

          <!-- Limitation of Liability -->
          <div class="p-10 bg-muted/30 rounded-[3rem] border border-dashed space-y-6">
             <h2 class="text-3xl font-display font-bold">Limitation of Liability</h2>
             <p class="text-muted-foreground leading-relaxed italic">
              "To the maximum extent permitted by law, Best Computer Hub shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues (including server downtime or data loss) whether incurred directly or indirectly."
             </p>
          </div>

          <!-- Dispute Resolution -->
          <div class="space-y-6 border-t pt-16">
            <h2 class="text-3xl font-display font-bold">Governing Law</h2>
            <p class="text-muted-foreground leading-relaxed">
              These terms are governed by the laws of our primary jurisdiction. Any disputes arising from hardware procurement shall be settled via binding arbitration in accordance with modern commercial legal frameworks.
            </p>
          </div>
        </article>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="container mx-auto px-4 py-20 mt-20 border-t">
       <div class="bg-black text-white p-12 rounded-[3.5rem] text-center space-y-8 relative overflow-hidden">
         <div class="absolute inset-0 bg-[linear-gradient(45deg,rgba(59,130,246,0.1),transparent)]"></div>
         <div class="relative z-10 space-y-4">
            <h3 class="text-3xl font-display font-bold">Ready to proceed?</h3>
            <p class="text-white/60 max-w-md mx-auto">By continuing to use our catalog and placing orders, you signify your agreement to these enterprise terms.</p>
            <div class="flex flex-wrap items-center justify-center gap-4 pt-4">
               <UiButton to="/category" class="rounded-full px-10 h-14 font-extrabold shadow-xl shadow-primary/20">
                 Explore Catalog
               </UiButton>
               <UiButton to="/privacy" variant="outline" class="rounded-full px-10 h-14 font-extrabold text-white border-white/20 hover:bg-white/10">
                 Privacy Policy
               </UiButton>
            </div>
         </div>
       </div>
    </section>
  </div>
</template>

<style scoped>
html {
  scroll-behavior: smooth;
}
</style>
