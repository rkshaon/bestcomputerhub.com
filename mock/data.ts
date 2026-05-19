export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  stock: number;
  image: string;
  images: string[];
  description: string;
  features: string[];
  specs: Record<string, string>;
  isFeatured?: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
}

export interface Category {
  name: string;
  slug: string;
  description: string;
  image: string;
  count: number;
}

export interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
}

export const CATEGORIES: Category[] = [
  {
    name: 'Laptops',
    slug: 'laptops',
    description: 'High-performance notebooks and workstations for creators and professionals.',
    image: 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&q=80&w=600',
    count: 24
  },
  {
    name: 'Smartphones',
    slug: 'smartphones',
    description: 'Flagship mobile devices engineered with ultra-dynamic processors.',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600',
    count: 18
  },
  {
    name: 'Audio Gear',
    slug: 'audio',
    description: 'Noise-cancelling headphones, high-fidelity earbuds, and studio monitors.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
    count: 32
  },
  {
    name: 'Wearables',
    slug: 'wearables',
    description: 'Reformed fitness watches, tactical smart bands, and next-gen AR eyewear.',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=600',
    count: 15
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Premium desk accessories, mechanical keyboards, mice, and immersive mounts.',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=600',
    count: 45
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'QuantumBook Pro M3 Max',
    slug: 'quantumbook-pro-m3-max',
    category: 'laptops',
    brand: 'TechCore',
    price: 1899,
    originalPrice: 2099,
    rating: 4.9,
    reviewCount: 48,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'The QuantumBook Pro is a powerhouse designed for developers, video editors, and power users. Equipped with TechCore’s custom silicon M3 Max core, it handles extensive compilations and 3D rendering with ease, while maintaining a stunning 22-hour battery life.',
    features: [
      'Custom Silicon M3 Max processor with 16-core CPU and 40-core GPU',
      'Liquid Retina XDR pristine 16.2-inch dynamic display with ProMotion 120Hz',
      'Comprehensive high-speed array including Thunderbolt 4, SDXC, and HDMI 2.1 ports',
      'Revolutionary cooling architecture enabling continuous performance without compromise'
    ],
    specs: {
      'Processor': 'M3 Max 16-Core Node',
      'Memory': '48GB Unified RAM',
      'Storage': '1TB NVMe PCIe Gen4 SSD',
      'Display': '16.2-inch (3456 x 2234) Mini-LED XDR',
      'Battery Life': 'Up to 22 hrs runtime',
      'Operating System': 'CoreOS Sierra Build 14',
      'Weight': '4.7 lbs (2.13 kg)',
      'Wi-Fi': 'Wi-Fi 7 Ready'
    },
    isFeatured: true,
    isNew: false,
    isOnSale: true
  },
  {
    id: 'prod-002',
    name: 'AeroPhone 16 Pro Cinematic',
    slug: 'aerophone-16-pro-cinematic',
    category: 'smartphones',
    brand: 'Aero',
    price: 1099,
    rating: 4.8,
    reviewCount: 124,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1592890284241-d1fd0da5570a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1565849906461-0ee2658414fa?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'The AeroPhone 16 Pro redefines smartphone perfection. Sporting a highly aesthetic titanium aerospace shell and custom high-resolution triple cameras, it allows filmmakers to shoot flawless 4K video at 120 FPS. Powering everything is the Aero A18 Bionic chip.',
    features: [
      'Grade-5 Aerospace Titanium chassis offering extreme durability and light weight',
      'Advanced 48MP Pro DSLR Triple Camera arrangement with Periscope Optical Zoom',
      'LTPO Super Retina display with 2000-nits peak outdoor luminance',
      'New secure Action Module for fast-triggering customized camera configurations'
    ],
    specs: {
      'Processor': 'A18 Neural Bionic 3nm',
      'Memory': '8GB LPDDR5X RAM',
      'Storage': '256GB High-Speed Flash',
      'Display': '6.7-inch Super LTPO OLED 120Hz',
      'Rear Camera': '48MP Main + 48MP UltraWide + 12MP Telephoto',
      'Front Camera': '12MP TrueShield',
      'Battery Capacity': '4,420 mAh with Qi2 Support',
      'Dust/Water': 'IP68 Certified Ingress-Resist'
    },
    isFeatured: true,
    isNew: true,
    isOnSale: false
  },
  {
    id: 'prod-003',
    name: 'SoundWave Elite ANC Headphones',
    slug: 'soundwave-elite-anc-headphones',
    category: 'audio',
    brand: 'Wave',
    price: 349,
    originalPrice: 399,
    rating: 4.7,
    reviewCount: 89,
    stock: 18,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Escape your environment with industry-leading Active Noise Cancellation. SoundWave Elite includes specialized custom-tuned dynamic drivers that deliver rich base, crisp high registers, and high-resolution spatial details for true sound connoisseurs.',
    features: [
      'Exclusive Smart Hybrid ANC actively nullifying up to 45dB external noise frequencies',
      '40mm custom bio-cellulose drivers offering rich, low-distortion studio grade audio',
      'Plush, premium memory-foam leather cups built for multi-hour wearing luxury',
      'Up to 50 hours of wireless playbook with ANC turned off, USB-C quick-charge active'
    ],
    specs: {
      'Driver Size': '40 mm Custom Bio-cellulose',
      'Frequency Response': '4Hz - 40,000Hz (Hi-Res Audio Cert)',
      'Active ANC': 'Hybrid Multi-Mic 4-Level ANC',
      'Bluetooth': 'v5.4 Multi-Point Connection',
      'Battery Life': '38 hours (ANC Active) / 50 hours (ANC Inert)',
      'CODECs': 'LDAC, AAC, SBC, aptX Adaptive'
    },
    isFeatured: true,
    isNew: false,
    isOnSale: true
  },
  {
    id: 'prod-004',
    name: 'Horizon UltraWide 34i Curved Monitor',
    slug: 'horizon-ultrawide-34i-curved-monitor',
    category: 'accessories',
    brand: 'Horizon',
    price: 799,
    rating: 4.6,
    reviewCount: 42,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Shatter boundaries with the Horizon 34-inch panoramic curved monitor. Boasting a striking 1500R curved profile and pristine quantum-dot IPS display, this unit guarantees professional-tier color fidelity alongside ultra-fluid 165Hz response timers.',
    features: [
      'Immersive 1500R curved ultra-wide gaming and workstation display standard',
      'QHD ultrawide resolution (3440 x 1440 px) with extreme detail density',
      '99% DCI-P3 wide color scale ideal for grading digital photography and cinema',
      'Integrated USB-C Hub interface outputting 95W single-cable power and video'
    ],
    specs: {
      'Screen Size': '34-inch Panoramic Curve',
      'Panel Tech': 'IPS Quantum-Dot Backlight',
      'Resolution': 'WQHD (3440 x 1440) 21:9 Aspect Ratio',
      'Refresh Rate': '165Hz Sync Mode',
      'Response Time': '1ms GtG Trigger',
      'I/O Ports': '2x HDMI 2.1, 1x DP 1.4, 1x USB-C (95W Power Delivery)',
      'Ergonomics': 'Height, Tilt, Swivel fully adjustable'
    },
    isFeatured: false,
    isNew: false,
    isOnSale: false
  },
  {
    id: 'prod-005',
    name: 'KeyForge Mechanical Pro Keyboard',
    slug: 'keyforge-mechanical-pro-keyboard',
    category: 'accessories',
    brand: 'KeyForge',
    price: 189,
    rating: 4.8,
    reviewCount: 76,
    stock: 30,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Engineered specifically for writers and developers. KeyForge Pro is a 75% wireless mechanical keyboard built with hot-swappable tactile linear quiet keys, full solid gasket shock mounting, and a solid anodized CNC aluminum structure weight.',
    features: [
      'Acoustically sound multi-layer silencing gaskets under switches',
      'Universal hot-swappable modular keyboard array supporting 3/5-pin switches',
      'Tri-mode connectivity: Bluetooth 5.2, Wireless 2.4GHz dongle, and Type-C routing',
      'Immersive customizable active per-key RGB backlighting arrays and patterns'
    ],
    specs: {
      'Form Factor': '75% Layout (84 Keys)',
      'Body Material': 'Anodized CNC Aluminum Plate',
      'Switches': 'TechCore Linear Silent Fox Switches',
      'Keycaps': 'Double-shot PBT Cherry Profile',
      'Mount Style': 'Dual-Gasket Soft Cushion',
      'Wireless Sync': 'Up to 3 host machines concurrent'
    },
    isFeatured: false,
    isNew: true,
    isOnSale: false
  },
  {
    id: 'prod-006',
    name: 'CoreBuds Active Pro Earbuds',
    slug: 'corebuds-active-pro-earbuds',
    category: 'audio',
    brand: 'Wave',
    price: 149,
    originalPrice: 179,
    rating: 4.5,
    reviewCount: 54,
    stock: 40,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Immaculately compact, sweatproof, and ready for high-intensity work. CoreBuds Pro deliver beautiful spatial sound in a highly ergonomic build, locking firmly into place regardless of your active core trajectory.',
    features: [
      'Adaptive Spatial Audio head-tracking engine mimicking concert setups',
      'Fully IPX7 rated liquid immersion and dust sealed protection standards',
      'Secure lock-fit ear tips staying tightly anchored in standard canals',
      'Compact docking case with Qi wireless power support and fast-charging'
    ],
    specs: {
      'Earpiece Weight': '4.8 grams per pod',
      'Waterproof Rate': 'IPX7 Certified Resistance',
      'Battery Specs': '8 hours pods charging + 24 hours extra in cradle',
      'Dynamic Engine': '11 mm Custom Composite Driver',
      'Bluetooth': 'V5.3 featuring Dual Connect LE'
    },
    isFeatured: false,
    isNew: false,
    isOnSale: true
  },
  {
    id: 'prod-007',
    name: 'Chronos Smart Fitness Watch 5',
    slug: 'chronos-smart-fitness-watch-5',
    category: 'wearables',
    brand: 'Chronos',
    price: 299,
    rating: 4.7,
    reviewCount: 65,
    stock: 14,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Your holistic health supervisor. Chronos Watch 5 keeps tabs on heart rhythms, oxygen structures, sleep density, and athletic load, visualizing vital diagnostics on an immersive, scratchproof sapphire OLED face.',
    features: [
      'Pre-installed active telemetry monitor tracking ECG, sleep cycles, and daily caloric load',
      'Resolute Aerospace Sapphire active screen guard ensuring high scratch immunity',
      'Integrated dual-band GPS receiver mapping dynamic hiking trails offline',
      'Up to 10 days of battery life on a single fast-charge cycle'
    ],
    specs: {
      'Processor': 'Chronos Dual-Core CoreLink SoC',
      'Display': '1.43-inch AMOLED (466x466) Sapphire Touch',
      'GPS': 'Dual frequency L1+L5 multi-satellite GPS',
      'Sensors': 'Optical heart sensor, ECG monitor, accelerometer, altimeter',
      'Material': 'Anodized aluminum with fluororubber sports band',
      'Battery': '450 mAh delivering up to 10 days standard use'
    },
    isFeatured: true,
    isNew: false,
    isOnSale: false
  },
  {
    id: 'prod-008',
    name: 'TechCore Zenith AR Smart Glasses',
    slug: 'techcore-zenith-ar-smart-glasses',
    category: 'wearables',
    brand: 'TechCore',
    price: 499,
    rating: 4.9,
    reviewCount: 31,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Immerse your daily workflow in spatial information. Zenith glasses cast high-resolution digital layers directly onto your field of vision, helping you navigate directions, read notifications hands-free, and monitor diagnostic logs.',
    features: [
      'Twin micro-OLED projections rendering crystal clear 1080p spatial graphics',
      'Dual active directional speakers providing isolated audio directly to listeners',
      'Extremely lightweight frame weighing only 72 grams for all-day comfort',
      'Onboard 5MP wide action logging lens with visual recording LED indicators'
    ],
    specs: {
      'Optics': 'Dual Holographic Waveguides',
      'Resolution': '1080p per eye virtual viewport',
      'Processor': 'TechCore GlassLink Low-Power SoC',
      'Connectivity': 'WiFi 6E and Bluetooth 5.3 Low Energy',
      'Battery Life': 'Up to 4 hours active AR execution / 14 hours audio only',
      'Weight': '72 grams (2.53 oz)'
    },
    isFeatured: true,
    isNew: true,
    isOnSale: false
  }
];

export const REVIEWS: Record<string, Review[]> = {
  'prod-001': [
    { id: 'rev-101', author: 'Markus D.', rating: 5, date: '2026-04-12', title: 'Absolute Dev Machine', comment: 'As an iOS engineer, building large source chains takes a fraction of the time. The thermal routing holds extremely cool even during 4-hour compilation bursts. Battery is solid as a rock.', verified: true },
    { id: 'rev-102', author: 'Sarah K.', rating: 5, date: '2026-05-01', title: 'Photorealist grading display', comment: 'The Mini-LED black values are exceptionally dark, rivaling studio monitors. Worth every single cent.', verified: true }
  ],
  'prod-002': [
    { id: 'rev-201', author: 'James Miller', rating: 5, date: '2026-05-10', title: 'Pro Cinematic Masterclass', comment: 'The Action button config works incredibly well to trigger recording parameters instantly. Color profiles are flawless in ProRes format.', verified: true }
  ]
};

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: 'art-01',
    title: 'The Rise of 3nm Architecture on Consumer Chips',
    slug: 'rise-of-3nm-architecture',
    excerpt: 'Explore how modern silicon nodes are reducing thermal profiles while increasing efficiency beyond standard silicon nodes.',
    content: 'The technology landscape is undergoing a massive shift. With the commercial deployment of 3-nanometer silicon chipsets, consumer hardware is achieving performance milestones once reserved for bulky server workstations. We dissect the gate-all-around layout, active leakage controls, and the real-world battery implications for developers and power users.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    category: 'Silicon',
    date: 'May 14, 2026',
    readTime: '6 min read',
    author: 'Elena Rostova, Chief Research Analyst'
  },
  {
    id: 'art-02',
    title: 'Designing Workspace Environments for Peak Performance',
    slug: 'designing-workspace-environments',
    excerpt: 'An evidence-based study detailing how display layout, smart optics, and acoustic insulation impact productivity indices.',
    content: 'Productivity is directly tied to sensory input. Our continuous testing indicates that acoustic thresholds, screen curves (like those found in 1500R panoramic panels), and custom backlighting significantly reduce occupational fatigue. This research guide showcases how to craft a desk setup designed specifically for high-intensity engineering environments.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
    category: 'Workspaces',
    date: 'April 28, 2026',
    readTime: '8 min read',
    author: 'Daniel Vance, Ergonomics Specialist'
  }
];
