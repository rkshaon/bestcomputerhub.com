// File: /composables/useProductService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import { products as initialProducts, categories, brands } from '@/mock/data';
import type { Product, ProductImage, Category, Brand, PaginatedResponse, ProductFilters, CreateProductPayload, UpdateProductPayload } from '@/types';
import { useRuntimeConfig } from '#app';

const PRODUCTS_STORAGE_KEY = 'techcore_mock_products_registry';

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
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.has('mock') || localStorage.getItem('techcore_mock_mode') === 'true';
    }
    return false;
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
    const imageIndex = p.id ? (Math.abs(Number(p.id) || 0) % techImages.length) : 0;
    const fallbackImage = techImages[imageIndex] || techImages[0];

    const priceVal = p.current_selling_price !== undefined && p.current_selling_price !== null 
      ? Number(p.current_selling_price) 
      : Number(p.price ?? 0);

    let defaultImg: any = p.default_image || null;
    let primaryImgUrl = '';

    if (defaultImg) {
      if (typeof defaultImg === 'object' && defaultImg.image) {
        primaryImgUrl = defaultImg.image;
      } else if (typeof defaultImg === 'string') {
        primaryImgUrl = defaultImg;
      }
    } else if (Array.isArray(p.images) && p.images.length > 0) {
      primaryImgUrl = typeof p.images[0] === 'string' ? p.images[0] : (p.images[0]?.image || '');
    } else if (p.image) {
      primaryImgUrl = typeof p.image === 'string' ? p.image : '';
    }

    let originObj = p.origin || null;
    let catName = 'General';
    if (originObj) {
      if (typeof originObj === 'object') {
        catName = originObj.name || catName;
      } else if (typeof originObj === 'string') {
        catName = originObj;
      }
    } else if (p.category) {
      if (typeof p.category === 'object') {
        catName = p.category.name || catName;
      } else if (typeof p.category === 'string') {
        catName = p.category;
      }
    }

    const avgRating = p.average_rating !== undefined && p.average_rating !== null
      ? Number(p.average_rating)
      : Number(p.rating ?? 0);

    const totReviews = p.total_reviews !== undefined && p.total_reviews !== null
      ? Number(p.total_reviews)
      : Number(p.reviewCount ?? p.review_count ?? 0);

    const mappedImages = Array.isArray(p.images) && p.images.length
      ? p.images.map((img: any) => typeof img === 'string' ? img : (img?.image || '')).filter(Boolean)
      : (primaryImgUrl ? [primaryImgUrl] : []);

    const brandName = typeof p.brand === 'object' && p.brand !== null
      ? (p.brand.name || '')
      : (p.brand ? String(p.brand) : (p.specifications?.['Brand'] || p.specifications?.['brand'] || ''));

    return {
      id: String(p.id ?? ''),
      name: p.name ?? '',
      slug: p.slug || `product-${p.id || 'item'}`,
      legacy_id: p.legacy_id !== undefined ? p.legacy_id : null,
      description: p.description !== undefined && p.description !== null ? String(p.description) : '',
      short_description: p.short_description !== undefined && p.short_description !== null ? String(p.short_description) : '',
      price: priceVal,
      current_selling_price: priceVal,
      originalPrice: p.originalPrice ? Number(p.originalPrice) : (p.original_price ? Number(p.original_price) : undefined),
      category: catName,
      subCategory: String(p.subCategory ?? p.sub_category ?? ''),
      brand: brandName,
      images: mappedImages,
      default_image: defaultImg || (primaryImgUrl ? { image: primaryImgUrl, alt_text: p.name ?? '' } : null),
      origin: originObj || (typeof p.category === 'object' ? p.category : null),
      categories: Array.isArray(p.categories) 
        ? p.categories 
        : (originObj?.id ? [originObj] : (typeof p.category === 'number' ? [p.category] : [])),
      price_histories: Array.isArray(p.price_histories) ? p.price_histories : [],
      average_rating: avgRating,
      rating: avgRating,
      total_reviews: totReviews,
      reviewCount: totReviews,
      wishlist: Boolean(p.wishlist),
      in_cart: Boolean(p.in_cart),
      is_active: p.is_active !== undefined ? Boolean(p.is_active) : true,
      stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0,
      specifications: p.specifications ?? {},
      features: Array.isArray(p.features) ? p.features : [],
      isNew: Boolean(p.isNew ?? p.is_new ?? false),
      isFeatured: Boolean(p.isFeatured ?? p.is_featured ?? false),
      onSale: Boolean(p.onSale ?? p.on_sale ?? false),
      sku: p.sku || `SKU-${p.id || 'N/A'}`,
      created_at: p.created_at || '',
      updated_at: p.updated_at || '',
      deleted_at: p.deleted_at !== undefined ? p.deleted_at : null,
      created_by: p.created_by !== undefined ? p.created_by : null,
      updated_by: p.updated_by !== undefined ? p.updated_by : null
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
    const categoriesFilter = params.categories !== undefined && params.categories !== null
      ? (Array.isArray(params.categories) ? params.categories.filter(Boolean).join(',') : String(params.categories).trim())
      : (params.category !== undefined && params.category !== null && params.category !== '' && /^\d+$/.test(String(params.category).trim()) ? String(params.category).trim() : undefined);
    const brandFilter = params.brand;
    const minPrice = params.minPrice;
    const maxPrice = params.maxPrice;
    const sort = params.sort;
    const ordering = params.ordering;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      isLoading.value = false;

      let filtered = [...getMockProducts()];

      if (categoriesFilter) {
        const catIds = categoriesFilter.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        if (catIds.length > 0) {
          filtered = filtered.filter(p => {
            const origId = p.origin?.id !== undefined && p.origin?.id !== null ? String(p.origin.id).toLowerCase() : '';
            const catName = String(p.category || '').toLowerCase();
            const subName = String(p.subCategory || '').toLowerCase();
            const pCategories = Array.isArray(p.categories) ? p.categories.map(c => typeof c === 'object' ? String(c.id ?? c.slug ?? '').toLowerCase() : String(c).toLowerCase()) : [];
            return (origId && catIds.includes(origId)) || catIds.includes(catName) || catIds.includes(subName) || pCategories.some(cid => catIds.includes(cid));
          });
        }
      } else if (categoryFilter) {
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

      // Forward categories filter (comma-separated integer IDs)
      if (categoriesFilter) {
        qParams.append('categories', categoriesFilter);
      } else if (categoryFilter !== undefined && categoryFilter !== '') {
        const isNumeric = /^\d+$/.test(categoryFilter.toString());
        if (isNumeric) {
          qParams.append('categories', categoryFilter.toString());
        } else {
          // Append as category_slug and category to support any backend implementation
          qParams.append('category_slug', categoryFilter.toString());
          qParams.append('category', categoryFilter.toString());
        }
      }

      // Forward search keywords
      if (search) {
        qParams.append('search', search);
      }

      // Forward brand filter
      if (brandFilter) {
        qParams.append('brand', brandFilter);
      }

      // Forward price range filters (standard & alternative casings)
      if (minPrice !== undefined) {
        qParams.append('min_price', minPrice.toString());
        qParams.append('minPrice', minPrice.toString());
      }
      if (maxPrice !== undefined) {
        qParams.append('max_price', maxPrice.toString());
        qParams.append('maxPrice', maxPrice.toString());
      }

      // Forward ordering / sorting options
      if (sort) {
        let backendOrdering = sort;
        if (sort === 'price-low-high') backendOrdering = 'price';
        if (sort === 'price-high-low') backendOrdering = '-price';
        if (sort === 'rating') backendOrdering = '-rating';
        if (sort === 'newest') backendOrdering = '-id';
        
        qParams.append('ordering', backendOrdering);
        qParams.append('sort', sort);
      } else if (ordering) {
        qParams.append('ordering', ordering);
      }

      const urlSuffix = qParams.toString() ? `?${qParams.toString()}` : '';
      
      // Backend Clarification: ALWAYS append trailing slash to products list API endpoint per enterprise rules
      const response = await apiClient.request<any>(`/api/v1/products/${urlSuffix}`, {
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
      // Backend Clarification: ALWAYS append trailing slash to match enterprise rules
      const response = await apiClient.request<any>(`/api/v1/products/${idOrSlug}/`, {
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

  // Fetch product image gallery: GET /api/v1/products/{id}/product-images/
  const getProductImages = async (idOrSlug: string | number): Promise<ProductImage[]> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 200));
      isLoading.value = false;
      const found = getMockProducts().find(p => String(p.id) === String(idOrSlug) || p.slug === String(idOrSlug));
      if (!found) return [];
      if (Array.isArray(found.images) && found.images.length > 0) {
        return found.images.map((img, idx) => ({
          id: idx + 1,
          image: typeof img === 'string' ? img : (img as any)?.image,
          alt_text: found.name,
          is_default: idx === 0,
          display_order: idx + 1,
          created_at: new Date().toISOString()
        }));
      }
      if (found.default_image) {
        const imgUrl = typeof found.default_image === 'string' ? found.default_image : found.default_image.image;
        const alt = typeof found.default_image === 'object' ? found.default_image.alt_text : found.name;
        if (imgUrl) {
          return [{
            id: 1,
            image: imgUrl,
            alt_text: alt || found.name,
            is_default: true,
            display_order: 1,
            created_at: new Date().toISOString()
          }];
        }
      }
      return [];
    }

    try {
      const response = await apiClient.request<any>(`/api/v1/products/${idOrSlug}/product-images/`, {
        method: 'GET'
      });
      isLoading.value = false;

      let list: any[] = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.results)) {
          list = response.results;
        } else if (Array.isArray(response.data)) {
          list = response.data;
        }
      }

      return list.map((item: any, idx: number) => ({
        id: item.id ?? idx,
        image: item.image || '',
        alt_text: item.alt_text || '',
        is_default: Boolean(item.is_default),
        display_order: item.display_order !== undefined && item.display_order !== null ? Number(item.display_order) : idx,
        created_at: item.created_at || undefined
      }));
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Technical failure loading product images.';
      isLoading.value = false;
      throw err;
    }
  };

  // Administrative / Vendor mutation endpoints
  const createProduct = async (payload: CreateProductPayload | Partial<Product>): Promise<Product> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 600));
      isLoading.value = false;
      
      const list = getMockProducts();
      const generatedSlug = payload.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `prod-${Date.now()}`;
      const productPrice = Number((payload as any).current_selling_price ?? (payload as any).price ?? 0);
      const newProd: Product = {
        id: 'prod_' + Math.floor(Math.random() * 1000000),
        name: payload.name ?? 'Untitled Product',
        slug: generatedSlug,
        description: (payload as any).description ?? '',
        price: productPrice,
        current_selling_price: productPrice,
        originalPrice: (payload as any).originalPrice ? Number((payload as any).originalPrice) : undefined,
        category: (payload as any).category ?? 'components',
        subCategory: (payload as any).subCategory ?? '',
        brand: (payload as any).brand ?? 'TechCore',
        images: (payload as any).images && (payload as any).images.length ? (payload as any).images : ['https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80'],
        stock: Number((payload as any).stock ?? 10),
        rating: 5.0,
        reviewCount: 0,
        specifications: (payload as any).specifications ?? {},
        features: (payload as any).features ?? [],
        sku: (payload as any).sku ?? `SKU-${Math.floor(Math.random() * 900000 + 100000)}`,
        isNew: true,
        isFeatured: (payload as any).isFeatured ?? false,
        onSale: (payload as any).onSale ?? false
      };
      
      list.push(newProd);
      saveMockProducts(list);
      return newProd;
    }

    try {
      // Backend Clarification: ALWAYS append trailing slash to POST requests
      const response = await apiClient.request<any>('/api/v1/products/', {
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

  const updateProduct = async (id: string | number, payload: UpdateProductPayload | Partial<Product>): Promise<Product> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 600));
      isLoading.value = false;

      const list = getMockProducts();
      const idx = list.findIndex(p => String(p.id) === String(id) || p.slug === String(id));
      if (idx === -1) throw new Error('Product not registered.');

      const existing = list[idx]!;
      const currentPrice = (payload as any).current_selling_price !== undefined 
        ? Number((payload as any).current_selling_price)
        : ((payload as any).price !== undefined ? Number((payload as any).price) : existing.price);

      const updated: Product = {
        ...existing,
        name: (payload as any).name !== undefined ? (payload as any).name : existing.name,
        price: currentPrice,
        current_selling_price: currentPrice,
        categories: (payload as any).categories !== undefined ? (payload as any).categories : existing.categories,
        description: (payload as any).description !== undefined ? (payload as any).description : existing.description,
        short_description: (payload as any).short_description !== undefined ? (payload as any).short_description : existing.short_description,
        specifications: (payload as any).specifications !== undefined ? (payload as any).specifications : existing.specifications
      };

      list[idx] = updated;
      saveMockProducts(list);
      return updated;
    }

    try {
      // Backend Clarification: ALWAYS append trailing slash to PATCH requests
      const response = await apiClient.request<any>(`/api/v1/products/${id}/`, {
        method: 'PATCH',
        body: payload
      });
      isLoading.value = false;
      return mapProductResponse(response);
    } catch (err: any) {
      errorMsg.value = err.data?.message || err.message || 'Technical Error: Update operational rejected.';
      isLoading.value = false;
      throw err;
    }
  };

  const deleteProduct = async (id: string | number): Promise<{ success: boolean; message: string }> => {
    isLoading.value = true;
    errorMsg.value = null;

    if (checkMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      isLoading.value = false;

      const list = getMockProducts();
      const filtered = list.filter(p => String(p.id) !== String(id) && p.slug !== String(id));
      if (filtered.length === list.length) throw new Error('Asset not registered.');
      saveMockProducts(filtered);
      return { success: true, message: 'Product deleted successfully.' };
    }

    try {
      // Backend Clarification: ALWAYS append trailing slash to DELETE requests
      await apiClient.request<any>(`/api/v1/products/${id}/`, {
        method: 'DELETE'
      });
      isLoading.value = false;
      return { success: true, message: 'Product deleted successfully.' };
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

  const getBestSellers = (): Product[] => {
    return [...getMockProducts()].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
  };

  const getBrands = (): Brand[] => {
    return brands;
  };

  return {
    isLoading,
    errorMsg,
    getProductsList,
    getProductDetails,
    getProductImages,
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
    getBestSellers,
    getBrands
  };
};
