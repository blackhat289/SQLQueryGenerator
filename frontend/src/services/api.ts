import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// API base URL configuration (uses Vite proxy setup in dev or environment variable)
const BASE_URL = 
  import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? '/api' : 'https://sqlquerygenerator-8m1j.onrender.com/api');

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 12000,
  withCredentials: true, // Crucial for HTTP-only JWT cookies sharing
});

interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Response interceptor for automatic session refreshing
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomRequestConfig;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Check if error is 401 (Unauthorized) and indicates token expiration
    const responseData = error.response?.data as any;
    const isTokenExpired = 
      error.response?.status === 401 && 
      (responseData?.code === 'TOKEN_EXPIRED' || responseData?.message?.toLowerCase().includes('expired'));

    if (isTokenExpired && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('🔄 Session expired. Attempting token rotation...');
        // Request token refresh
        await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        
        console.log('✅ Session refreshed. Retrying original request.');
        // Retry the original request with the active credentials
        return api(originalRequest);
      } catch (refreshError) {
        console.warn('❌ Session refresh failed. Redirecting to login.');
        // If refresh fails, clear token cookies (optional, handled by server/client) and redirect
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(refreshError);
      }
    }

    // Structure readable display errors
    let displayMessage = 'An unexpected server error occurred.';
    if (error.response) {
      const data = error.response.data as any;
      displayMessage = data?.message || data?.detail || `Error Code ${error.response.status}`;
    } else if (error.request) {
      displayMessage = 'Cannot connect to Genie microservices. Check server states.';
    } else {
      displayMessage = error.message;
    }

    // Inject parsed message details
    (error as any).displayMessage = displayMessage;

    return Promise.reject(error);
  }
);

export default api;
