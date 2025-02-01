import { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * Adds a request interceptor to the Axios instance.
 * @param client - The Axios instance.
 * @param token - The authentication token.
 */
export function addRequestInterceptor(client: AxiosInstance, token: string): void {
  client.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      // Add authorization header
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      // Log or handle request errors
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );
}

/**
 * Adds a response interceptor to the Axios instance.
 * @param client - The Axios instance.
 */
export function addResponseInterceptor(client: AxiosInstance): void {
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Handle successful responses
      return response;
    },
    (error: AxiosError) => {
      // Log or handle response errors
      console.error('Response interceptor error:', error);
      return Promise.reject(error);
    }
  );
}
