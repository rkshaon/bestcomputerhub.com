// File: /data/heroSlides.ts
import type { HeroSlideData } from '@/types/hero';

export const HERO_SLIDES: HeroSlideData[] = [
  {
    id: 'slide-1',
    primary: {
      badgeIcon: 'Trophy',
      badgeText: '#1 Tech Retailer 2026',
      titlePrefix: 'The Future of ',
      titleHighlight: 'Hardware',
      description: 'Elevate your digital workflow with exclusive access to top-tier components, enterprise servers, and precision engineering.',
      image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&q=80&w=2000',
      primaryAction: {
        label: 'Explore Catalog',
        href: '/products'
      },
      secondaryAction: {
        label: 'View Special Offers',
        href: '/offers'
      }
    },
    secondary: [
      {
        badgeIcon: 'Server',
        badgeText: 'Enterprise Solution',
        badgeVariant: 'primary',
        title: 'Advanced Server Architecture',
        description: 'Custom-configured enterprise server racks & high-density compute solutions for scale.',
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1000',
        href: '/products'
      },
      {
        badgeIcon: 'Cpu',
        badgeText: 'Featured Rig',
        badgeVariant: 'emerald',
        title: 'Workstation Customization',
        description: 'Tailored multi-GPU rigs and precision liquid cooling built for professional creators.',
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&q=80&w=1000',
        href: '/offers'
      }
    ]
  },
  {
    id: 'slide-2',
    primary: {
      badgeIcon: 'Zap',
      badgeText: 'Next-Gen Performance',
      titlePrefix: 'Extreme Gaming & ',
      titleHighlight: 'AI Rigs',
      description: 'Unleash raw power with latest-gen GPUs, liquid-cooled custom loops, and overclocked multi-core processors.',
      image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=2000',
      primaryAction: {
        label: 'Configure Rig',
        href: '/products'
      },
      secondaryAction: {
        label: 'Gaming Deals',
        href: '/offers'
      }
    },
    secondary: [
      {
        badgeIcon: 'Sparkles',
        badgeText: 'Flagship GPU Stock',
        badgeVariant: 'amber',
        title: 'RTX & RX Series Available',
        description: 'In-stock high performance graphic cards with official brand warranty and instant dispatch.',
        image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=1000',
        href: '/products'
      },
      {
        badgeIcon: 'Trophy',
        badgeText: 'Tournament Grade',
        badgeVariant: 'blue',
        title: 'Pro Gaming Peripherals',
        description: 'Low-latency mechanical keyboards, ultra-light mice, and high refresh rate gaming displays.',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000',
        href: '/products'
      }
    ]
  },
  {
    id: 'slide-3',
    primary: {
      badgeIcon: 'ShieldCheck',
      badgeText: 'Enterprise Storage',
      titlePrefix: 'High-Density ',
      titleHighlight: 'Cloud & Storage',
      description: 'Reliable enterprise NVMe SAN arrays, redundant power infrastructure, and 24/7 mission-critical support.',
      image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=2000',
      primaryAction: {
        label: 'View Storage Systems',
        href: '/products'
      },
      secondaryAction: {
        label: 'Enterprise Support',
        href: '/support/help-center'
      }
    },
    secondary: [
      {
        badgeIcon: 'Layers',
        badgeText: 'Data Center Grade',
        badgeVariant: 'primary',
        title: 'PCIe Gen5 NVMe Arrays',
        description: 'Unmatched IOPS performance for databases, virtualized servers, and AI training clusters.',
        image: 'https://images.unsplash.com/photo-1600267175161-cfaa711b4a81?auto=format&fit=crop&q=80&w=1000',
        href: '/products'
      },
      {
        badgeIcon: 'Server',
        badgeText: 'Power Backup',
        badgeVariant: 'emerald',
        title: 'UPS & Infrastructure',
        description: 'Online double-conversion UPS units ensuring zero downtime for mission-critical setups.',
        image: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&q=80&w=1000',
        href: '/products'
      }
    ]
  }
];
