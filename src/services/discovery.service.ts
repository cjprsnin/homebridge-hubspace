import { Device } from '../models/device';
import { Endpoints } from '../api/endpoints';
import { createHttpClientWithBearerInterceptor } from '../api/http-client-factory';
import { Logger, PlatformAccessory } from 'homebridge'; // Import PlatformAccessory
import { TokenService } from './token-service';

/**
 * Service for discovering devices
 */
export class DiscoveryService {
  private readonly _httpClient;

  constructor(private readonly _log: Logger) {
    this._httpClient = createHttpClientWithBearerInterceptor(
      { baseURL: Endpoints.API_BASE_URL },
      _log
    );
  }

  /**
   * Configures a cached accessory
   * @param accessory Cached accessory
   */
  public configureCachedAccessory(accessory: PlatformAccessory): void {
    // Implementation for configuring cached accessories
    this._log.info('Configuring cached accessory:', accessory.displayName);
  }

  /**
   * Discovers devices associated with the account
   * @returns Array of devices
   */
  public async discoverDevices(): Promise<Device[]> {
    const maxRetries = 3;
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        // Ensure a valid token is available
        const token = await TokenService.instance.getToken();
        if (!token) {
          throw new Error('Failed to retrieve access token.');
        }

        this._log.debug('Fetching devices from Hubspace API...');
        const response = await this._httpClient.get<Device[]>('/devices');

        this._log.debug(`Discovered ${response.data.length} devices.`);
        return response.data;
      } catch (ex) {
        lastError = ex as Error;
        this._log.error(`Attempt ${i + 1} failed:`, lastError.message);

        if (i < maxRetries - 1) {
          this._log.debug('Retrying after 5 seconds...');
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
        }
      }
    }

    this._log.error('Failed to discover devices after multiple attempts.');
    throw lastError || new Error('Failed to discover devices.');
  }
}
