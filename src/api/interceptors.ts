import { InternalAxiosRequestConfig } from 'axios';
import { TokenService } from '../services/token.service';

/**
 * Adds a Bearer token to the request
 * @param config Axios request configuration
 * @returns Config with Bearer token
 */
export async function addBearerToken(config: InternalAxiosRequestConfig<unknown>): Promise<InternalAxiosRequestConfig<unknown>> {
    const token = await TokenService.instance.getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        // Optional: Log or handle the case where no token is available
        console.warn('No Bearer token found');
    }

    return config;
}
