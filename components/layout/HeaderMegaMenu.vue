<!-- File: /components/layout/HeaderMegaMenu.vue -->
<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { 
  ChevronRight, 
  Sparkles, 
  ArrowRight, 
  Grid, 
  Zap,
  Box,
  Layers,
  Cpu,
  Server
} from 'lucide-vue-next';
import type { Category } from '@/types';
import { useCategoryService } from '@/composables/useCategoryService';
import { cn } from '@/utils';

const props = defineProps<{
  category: Category;
  allCategories: Category[];
  isOpen?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'keepOpen'): void;
}>();

const categoryService = useCategoryService();

// State for active / hovered subcategory for nested flyouts
const activeSubCatId = ref<string | null>(null);
const activeFlyoutCatId = ref<string | null>(null);
const isFlyoutVisible = ref(false);

let flyoutTimeout: ReturnType<typeof setTimeout> | null = null;

// Helper to resolve subcategories recursively or via subCategories slug array
const getSubCategories = (cat?: Category | null): Category[] => {
  if (!cat) return [];
  if (cat.children && Array.isArray(cat.children) && cat.children.length) {
    return cat.children;
  }
  if (cat.subCategories && Array.isArray(cat.subCategories)) {
    return cat.subCategories
      .map(slug => props.allCategories.find(c => c.slug === slug || c.id === slug))
      .filter((c): c is Category => !!c);
  }
  return [];
};

// Root subcategories (Level 2)
const level2Categories = computed(() => getSubCategories(props.category));

// Set initial active Level 2 subcategory
if (level2Categories.value.length > 0 && level2Categories.value[0]) {
  activeSubCatId.value = level2Categories.value[0].id;
}

const handleSubCatHover = (subCat: Category) => {
  if (flyoutTimeout) clearTimeout(flyoutTimeout);
  activeSubCatId.value = subCat.id;
  
  const subSubItems = getSubCategories(subCat);
  if (subSubItems.length > 0) {
    activeFlyoutCatId.value = subCat.id;
    isFlyoutVisible.value = true;
  } else {
    activeFlyoutCatId.value = null;
    isFlyoutVisible.value = false;
  }
};

const handleSubCatLeave = () => {
  flyoutTimeout = setTimeout(() => {
    isFlyoutVisible.value = false;
    activeFlyoutCatId.value = null;
  }, 200);
};

const cancelFlyoutClose = () => {
  if (flyoutTimeout) clearTimeout(flyoutTimeout);
};

onUnmounted(() => {
  if (flyoutTimeout) clearTimeout(flyoutTimeout);
});
</script>

<template>
  <div 
    :class="cn(
      'absolute top-full left-0 right-0 w-full pt-2 z-50 transition-all duration-200 origin-top',
      isOpen ? 'block opacity-100 scale-100 pointer-events-auto' : 'hidden group-hover:block group-focus-within:block'
    )"
    @mouseenter="emit('keepOpen')"
    @mouseleave="emit('close')"
  >
    <!-- Pointer Hover Bridge to prevent gap flicker -->
    <div class="absolute -top-3 inset-x-0 h-3 pointer-events-auto"></div>

    <!-- Main Wide Mega Menu Panel -->
    <div 
      class="bg-card/98 backdrop-blur-2xl border border-border/80 shadow-2xl shadow-primary/5 rounded-b-2xl rounded-t-sm p-6 sm:p-8 w-full max-w-7xl mx-auto text-foreground relative overflow-visible"
    >
      <!-- Top Header Bar inside Mega Menu -->
      <div class="flex items-center justify-between pb-4 mb-6 border-b border-border/60">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            <Grid class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-extrabold font-display uppercase tracking-wider text-foreground flex items-center gap-2">
              {{ category.name }} Catalog
              <span v-if="level2Categories.length" class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 normal-case font-semibold">
                {{ level2Categories.length }} Series
              </span>
            </h3>
            <p class="text-xs text-muted-foreground line-clamp-1">
              {{ category.description || 'Explore enterprise grade hardware, components, and workstation computing nodes.' }}
            </p>
          </div>
        </div>

        <NuxtLink 
          :to="categoryService.getCategoryUrl(category, allCategories)"
          class="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors group/all shrink-0"
        >
          <span>View All {{ category.name }}</span>
          <ArrowRight class="w-3.5 h-3.5 transition-transform group-hover/all:translate-x-1" />
        </NuxtLink>
      </div>

      <!-- Main Body Layout: Multi-Column Distribution with Flyout Support -->
      <div class="grid grid-cols-12 gap-6 relative">

        <!-- Case 1: Multi-Column Catalog Presentation (When Level 2 categories exist) -->
        <template v-if="level2Categories.length > 0">
          
          <!-- Column Grid for Level 2 Groups -->
          <div 
            :class="cn(
              'grid gap-6 text-left relative',
              level2Categories.length >= 4 ? 'col-span-12 lg:col-span-9 grid-cols-1 sm:grid-cols-2 md:grid-cols-4' :
              level2Categories.length === 3 ? 'col-span-12 lg:col-span-9 grid-cols-1 sm:grid-cols-3' :
              'col-span-12 lg:col-span-8 grid-cols-1 sm:grid-cols-2'
            )"
          >
            <div 
              v-for="subCat in level2Categories" 
              :key="subCat.id"
              class="space-y-3 p-3.5 rounded-xl transition-all duration-150 border border-transparent hover:border-border/60 hover:bg-muted/40 relative group/sub"
              @mouseenter="handleSubCatHover(subCat)"
              @mouseleave="handleSubCatLeave"
            >
              <!-- Level 2 Group Header -->
              <div class="flex items-center justify-between pb-2 border-b border-border/50">
                <NuxtLink 
                  :to="categoryService.getCategoryUrl(subCat, allCategories)"
                  class="font-extrabold text-xs uppercase tracking-wider text-primary hover:text-primary/80 transition-colors block truncate"
                >
                  {{ subCat.name }}
                </NuxtLink>

                <!-- Indicator if Level 3 children exist for nested flyout -->
                <ChevronRight 
                  v-if="getSubCategories(subCat).length > 0"
                  class="w-3.5 h-3.5 text-muted-foreground group-hover/sub:text-primary group-hover/sub:translate-x-0.5 transition-all shrink-0"
                />
              </div>

              <!-- Level 3 Child Links List -->
              <ul class="space-y-1.5">
                <template v-if="getSubCategories(subCat).length > 0">
                  <li 
                    v-for="childCat in getSubCategories(subCat)" 
                    :key="childCat.id"
                  >
                    <NuxtLink 
                      :to="categoryService.getCategoryUrl(childCat, allCategories)"
                      class="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors flex items-center justify-between group/link py-0.5"
                    >
                      <span class="truncate group-hover/link:translate-x-1 transition-transform">
                        {{ childCat.name }}
                      </span>
                    </NuxtLink>
                  </li>
                </template>

                <!-- Fallback child shortcuts if Level 3 array empty -->
                <template v-else>
                  <li>
                    <NuxtLink 
                      :to="categoryService.getCategoryUrl(subCat, allCategories)"
                      class="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors block group/link py-0.5"
                    >
                      <span class="group-hover/link:translate-x-1 transition-transform inline-block">
                        Workstation & Desktop Models
                      </span>
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink 
                      :to="categoryService.getCategoryUrl(subCat, allCategories)"
                      class="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors block group/link py-0.5"
                    >
                      <span class="group-hover/link:translate-x-1 transition-transform inline-block">
                        Enterprise Solutions
                      </span>
                    </NuxtLink>
                  </li>
                </template>
              </ul>

              <!-- NESTED FLYOUT SUBMENU PANEL (Appears adjacent to hovered subCat if Level 3 children exist) -->
              <div 
                v-if="activeFlyoutCatId === subCat.id && isFlyoutVisible && getSubCategories(subCat).length > 0"
                class="absolute left-full top-0 ml-3 w-64 bg-card/98 backdrop-blur-2xl border border-border shadow-2xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-left-2 duration-150"
                @mouseenter="cancelFlyoutClose"
                @mouseleave="handleSubCatLeave"
              >
                <!-- Pointer bridge to flyout -->
                <div class="absolute -left-3 inset-y-0 w-3 pointer-events-auto"></div>

                <div class="flex items-center gap-2 pb-2 mb-3 border-b border-border/60">
                  <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span class="text-xs font-bold uppercase tracking-wider text-foreground">
                    {{ subCat.name }} Series
                  </span>
                </div>

                <div class="space-y-2">
                  <NuxtLink 
                    v-for="child in getSubCategories(subCat)" 
                    :key="child.id"
                    :to="categoryService.getCategoryUrl(child, allCategories)"
                    class="block p-2 rounded-lg hover:bg-accent text-xs font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    <div class="flex items-center justify-between">
                      <span>{{ child.name }}</span>
                      <ChevronRight class="w-3 h-3 text-muted-foreground" />
                    </div>
                    <p v-if="child.description" class="text-[10px] font-normal text-muted-foreground line-clamp-1 mt-0.5">
                      {{ child.description }}
                    </p>
                  </NuxtLink>

                  <div class="pt-2 mt-2 border-t border-border/40 text-center">
                    <NuxtLink 
                      :to="categoryService.getCategoryUrl(subCat, allCategories)"
                      class="text-[11px] font-bold text-primary hover:underline block"
                    >
                      Explore All {{ subCat.name }} →
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Feature Spotlight Column (Right Pane) -->
          <div class="col-span-12 lg:col-span-3 flex flex-col justify-between bg-muted/30 border border-border/60 rounded-2xl p-5">
            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <Sparkles class="w-4 h-4 text-primary" />
                <span class="text-xs font-bold uppercase tracking-wider text-foreground">
                  Enterprise Spotlight
                </span>
              </div>

              <div class="space-y-2">
                <p class="text-xs text-muted-foreground leading-relaxed">
                  Verified hardware configurations tested for 24/7 continuous operation and high-concurrency enterprise workloads.
                </p>
              </div>

              <!-- Quick Brand Badges -->
              <div class="space-y-2 pt-2">
                <span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                  Top Certified Partners
                </span>
                <div class="flex flex-wrap gap-1.5">
                  <NuxtLink 
                    to="/products?search=NVIDIA" 
                    class="px-2.5 py-1 rounded-md bg-background border border-border text-[11px] font-bold text-foreground hover:text-primary hover:border-primary/40 transition-colors"
                  >
                    NVIDIA
                  </NuxtLink>
                  <NuxtLink 
                    to="/products?search=AMD" 
                    class="px-2.5 py-1 rounded-md bg-background border border-border text-[11px] font-bold text-foreground hover:text-primary hover:border-primary/40 transition-colors"
                  >
                    AMD
                  </NuxtLink>
                  <NuxtLink 
                    to="/products?search=Intel" 
                    class="px-2.5 py-1 rounded-md bg-background border border-border text-[11px] font-bold text-foreground hover:text-primary hover:border-primary/40 transition-colors"
                  >
                    Intel
                  </NuxtLink>
                  <NuxtLink 
                    to="/products?search=Supermicro" 
                    class="px-2.5 py-1 rounded-md bg-background border border-border text-[11px] font-bold text-foreground hover:text-primary hover:border-primary/40 transition-colors"
                  >
                    Supermicro
                  </NuxtLink>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-border/40 mt-4">
              <NuxtLink 
                :to="categoryService.getCategoryUrl(category, allCategories)"
                class="w-full py-2.5 px-3 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-bold transition-all text-center flex items-center justify-center gap-2"
              >
                <Zap class="w-3.5 h-3.5" />
                <span>Filter {{ category.name }}</span>
              </NuxtLink>
            </div>
          </div>

        </template>

        <!-- Case 2: Fallback when Category has no subcategories in data -->
        <template v-else>
          <div class="col-span-12 py-6 text-center space-y-4">
            <p class="text-xs text-muted-foreground">
              Direct access to {{ category.name }} components and workstation models.
            </p>
            <div class="flex justify-center gap-3">
              <NuxtLink 
                :to="categoryService.getCategoryUrl(category, allCategories)"
                class="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors"
              >
                Browse All {{ category.name }} Products
              </NuxtLink>
            </div>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>
