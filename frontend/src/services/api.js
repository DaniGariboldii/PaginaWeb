import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // envía cookies HttpOnly en cada request
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor de respuesta: manejo centralizado de 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // El AuthContext escucha esto para limpiar el estado
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
