import api from './api';

export const adminService = {
  dashboard: () => api.get('/admin/dashboard'),

  // Usuarios
  listUsers: (params) => api.get('/admin/users', { params }),
  setUserStatus: (id, active) => api.put(`/admin/users/${id}/status`, { active }),

  // Stock
  stockOverview: (params) => api.get('/admin/stock', { params }),
  adjustStock: (id, stock, reason) => api.put(`/admin/stock/${id}`, { stock, reason }),
  stockMovements: (params) => api.get('/admin/stock-movements', { params }),

  // Reportes
  salesReport: (params) => api.get('/admin/reports/sales', { params }),
  stockReport: () => api.get('/admin/reports/stock'),
};
