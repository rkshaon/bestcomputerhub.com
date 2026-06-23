// File: /composables/useProductService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import { products as initialProducts, categories, brands } from '@/mock/data';
import type { Product, Category, Brand, PaginatedResponse } from '@/types';
import { useRuntimeConfig } from '#app';

const PRODUCTS_STORAGE_KEY = 'techcore_mock_products_registry';

export interface ProductFilters {
  page?: number;
  page_size?: number;
  category?: string | number;
  query?: string;
  search?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  ordering?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  onSale?: boolean;
}

export const useProductService = () => {
  const apiClient = useApiClient();
  const isLoading = ref(false);
  const errorMsg = ref<string | null>(null);

  // Initialize mock products in localStorage for state preservation
  const getMockProducts = (): Product[] => {
    if (typeof window === 'undefined') return initialProducts;
    try {
      const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(initialProducts));
      return initialProducts;
    } catch {
      return initialProducts;
    }
  };

  const saveMockProducts = (updatedList: Product[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedList));
    } catch {}
  };

  const checkMockMode = (): boolean => {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase || '';
    return !apiBase || apiBase.trim() === '';
  };

  // Maps backend response product schema if required to match Product interface
  const mapProductResponse = (p: any): Product => {
    if (!p) return p;
    
    // Fallback images matching Technical Premium design language
    const techImages = [
      'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop&q=80'
    ];
    const imageIndex = p.id ? (Number(p.id) % techImages.length) : 0;
    const fallbackImage = techImages[imageIndex] || techImages[0];

    const priceVal = p.current_selling_price ? Number(p.current_selling_price) : Number(p.price ?? 149.99);

    return {
      id: String(p.id ?? ''),
      name: p.name ?? '',
      slug: p.slug || `product-${p.id || 'item'}`,
      description: p.description ?? 'High-performance enterprise hardware component designed for 24/7 reliability.',
      price: priceVal,
      originalPrice: p.originalPrice ? Number(p.originalPrice) : (priceVal > 200 ? priceVal * 1.15 : undefined),
      category: String(p.category ?? ''),
      subCategory: String(p.subCategory ?? p.sub_category ?? ''),
      brand: p.brand || 'TechCore',
      images: Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : [fallbackImage]),
      stock: Number(p.stock ?? 15),
      rating: Number(p.rating ?? 4.8),
      reviewCount: Number(p.reviewCount ?? p.review_count ?? 12),
      specifications: p.specifications ?? {
        'Form Factor': 'Enterprise Node',
        'Status': 'Certified'
      },
      features: Array.isArray(p.features) && p.features.length ? p.features : ['Enterprise Certified Node', '24/7 Workload Optimization'],
      isNew: Boolean(p.isNew ?? p.is_new ?? false),
      isFeatured: Boolean(p.isFeatured ?? p.is_featured ?? false),
      onSale: Boolean(p.onSale ?? p.on_sale ?? false),
      sku: p.sku || `SKU-${p.id || 'N/A'}`
    };
  };

  // ==========================================
  // 1. ASYNCHRONOUS PRODUCTS API ACTIONS
  // ==========================================

  // Fetch paginated products collection matching backend capabilities
  const getProductsList = async (params: ProductFilters = {}): Promise<PaginatedResponse<Product>> => {
    isLoading.value = true;
    errorMsg.value = null;

    const page = params.page || 1;
    const pageSize = params.page_size || 10;
    const search = params.search || params.query || '';
    const categoryFilter = params.category;
    const brandFilter = params.brand;
    const minPrice = params.minPrice;
    const maxPrice = params.maxPrice;
    const sort = params.sort;
    const ordering = params.ordering;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      isLoading.value = false;

      let filtered = [...getMockProducts()];

      if (categoryFilter) {
        const catStr = String(categoryFilter).toLowerCase();
        filtered = filtered.filter(p => 
          String(p.category).toLowerCase() === catStr || 
          String(p.subCategory).toLowerCase() === catStr
        );
      }

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(q) || 
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      }

      if (brandFilter) {
        filtered = filtered.filter(p => p.brand.toLowerCase() === brandFilter.toLowerCase());
      }

      if (minPrice !== undefined) {
        filtered = filtered.filter(p => p.price >= minPrice);
      }

      if (maxPrice !== undefined) {
        filtered = filtered.filter(p => p.price <= maxPrice);
      }

      if (params.isFeatured !== undefined) {
        filtered = filtered.filter(p => p.isFeatured === params.isFeatured);
      }

      if (params.isNew !== undefined) {
        filtered = filtered.filter(p => p.isNew === params.isNew);
      }

      if (params.onSale !== undefined) {
        filtered = filtered.filter(p => p.onSale === params.onSale);
      }

      // Ordering Sort logic
      if (sort === 'price-low-high' || ordering === 'price') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sort === 'price-high-low' || ordering === '-price') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (sort === 'rating' || ordering === '-rating') {
        filtered.sort((a, b) => b.rating - a.rating);
      } else if (ordering === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      } else if (ordering === '-name') {
        filtered.sort((a, b) => b.name.localeCompare(a.name));
      }

      const totalCount = filtered.length;
      const totalPages = Math.ceil(totalCount / pageSize) || 1;
      const startIndex = (page - 1) * pageSize;
      const results = filtered.slice(startIndex, startIndex + pageSize);

      return {
        results,
        count: totalCount,
        page,
        pages: totalPages
      };
    }

    try {
      const qParams = new URLSearchParams();
      qParams.append('page', page.toString());
      qParams.append('page_size', pageSize.toString());

      // Real backend category ID must be integer as verified by backend developer
      if (categoryFilter !== undefined && categoryFilter !== '') {
        const isNumeric = /^\d+$/.test(categoryFilter.toString());
        if (isNumeric) {
          qParams.append('category', categoryFilter.toString());
        }
      }

      const urlSuffix = qParams.toString() ? `?${qParams.toString()}` : '';
      
      // Backend Clarification: No trailing slash on products list API
      const response = await apiClient.request<any>(`/api/v1/products${urlSuffix}`, {
        method: 'GET'
      });

      isLoading.value = false;

      let results: Product[] = [];
      let count = 0;
      let pages = 1;

      if (response && typeof response === 'object') {
        if ('results' in response && Array.isArray(response.results)) {
          results = response.results.map(mapProductResponse);
          count = response.count ?? results.length;
          pages = response.total_pages ?? response.pages ?? Math.ceil(count / pageSize);
        } else if ('data' in response && Array.isArray(response.data)) {
          results = response.data.map(mapProductResponse);
          count = response.total ?? results.length;
          pages = Math.ceil(count / pageSize);
        } else if (Array.isArray(response)) {
          results = response.map(mapProductResponse);
          count = response.length;
          pages = Math.ceil(count / pageSize);
        }
      }

      return {
        results,
        count,
        page,
        pages
      };
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Unable to retrieve matching catalog products.';
      isLoading.value = false;
      throw err;
    }
  };

  // Fetch detailed product layout
  const getProductDetails = async (idOrSlug: string): Promise<Product> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 400));
      isLoading.value = false;
      const found = getMockProducts().find(p => p.id === idOrSlug || p.slug === idOrSlug);
      if (!found) throw new Error(`Product mapping failed: ID or Slug "${idOrSlug}" not found.`);
      return found;
    }

    try {
      // Backend Clarification: No trailing slash on detail endpoint
      const response = await apiClient.request<any>(`/api/v1/products/${idOrSlug}`, {
        method: 'GET'
      });
      isLoading.value = false;
      return mapProductResponse(response);
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Technical failure loading product specification details.';
      isLoading.value = false;
      throw err;
    }
  };

  // Administrative / Vendor mutation endpoints
  const createProduct = async (payload: Partial<Product>): Promise<Product> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 600));
      isLoading.value = false;
      
      const list = getMockProducts();
      const generatedSlug = payload.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `prod-${Date.now()}`;
      const newProd: Product = {
        id: 'prod_' + Math.floor(Math.random() * 1000000),
        name: payload.name ?? 'Untitled Product',
        slug: generatedSlug,
        description: payload.description ?? '',
        price: Number(payload.price ?? 0),
        originalPrice: payload.originalPrice ? Number(payload.originalPrice) : undefined,
        category: payload.category ?? 'components',
        subCategory: payload.subCategory ?? '',
        brand: payload.brand ?? 'TechCore',
        images: payload.images && payload.images.length ? payload.images : ['/images/placeholder.jpg'],
        stock: Number(payload.stock ?? 10),
        rating: 5.0,
        reviewCount: 0,
        specifications: payload.specifications ?? {},
        features: payload.features ?? [],
        sku: payload.sku ?? `SKU-${Math.floor(Math.random() * 900000 + 100000)}`,
        isNew: true,
        isFeatured: payload.isFeatured ?? false,
        onSale: payload.onSale ?? false
      };
      
      list.push(newProd);
      saveMockProducts(list);
      return newProd;
    }

    try {
      const response = await apiClient.request<any>('/api/v1/products', {
        method: 'POST',
        body: payload
      });
      isLoading.value = false;
      return mapProductResponse(response);
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Protocol Failure: Could not register new asset.';
      isLoading.value = false;
      throw err;
    }
  };

  const updateProduct = async (id: string, payload: Partial<Product>): Promise<Product> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 600));
      isLoading.value = false;

      const list = getMockProducts();
      const idx = list.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Product not registered.');

      const existing = list[idx]!;
      const updated: Product = {
        ...existing,
        id: existing.id,
        name: payload.name !== undefined ? payload.name : existing.name,
        slug: payload.slug !== undefined ? payload.slug : existing.slug,
        description: payload.description !== undefined ? payload.description : existing.description,
        category: payload.category !== undefined ? payload.category : existing.category,
        subCategory: payload.subCategory !== undefined ? payload.subCategory : existing.subCategory,
        brand: payload.brand !== undefined ? payload.brand : existing.brand,
        price: payload.price !== undefined ? Number(payload.price) : existing.price,
        originalPrice: payload.originalPrice !== undefined ? Number(payload.originalPrice) : existing.originalPrice,
        stock: payload.stock !== undefined ? Number(payload.stock) : existing.stock,
        rating: payload.rating !== undefined ? Number(payload.rating) : existing.rating,
        reviewCount: payload.reviewCount !== undefined ? Number(payload.reviewCount) : existing.reviewCount,
        specifications: payload.specifications !== undefined ? payload.specifications : existing.specifications,
        features: payload.features !== undefined ? payload.features : existing.features,
        sku: payload.sku !== undefined ? payload.sku : existing.sku,
        images: payload.images !== undefined ? payload.images : existing.images,
        isNew: payload.isNew !== undefined ? payload.isNew : existing.isNew,
        isFeatured: payload.isFeatured !== undefined ? payload.isFeatured : existing.isFeatured,
        onSale: payload.onSale !== undefined ? payload.onSale : existing.onSale
      };

      list[idx] = updated;
      saveMockProducts(list);
      return updated;
    }

    try {
      // Rule compliance: Always exclude slug/readonly fields on payload mutations as explicitly mandated
      const { slug, sku, id: pId, rating, reviewCount, ...cleanPayload } = payload as any;

      const response = await apiClient.request<any>(`/api/v1/products/${id}`, {
        method: 'PATCH',
        body: cleanPayload
      });
      isLoading.value = false;
      return mapProductResponse(response);
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Technical Error: Update operational rejected.';
      isLoading.value = false;
      throw err;
    }
  };

  const deleteProduct = async (id: string): Promise<{ success: boolean; message: string }> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      isLoading.value = false;

      const list = getMockProducts();
      const filtered = list.filter(p => p.id !== id);
      if (filtered.length === list.length) throw new Error('Asset not registered.');
      saveMockProducts(filtered);
      return { success: true, message: 'Asset deleted successfully.' };
    }

    try {
      await apiClient.request<any>(`/api/v1/products/${id}`, {
        method: 'DELETE'
      });
      isLoading.value = false;
      return { success: true, message: 'Registry item dropped successfully.' };
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Operation failed: Network error during rejection.';
      isLoading.value = false;
      throw err;
    }
  };


  // ==========================================
  // 2. SYNCHRONOUS FALLBACKS FOR SPA ROUTING
  // ==========================================

  const getProducts = (params?: { 
    category?: string; 
    query?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }): Product[] => {
    const activeProducts = getMockProducts();
    let filtered = [...activeProducts];

    if (params?.category) {
      filtered = filtered.filter(p => 
        String(p.category).toLowerCase() === String(params.category).toLowerCase() || 
        String(p.subCategory).toLowerCase() === String(params.category).toLowerCase()
      );
    }

    if (params?.query) {
      const q = params.query.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q)
      );
    }

    if (params?.brand) {
      filtered = filtered.filter(p => p.brand.toLowerCase() === params.brand!.toLowerCase());
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
    return getMockProducts().find(p => p.slug === slug);
  };

  const getProductById = (id: string): Product | undefined => {
    return getMockProducts().find(p => p.id === id);
  };

  const getCategories = (): Category[] => {
    return categories;
  };

  const getFeaturedProducts = (): Product[] => {
    return getMockProducts().filter(p => p.isFeatured);
  };

  const getNewArrivals = (): Product[] => {
    return getMockProducts().filter(p => p.isNew);
  };

  const getOnSaleProducts = (): Product[] => {
    return getMockProducts().filter(p => p.onSale);
  };

  const getBrands = (): Brand[] => {
    return brands;
  };

  return {
    isLoading,
    errorMsg,
    getProductsList,
    getProductDetails,
    createProduct,
    updateProduct,
    deleteProduct,
    getProducts,
    getProductBySlug,
    getProductById,
    getCategories,
    getFeaturedProducts,
    getNewArrivals,
    getOnSaleProducts,
    getBrands
  };
};
