import api from './api';

export const ordersService = {
  create: (addressId, couponCode) => api.post('/orders', { addressId, ...(couponCode && { couponCode }) }),
  myOrders: (params) => api.get('/orders/my', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  // Admin
  listAll: (params) => api.get('/admin/orders', { params }),
  updateStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
};

export const couponsService = {
  validate: (code, subtotal) => api.post('/coupons/validate', { code, subtotal }),
  // Admin
  list: () => api.get('/coupons'),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  remove: (id) => api.delete(`/coupons/${id}`),
};

export const shippingService = {
  quote: (province, subtotal) => api.post('/shipping/quote', { province, subtotal }),
  // Admin
  listZones: () => api.get('/shipping/zones'),
  createZone: (data) => api.post('/shipping/zones', data),
  updateZone: (id, data) => api.put(`/shipping/zones/${id}`, data),
  removeZone: (id) => api.delete(`/shipping/zones/${id}`),
};

export const addressesService = {
  list: () => api.get('/addresses'),
  create: (data) => api.post('/addresses', data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  remove: (id) => api.delete(`/addresses/${id}`),
};

export const paymentsService = {
  createPreference: (orderId) => api.post('/payments/create-preference', { orderId }),
  simulate: (orderId, outcome = 'approved') => api.post('/payments/simulate', { orderId, outcome }),
  status: (orderId) => api.get(`/payments/${orderId}/status`),
};
