<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  Tag, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Bell, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  Menu,
  ShieldCheck,
  ShieldAlert,
  Search,
  User as UserIcon,
  Moon,
  Sun,
  Monitor,
  Boxes,
  ExternalLink
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { cn } from '@/utils';
import { markRaw } from 'vue';

const authStore = useAuthStore();
const uiStore = useUIStore();
const isSidebarOpen = ref(true);
const isMobileMenuOpen = ref(false);
const isThemeMenuOpen = ref(false);

if (process.client) {
  // Close theme menu on click outside
  window.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.theme-dropdown')) {
      isThemeMenuOpen.value = false;
    }
  });
}

const navigation = [
  { name: 'Dashboard', iconKey: 'LayoutDashboard', href: '/admin' },
  { name: 'Products', iconKey: 'Package', href: '/admin/products' },
  { name: 'Categories', iconKey: 'Layers', href: '/admin/categories' },
  { name: 'Brands', iconKey: 'Tag', href: '/admin/brands' },
  { name: 'Inventory', iconKey: 'Boxes', href: '/admin/inventory' },
  { name: 'Orders', iconKey: 'ShoppingCart', href: '/admin/orders' },
  { name: 'Customers', iconKey: 'Users', href: '/admin/customers' },
  { name: 'Staff', iconKey: 'ShieldCheck', href: '/admin/staff' },
  { name: 'Analytics', iconKey: 'BarChart3', href: '/admin/analytics' },
];

const secondaryNavigation = [
  { name: 'Profile', iconKey: 'UserIcon', href: '/admin/profile' },
  { name: 'Security', iconKey: 'ShieldAlert', href: '/admin/security' },
  { name: 'Notifications', iconKey: 'Bell', href: '/admin/notifications' },
  { name: 'Settings', iconKey: 'Settings', href: '/admin/settings' },
];

const iconMap = {
  LayoutDashboard,
  Package,
  Layers,
  Tag,
  Boxes,
  ShoppingCart,
  Users,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  Bell,
  Settings,
  UserIcon
};

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const handleLogout = () => {
  authStore.logout();
  navigateTo('/login');
};

const breadcrumbs = computed(() => {
  const route = useRoute();
  const pathParts = route.path.split('/').filter(p => p !== '');
  return pathParts.map((part, index) => ({
    name: isNaN(Number(part.charAt(0))) ? part.charAt(0).toUpperCase() + part.slice(1) : part,
    href: '/' + pathParts.slice(0, index + 1).join('/'),
    current: index === pathParts.length - 1
  }));
});
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans">
    <!-- Sidebar for Desktop -->
    <aside 
      :class="cn(
        'fixed top-0 left-0 z-40 h-screen transition-all duration-300 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950',
        isSidebarOpen ? 'w-64' : 'w-20'
      )"
    >
      <div class="flex flex-col h-full">
        <!-- Logo Area -->
        <div class="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 overflow-hidden">
          <NuxtLink to="/admin" class="flex items-center gap-3">
            <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <ShieldCheck class="w-5 h-5 text-white" />
            </div>
            <span v-if="isSidebarOpen" class="font-display font-bold text-lg tracking-tight whitespace-nowrap">
              Admin<span class="text-primary">Core</span>
            </span>
          </NuxtLink>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
          <NuxtLink 
            v-for="item in navigation" 
            :key="item.name"
            :to="item.href"
            :class="cn(
              'group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 font-medium text-sm',
              $route.path === item.href 
                ? 'bg-primary/10 text-primary' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
            )"
          >
            <component :is="iconMap[item.iconKey as keyof typeof iconMap]" :class="cn('w-5 h-5 shrink-0')" />
            <span v-if="isSidebarOpen" class="whitespace-nowrap">{{ item.name }}</span>
          </NuxtLink>

          <div class="pt-6 pb-2">
            <div v-if="isSidebarOpen" class="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">System</div>
            <div v-else class="mx-auto w-4 border-t border-slate-200 dark:border-slate-800 my-4"></div>
          </div>

          <NuxtLink 
            v-for="item in secondaryNavigation" 
            :key="item.name"
            :to="item.href"
            :class="cn(
              'group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 font-medium text-sm',
              $route.path === item.href 
                ? 'bg-primary/10 text-primary' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
            )"
          >
            <component :is="iconMap[item.iconKey as keyof typeof iconMap]" :class="cn('w-5 h-5 shrink-0')" />
            <span v-if="isSidebarOpen" class="whitespace-nowrap">{{ item.name }}</span>
          </NuxtLink>
        </nav>

        <!-- Sidebar Footer -->
        <div class="p-3 border-t border-slate-200 dark:border-slate-800">
          <button 
            @click="handleLogout"
            class="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all text-sm font-medium"
          >
            <LogOut class="w-5 h-5 shrink-0" />
            <span v-if="isSidebarOpen">Logout</span>
          </button>
        </div>
      </div>

      <!-- Toggle Button -->
      <button 
        @click="toggleSidebar"
        class="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center shadow-md text-slate-500 hover:text-primary transition-all z-50 hidden md:flex"
      >
        <ChevronLeft :class="cn('w-4 h-4 transition-transform duration-300', !isSidebarOpen && 'rotate-180')" />
      </button>
    </aside>

    <!-- Main Content Area -->
    <main 
      :class="cn(
        'transition-all duration-300 min-h-screen flex flex-col',
        isSidebarOpen ? 'md:ml-64' : 'md:ml-20'
      )"
    >
      <!-- Header -->
      <header class="h-16 sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <!-- Mobile Menu Toggle -->
          <button @click="isMobileMenuOpen = true" class="md:hidden p-2 text-slate-500">
            <Menu class="w-6 h-6" />
          </button>

          <!-- Search Bar (Placeholder) -->
          <div class="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-1.5 w-64 lg:w-96">
            <Search class="w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search operations..." class="bg-transparent border-none outline-none text-xs w-full focus:ring-0" />
            <div class="text-[10px] font-bold text-slate-400 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border dark:border-slate-700">⌘K</div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Visit Website -->
          <NuxtLink 
            to="/" 
            class="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-full transition-all duration-300 hover:scale-[1.02] shrink-0 text-slate-700 dark:text-slate-300"
            title="Return to Main Marketplace"
          >
            <ExternalLink class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span class="text-[9px] font-extrabold uppercase tracking-widest">Visit Website</span>
          </NuxtLink>

          <!-- Mobile Visit Website icon button -->
          <NuxtLink 
            to="/" 
            class="sm:hidden p-2 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl transition-all shrink-0"
            title="Return to Main Marketplace"
          >
            <ExternalLink class="w-4 h-4" />
          </NuxtLink>

          <!-- Theme Toggle Dropdown -->
          <div class="relative theme-dropdown">
            <button 
              @click="isThemeMenuOpen = !isThemeMenuOpen"
              class="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors flex items-center justify-center h-9 w-9"
            >
              <Sun v-if="uiStore.themeMode === 'light'" class="w-5 h-5" />
              <Moon v-else-if="uiStore.themeMode === 'dark'" class="w-5 h-5" />
              <Monitor v-else class="w-5 h-5" />
            </button>

            <transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <div v-if="isThemeMenuOpen" class="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50">
                <button 
                  v-for="mode in ['light', 'dark', 'system'] as const" 
                  :key="mode"
                  @click="uiStore.setTheme(mode); isThemeMenuOpen = false"
                  :class="cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors',
                    uiStore.themeMode === mode ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  )"
                >
                  <Sun v-if="mode === 'light'" class="w-4 h-4" />
                  <Moon v-else-if="mode === 'dark'" class="w-4 h-4" />
                  <Monitor v-else class="w-4 h-4" />
                  <span>{{ mode }}</span>
                </button>
              </div>
            </transition>
          </div>

          <!-- User Profile -->
          <NuxtLink to="/admin/profile" class="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800 hover:opacity-80 transition-opacity">
            <div class="text-right hidden lg:block">
              <p class="text-xs font-bold leading-none">{{ authStore.user?.name || 'Admin User' }}</p>
              <p class="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Super Admin</p>
            </div>
            <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
              <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" class="w-full h-full object-cover" />
              <UserIcon v-else class="w-5 h-5 text-slate-400" />
            </div>
          </NuxtLink>
        </div>
      </header>

      <!-- Content -->
      <div class="flex-1 p-6 lg:p-8">
        <!-- Breadcrumbs -->
        <nav class="flex mb-6" aria-label="Breadcrumb">
          <ol class="flex items-center space-x-2 text-xs font-medium">
            <li>
              <NuxtLink to="/admin" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">Admin</NuxtLink>
            </li>
            <li v-for="crumb in breadcrumbs" :key="crumb.href" class="flex items-center">
              <ChevronLeft class="w-3 h-3 text-slate-300 dark:text-slate-700 rotate-180 flex-shrink-0" />
              <NuxtLink 
                :to="crumb.href" 
                :class="cn(
                  'ml-2',
                  crumb.current ? 'text-primary font-bold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                )"
                :aria-current="crumb.current ? 'page' : undefined"
              >
                {{ crumb.name }}
              </NuxtLink>
            </li>
          </ol>
        </nav>

        <slot />
      </div>
    </main>

    <!-- Mobile Sidebar Backdrop -->
    <div v-if="isMobileMenuOpen" class="fixed inset-0 z-50 md:hidden overflow-hidden">
      <div 
        class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        @click="isMobileMenuOpen = false"
      ></div>
      <div class="absolute inset-y-0 left-0 w-72 bg-white dark:bg-slate-950 shadow-2xl animate-in slide-in-from-left duration-300">
        <!-- Re-use sidebar content for mobile -->
        <div class="flex flex-col h-full">
          <div class="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
            <span class="font-display font-bold text-lg tracking-tight">Admin<span class="text-primary">Core</span></span>
            <button @click="isMobileMenuOpen = false" class="ml-auto p-2 text-slate-500">
              <ChevronLeft class="w-6 h-6" />
            </button>
          </div>
          <nav class="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            <NuxtLink 
              v-for="item in navigation" 
              :key="item.name"
              :to="item.href"
              @click="isMobileMenuOpen = false"
              :class="cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium text-sm',
                $route.path === item.href 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
              )"
            >
              <component :is="iconMap[item.iconKey as keyof typeof iconMap]" class="w-5 h-5" />
              {{ item.name }}
            </NuxtLink>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.2);
  border-radius: 10px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.4);
}
</style>
