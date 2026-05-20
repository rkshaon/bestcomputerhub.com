<script setup lang="ts">
import { ref } from 'vue';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-vue-next';

const name = ref('');
const email = ref('');
const message = ref('');
const isSubmitted = ref(false);

const handleSubmit = () => {
  if (!name.value || !email.value || !message.value) return;
  isSubmitted.value = true;
};
</script>

<template>
  <div class="min-h-screen pb-24 bg-background text-foreground">
    <!-- Header banner -->
    <section class="bg-muted/30 border-b py-16">
      <div class="container mx-auto px-6">
        <div class="max-w-2xl space-y-4">
          <h1 class="text-4xl md:text-6xl font-display font-extrabold tracking-tight">
            Contact <span class="text-primary italic">Support</span>
          </h1>
          <p class="text-lg text-muted-foreground">
            Connect with our system engineers and global client teams for procurement assistance or configuration troubleshooting.
          </p>
        </div>
      </div>
    </section>

    <!-- Support Content -->
    <section class="container mx-auto px-6 py-16">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
        <!-- Details Column -->
        <div class="lg:col-span-5 space-y-8">
          <div class="space-y-4">
            <h2 class="text-2xl font-display font-bold">TechCore HQ</h2>
            <p class="text-muted-foreground leading-relaxed">
              Our engineering workshops and operations logistics depots process orders 24/7/365 to maintain constant silicon flows.
            </p>
          </div>

          <!-- Quick facts cards -->
          <div class="space-y-4">
            <div 
              v-for="item in [
                { icon: Mail, label: 'Technical Inquiries', val: 'systems@techcore.com' },
                { icon: Phone, label: 'Hotline Desk', val: '+1 (800) Silicon' },
                { icon: MapPin, label: 'Command Depot', val: '40 Silicon Valley Way, CA' }
              ]" 
              :key="item.label"
              class="flex items-start gap-4 p-5 bg-card border rounded-3xl"
            >
              <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/15">
                <component :is="item.icon" class="w-5 h-5" />
              </div>
              <div class="space-y-1">
                <p class="text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold">{{ item.label }}</p>
                <p class="text-sm font-semibold">{{ item.val }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Form Column -->
        <div class="lg:col-span-7 bg-card border rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden">
          <div v-if="isSubmitted" class="py-16 text-center space-y-6">
            <div class="w-16 h-16 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 class="w-8 h-8" />
            </div>
            <div class="space-y-2">
              <h3 class="text-2xl font-bold">Inquiry Broadcasted</h3>
              <p class="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Thank you. We have cataloged your inquiry in our tracking system. A silicon engineering representative will reply within 2 hours.
              </p>
            </div>
            <UiButton variant="outline" class="rounded-full" @click="isSubmitted = false">
              Send Another Inquiry
            </UiButton>
          </div>

          <form v-else @submit.prevent="handleSubmit" class="space-y-6">
            <h3 class="text-xl font-display font-bold">Interface Form</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground block">Representative Name</label>
                <input 
                  v-model="name"
                  type="text" 
                  placeholder="Alex Vance"
                  class="w-full h-12 px-4 bg-muted/20 border border-border/80 focus:border-primary/50 text-foreground text-sm font-medium rounded-xl outline-none transition-all"
                  required
                />
              </div>

              <div class="space-y-2">
                <label class="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground block">Email Coordinates</label>
                <input 
                  v-model="email"
                  type="email" 
                  placeholder="alex@company.com"
                  class="w-full h-12 px-4 bg-muted/20 border border-border/80 focus:border-primary/50 text-foreground text-sm font-medium rounded-xl outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground block">Inquiry Protocol</label>
              <textarea 
                v-model="message"
                rows="5"
                placeholder="Include system hardware requirement lists..."
                class="w-full p-4 bg-muted/20 border border-border/80 focus:border-primary/50 text-foreground text-sm font-medium rounded-xl outline-none transition-all resize-none"
                required
              ></textarea>
            </div>

            <UiButton type="submit" class="w-full h-14 rounded-full font-bold group">
              Transmit Ticket Protocol <Send class="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
            </UiButton>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>
