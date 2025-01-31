import { AxiosInstance, CreateAxiosDefaults, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { addBearerToken } from './interceptors/add-bearer-token';
import { Logger } from 'homebridge';

/**
 * Creates an HTTP client with Bearer interceptor
 * @param config HTTP client configuration
 * @param logger Optional logger instance for consistent logging
 * @returns HTTP client with Bearer interceptor
 */
export function createHttpClientWithBearerInterceptor(
  config?: CreateAxiosDefaults<unknown>,
  logger?: Logger
): AxiosInstance {
  const client = axios.create(config);

  // Add Bearer token interceptor
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig<unknown>) => {
      try {
        return await addBearerToken(config, logger);
      } catch (ex) {
        if (logger) {
          logger.error('Failed to add Bearer token to request:', ex);
        } else {
          console.error('Failed to add Bearer token to request:', ex);
        }
        throw ex; // Re-throw the error to ensure the request fails
      }
    },
    (error) => {
      if (logger) {
        logger.error('Request interceptor error:', error);
      } else {
        console.error('Request interceptor error:', error);
      }
      return Promise.reject(error);
    }
  );

  return client;
}
