import { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export function addRequestInterceptor(client: AxiosInstance, token: string): void {
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );
}

export function addResponseInterceptor(client: AxiosInstance): void {
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError) => {
      console.error('Response interceptor error:', error);
      return Promise.reject(error);
    }
  );
}
