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
  Search,
  User as UserIcon,
  Moon,
  Sun,
  Monitor,
  Boxes
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { cn } from '@/utils';
import { markRaw } from 'vue';

const authStore = useAuthStore();
const uiStore = useUIStore();
const isSidebarOpen = ref(true);
const isMobileMenuOpen = ref(false);

definePageMeta({
  middleware: 'auth'
});

const navigation = [
  { name: 'Dashboard', icon: markRaw(LayoutDashboard), href: '/admin' },
  { name: 'Products', icon: markRaw(Package), href: '/admin/products' },
  { name: 'Categories', icon: markRaw(Layers), href: '/admin/categories' },
  { name: 'Brands', icon: markRaw(Tag), href: '/admin/brands' },
  { name: 'Inventory', icon: markRaw(Boxes), href: '/admin/inventory' },
  { name: 'Orders', icon: markRaw(ShoppingCart), href: '/admin/orders' },
  { name: 'Customers', icon: markRaw(Users), href: '/admin/customers' },
  { name: 'Staff', icon: markRaw(ShieldCheck), href: '/admin/staff' },
  { name: 'Analytics', icon: markRaw(BarChart3), href: '/admin/analytics' },
];

const secondaryNavigation = [
  { name: 'Notifications', icon: markRaw(Bell), href: '/admin/notifications' },
  { name: 'Settings', icon: markRaw(Settings), href: '/admin/settings' },
];

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
            <component :is="item.icon" :class="cn('w-5 h-5 shrink-0')" />
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
            <component :is="item.icon" :class="cn('w-5 h-5 shrink-0')" />
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
          <!-- Theme Toggle -->
          <button class="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors">
            <Sun v-if="uiStore.themeMode === 'dark'" class="w-5 h-5" @click="uiStore.setTheme('light')" />
            <Moon v-else class="w-5 h-5" @click="uiStore.setTheme('dark')" />
          </button>

          <!-- User Profile -->
          <div class="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
            <div class="text-right hidden lg:block">
              <p class="text-xs font-bold leading-none">{{ authStore.user?.name || 'Admin User' }}</p>
              <p class="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Super Admin</p>
            </div>
            <button class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
              <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" class="w-full h-full object-cover" />
              <UserIcon v-else class="w-5 h-5 text-slate-400" />
            </button>
          </div>
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
              <component :is="item.icon" class="w-5 h-5" />
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
