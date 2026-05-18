export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subCategory: string;
  brand: string;
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  specifications: Record<string, string>;
  features: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  onSale?: boolean;
  sku: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  publishedAt: string;
  readingTime: string;
  tags: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  description?: string;
  parentCategoryId?: string;
  subCategories?: string[];
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}
