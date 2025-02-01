import { AxiosInstance } from 'axios';
import { HttpClientFactory } from '../api/http-client-factory';
import { Device } from '../models/device';

export class DiscoveryService {
  private _httpClient: AxiosInstance;

  /**
   * Creates a new DiscoveryService instance.
   * @param baseURL - The base URL for the API.
   * @param token - Optional authentication token.
   */
  constructor(baseURL: string, token?: string) {
    this._httpClient = HttpClientFactory.createHttpClient(baseURL, token);
  }

  /**
   * Discovers devices from the API.
   * @returns A promise that resolves to an array of devices.
   */
  public async discoverDevices(): Promise<Device[]> {
    const response = await this._httpClient.get<Device[]>('/devices');
    return response.data;
  }
}
