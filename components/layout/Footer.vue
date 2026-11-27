<!-- File: /components/layout/Footer.vue -->
<script setup lang="ts">
// TEMPORARILY DISABLED: Newsletter Icons (Mail, ArrowRight)
import { computed, onMounted } from 'vue';
import { Facebook, Twitter, Linkedin, Youtube, Instagram, Phone, Mail, MapPin } from 'lucide-vue-next';
import { useCmsService } from '@/composables/useCmsService';
import type { PublicCmsNavigationItem } from '@/types/cms';
import { normalizeCmsPath } from '@/utils/cms';
import FooterNavList, { type FooterNavLinkItem } from '@/components/layout/FooterNavList.vue';

interface FooterSectionColumn {
  id: string | number;
  title: string;
  alignClass: 'text-left' | 'text-center' | 'text-right';
  links: FooterNavLinkItem[];
}

const currentYear = new Date().getFullYear();
const route = useRoute();
const isAuthRoute = computed(() => {
  const p = route.path;
  return p === '/login' || p === '/login/' || p === '/signup' || p === '/signup/';
});

const socialLinks = [
  { 
    label: 'Facebook', 
    icon: Facebook, 
    href: 'https://www.facebook.com/bestcomputerhubltd',
    brandBg: 'bg-[#1877F2]',
    brandBorder: 'border-[#1877F2]'
  },
  { 
    label: 'X / Twitter', 
    icon: Twitter, 
    href: 'https://x.com/bestcomhubltd',
    brandBg: 'bg-[#000000]',
    brandBorder: 'border-[#000000]'
  },
  { 
    label: 'LinkedIn', 
    icon: Linkedin, 
    href: 'https://www.linkedin.com/company/best-computer-hub-ltd/home/',
    brandBg: 'bg-[#0A66C2]',
    brandBorder: 'border-[#0A66C2]'
  },
  { 
    label: 'Instagram', 
    icon: Instagram, 
    href: 'https://www.instagram.com/bestcomputerhubltd',
    brandBg: 'bg-[#E4405F]',
    brandBorder: 'border-[#E4405F]'
  },
  { 
    label: 'YouTube', 
    icon: Youtube, 
    href: 'https://www.youtube.com/@bestcomputerhubltd',
    brandBg: 'bg-[#FF0000]',
    brandBorder: 'border-[#FF0000]'
  }
];

const FALLBACK_FOOTER_SECTIONS: FooterSectionColumn[] = [
  {
    id: 'fallback-information',
    title: 'Information',
    alignClass: 'text-center',
    links: [
      { id: 'info-about', label: 'About Us', url: '/about-us/', open_in_new_tab: false, children: [] },
      { id: 'info-contact', label: 'Contact Us', url: null, open_in_new_tab: false, children: [] },
      { id: 'info-affiliation', label: 'Affiliation', url: null, open_in_new_tab: false, children: [] },
      { id: 'info-emi', label: 'EMI Information', url: '/emi-information/', open_in_new_tab: false, children: [] },
      { id: 'info-shop', label: 'Shop Now', url: '/shop-now/', open_in_new_tab: false, children: [] },
      { id: 'info-blog', label: 'Blog', url: '/blog/', open_in_new_tab: false, children: [] },
      { id: 'info-repair', label: 'Repair Hub', url: null, open_in_new_tab: false, children: [] }
    ]
  },
  {
    id: 'fallback-policy',
    title: 'Policy',
    alignClass: 'text-center',
    links: [
      { id: 'policy-disclaimer', label: 'Disclaimer', url: '/disclaimer/', open_in_new_tab: false, children: [] },
      { id: 'policy-privacy', label: 'Privacy Policy', url: '/privacy-policy/', open_in_new_tab: false, children: [] },
      { id: 'policy-warranty', label: 'Warranty Policy', url: '/warranty-policy/', open_in_new_tab: false, children: [] },
      { id: 'policy-return', label: 'Return, Refund & After-Sales Policy', url: '/return-refund-after-sales-policy/', open_in_new_tab: false, children: [] },
      { id: 'policy-delivery', label: 'Delivery Policy', url: '/delivery-policy/', open_in_new_tab: false, children: [] },
      { id: 'policy-terms', label: 'Terms & Conditions', url: null, open_in_new_tab: false, children: [] },
      { id: 'policy-dcg', label: 'ডিজিটাল কমার্স নির্দেশিকা ২০২১', url: '/digital-commerce-guidelines/', open_in_new_tab: false, children: [] }
    ]
  },
  {
    id: 'fallback-support-hub',
    title: 'Support Hub',
    alignClass: 'text-right',
    links: [
      { id: 'support-account', label: 'My account', url: '/my-account/', open_in_new_tab: false, children: [] },
      { id: 'support-cart', label: 'Cart', url: null, open_in_new_tab: false, children: [] },
      { id: 'support-compare', label: 'Compare', url: null, open_in_new_tab: false, children: [] },
      { id: 'support-wishlist', label: 'Wishlist', url: null, open_in_new_tab: false, children: [] },
      { id: 'support-checkout', label: 'Checkout', url: null, open_in_new_tab: false, children: [] },
      { id: 'support-track', label: 'Track Your Order', url: null, open_in_new_tab: false, children: [] }
    ]
  }
];

const normalizeSlug = (rawSlug: unknown): string | null => {
  if (typeof rawSlug !== 'string') return null;
  const trimmed = rawSlug.trim();
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('\\')) return null;
  const cleaned = trimmed.replace(/^\/+|\/+$/g, '');
  if (!cleaned) return null;
  const collapsed = cleaned.replace(/[\u0000-\u0020]+/g, '').toLowerCase();
  if (/^[a-z][a-z0-9+.-]*:/.test(collapsed)) return null;
  return cleaned;
};

const normalizeNavNode = (
  raw: unknown,
  visited: Set<string | number>
): FooterNavLinkItem | null => {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<PublicCmsNavigationItem>;
  if (candidate.id === undefined || candidate.id === null) return null;
  if (typeof candidate.label !== 'string' || !candidate.label.trim()) return null;
  if (visited.has(candidate.id)) return null;

  const nextVisited = new Set(visited);
  nextVisited.add(candidate.id);

  const rawChildren = Array.isArray(candidate.children) ? candidate.children : [];
  const children = rawChildren
    .map(child => normalizeNavNode(child, nextVisited))
    .filter((child): child is FooterNavLinkItem => child !== null);

  const isExplicitExternal = candidate.link_type === 'EXTERNAL';
  const resolvedSlug = isExplicitExternal ? null : normalizeSlug(candidate.slug);
  const primaryUrl = typeof candidate.url === 'string' && candidate.url.trim() ? candidate.url.trim() : null;
  const fallbackExternalUrl =
    typeof candidate.external_url === 'string' && candidate.external_url.trim()
      ? candidate.external_url.trim()
      : null;
  const rawUrl = primaryUrl ?? fallbackExternalUrl;
  const resolvedUrl = resolvedSlug ? normalizeCmsPath(resolvedSlug) : rawUrl;

  return {
    id: candidate.id,
    label: candidate.label.trim(),
    url: resolvedUrl,
    slug: resolvedSlug,
    open_in_new_tab: Boolean(candidate.open_in_new_tab),
    children
  };
};

const cmsService = useCmsService();

const { data: footerNavItems, error: footerNavError, refresh: refreshFooterNav } = await useAsyncData<PublicCmsNavigationItem[]>(
  'storefront-footer-navigation',
  async () => {
    const items = await cmsService.getPublicNavigation('footer');
    return Array.isArray(items) ? items : [];
  },
  {
    lazy: false,
    default: () => []
  }
);

onMounted(() => {
  if (footerNavError.value) {
    void refreshFooterNav();
  }
});

const footerSections = computed<FooterSectionColumn[]>(() => {
  const raw = footerNavItems.value;
  if (!Array.isArray(raw) || raw.length === 0) {
    return FALLBACK_FOOTER_SECTIONS;
  }

  const visited = new Set<string | number>();
  const normalizedTopLevel = raw
    .map(node => normalizeNavNode(node, visited))
    .filter((node): node is FooterNavLinkItem => node !== null);

  if (normalizedTopLevel.length === 0) {
    return FALLBACK_FOOTER_SECTIONS;
  }

  return normalizedTopLevel.map((col, idx) => ({
    id: col.id,
    title: col.label,
    alignClass: idx >= 2 && idx === normalizedTopLevel.length - 1 ? 'text-right' : 'text-center',
    links: col.children
  }));
});

const getResponsiveColumnAlignClass = (alignClass: FooterSectionColumn['alignClass']): string => {
  if (alignClass === 'text-center') return 'text-left lg:text-center';
  if (alignClass === 'text-right') return 'text-left lg:text-right';
  return 'text-left';
};
</script>

<template>
  <footer v-if="!isAuthRoute" class="bg-header text-header-foreground border-header-border pt-7 sm:pt-9 lg:pt-12 pb-[calc(8.5rem_+_env(safe-area-inset-bottom,0px))] md:pb-8 border-t">
    <div class="container mx-auto px-4">
      <div class="w-full lg:w-[90%] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-x-8 sm:gap-y-7 lg:gap-8 mb-6 sm:mb-8 lg:mb-10">
        <!-- Brand -->
        <div class="space-y-4 lg:space-y-6 text-left">
          <div class="space-y-2 lg:space-y-4">
            <h4 class="font-bold text-xs sm:text-sm uppercase tracking-widest text-header-foreground">We're Here to Help</h4>
            <div class="flex flex-col gap-0.5 lg:gap-3 text-header-muted-foreground text-xs sm:text-sm">
              <div>
                <a
                  href="tel:+8801794062601"
                  class="inline-flex items-center gap-3 min-h-[40px] py-1.5 pr-2 lg:min-h-0 lg:py-0 lg:pr-0 text-header-foreground/90 lg:text-header-muted-foreground hover:text-header-primary transition-colors"
                >
                  <Phone class="w-4 h-4 text-header-primary shrink-0" />
                  <span>(+880) 1794062601</span>
                </a>
              </div>
              <div>
                <a
                  href="tel:+8801783553844"
                  class="inline-flex items-center gap-3 min-h-[40px] py-1.5 pr-2 lg:min-h-0 lg:py-0 lg:pr-0 text-header-foreground/90 lg:text-header-muted-foreground hover:text-header-primary transition-colors"
                >
                  <Phone class="w-4 h-4 text-header-primary shrink-0" />
                  <span>(+880) 1783553844</span>
                </a>
              </div>
              <div>
                <a
                  href="tel:+8801714111479"
                  class="inline-flex items-center gap-3 min-h-[40px] py-1.5 pr-2 lg:min-h-0 lg:py-0 lg:pr-0 text-header-foreground/90 lg:text-header-muted-foreground hover:text-header-primary transition-colors"
                >
                  <Phone class="w-4 h-4 text-header-primary shrink-0" />
                  <span>(+880) 1714111479</span>
                </a>
              </div>
              <div>
                <a
                  href="mailto:support@bestcomputerhub.com"
                  class="inline-flex items-center gap-3 min-h-[40px] py-1.5 pr-2 lg:min-h-0 lg:py-0 lg:pr-0 text-header-foreground/90 lg:text-header-muted-foreground hover:text-header-primary transition-colors"
                >
                  <Mail class="w-4 h-4 text-header-primary shrink-0" />
                  <span>support@bestcomputerhub.com</span>
                </a>
              </div>
              <div class="flex items-start gap-3 pt-1.5 lg:pt-0 pr-14 sm:pr-0">
                <MapPin class="w-4 h-4 text-header-primary mt-0.5 shrink-0" />
                <span>74/1 (1st Floor), Rajonigondha Bhaban, Science Laboratory Road, Dhanmondi, Dhaka 1205, Bangladesh</span>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <a 
              v-for="social in socialLinks" 
              :key="social.label" 
              :href="social.href" 
              :aria-label="social.label"
              target="_blank"
              rel="noopener noreferrer"
              class="w-10 h-10 border border-header-border hover:border-header-primary rounded-full flex items-center justify-center transition-all duration-300 hover:bg-header-primary hover:text-header-primary-foreground group shadow-sm"
            >
              <component 
                :is="social.icon" 
                class="w-5 h-5 text-header-muted-foreground group-hover:text-header-primary-foreground transition-colors duration-300" 
              />
            </a>
          </div>
        </div>

        <!-- Links Grid -->
        <div
          v-for="section in footerSections"
          :key="section.id"
          :class="['space-y-1.5 sm:space-y-2 lg:space-y-4 px-0', getResponsiveColumnAlignClass(section.alignClass)]"
        >
          <h4 class="font-bold text-xs sm:text-sm uppercase tracking-widest text-header-foreground px-0 mx-0">{{ section.title }}</h4>
          <FooterNavList
            v-if="section.links.length > 0"
            :items="section.links"
            :align-class="section.alignClass"
          />
        </div>
      </div>

      <!-- TEMPORARILY DISABLED: Footer Newsletter Subscription -->
      <!-- Restore when the newsletter feature is required again. -->
      <!--
      <div class="p-6 sm:p-8 md:p-12 bg-muted rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 sm:gap-8 mb-12 sm:mb-20">
        <div class="space-y-2 text-center md:text-left">
          <h3 class="text-xl sm:text-2xl font-display font-bold">Join Best Computer Hub Insider</h3>
          <p class="text-muted-foreground text-xs sm:text-sm">Expert reviews, early access to hardware drops, and weekly deep dives.</p>
        </div>
        <div class="flex flex-col sm:flex-row w-full md:w-auto max-w-md gap-2.5">
          <div class="relative flex-grow">
            <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <input type="email" placeholder="Your work email" class="w-full h-11 sm:h-12 bg-background border rounded-full px-11 sm:px-12 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-xs sm:text-sm" />
          </div>
          <UiButton class="rounded-full gap-2 px-6 h-11 sm:h-12 font-bold shrink-0">
            Join <ArrowRight class="w-4 h-4" />
          </UiButton>
        </div>
      </div>
      -->

      <!-- Bottom Bar -->
      <div class="pt-5 sm:pt-6 lg:pt-8 border-t border-header-border flex flex-col md:flex-row justify-center items-center gap-6">
        <div class="flex flex-wrap justify-center gap-6 text-xs font-medium text-header-muted-foreground text-center">
          <span>&copy; {{ currentYear }}, Best Technology BD. All Rights Reserved.</span>
        </div>
      </div>
    </div>
  </footer>
</template>
