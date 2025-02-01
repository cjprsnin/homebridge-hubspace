import { AxiosInstance } from 'axios';
import { HttpClientFactory } from '../api/http-client-factory';
import { Device } from '../models/device';
import { PlatformAccessory } from 'homebridge';

export class DiscoveryService {
  private _httpClient: AxiosInstance;

  constructor(baseURL: string, token?: string) {
    this._httpClient = HttpClientFactory.createHttpClient(baseURL, token);
  }

  public async discoverDevices(): Promise<Device[]> {
    const response = await this._httpClient.get<Device[]>('/devices');
    return response.data;
  }

  public configureCachedAccessory(accessory: PlatformAccessory): void {
    // Implement logic to configure the cached accessory
    console.log(`Configuring cached accessory: ${accessory.displayName}`);
  }
}
