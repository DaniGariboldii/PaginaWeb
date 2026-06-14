import api from './api';

export const legalService = {
  retraction: (data) => api.post('/legal/arrepentimiento', data),
  contact: (data) => api.post('/legal/contacto', data),
};
