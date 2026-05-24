export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentCategoryId?: string;
  subCategories?: string[];
  icon?: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  categoryId: string;
}

export interface Brand {
  id: string | number;
  name: string;
  slug: string;
  display_order?: number;
  is_active: boolean;
  created_at?: string;
  logo?: string;
  description?: string;
}

