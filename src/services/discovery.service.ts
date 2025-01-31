import { Device } from '../models/device';
import { Endpoints } from '../api/endpoints';
import { createHttpClientWithBearerInterceptor } from '../api/http-client-factory';
import { Logger } from 'homebridge';
import { TokenService } from './token-service';

/**
 * Service for discovering devices
 */
export class DiscoveryService {
  private readonly _httpClient = createHttpClientWithBearerInterceptor({
    baseURL: Endpoints.API_BASE_URL,
  });

  constructor(private readonly _log: Logger) {}

  /**
   * Discovers devices associated with the account
   * @returns Array of devices
   */
  public async discoverDevices(): Promise<Device[]> {
    try {
      // Ensure a valid token is available
      const token = await TokenService.instance.getToken();
      if (!token) {
        throw new Error('Failed to retrieve access token.');
      }

      const response = await this._httpClient.get<Device[]>('/devices');
      return response.data;
    } catch (ex) {
      this._log.error('Failed to discover devices:', ex);
      throw ex;
    }
  }
}
