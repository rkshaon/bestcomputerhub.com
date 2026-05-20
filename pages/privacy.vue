<script setup lang="ts">
import { Shield, Lock, Eye, FileText, Globe, Server, Bell, ChevronRight } from 'lucide-vue-next';

const lastUpdated = 'May 18, 2026';

const sections = [
  {
    id: 'data-collection',
    title: 'Data Collection',
    icon: Eye,
    content: `We collect information that you provide directly to us when you create an account, make a purchase, or communicate with our enterprise support teams. This includes identifiers like your name, email address, physical address, and payment information processed through our secure enterprise partners.`
  },
  {
    id: 'usage',
    title: 'Usage of Information',
    icon: FileText,
    content: `Your data powers your enterprise experience. We use collected information to process transactions, provide technical support for high-performance hardware, and optimize our inventory based on regional demand patterns. We do not sell your personal data to third parties.`
  },
  {
    id: 'security',
    title: 'Security Protocols',
    icon: Lock,
    iconColor: 'text-primary',
    content: `We implement industry-standard encryption and security protocols (TLS/SSL) for all data transmissions. Our internal systems are audited regularly to ensure compliance with global data protection standards, ensuring your hardware sourcing data remains confidential.`
  },
  {
    id: 'infrastructure',
    title: 'Global Infrastructure',
    icon: Server,
    content: `Data may be processed on servers located in various global regions to ensure low-latency access and high availability. By using our platforms, you consent to the processing and transfer of information across our secure distributed network.`
  }
];
</script>

<template>
  <div class="min-h-screen pb-24">
    <!-- Header -->
    <section class="bg-black text-white pt-32 pb-20 border-b border-white/10">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl space-y-4">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/20">
            <Shield class="w-3 h-3" /> Compliance & Trust
          </div>
          <h1 class="text-4xl md:text-7xl font-display font-extrabold tracking-tight">
            Privacy <span class="italic text-primary">Policy</span>
          </h1>
          <p class="text-lg text-white/50 max-w-xl">
            Transparency is the foundation of our enterprise relationship. Learn how we protect your hardware procurement data.
          </p>
          <div class="pt-4 flex items-center gap-4 text-xs font-bold text-white/30 uppercase tracking-widest">
            <span>Effective Date: {{ lastUpdated }}</span>
            <span class="w-1 h-1 bg-white/20 rounded-full"></span>
            <span>Version 2.4.0</span>
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
            <p class="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Quick Navigation</p>
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
            
            <div class="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-4">
              <p class="text-xs font-bold uppercase tracking-tight text-primary">Need Clarification?</p>
              <p class="text-xs text-muted-foreground leading-relaxed">Our data protection officer is available for enterprise inquiries at privacy@techcore.io</p>
              <UiButton variant="outline" size="sm" class="w-full rounded-full text-[10px] font-bold uppercase border-primary/20">
                Contact Data Office
              </UiButton>
            </div>
          </div>
        </aside>

        <!-- Main Text -->
        <article class="flex-grow max-w-3xl space-y-16">
          <div v-for="section in sections" :key="section.id" :id="section.id" class="space-y-6 scroll-mt-32">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <component :is="section.icon" class="w-6 h-6" :class="section.iconColor || 'text-muted-foreground'" />
              </div>
              <h2 class="text-3xl font-display font-bold">{{ section.title }}</h2>
            </div>
            
            <div class="prose prose-slate max-w-none text-muted-foreground leading-relaxed">
              <p class="text-lg">{{ section.content }}</p>
              <p v-if="section.id === 'data-collection'">
                We automatically collect certain technical information when you access our high-performance computing clusters and marketplace, including your IP address, browser type, and interaction data. This helps us maintain security and reliability across our global edge network.
              </p>
            </div>
          </div>

          <!-- Cookies Section -->
          <div class="p-10 bg-muted/30 rounded-[3rem] border space-y-6">
             <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center">
                <Globe class="w-6 h-6" />
              </div>
              <h2 class="text-3xl font-display font-bold">Cookies & Tracking</h2>
            </div>
            <p class="text-muted-foreground leading-relaxed">
              We use essential cookies to maintain your session and security context. Optional analytics cookies may be used with your consent to improve our distribution logistics and procurement interfaces. You can manage your preferences at any time via your browser settings.
            </p>
          </div>

          <!-- Updates Section -->
          <div class="space-y-6 border-t pt-16">
            <h2 class="text-3xl font-display font-bold flex items-center gap-4">
              <Bell class="w-7 h-7 text-primary" /> Changes to this Policy
            </h2>
            <p class="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy to reflect changes in our enterprise offerings or regulatory requirements. We will notify you of any significant modifications by posting a clear notice on our digital interfaces or via your registered enterprise email.
            </p>
          </div>
        </article>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="container mx-auto px-4 py-20 mt-20 border-t">
       <div class="bg-black text-white p-12 rounded-[3.5rem] text-center space-y-8 relative overflow-hidden">
         <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_70%)]"></div>
         <div class="relative z-10 space-y-4">
            <h3 class="text-3xl font-display font-bold">Trust built on transparency.</h3>
            <p class="text-white/60 max-w-md mx-auto">Still have questions about how we handle your enterprise hardware requirements?</p>
            <div class="flex flex-wrap items-center justify-center gap-4 pt-4">
               <UiButton class="rounded-full px-10 h-14 font-extrabold shadow-xl shadow-primary/20">
                 Read Our Terms
               </UiButton>
               <UiButton variant="outline" class="rounded-full px-10 h-14 font-extrabold text-white border-white/20 hover:bg-white/10">
                 Enterprise Support
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
