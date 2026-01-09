import api from './axios';

export const productAPI = {
  // Get all products with filters
  getProducts: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    if (params.size) queryParams.append('size', params.size);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
    if (params.inStock !== undefined) queryParams.append('inStock', params.inStock);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sort) queryParams.append('sort', params.sort);

    const queryString = queryParams.toString();
    const url = `/products${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    // Return full response for success check and pagination
    return response.data;
  },

  // Get product by ID
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data.data; // Extract inner data object for consistency
  },
};

