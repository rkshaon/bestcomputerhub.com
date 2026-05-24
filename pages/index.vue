<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
    <!-- Navigation Header -->
    <header class="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/85 backdrop-blur-md transition-all duration-300">
      <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/20 flex items-center justify-center font-display font-black text-slate-950 text-base">TC</div>
          <span class="font-display text-lg uppercase tracking-widest font-black text-white">TechCore</span>
        </div>
        
        <nav class="hidden md:flex items-center gap-8">
          <a href="#" class="text-sm font-medium text-slate-400 hover:text-cyan-400 transition">Products</a>
          <nuxt-link to="/admin/categories" class="text-sm font-medium text-slate-400 hover:text-cyan-400 transition">Admin Panel</nuxt-link>
          <a href="#" class="text-sm font-medium text-slate-400 hover:text-cyan-400 transition">Solutions</a>
          <a href="#" class="text-sm font-medium text-slate-400 hover:text-cyan-400 transition">Partners</a>
        </nav>

        <div class="flex items-center gap-4">
          <nuxt-link
            to="/admin/categories"
            class="rounded-full border border-cyan-500/30 bg-cyan-950/20 px-5 py-2 text-xs font-mono font-semibold tracking-wider text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950 hover:shadow-lg hover:shadow-cyan-500/20"
          >
            ADMIN GATEWAY
          </nuxt-link>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="relative overflow-hidden py-24 sm:py-32 border-b border-slate-900">
      <div class="absolute inset-0 bg-radial-gradient from-cyan-950/15 via-transparent to-transparent pointer-events-none"></div>
      
      <div class="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div class="flex flex-col gap-6">
          <div class="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-4 py-1.5 text-xs font-mono text-cyan-400 tracking-wider">
            <span class="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></span>
            ENTERPRISE PLATFORM V2.4
          </div>
          
          <h1 class="font-display text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none">
            Premium Hardware <br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-400">
              Supply Chains
            </span>
          </h1>
          
          <p class="text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg">
            Deploy scalable, enterprise-grade computing infrastructures with the world's leading semiconductor arrays, computing nodes, and dense network switches. 
          </p>

          <div class="mt-4 flex flex-wrap gap-4">
            <nuxt-link
              to="/admin/categories"
              class="rounded-full bg-cyan-500 px-8 py-4 text-xs uppercase tracking-widest font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 hover:shadow-cyan-400/35"
            >
              Explore Taxonomy
            </nuxt-link>
            <a
              href="#"
              class="rounded-full border border-slate-800 bg-slate-900/40 px-8 py-4 text-xs uppercase tracking-widest font-bold text-slate-300 transition hover:border-slate-700 hover:bg-slate-900"
            >
              Get Quotation
            </a>
          </div>
        </div>

        <div class="relative">
          <div class="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-tr from-cyan-500 to-indigo-500 opacity-20 blur-xl pointer-events-none"></div>
          <div class="relative rounded-[2.5rem] border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-md">
            <!-- Mock Hardware Stats -->
            <div class="flex flex-col gap-6">
              <div class="flex items-center justify-between border-b border-slate-850 pb-4">
                <span class="font-mono text-xs text-slate-500">SYSTEM ARCHITECTURE</span>
                <span class="font-mono text-xs text-emerald-400 flex items-center gap-1.5">
                  <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  OPERATIONAL
                </span>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="rounded-2xl border border-slate-850 bg-slate-950/50 p-4">
                  <p class="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Node Bandwidth</p>
                  <p class="font-display text-xl font-bold text-white mt-1">1.2 Tb/s</p>
                </div>
                <div class="rounded-2xl border border-slate-850 bg-slate-950/50 p-4">
                  <p class="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Cluster Efficiency</p>
                  <p class="font-display text-xl font-bold text-cyan-400 mt-1">99.982%</p>
                </div>
              </div>

              <div class="rounded-2xl border border-slate-850 bg-slate-950/50 p-4 flex flex-col gap-2">
                <div class="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>HBM3 DISPATCH BUFFER</span>
                  <span>78% LOAD</span>
                </div>
                <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full w-[78%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Partner / Brands Section (User's Target Component) -->
    <section class="py-16 bg-slate-950 border-b border-slate-900">
      <div class="max-w-7xl mx-auto px-6">
        <h2 class="font-display text-xs uppercase tracking-widest text-slate-500 text-center mb-8">
          Authorized Semiconductor Foundry Partners & Tech Brands
        </h2>

        <div v-if="isLoading" class="flex justify-center py-6">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-slate-850 border-t-cyan-500"></div>
        </div>

        <div v-else-if="brandsList.length === 0" class="text-center py-6 text-slate-500 text-xs font-mono">
          No foundries registered inside the cluster database.
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div
            v-for="brand in brandsList"
            :key="brand.id"
            class="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-900 bg-slate-900/20 hover:border-cyan-500/40 hover:bg-slate-900/40 transition-all duration-300"
          >
            <Cpu class="h-6 w-6 text-slate-600 mb-2 hover:text-cyan-400 transition" />
            <span class="text-xs font-semibold text-slate-300 hover:text-white transition tracking-wide text-center">
              {{ brand.name }}
            </span>
            <span class="text-[9px] font-mono text-slate-600 mt-1 uppercase">{{ brand.slug }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories Taxonomy Overview Section -->
    <section class="py-24 max-w-7xl mx-auto px-6">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span class="text-xs font-mono text-cyan-400 uppercase tracking-widest pl-1">CATALOG EXPLORER</span>
          <h2 class="font-display text-3xl font-black uppercase text-white mt-1">Enterprise Categories</h2>
        </div>
        <nuxt-link
          to="/admin/categories"
          class="text-xs font-mono text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition"
        >
          Manage Catalog Schema <ChevronRight class="h-3 w-3" />
        </nuxt-link>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="rounded-3xl border border-slate-900 bg-slate-900/20 p-8 hover:border-indigo-5050/30 transition-all">
          <Layers class="h-8 w-8 text-cyan-400 mb-4" />
          <h3 class="font-display text-lg font-bold text-white mb-2">Central Node Array</h3>
          <p class="text-xs text-slate-500 leading-relaxed">
            High performance microprocessors, chiplets, customized integrated circuits for hyperscale workloads.
          </p>
        </div>

        <div class="rounded-3xl border border-slate-900 bg-slate-900/20 p-8 hover:border-cyan-5050/30 transition-all">
          <Server class="h-8 w-8 text-indigo-400 mb-4" />
          <h3 class="font-display text-lg font-bold text-white mb-2">Network Switches</h3>
          <p class="text-xs text-slate-500 leading-relaxed">
            Spine-and-leaf switches, routing modules, and dense optics supporting high throughout connectivity.
          </p>
        </div>

        <div class="rounded-3xl border border-slate-900 bg-slate-900/20 p-8 hover:border-teal-5050/30 transition-all">
          <Database class="h-8 w-8 text-teal-400 mb-4" />
          <h3 class="font-display text-lg font-bold text-white mb-2">Accelerator Storage</h3>
          <p class="text-xs text-slate-500 leading-relaxed">
            Persistent solid state storage clusters, PCIe Gen 5 expanders, with massive input output limits.
          </p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-slate-900 py-12 bg-slate-950">
      <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <span class="text-xs font-mono text-slate-600">
          © 2026 TechCore Platforms Inc. All secure channels verified.
        </span>
        <div class="flex items-center gap-6">
          <a href="#" class="text-xs text-slate-600 hover:text-slate-400 transition font-mono">STATUS ONLINE</a>
          <a href="#" class="text-xs text-slate-600 hover:text-slate-400 transition font-mono font-medium">SECURITY COMPLIANT</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useBrandService } from '@/composables/useBrandService';
import { Cpu, ChevronRight, Layers, Server, Database } from 'lucide-vue-next';
import type { Brand } from '@/types';

const brandService = useBrandService();
const brandsList = ref<Brand[]>([]);
const isLoading = ref(true);

onMounted(async () => {
  try {
    isLoading.value = true;
    const registry = await brandService.getBrandsList();
    if (registry && registry.length > 0) {
      brandsList.value = registry.filter(b => b.is_active !== false);
    }
  } catch (error) {
    console.error('Core Protocol Exception: Failed to poll partner registry on home page slide render.', error);
  } finally {
    isLoading.value = false;
  }
});
</script>
