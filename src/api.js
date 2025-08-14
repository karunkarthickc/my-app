import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

const api = axios.create({
  baseURL: `https://api.dev.intranet.intuitiveapps.com/hrms/api/v1/`,
});

api.interceptors.request.use(
  async (config) => {
    config.headers = config.headers || {};
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    } else {
      config.headers['Content-Type'] = 'application/json';
    }

    if (!config.url?.endsWith('login/')) {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('[Axios Request Error]', {
      message: error.message,
      code: error.code,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      },
      stack: error.stack,
    });
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API Response URL:', response.config.url);
    return response;
  },
  async (error) => {
    const originalReq = error.config;
    console.error('[Axios Response Error]', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: originalReq.url,
      method: originalReq.method,
      headers: originalReq.headers,
    });

    if (error.response?.status === 401 && !originalReq._retry) {
      originalReq._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (!refreshToken) {
          console.error('[Token Refresh Error] No refresh token available');
          return Promise.reject(error);
        }
        const res = await axios.post(
          `https://api.dev.intranet.intuitiveapps.com/hrms/api/v1/token/refresh/`,
          { refresh: refreshToken }
        );
        const { access } = res.data;
        await AsyncStorage.setItem('access_token', access);
        originalReq.headers = originalReq.headers || {};
        originalReq.headers['Authorization'] = `Bearer ${access}`;
        if (originalReq.data instanceof FormData) {
          originalReq.headers['Content-Type'] = 'multipart/form-data';
        }
        return api(originalReq);
      } catch (refreshError) {
        console.error('[Token Refresh Error]', {
          message: refreshError.message,
          status: refreshError.response?.status,
          statusText: refreshError.response?.statusText,
          data: refreshError.response?.data,
          url: `${Config.API_BASE_URL}/hrms/api/v1/token/refresh/`,
        });
        if (
          refreshError.response?.data?.code === 'token_not_valid' ||
          refreshError.response?.status === 401
        ) {
          await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;