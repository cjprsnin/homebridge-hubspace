import { InternalAxiosRequestConfig } from 'axios';
import { TokenService } from '../services/token.service';
import { Logger } from 'homebridge';

/**
 * Adds a Bearer token to the request
 * @param config Axios request configuration
 * @param logger Optional logger instance for consistent logging
 * @returns Config with Bearer token
 * @throws Error if no token is available and the request requires authentication
 */
export async function addBearerToken(
  config: InternalAxiosRequestConfig<unknown>,
  logger?: Logger
): Promise<InternalAxiosRequestConfig<unknown>> {
  try {
    const token = await TokenService.instance.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      const errorMessage = 'No Bearer token found. Authentication is required.';
      if (logger) {
        logger.warn(errorMessage);
      } else {
        console.warn(errorMessage);
      }
      throw new Error(errorMessage);
    }

    return config;
  } catch (ex) {
    const errorMessage = 'Failed to add Bearer token to request.';
    if (logger) {
      logger.error(errorMessage, ex);
    } else {
      console.error(errorMessage, ex);
    }
    throw ex;
  }
}
