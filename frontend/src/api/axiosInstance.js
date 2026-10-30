import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Send and receive session cookies (nagrikseva.sid)
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Return standard backend data payload if available
    return response.data;
  },
  (error) => {
    const status = error.response ? error.response.status : null;
    const errorData = error.response ? error.response.data : null;

    const formattedError = {
      status,
      message: errorData?.message || error.message || 'An unexpected error occurred.',
      errors: errorData?.errors || [],
      originalError: error,
    };

    if (status === 401) {
      const url = error.config?.url || '';
      // Do not dispatch logout event on passive session checks or role-guarded background queries
      const isPassive = url.includes('/auth/session') ||
                        url.includes('/notifications') ||
                        url.includes('/users/workers') ||
                        url.includes('/sla/rules');
      if (!isPassive) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    return Promise.reject(formattedError);
  }
);

export default axiosInstance;

