<!-- File: /pages/careers.vue -->
<script setup lang="ts">
import { Briefcase, MapPin, Clock, ArrowRight, Zap, Target, Rocket } from 'lucide-vue-next';

const openings = [
  { title: 'Senior FPGA Engineer', team: 'Hardware Logic', type: 'Full-time', location: 'Singapore / Remote', salary: '$160k - $220k' },
  { title: 'Global Supply Chain Director', team: 'Operations', type: 'Full-time', location: 'Zürich, Switzerland', salary: '$180k - $250k' },
  { title: 'Technical Product Manager', team: 'System Integration', type: 'Full-time', location: 'San Francisco, CA', salary: '$150k - $190k' },
  { title: 'Firmware Specialty Architect', team: 'Engineering', type: 'Contract', location: 'New York / Remote', salary: '$120 - $180 / hr' },
  { title: 'Procurement Specialist', team: 'Enterprise Sales', type: 'Full-time', location: 'London, UK', salary: '£65k - £85k' }
];

const perks = [
  { icon: Zap, title: 'Cutting-Edge Gear', desc: 'Work with unreleased hardware from our partners before anyone else.' },
  { icon: Target, title: 'Impact Driven', desc: 'Build the systems that allow researchers to solve real-world problems.' },
  { icon: Rocket, title: 'Growth Mindset', desc: 'Annual budget for certifications, research projects, and travel.' }
];
</script>

<template>
  <div class="min-h-screen pt-32 pb-20">
    <div class="container mx-auto px-4 max-w-6xl">
      <!-- Hero -->
      <div class="space-y-8 text-center mb-24">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
          <Briefcase class="w-3 h-3" /> Join the Team
        </div>
        <h1 class="text-5xl md:text-7xl font-display font-bold tracking-tight">Help us build the <span class="text-primary italic">Future</span> of IT.</h1>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto">We are searching for the brightest minds in hardware engineering, logistics, and system architecture.</p>
        <div class="flex items-center justify-center gap-4 pt-4">
          <UiButton class="rounded-full px-8 h-12 font-bold">View Openings</UiButton>
          <UiButton variant="outline" class="rounded-full px-8 h-12 font-bold">Our Culture</UiButton>
        </div>
      </div>

      <!-- Perks -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
        <div v-for="perk in perks" :key="perk.title" class="p-10 border rounded-[3rem] space-y-6 bg-muted/20 hover:bg-muted/40 transition-colors">
          <div class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <component :is="perk.icon" class="w-6 h-6 text-primary" />
          </div>
          <h3 class="text-xl font-bold">{{ perk.title }}</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">{{ perk.desc }}</p>
        </div>
      </div>

      <!-- Job Openings -->
      <div class="space-y-12">
        <div class="flex items-end justify-between border-b pb-8">
          <div class="space-y-2">
            <h2 class="text-4xl font-display font-bold">Current <span class="text-primary">Openings</span></h2>
            <p class="text-muted-foreground">Find your next challenge in our global network.</p>
          </div>
          <div class="hidden md:block">
            <span class="text-sm font-bold text-muted-foreground">{{ openings.length }} Positions Available</span>
          </div>
        </div>

        <div class="grid gap-4">
          <div v-for="job in openings" :key="job.title" class="group p-8 bg-card border rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 hover:border-primary/50 hover:shadow-xl transition-all">
            <div class="space-y-2">
              <h3 class="text-2xl font-bold group-hover:text-primary transition-colors">{{ job.title }}</h3>
              <div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span class="flex items-center gap-1.5"><Briefcase class="w-4 h-4" /> {{ job.team }}</span>
                <span class="flex items-center gap-1.5"><MapPin class="w-4 h-4" /> {{ job.location }}</span>
                <span class="flex items-center gap-1.5"><Clock class="w-4 h-4" /> {{ job.type }}</span>
              </div>
            </div>
            <div class="flex items-center gap-8 w-full md:w-auto">
              <div class="text-right hidden md:block">
                <p class="text-sm font-bold">{{ job.salary }}</p>
                <p class="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Est. Annual Base</p>
              </div>
              <UiButton variant="outline" class="rounded-full w-full md:w-auto font-bold h-12 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
                Apply Now <ArrowRight class="w-4 h-4 ml-2" />
              </UiButton>
            </div>
          </div>
        </div>
      </div>

      <!-- General Application -->
      <div class="mt-32 p-16 bg-black text-white rounded-[4rem] text-center space-y-8 relative overflow-hidden">
        <div class="relative z-10 space-y-4">
          <h2 class="text-4xl font-display font-bold">Don't see a <span class="text-primary">perfect match?</span></h2>
          <p class="text-gray-400 max-w-xl mx-auto">We are always looking for exceptional talent. If you have unique expertise in high-performance computing, let us know.</p>
          <UiButton class="rounded-full px-12 h-14 font-bold bg-primary hover:bg-primary/90 mt-4">Send General Application</UiButton>
        </div>
        <div class="absolute inset-0 bg-primary/5 blur-[100px]"></div>
      </div>
    </div>
  </div>
</template>
