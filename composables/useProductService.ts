import { products, categories } from '@/mock/data';
import type { Product, Category } from '@/types';

export const useProductService = () => {
  const getProducts = (params?: { 
    category?: string; 
    query?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }) => {
    let filtered = [...products];

    if (params?.category) {
      filtered = filtered.filter(p => p.category === params.category || p.subCategory === params.category);
    }

    if (params?.query) {
      const q = params.query.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q)
      );
    }

    if (params?.minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= params.minPrice!);
    }

    if (params?.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= params.maxPrice!);
    }

    // Sort logic
    if (params?.sort === 'price-low-high') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (params?.sort === 'price-high-low') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (params?.sort === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  };

  const getProductBySlug = (slug: string): Product | undefined => {
    return products.find(p => p.slug === slug);
  };

  const getProductById = (id: string): Product | undefined => {
    return products.find(p => p.id === id);
  };

  const getCategories = (): Category[] => {
    return categories;
  };

  const getFeaturedProducts = (): Product[] => {
    return products.filter(p => p.isFeatured);
  };

  const getNewArrivals = (): Product[] => {
    return products.filter(p => p.isNew);
  };

  const getOnSaleProducts = (): Product[] => {
    return products.filter(p => p.onSale);
  };

  return {
    getProducts,
    getProductBySlug,
    getProductById,
    getCategories,
    getFeaturedProducts,
    getNewArrivals,
    getOnSaleProducts
  };
};
