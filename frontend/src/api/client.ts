import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Check if we're in the admin area
    const isInAdminArea = window.location.pathname.startsWith('/admin');

    // Check if it's an admin-specific route
    const isAdminRoute = config.url?.startsWith('/auth/') || config.url?.startsWith('/admin/');

    if (isInAdminArea || isAdminRoute) {
      // Use admin token for admin area or admin-specific routes
      const adminToken = window.localStorage.getItem('luxia-admin-token');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      // Use user token for user routes
      const userToken = window.localStorage.getItem('luxia-user-token');
      if (userToken) {
        config.headers.Authorization = `Bearer ${userToken}`;
      }
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized responses
    if (error.response?.status === 401) {
      const isAdminRoute = error.config?.url?.startsWith('/auth/') || error.config?.url?.startsWith('/admin/');

      if (isAdminRoute) {
        // Clear admin token
        window.localStorage.removeItem('luxia-admin-token');
        // Redirect to admin login if not already there
        if (!window.location.pathname.includes('/admin/login')) {
          window.location.href = '/admin/login';
        }
      } else {
        // Clear user token
        window.localStorage.removeItem('luxia-user-token');
        // Don't redirect automatically for user routes
        // Let the component handle the redirect
      }
    }
    return Promise.reject(error);
  }
);

export default api;
