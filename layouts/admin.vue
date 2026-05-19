<script setup lang="ts">
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Layers, 
  Boxes, 
  FileText, 
  Award, 
  BarChart3, 
  ShieldAlert, 
  Bell, 
  Settings, 
  Shield,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Search
} from 'lucide-vue-next';
import { useUIStore } from '~/stores/ui';
import { cn } from '~/utils';

const uiStore = useUIStore();
const route = useRoute();

const isMobileMenuOpen = ref(false);
const isThemeMenuOpen = ref(false);
const isProfileOpen = ref(false);

const iconsMap: Record<string, any> = {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Layers,
  Boxes,
  FileText,
  Award,
  BarChart3,
  ShieldAlert,
  Bell,
  Settings,
  Shield
};

const navigation = [
  { name: 'Dashboard', iconKey: 'LayoutDashboard', href: '/admin' },
  { name: 'Products', iconKey: 'ShoppingBag', href: '/admin/products' },
  { name: 'Orders', iconKey: 'FileText', href: '/admin/orders' },
  { name: 'Categories', iconKey: 'Layers', href: '/admin/categories' },
  { name: 'Inventory', iconKey: 'Boxes', href: '/admin/inventory' },
  { name: 'Customers', iconKey: 'Users', href: '/admin/customers' },
  { name: 'Staff', iconKey: 'Award', href: '/admin/staff' },
  { name: 'Brands', iconKey: 'Shield', href: '/admin/brands' },
  { name: 'Analytics', iconKey: 'BarChart3', href: '/admin/analytics' },
];

const secondaryNavigation = [
  { name: 'Security', iconKey: 'ShieldAlert', href: '/admin/security' },
  { name: 'Notifications', iconKey: 'Bell', href: '/admin/notifications' },
  { name: 'Settings', iconKey: 'Settings', href: '/admin/settings' },
];

// Click outside helper to shut down menus
if (process.client) {
  window.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.theme-dropdown')) {
      isThemeMenuOpen.value = false;
    }
    if (!target.closest('.profile-dropdown')) {
      isProfileOpen.value = false;
    }
  });
}
</script>

<template>
  <div class="min-h-screen flex bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans">
    
    <!-- Sidebar - Desktop view -->
    <aside 
      :class="cn(
        'hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 transition-all duration-300',
        uiStore.isSidebarOpen ? 'w-64' : 'w-20'
      )"
    >
      <!-- Logo Branding -->
      <div class="h-16 flex items-center px-6 border-b border-slate-200/50 dark:border-slate-800 gap-3">
        <div class="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20 text-white">
          <Shield class="w-4 h-4" />
        </div>
        <span 
          v-if="uiStore.isSidebarOpen"
          class="text-sm font-display font-bold font-black tracking-tight bg-gradient-to-r from-rose-600 to-indigo-600 bg-clip-text text-transparent animate-in fade-in"
        >
          TechCore Admin
        </span>
      </div>

      <!-- Main Navigation -->
      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
        <NuxtLink 
          v-for="item in navigation" 
          :key="item.name" 
          :to="item.href"
          :class="cn(
            'flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-display text-[11px] font-black uppercase tracking-wider',
            route.path === item.href
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/10'
              : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-900'
          )"
        >
          <component :is="iconsMap[item.iconKey]" class="w-4 h-4 shrink-0" />
          <span v-if="uiStore.isSidebarOpen" class="animate-in fade-in">{{ item.name }}</span>
        </NuxtLink>

        <!-- Spacer -->
        <div class="my-4 border-t border-slate-100 dark:border-slate-800/60 mx-2"></div>
        <div v-if="uiStore.isSidebarOpen" class="px-3 pb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
          Systems & Settings
        </div>

        <NuxtLink 
          v-for="item in secondaryNavigation" 
          :key="item.name" 
          :to="item.href"
          :class="cn(
            'flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-display text-[11px] font-black uppercase tracking-wider',
            route.path.startsWith(item.href)
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 shadow-md shadow-slate-900/10'
              : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-900'
          )"
        >
          <component :is="iconsMap[item.iconKey]" class="w-4 h-4 shrink-0" />
          <span v-if="uiStore.isSidebarOpen" class="animate-in fade-in">{{ item.name }}</span>
        </NuxtLink>
      </nav>

      <!-- Sidebar Footer -->
      <div class="p-4 border-t border-slate-100 dark:border-slate-800/60">
        <NuxtLink to="/" class="flex items-center gap-3 p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 rounded-xl transition-all">
          <LogOut class="w-4 h-4 shrink-0" />
          <span v-if="uiStore.isSidebarOpen" class="text-xs font-bold uppercase tracking-wider font-display">Back to Web</span>
        </NuxtLink>
      </div>
    </aside>

    <!-- Mobile Drawer Sidebar (Sliding Drawer) -->
    <div 
      v-if="isMobileMenuOpen" 
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden flex"
      @click="isMobileMenuOpen = false"
    >
      <div 
        class="w-64 bg-white dark:bg-slate-950 h-full flex flex-col p-4 animate-in slide-in-from-left duration-300"
        @click.stop
      >
        <div class="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-900">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white">
              <Shield class="w-4 h-4" />
            </div>
            <span class="text-xs font-display font-black tracking-widest uppercase">TechCore</span>
          </div>
          <button @click="isMobileMenuOpen = false" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl">
            <X class="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <nav class="flex-1 overflow-y-auto py-6 space-y-1">
          <NuxtLink 
            v-for="item in navigation" 
            :key="item.name" 
            :to="item.href"
            @click="isMobileMenuOpen = false"
            :class="cn(
              'flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-display text-[10px] font-bold uppercase tracking-widest',
              route.path === item.href
                ? 'bg-rose-500 text-white'
                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            )"
          >
            <component :is="iconsMap[item.iconKey]" class="w-4 h-4 shrink-0" />
            <span>{{ item.name }}</span>
          </NuxtLink>

          <!-- Divider -->
          <div class="my-4 border-t border-slate-100 dark:border-slate-800"></div>

          <NuxtLink 
            v-for="item in secondaryNavigation" 
            :key="item.name" 
            :to="item.href"
            @click="isMobileMenuOpen = false"
            :class="cn(
              'flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-display text-[10px] font-bold uppercase tracking-widest',
              route.path.startsWith(item.href)
                ? 'bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950'
                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            )"
          >
            <component :is="iconsMap[item.iconKey]" class="w-4 h-4 shrink-0" />
            <span>{{ item.name }}</span>
          </NuxtLink>
        </nav>

        <div class="pt-4 border-t border-slate-100 dark:border-slate-900">
          <NuxtLink to="/" class="flex items-center gap-3 p-3 text-slate-400 rounded-xl">
            <LogOut class="w-4 h-4" />
            <span class="text-[10px] font-bold uppercase tracking-widest">Back to Frontpage</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Main Right Content Wrapper -->
    <div class="flex-1 flex flex-col min-w-0">
      
      <!-- Top Navbar Header -->
      <header class="h-16 border-b border-slate-200/50 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        
        <!-- Sidebar collapse toggle trigger / Mobile burger menu trigger -->
        <div class="flex items-center gap-3">
          <button 
            @click="isMobileMenuOpen = true"
            class="p-2 lg:hidden hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors cursor-pointer text-slate-500"
          >
            <Menu class="w-5 h-5" />
          </button>
          
          <button 
            @click="uiStore.toggleSidebar()"
            class="hidden lg:flex p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <Menu class="w-5 h-5" />
          </button>

          <div class="hidden md:flex relative max-w-xs">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Omnipresent query finder..." 
              class="h-9 w-60 pl-9 pr-4 bg-slate-50 dark:bg-slate-900 text-xs rounded-xl outline-none border border-transparent focus:border-slate-200 dark:focus:border-slate-800 focus:bg-white dark:focus:bg-slate-950 font-medium placeholder:text-slate-400 transition-all duration-200"
            />
          </div>
        </div>

        <!-- Header Controls (Theme Toggle dropdown, user profiles, alert hub) -->
        <div class="flex items-center gap-3">
          
          <!-- Theme Toggle Dropdown -->
          <div class="relative theme-dropdown">
            <button 
              @click="isThemeMenuOpen = !isThemeMenuOpen"
              class="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors flex items-center justify-center h-9 w-9 cursor-pointer"
            >
              <Sun v-if="uiStore.themeMode === 'light'" class="w-4.5 h-4.5 text-amber-500" />
              <Moon v-else-if="uiStore.themeMode === 'dark'" class="w-4.5 h-4.5 text-indigo-400" />
              <Monitor v-else class="w-4.5 h-4.5 text-slate-500 dark:text-slate-400" />
            </button>

            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0 m-1"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <div 
                v-if="isThemeMenuOpen" 
                class="absolute top-full right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in"
              >
                <div class="px-3.5 py-2 text-[8px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50 dark:border-slate-800/80 mb-1">
                  Choose App Theme
                </div>
                <button 
                  v-for="mode in ['light', 'dark', 'system'] as const" 
                  :key="mode"
                  @click="uiStore.setTheme(mode); isThemeMenuOpen = false"
                  :class="cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer',
                    uiStore.themeMode === mode 
                      ? 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400' 
                      : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-slate-100'
                  )"
                >
                  <Sun v-if="mode === 'light'" class="w-3.5 h-3.5" />
                  <Moon v-else-if="mode === 'dark'" class="w-3.5 h-3.5" />
                  <Monitor v-else class="w-3.5 h-3.5" />
                  <span class="capitalize">{{ mode }}</span>
                </button>
              </div>
            </transition>
          </div>

          <!-- Notification Hub Bubble -->
          <NuxtLink to="/admin/notifications">
            <button class="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl relative transition-all duration-200 btn h-9 w-9 flex items-center justify-center">
              <Bell class="w-4.5 h-4.5" />
              <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-950"></span>
            </button>
          </NuxtLink>

          <!-- Divider -->
          <div class="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

          <!-- User Profile Dropdown -->
          <div class="relative profile-dropdown">
            <button 
              @click="isProfileOpen = !isProfileOpen"
              class="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white shrink-0 uppercase">
                AD
              </div>
              <span class="hidden md:inline text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-none">Admin</span>
              <ChevronDown class="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            <!-- Dropdown list -->
            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0 m-1"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <div 
                v-if="isProfileOpen" 
                class="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 text-left animate-in fade-in"
              >
                <div class="p-3 border-b border-slate-50 dark:border-slate-800/80 mb-2">
                  <p class="text-xs font-black uppercase text-slate-900 dark:text-white">RK Shaon</p>
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">rkshaon.ist@gmail.com</p>
                </div>
                <NuxtLink 
                  to="/admin/settings" 
                  @click="isProfileOpen = false"
                  class="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors uppercase tracking-wider"
                >
                  <Settings class="w-4 h-4 text-slate-400" />
                  Settings
                </NuxtLink>
                <NuxtLink 
                  to="/admin/security" 
                  @click="isProfileOpen = false"
                  class="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors uppercase tracking-wider"
                >
                  <Shield class="w-4 h-4 text-slate-400" />
                  Security Console
                </NuxtLink>
                <div class="border-t border-slate-50 dark:border-slate-800 my-1.5"></div>
                <NuxtLink 
                  to="/" 
                  @click="isProfileOpen = false"
                  class="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors uppercase tracking-wider"
                >
                  <LogOut class="w-4 h-4" />
                  Logout
                </NuxtLink>
              </div>
            </transition>
          </div>

        </div>
      </header>

      <!-- Main Responsive Panel View -->
      <main class="flex-1 overflow-y-auto p-6 md:p-8 max-w-[1600px] w-full mx-auto">
        <slot />
      </main>

    </div>
  </div>
</template>
