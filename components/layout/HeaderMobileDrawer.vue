<!-- File: /components/layout/HeaderMobileDrawer.vue -->
<script setup lang="ts">
import { navigateTo } from '#app';
import { ref, computed } from 'vue';
import { 
  Search, 
  Grid2X2, 
  ChevronRight, 
  ShieldCheck, 
  User, 
  PackageSearch, 
  MapPin, 
  Cpu, 
  ArrowLeftRight, 
  Tag, 
  Sparkles, 
  Zap, 
  Clock 
} from 'lucide-vue-next';
import { cn, decodeHtmlEntities } from '@/utils';
import { useUIStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { useCategoryService } from '@/composables/useCategoryService';
import { useToast } from '@/composables/useToast';
import type { Category } from '@/types';

interface Props {
  categories: Category[];
  allCategories: Category[];
  isMenuLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isMenuLoading: false,
});

const uiStore = useUIStore();
const authStore = useAuthStore();
const categoryService = useCategoryService();
const { toastInfo } = useToast();

const isSuperAdmin = computed(() => authStore.isAdmin);

// Mobile Category Drawer Accordion State
const openMobileCategoryIds = ref<string[]>([]);

const toggleMobileCategory = async (catId: string) => {
  if (openMobileCategoryIds.value.includes(catId)) {
    openMobileCategoryIds.value = openMobileCategoryIds.value.filter(id => id !== catId);
  } else {
    openMobileCategoryIds.value.push(catId);
    const cat = props.categories.find(c => String(c.id) === String(catId)) || props.allCategories.find(c => String(c.id) === String(catId));
    if (cat && cat.has_children !== false && !categoryService.hasChildrenLoaded(catId)) {
      await categoryService.getCategoryChildrenBatch([catId], { is_menu: true });
    }
  }
};

const handleCompareClick = () => {
  toastInfo('Product comparison coming soon!', {
    description: 'Select products on catalog pages to compare specifications.'
  });
};

// Helper to get sub-categories dynamically from cached children state or 'children' object list
const getSubCategories = (cat: Category): Category[] => {
  if (!cat) return [];

  const cached = categoryService.getChildrenForParent(cat.id);
  if (cached && cached.length > 0) {
    return cached;
  }

  if (cat.slug) {
    const cachedBySlug = categoryService.getChildrenForParent(cat.slug);
    if (cachedBySlug && cachedBySlug.length > 0) {
      return cachedBySlug;
    }
  }

  if (cat.children && Array.isArray(cat.children) && cat.children.length) {
    return cat.children;
  }
  
  if (cat.subCategories && Array.isArray(cat.subCategories)) {
    const list = props.allCategories || [];
    const matched = cat.subCategories
      .map(idOrSlug => list.find(c => c.id === idOrSlug || c.slug === idOrSlug))
      .filter((c): c is Category => !!c);
    if (matched.length > 0) return matched;
  }

  if (props.allCategories && props.allCategories.length > 0) {
    const matches = props.allCategories.filter(
      c => c.id !== cat.id && (String(c.parentCategoryId) === String(cat.id) || c.parentCategoryId === cat.slug)
    );
    if (matches.length > 0) return matches;
  }
  
  return [];
};

// Helper to check if a category has child categories using has_children or children arrays
const hasChildren = (cat: Category): boolean => {
  if (typeof cat.has_children === 'boolean') {
    return cat.has_children;
  }
  return getSubCategories(cat).length > 0;
};
</script>

<template>
  <!-- Mobile Navigation Drawer representing the full Taxonomy hierarchy dynamically fetched -->
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-4"
  >
    <div 
      v-if="uiStore.isMobileMenuOpen" 
      class="md:hidden absolute top-full left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border flex flex-col p-6 space-y-6 max-h-[80vh] overflow-y-auto shadow-2xl"
    >
      <!-- Mobile Search -->
      <div class="relative group">
        <input 
          type="text" 
          placeholder="Search items..." 
          class="w-full bg-muted/50 border border-input rounded-full h-10 text-xs px-10 outline-none focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-300"
          @keyup.enter="navigateTo(`/products?q=${($event.target as HTMLInputElement).value}`); uiStore.closeMobileMenu()"
        />
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      </div>

      <!-- Navigation Menu Hierarchy -->
      <div class="flex flex-col space-y-4">
        <div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2">
          Technical Categories
        </div>
        
        <NuxtLink 
          to="/products/" 
          class="font-bold text-xs uppercase tracking-widest text-primary flex items-center gap-2"
          @click="uiStore.closeMobileMenu()"
        >
          <Grid2X2 class="w-4 h-4 text-primary" />
          Full Catalog
        </NuxtLink>

        <!-- Dynamic Loader -->
        <div v-if="isMenuLoading" class="py-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span class="animate-spin border-2 border-primary/30 border-t-primary rounded-full w-4 h-4"></span>
          Synchronizing Nodes...
        </div>
        
        <div v-else class="space-y-3">
          <div v-for="cat in categories" :key="cat.id" class="border-b border-border/40 pb-2">
            <div class="flex items-center justify-between">
              <NuxtLink 
                :to="categoryService.getCategoryUrl(cat, allCategories)" 
                class="font-bold text-xs uppercase tracking-wider block hover:text-primary transition-colors py-1"
                @click="uiStore.closeMobileMenu()"
              >
                {{ decodeHtmlEntities(cat.name) }}
              </NuxtLink>

              <button 
                v-if="hasChildren(cat)"
                type="button"
                @click="toggleMobileCategory(cat.id)"
                class="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                :aria-label="`Toggle subcategories for ${cat.name}`"
              >
                <ChevronRight 
                  :class="cn('w-4 h-4 transition-transform duration-200', categoryService.isChildrenLoading(cat.id) ? 'animate-spin text-primary' : (openMobileCategoryIds.includes(cat.id) ? 'rotate-90 text-primary' : ''))" 
                />
              </button>
            </div>
            
            <!-- Subcategories expandable via tap -->
            <transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="max-h-0 opacity-0 overflow-hidden"
              enter-to-class="max-h-96 opacity-100 overflow-hidden"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="max-h-96 opacity-100 overflow-hidden"
              leave-to-class="max-h-0 opacity-0 overflow-hidden"
            >
              <ul 
                v-if="getSubCategories(cat).length && openMobileCategoryIds.includes(cat.id)" 
                class="pl-3 mt-1.5 border-l-2 border-primary/40 space-y-2 py-1.5 bg-muted/20 rounded-r-lg"
              >
                <li v-for="subCat in getSubCategories(cat)" :key="subCat.id">
                  <NuxtLink 
                    :to="categoryService.getCategoryUrl(subCat, allCategories)" 
                    class="text-[11px] font-semibold tracking-wide text-muted-foreground hover:text-primary block py-1 px-1.5 rounded hover:bg-muted/50 transition-colors"
                    @click="uiStore.closeMobileMenu()"
                  >
                    {{ decodeHtmlEntities(subCat.name) }}
                  </NuxtLink>
                </li>
              </ul>
            </transition>
          </div>
        </div>
      </div>

      <!-- Secondary Support / Corporate Links -->
      <div class="space-y-3 pt-4 border-t border-border/50">
        <NuxtLink 
          v-if="isSuperAdmin"
          to="/admin" 
          class="font-bold text-xs uppercase tracking-widest text-primary flex items-center gap-2 hover:underline transition-colors"
          @click="uiStore.closeMobileMenu()"
        >
          <ShieldCheck class="w-4 h-4 text-primary" />
          <span>Admin Panel</span>
        </NuxtLink>
        <NuxtLink 
          :to="authStore.isLoggedIn ? '/account/' : '/login/'" 
          class="font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2 hover:text-primary transition-colors"
          @click="uiStore.closeMobileMenu()"
        >
          <User class="w-4 h-4 text-primary" />
          <span>{{ authStore.isLoggedIn ? (authStore.user?.name || 'Account') : 'Hello, Login' }}</span>
        </NuxtLink>
        <NuxtLink 
          to="/account/" 
          class="font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2 hover:text-primary transition-colors"
          @click="uiStore.closeMobileMenu()"
        >
          <PackageSearch class="w-4 h-4 text-primary" />
          <span>Track Your Order</span>
        </NuxtLink>
        <a 
          href="https://www.google.com/maps/place/G.M+Plaza/@23.7388697,90.386565,17z/data=!3m1!5s0x3755b8c81091d773:0x601a730b2bf4e399!4m16!1m9!3m8!1s0x3755b8c77df0f4fb:0x8620358ee5376a1a!2sG.M+Plaza!8m2!3d23.7388697!4d90.386565!9m1!1b1!16s%2Fg%2F11c2p4g0df!3m5!1s0x3755b8c77df0f4fb:0x8620358ee5376a1a!8m2!3d23.7388697!4d90.386565!16s%2Fg%2F11c2p4g0df?hl=en-US&entry=ttu&g_ep=EgoyMDI2MDgwMi4wIKXMDSoASAFQAw%3D%3D" 
          target="_blank"
          rel="noopener noreferrer"
          class="font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2 hover:text-primary transition-colors"
          @click="uiStore.closeMobileMenu()"
        >
          <MapPin class="w-4 h-4 text-primary" />
          <span>Store Location</span>
        </a>
        <NuxtLink 
          to="/products/" 
          class="font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2 hover:text-primary transition-colors"
          @click="uiStore.closeMobileMenu()"
        >
          <Cpu class="w-4 h-4 text-primary" />
          <span>PC Builder</span>
        </NuxtLink>
        <button 
          @click="handleCompareClick(); uiStore.closeMobileMenu()" 
          type="button"
          class="font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2 hover:text-primary transition-colors w-full text-left cursor-pointer"
        >
          <ArrowLeftRight class="w-4 h-4 text-primary" />
          <span>Compare</span>
        </button>
        <NuxtLink 
          to="/offers/" 
          class="font-bold text-xs uppercase tracking-widest text-destructive flex items-center gap-2 hover:translate-x-1 transition-transform"
          @click="uiStore.closeMobileMenu()"
        >
          <Tag class="w-4 h-4 text-destructive" />
          <span>Offers</span>
        </NuxtLink>
        <NuxtLink 
          to="/new-arrivals/" 
          class="font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2 hover:text-amber-500 transition-colors"
          @click="uiStore.closeMobileMenu()"
        >
          <Sparkles class="w-4 h-4 text-amber-500" />
          <span>New Arrivals</span>
        </NuxtLink>
        <NuxtLink 
          to="/offers/" 
          class="font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2 hover:text-primary transition-colors"
          @click="uiStore.closeMobileMenu()"
        >
          <Zap class="w-4 h-4 text-primary" />
          <span>Flash Sale</span>
        </NuxtLink>
        <NuxtLink 
          to="/offers/" 
          class="font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2 hover:text-sky-500 transition-colors"
          @click="uiStore.closeMobileMenu()"
        >
          <Clock class="w-4 h-4 text-sky-500" />
          <span>Happy Hours</span>
        </NuxtLink>
        <NuxtLink 
          to="/blog/" 
          class="font-bold text-xs uppercase tracking-widest block hover:text-primary hover:translate-x-1 transition-all duration-300"
          @click="uiStore.closeMobileMenu()"
        >
          Tech Insights
        </NuxtLink>
      </div>
    </div>
  </transition>
</template>
