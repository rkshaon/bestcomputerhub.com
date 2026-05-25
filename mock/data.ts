import type { Product, Category, Brand, BlogPost } from '@/types';

export const categories: Category[] = [
  {
    id: 'cat_gpu',
    name: 'Graphics Processors',
    slug: 'gpus',
    description: 'High-performance graphic processing units for enterprise deep learning, AI modeling, and rendering tasks.',
    subCategories: ['nvidia-rtx', 'amd-radeon', 'datacenter-accelerators'],
    order: 10
  },
  {
    id: 'nvidia-rtx',
    name: 'NVIDIA RTX',
    slug: 'nvidia-rtx',
    parentCategoryId: 'cat_gpu',
    description: 'Workstation graphic processing units powered by NVIDIA architecture.',
    order: 11
  },
  {
    id: 'amd-radeon',
    name: 'AMD Radeon',
    slug: 'amd-radeon',
    parentCategoryId: 'cat_gpu',
    description: 'High-performance graphic hardware from AMD.',
    order: 12
  },
  {
    id: 'datacenter-accelerators',
    name: 'Data Center Accelerators',
    slug: 'datacenter-accelerators',
    parentCategoryId: 'cat_gpu',
    description: 'AI and compute accelerators for data centers.',
    order: 13
  },
  {
    id: 'cat_cpu',
    name: 'Processors',
    slug: 'processors',
    description: 'Server and workstation grade central processing units optimized for heavy parallel workloads.',
    subCategories: ['intel-xeon', 'amd-epyc', 'workstation-threadripper'],
    order: 20
  },
  {
    id: 'intel-xeon',
    name: 'Intel Xeon',
    slug: 'intel-xeon',
    parentCategoryId: 'cat_cpu',
    description: 'Computing nodes powered by Intel Xeon series processors.',
    order: 21
  },
  {
    id: 'amd-epyc',
    name: 'AMD EPYC',
    slug: 'amd-epyc',
    parentCategoryId: 'cat_cpu',
    description: 'Computing power powered by AMD Epyc processors.',
    order: 22
  },
  {
    id: 'workstation-threadripper',
    name: 'Threadripper PRO',
    slug: 'workstation-threadripper',
    parentCategoryId: 'cat_cpu',
    description: 'Extreme processors for workstation compute.',
    order: 23
  },
  {
    id: 'cat_server',
    name: 'Enterprise Servers',
    slug: 'servers',
    description: 'High-density rack servers and workstation nodes designed for 24/7 reliability and computing power.',
    subCategories: ['rackmount-servers', 'blade-enclosures', 'gpu-compute-servers'],
    order: 30
  },
  {
    id: 'rackmount-servers',
    name: 'Rackmount Servers',
    slug: 'rackmount-servers',
    parentCategoryId: 'cat_server',
    description: 'High performance rackmount servers.',
    order: 31
  },
  {
    id: 'blade-enclosures',
    name: 'Blade Enclosures',
    slug: 'blade-enclosures',
    parentCategoryId: 'cat_server',
    description: 'High density blade cabinets.',
    order: 32
  },
  {
    id: 'gpu-compute-servers',
    name: 'GPU Compute Servers',
    slug: 'gpu-compute-servers',
    parentCategoryId: 'cat_server',
    description: 'Servers designed for dense AI acceleration.',
    order: 33
  }
];

export const brands: Brand[] = [
  {
    id: 'brand_nvidia',
    name: 'NVIDIA',
    slug: 'nvidia',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&q=80',
    description: 'Pioneers of GPU computing and AI enterprise hardware innovations.',
    productCount: 142
  },
  {
    id: 'brand_amd',
    name: 'AMD',
    slug: 'amd',
    logo: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&h=150&fit=crop&q=80',
    description: 'High-performance workstation and datacenter processing architectures.',
    productCount: 98
  },
  {
    id: 'brand_intel',
    name: 'Intel',
    slug: 'intel',
    logo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&h=150&fit=crop&q=80',
    description: 'Enterprise server platforms and cloud computing processors.',
    productCount: 125
  },
  {
    id: 'brand_supermicro',
    name: 'Supermicro',
    slug: 'supermicro',
    logo: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=150&h=150&fit=crop&q=80',
    description: 'Premium enterprise application-optimized node designs.',
    productCount: 64
  }
];

export const products: Product[] = [
  {
    id: 'prod_1',
    name: 'RTX 4090 Extreme Edition',
    slug: 'rtx-4090-extreme',
    description: 'The ultimate graphics workstation card featuring advanced architectural Ada Lovelace technology and 24GB of G6X memory.',
    price: 1999.99,
    originalPrice: 2299.99,
    category: 'cat_gpu',
    subCategory: 'nvidia-rtx',
    brand: 'NVIDIA',
    images: [
      'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop&q=80'
    ],
    stock: 3,
    rating: 4.9,
    reviewCount: 38,
    specifications: {
      'Cuda Cores': '16384',
      'Memory': '24GB GDDR6X',
      'Memory Bus': '384-bit',
      'TGP': '450W'
    },
    features: [
      'NVIDIA DLSS 3 Support',
      'Ray Tracing Cores Gen 3',
      'Dedicated Tensor Cores Gen 4',
      'PCI Express Gen 4.0 Interface'
    ],
    isFeatured: true,
    isNew: true,
    onSale: true,
    sku: 'NV-RTX4090-EXT'
  },
  {
    id: 'prod_2',
    name: 'AMD Threadripper PRO 7995WX',
    slug: 'threadripper-pro-7995wx',
    description: 'Breakthrough performance with 96 cores and 192 threads for rendering computations and complex simulation tasks.',
    price: 9999.99,
    category: 'cat_cpu',
    subCategory: 'workstation-threadripper',
    brand: 'AMD',
    images: [
      'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80'
    ],
    stock: 8,
    rating: 5.0,
    reviewCount: 14,
    specifications: {
      'Cores/Threads': '96 / 192',
      'Base Clock': '2.5 GHz',
      'Max Boost Clock': '5.1 GHz',
      'L3 Cache': '384MB'
    },
    features: [
      '128 PCIe Gen 5 Lanes Support',
      '8-channel DDR5 Memory Support',
      'Enterprise security features built-in',
      'Designed for extreme multi-threaded software'
    ],
    isFeatured: true,
    sku: 'AMD-TR-7995WX'
  },
  {
    id: 'prod_3',
    name: 'Supermicro SYS-421GE Rack Server',
    slug: 'supermicro-sys-421ge',
    description: 'A massive 4U dual-socket Intel Xeon system optimized for intense AI workloads and virtualization deployments.',
    price: 15499.99,
    originalPrice: 16999.99,
    category: 'cat_server',
    subCategory: 'gpu-compute-servers',
    brand: 'Supermicro',
    images: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop&q=80'
    ],
    stock: 12,
    rating: 4.8,
    reviewCount: 7,
    specifications: {
      'Form Factor': '4U Rackmount',
      'CPU Sockets': 'Dual Socket E (LGA-4677)',
      'Drive Bays': '24x Hot-swap 2.5" NVMe/SATA',
      'Power Supply': 'Redundant 2000W Titanium Level'
    },
    features: [
      'Support for up to 8 dual-slot GPUs',
      'Intel Xeon Scalable Processors support',
      'PCIe Gen 5 high bandwidth expansion',
      'Integrated IPMI 2.0 system control'
    ],
    isFeatured: true,
    onSale: true,
    isNew: false,
    sku: 'SM-SYS-421GE'
  },
  {
    id: 'prod_4',
    name: 'Intel Xeon Platinum 8490H',
    slug: 'xeon-platinum-8490h',
    description: 'High-density multi-socket server CPU built for extreme database, cloud networking, and analytical computational needs.',
    price: 12900.00,
    category: 'cat_cpu',
    subCategory: 'intel-xeon',
    brand: 'Intel',
    images: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop&q=80'
    ],
    stock: 15,
    rating: 4.7,
    reviewCount: 9,
    specifications: {
      'Cores/Threads': '60 / 120',
      'Base Clock': '1.9 GHz',
      'Max Turbo': '3.5 GHz',
      'Thermal Design Power': '350W'
    },
    features: [
      'Intel AMX (Advanced Matrix Extensions)',
      'UPI Speed: 4 links at 16 GT/s',
      'Up to 8-socket configuration scaling',
      'Intel Software Guard Extensions support'
    ],
    isNew: true,
    sku: 'INT-XN-8490H'
  },
  {
    id: 'prod_5',
    name: 'Intel Core i9-14900K Processor',
    slug: 'core-i9-14900k',
    description: 'Standard elite performance desktop CPU with 24 cores (8 P-cores + 16 E-cores) for lightning computation routing.',
    price: 549.99,
    category: 'cat_cpu',
    subCategory: 'intel-xeon',
    brand: 'Intel',
    images: [
      'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80'
    ],
    stock: 0,
    rating: 4.6,
    reviewCount: 154,
    specifications: {
      'Cores/Threads': '24 / 32',
      'Max Turbo Speed': '6.0 GHz',
      'Socket Compatibility': 'LGA-1700',
      'L3 Cache': '36MB'
    },
    features: [
      'Intel Turbo Boost Max Technology 3.0',
      'PCIe 5.0 and 4.0 support',
      'Compatible with Intel 600 & 700 series chipsets',
      'Unlocked for performance customization'
    ],
    sku: 'INT-i9-14900K'
  }
];

export const blogPosts: BlogPost[] = [
  {
    id: 'post_1',
    title: 'The AI Compute Bottleneck: Optimizing Workstations for Deep Learning',
    slug: 'ai-compute-bottleneck-workstations',
    excerpt: 'Analyzing memory bandwidth and pipeline configurations to bypass core GPU wait states in artificial intelligence training.',
    content: 'Enterprise AI workflows demand unprecedented compute density... By pairing high-bandwidth memory configurations with optimized PCIe layouts, engineering teams are cutting latency cycles in half.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop&q=80',
    category: 'Deep Learning',
    author: {
      name: 'Dr. Evelyn Carter',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&q=80',
      role: 'Chief Computing Scientist'
    },
    publishedAt: 'May 10, 2024',
    readingTime: '6 min read',
    tags: ['GPU', 'Deep Learning', 'Workstation', 'Hardware']
  },
  {
    id: 'post_2',
    title: 'PCIe Gen 5.0 vs Gen 6.0: Future-Proofing Corporate Server Deployments',
    slug: 'pcie-gen-5-vs-gen-6-server',
    excerpt: 'A comprehensive technical layout comparing bus architectures, signal integrity issues, and throughput dynamics.',
    content: 'Moving to higher bus frequencies requires addressing critical electromagnetic interference... We trace the progress from early PCIe Gen 5 boards to upcoming PAM4 optical lanes.',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=450&fit=crop&q=80',
    category: 'Infrastructure',
    author: {
      name: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&q=80',
      role: 'Enterprise Architect'
    },
    publishedAt: 'May 15, 2024',
    readingTime: '8 min read',
    tags: ['Server', 'PCIe', 'Datacenter', 'Engineering']
  }
];
