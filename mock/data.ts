import type { Category, Product, BlogPost } from '@/types';

export const categories: Category[] = [
  {
    id: 'cat-1',
    name: 'Laptops',
    slug: 'laptops',
    description: 'High-performance laptops for gaming, work, and creative tasks.',
    subCategories: ['gaming-laptops', 'ultrabooks', 'workstations']
  },
  {
    id: 'cat-gaming-laptops',
    name: 'Gaming Laptops',
    slug: 'gaming-laptops',
    parentCategoryId: 'cat-1'
  },
  {
    id: 'cat-ultrabooks',
    name: 'Ultrabooks',
    slug: 'ultrabooks',
    parentCategoryId: 'cat-1'
  },
  {
    id: 'cat-workstations',
    name: 'Workstations',
    slug: 'workstations',
    parentCategoryId: 'cat-1'
  },
  {
    id: 'cat-2',
    name: 'Desktops',
    slug: 'desktops',
    description: 'Powerful desktop computers for maximum performance.',
    subCategories: ['gaming-desktops', 'all-in-one', 'mini-pcs']
  },
  {
    id: 'cat-3',
    name: 'Components',
    slug: 'components',
    description: 'Individual parts for building or upgrading your PC.',
    subCategories: ['processors', 'graphics-cards', 'motherboards', 'ram', 'storage']
  },
  {
    id: 'cat-4',
    name: 'Peripherals',
    slug: 'peripherals',
    description: 'Keyboards, mice, and other input devices.',
    subCategories: ['keyboards', 'mice', 'headsets', 'webcams']
  }
];

export const products: Product[] = [
  {
    id: 'p-1',
    name: 'Quantum X Pro Gaming Laptop',
    slug: 'quantum-x-pro-gaming-laptop',
    description: 'The ultimate gaming powerhouse with RTX 4090 and 64GB DDR5 RAM.',
    price: 3499.99,
    originalPrice: 3799.99,
    category: 'cat-1',
    subCategory: 'gaming-laptops',
    brand: 'Quantum',
    images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=800'],
    stock: 12,
    rating: 4.9,
    reviewCount: 128,
    specifications: {
      'Processor': 'Intel Core i9-14900HX',
      'Memory': '64GB DDR5 5600MHz',
      'Storage': '2TB NVMe Gen4 SSD',
      'GPU': 'NVIDIA GeForce RTX 4090 16GB VRAM'
    },
    features: ['Ray Tracing', '240Hz QHD Display', 'Mechanical Keyboard'],
    isFeatured: true,
    onSale: true,
    sku: 'QX-PRO-9000'
  },
  {
    id: 'p-4',
    name: 'Apex Stealth 14 Gaming Laptop',
    slug: 'apex-stealth-14-gaming-laptop',
    description: 'Ultra-portable 14" gaming laptop with RTX 4070 and OLED display.',
    price: 1799.99,
    originalPrice: 1999.99,
    category: 'cat-1',
    subCategory: 'gaming-laptops',
    brand: 'Apex',
    images: ['https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&q=80&w=800'],
    stock: 8,
    rating: 4.8,
    reviewCount: 45,
    specifications: {
      'Processor': 'Ryzen 9 8945HS',
      'Memory': '32GB DDR5',
      'Storage': '1TB NVMe SSD',
      'GPU': 'RTX 4070'
    },
    features: ['OLED 120Hz', 'Magnesium Chassis', 'Per-key RGB'],
    onSale: true,
    sku: 'APEX-S14-G'
  },
  {
    id: 'p-10',
    name: 'AeroFlow Pro Cooling Fan',
    slug: 'aeroflow-pro-cooling-fan',
    description: 'Premium 120mm PWM fan with fluid dynamic bearing for silent operation.',
    price: 19.99,
    originalPrice: 29.99,
    category: 'cat-3',
    subCategory: 'cooling',
    brand: 'AeroFlow',
    images: ['https://images.unsplash.com/photo-1587202376732-8179263035b1?auto=format&fit=crop&q=80&w=800'],
    stock: 200,
    rating: 4.9,
    reviewCount: 567,
    specifications: {
      'Size': '120mm',
      'RPM': '500-2000',
      'Noise': '18dB',
      'Bearing': 'FDB'
    },
    features: ['PWM Control', 'Anti-vibration Pads', '6-year Warranty'],
    onSale: true,
    sku: 'AF-PRO-120'
  },
  {
    id: 'p-11',
    name: 'Lumina RGB LED Strip Kit',
    slug: 'lumina-rgb-led-strip-kit',
    description: 'Addressable RGB LED strips for your PC case with magnetic mounting.',
    price: 34.99,
    originalPrice: 49.99,
    category: 'cat-3',
    subCategory: 'accessories',
    brand: 'Lumina',
    images: ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800'],
    stock: 150,
    rating: 4.4,
    reviewCount: 89,
    specifications: {
      'Length': '2x 40cm',
      'LEDs': '60/m',
      'Interface': '3-pin ARGB',
      'Mounting': 'Magnetic/3M'
    },
    features: ['Individually Addressable', 'Diffused Light', 'Universal Sync'],
    onSale: true,
    sku: 'LUM-RGB-KIT'
  },
  {
    id: 'p-5',
    name: 'Zenith Workstation Z1',
    slug: 'zenith-workstation-z1',
    description: 'Enterprise workstation for AI development and data science.',
    price: 4999.99,
    category: 'cat-1',
    subCategory: 'workstations',
    brand: 'Zenith',
    images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=800'],
    stock: 5,
    rating: 5.0,
    reviewCount: 12,
    specifications: {
      'Processor': 'Threadripper 7980X',
      'Memory': '128GB ECC RAM',
      'Storage': '4TB RAID 0 SSD',
      'GPU': 'NVIDIA RTX 6000 Ada'
    },
    features: ['ISV Certified', 'ECC Memory', 'Liquid Cooled'],
    isNew: true,
    sku: 'ZEN-Z1-WS'
  },
  {
    id: 'p-6',
    name: 'CoreFlow i9-14900K Processor',
    slug: 'coreflow-i9-14900k-processor',
    description: 'The fastest desktop processor for enthusiasts and creators.',
    price: 589.99,
    category: 'cat-3',
    subCategory: 'processors',
    brand: 'CoreFlow',
    images: ['https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=800'],
    stock: 100,
    rating: 4.9,
    reviewCount: 890,
    specifications: {
      'Cores': '24 (8P + 16E)',
      'Threads': '32',
      'Boost Clock': '6.0 GHz',
      'Cache': '36MB L3'
    },
    features: ['Unlocked', 'DDR5 Support', 'PCIe 5.0'],
    isNew: true,
    sku: 'CF-I9-149K'
  },
  {
    id: 'p-7',
    name: 'Velocity RTX 4080 Super',
    slug: 'velocity-rtx-4080-super',
    description: 'High-end graphics card for 4K gaming and professional rendering.',
    price: 1199.99,
    category: 'cat-3',
    subCategory: 'graphics-cards',
    brand: 'Velocity',
    images: ['https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800'],
    stock: 15,
    rating: 4.7,
    reviewCount: 230,
    specifications: {
      'VRAM': '16GB GDDR6X',
      'Interface': 'PCIe 4.0',
      'Outputs': '3x DP, 1x HDMI',
      'Power': '320W TDP'
    },
    features: ['DLSS 3.5', 'Ray Tracing', 'Tri-Fan Cooling'],
    isNew: true,
    sku: 'VEL-4080S'
  },
  {
    id: 'p-2',
    name: 'UltraWide Vision 34" Curved Monitor',
    slug: 'ultrawide-vision-34-curved-monitor',
    description: 'Immersive 3440x1440p resolution with 165Hz refresh rate.',
    price: 699.99,
    category: 'cat-3',
    subCategory: 'monitors',
    brand: 'VisionTech',
    images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800'],
    stock: 25,
    rating: 4.7,
    reviewCount: 342,
    specifications: {
      'Size': '34 Inches',
      'Resolution': '3440 x 1440',
      'Refresh Rate': '165Hz',
      'Panel Type': 'IPS'
    },
    features: ['Curved Panel', 'HDR400 Support', 'USB-C Hub'],
    isNew: true,
    sku: 'VIS-34C-165'
  },
  {
    id: 'p-3',
    name: 'Titan G1 Mechanical Keyboard',
    slug: 'titan-g1-mechanical-keyboard',
    description: 'Tactile blue switches with customizable per-key RGB lighting.',
    price: 149.99,
    category: 'cat-4',
    subCategory: 'keyboards',
    brand: 'Titan',
    images: ['https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=800'],
    stock: 50,
    rating: 4.5,
    reviewCount: 156,
    specifications: {
      'Switch Type': 'Tactile Blue',
      'Connectivity': 'USB-C Wired',
      'Lighting': 'Per-key RGB'
    },
    features: ['Metal Frame', 'Macro Support', 'Braided Cable'],
    isNew: true,
    sku: 'TITAN-G1-KB'
  },
  {
    id: 'p-8',
    name: 'Swift Air M3 Ultrabook',
    slug: 'swift-air-m3-ultrabook',
    description: 'The thinnest and lightest laptop with 20-hour battery life.',
    price: 1299.99,
    category: 'cat-1',
    subCategory: 'ultrabooks',
    brand: 'Swift',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800'],
    stock: 20,
    rating: 4.6,
    reviewCount: 450,
    specifications: {
      'Battery': '20 Hours',
      'Weight': '2.2 lbs',
      'Display': 'Retina Flow'
    },
    features: ['Silent Design', 'Touch ID', 'MagSafe'],
    isNew: true,
    sku: 'SWIFT-M3-U'
  },
  {
    id: 'p-9',
    name: 'Precision Mouse Pro',
    slug: 'precision-mouse-pro',
    description: 'Ergonomic mouse with 26,000 DPI and infinity scroll.',
    price: 79.99,
    category: 'cat-4',
    subCategory: 'mice',
    brand: 'VisionTech',
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=800'],
    stock: 120,
    rating: 4.8,
    reviewCount: 1500,
    specifications: {
      'DPI': '26,000',
      'Weight': '63g',
      'Battery': '140 Hours'
    },
    features: ['Wireless', 'Hyper-polling', 'PTFE Feet'],
    sku: 'VIS-PRO-M'
  }
];

export const blogPosts: BlogPost[] = [
  {
    id: 'blog-1',
    title: 'The Evolution of Portable Computing in 2026',
    slug: 'evolution-of-portable-computing-2026',
    excerpt: 'How Quantum processors and transparent OLED displays are redefining what we call a laptop.',
    content: `
      <p>The landscape of portable computing has undergone a seismic shift over the last twelve months. We are no longer looking at incremental performance gains; we are witnessing a fundamental redesign of human-computer interaction.</p>
      
      <h2>The Rise of Quantum Processing</h2>
      <p>With the integration of room-temperature quantum dots into standard workstation chipsets, the raw computational power available to mobile professionals has tripled. Tasks that previously required bulky tower desktops—such as real-time 8K video rendering and large-scale architectural simulation—are now being handled on devices thinner than a standard magazine.</p>

      <blockquote>"The bottleneck is no longer the hardware; it's how fast the user can think." - Dr. Aris Thorne, Lead Architect at Quantum Labs</blockquote>

      <h2>Connectivity and the Neural Web</h2>
      <p>6G integration has become the standard for the TechCore Pro line, ensuring that latency is a relic of the past. For enterprise teams, this means collaborative environments that feel local, regardless of geographical distribution.</p>
    `,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800',
    category: 'Insights',
    author: {
      name: 'Sarah Chen',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
      role: 'Hardware Analyst'
    },
    publishedAt: '2026-05-10',
    readingTime: '6 min read',
    tags: ['Computing', 'Quantum', 'Hardware']
  },
  {
    id: 'blog-2',
    title: 'Optimizing Your Workstation for Deep Learning',
    slug: 'optimizing-workstation-deep-learning',
    excerpt: 'A comprehensive guide to selecting GPUs and cooling systems for local AI development.',
    content: `
      <p>Artificial Intelligence development has moved from the cloud back to the edge. High-performance local workstations are now the preferred environment for initial model training and fine-tuning.</p>
      
      <h2>GPU Architecture in 2026</h2>
      <p>When selecting a GPU for deep learning, VRAM bandwidth is more critical than raw clock speed. The latest RTX enterprise series offers unified memory architectures that allow for massive parameter sharing across NVLink clusters.</p>

      <h3>Key Cooling Considerations</h3>
      <ul>
        <li>Active Liquid-to-Air heat exchangers for sustained load.</li>
        <li>Phase-change thermal interface materials for zero-maintenance long-term stability.</li>
        <li>Inductive airflow fans that vary speed based on moisture-sensor data.</li>
      </ul>
    `,
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    category: 'Guides',
    author: {
      name: 'Marcus Vane',
      avatar: 'https://i.pravatar.cc/150?u=marcus',
      role: 'System Architect'
    },
    publishedAt: '2026-05-14',
    readingTime: '12 min read',
    tags: ['AI', 'Workstations', 'Engineering']
  }
];
