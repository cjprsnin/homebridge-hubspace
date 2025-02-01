import axios, { AxiosInstance } from 'axios';
import { addRequestInterceptor, addResponseInterceptor } from './interceptors';

export class HttpClientFactory {
  /**
   * Creates and configures an Axios HTTP client.
   * @param baseURL - The base URL for the API.
   * @param token - Optional authentication token.
   * @returns The configured Axios instance.
   */
  static createHttpClient(baseURL: string, token?: string): AxiosInstance {
    const client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor (if token is provided)
    if (token) {
      addRequestInterceptor(client, token);
    }

    // Add response interceptor
    addResponseInterceptor(client);

    return client;
  }
}
