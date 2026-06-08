import api from './api';

export const productsService = {
  list: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getBySlug: (slug) => api.get(`/products/slug/${slug}`),
  related: (id) => api.get(`/products/${id}/related`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),

  // Imágenes (admin)
  uploadImages: (id, files) => {
    const form = new FormData();
    Array.from(files).forEach((f) => form.append('images', f));
    return api.post(`/products/${id}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage: (id, imageId) => api.delete(`/products/${id}/images/${imageId}`),
  setPrimaryImage: (id, imageId) => api.put(`/products/${id}/images/${imageId}/primary`),
};

export const categoriesService = {
  list: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const brandsService = {
  list: () => api.get('/categories/brands'),
  create: (data) => api.post('/categories/brands', data),
  update: (id, data) => api.put(`/categories/brands/${id}`, data),
  remove: (id) => api.delete(`/categories/brands/${id}`),
};
