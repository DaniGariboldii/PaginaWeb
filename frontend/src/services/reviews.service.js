import api from './api';

export const reviewsService = {
  list: (productId) => api.get(`/products/${productId}/reviews`),
  create: (productId, data) => api.post(`/products/${productId}/reviews`, data),
  remove: (productId) => api.delete(`/products/${productId}/reviews`),
};

export const wishlistService = {
  list: () => api.get('/wishlist'),
  ids: () => api.get('/wishlist/ids'),
  add: (productId) => api.post(`/wishlist/${productId}`),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};
