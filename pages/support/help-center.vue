<script setup lang="ts">
import { HelpCircle, Search, MessageSquare, Phone, Mail, ChevronRight } from 'lucide-vue-next';

const faqs = [
  {
    category: 'Ordering',
    questions: [
      { q: 'How do I track my order?', a: 'Once your order ships, you will receive an email with a tracking link. You can also view it in your Account Dashboard.' },
      { q: 'Can I change my shipping address?', a: 'Contact our procurement support team within 2 hours of placing your order to request an address change.' }
    ]
  },
  {
    category: 'Technical Support',
    questions: [
      { q: 'Where can I find drivers for my hardware?', a: 'Drivers are available on the specific product page under the "Downloads" section or our unified driver portal.' },
      { q: 'How do I request a compatibility check?', a: 'Our engineers offer free pre-purchase compatibility audits for enterprise systems. Open a ticket with your specs.' }
    ]
  }
];
</script>

<template>
  <div class="min-h-screen pt-32 pb-20">
    <div class="container mx-auto px-4 max-w-4xl">
      <!-- Header -->
      <div class="space-y-6 text-center mb-16">
        <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <HelpCircle class="w-8 h-8 text-primary" />
        </div>
        <h1 class="text-4xl md:text-5xl font-display font-bold tracking-tight">Help <span class="text-primary italic">Center</span></h1>
        <p class="text-lg text-muted-foreground">Self-service resources and direct support for enterprise hardware procurement.</p>
        
        <div class="max-w-2xl mx-auto relative group mt-8">
          <Search class="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search FAQs, tutorials, and documentation..." 
            class="w-full h-16 bg-muted/50 border rounded-full pl-16 pr-8 text-lg focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
      </div>

      <!-- Support Channels -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        <div v-for="channel in [
          { icon: MessageSquare, title: 'Live Chat', desc: 'Average response: 2 mins', action: 'Start Chat' },
          { icon: Phone, title: 'Global Hotline', desc: '24/7 Enterprise support', action: 'Call Now' },
          { icon: Mail, title: 'Email Tickets', desc: 'Average response: 4 hours', action: 'Open Ticket' }
        ]" :key="channel.title" class="p-8 bg-card border rounded-[2.5rem] text-center space-y-4 hover:border-primary/50 transition-colors group">
          <div class="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto group-hover:bg-primary/10 transition-colors">
            <component :is="channel.icon" class="w-6 h-6 text-primary" />
          </div>
          <h3 class="font-bold text-lg">{{ channel.title }}</h3>
          <p class="text-xs text-muted-foreground">{{ channel.desc }}</p>
          <UiButton variant="outline" size="sm" class="rounded-full w-full font-bold">{{ channel.action }}</UiButton>
        </div>
      </div>

      <!-- FAQs -->
      <div class="space-y-12">
        <h2 class="text-3xl font-display font-bold text-center">Frequently Asked <span class="text-primary">Questions</span></h2>
        
        <div class="space-y-10">
          <div v-for="cat in faqs" :key="cat.category" class="space-y-6">
            <h3 class="text-sm font-bold uppercase tracking-[0.2em] text-primary border-b pb-4">{{ cat.category }}</h3>
            <div class="grid gap-6">
              <div v-for="item in cat.questions" :key="item.q" class="bg-muted/30 p-8 rounded-3xl space-y-2 border border-transparent hover:border-muted-foreground/10 transition-all">
                <h4 class="font-bold text-lg flex items-center justify-between">
                  {{ item.q }}
                  <ChevronRight class="w-4 h-4 text-muted-foreground" />
                </h4>
                <p class="text-muted-foreground leading-relaxed">{{ item.a }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer CTA -->
      <div class="mt-20 p-12 bg-primary text-primary-foreground rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
        <div class="space-y-2">
          <h3 class="text-2xl font-display font-bold">Still need technical assistance?</h3>
          <p class="opacity-80">Our specialized hardware engineers are ready to help with complex deployments.</p>
        </div>
        <UiButton variant="secondary" class="rounded-full font-bold px-10 h-14 text-primary">Contact Engineering</UiButton>
      </div>
    </div>
  </div>
</template>
