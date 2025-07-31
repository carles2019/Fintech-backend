import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://your-backend-api.com',
  timeout: 10000,
});

axiosInstance.interceptors.request.use(config => {
  const token = globalThis.authToken || '';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;