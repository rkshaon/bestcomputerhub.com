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
  Clock,
  Phone,
  BookOpen
} from 'lucide-vue-next';
import { cn, decodeHtmlEntities } from '@/utils';
import { useUIStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { useCategoryService } from '@/composables/useCategoryService';
import { useToast } from '@/composables/useToast';
import { STORE_CONTACT } from '@/constants/contact';
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
const isAuthRoute = computed(() => {
  const p = useRoute().path;
  return p === '/login' || p === '/login/' || p === '/signup' || p === '/signup/';
});

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
      <div v-if="!isAuthRoute" class="flex flex-col space-y-4">
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
        <!-- Direct Quick Contact (Call & WhatsApp) -->
        <div class="grid grid-cols-2 gap-2 pb-1">
          <a 
            :href="`tel:${STORE_CONTACT.telPhone}`"
            class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs uppercase tracking-wider transition-colors"
            @click="uiStore.closeMobileMenu()"
          >
            <Phone class="w-4 h-4 text-primary" />
            <span>Call</span>
          </a>
          <a 
            :href="STORE_CONTACT.whatsappLink"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-bold text-xs uppercase tracking-wider transition-colors"
            @click="uiStore.closeMobileMenu()"
          >
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span>WhatsApp</span>
          </a>
        </div>

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
          :to="authStore.isLoggedIn ? '/my-account/' : '/login/'" 
          class="font-bold text-xs uppercase tracking-widest text-foreground flex items-center gap-2 hover:text-primary transition-colors"
          @click="uiStore.closeMobileMenu()"
        >
          <User class="w-4 h-4 text-primary" />
          <span>{{ authStore.isLoggedIn ? (authStore.user?.name || 'Account') : 'Hello, Login' }}</span>
        </NuxtLink>
        <NuxtLink 
          to="/my-account/" 
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
          class="font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:text-primary transition-colors text-foreground"
          @click="uiStore.closeMobileMenu()"
        >
          <BookOpen class="w-4 h-4 text-primary" />
          <span>Tech Insights & Blog</span>
        </NuxtLink>
      </div>
    </div>
  </transition>
</template>
