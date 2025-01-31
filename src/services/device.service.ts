import { HubspacePlatform } from '../platform';
import { Endpoints } from '../api/endpoints';
import { createHttpClientWithBearerInterceptor } from '../api/http-client-factory';
import { AxiosError, AxiosResponse } from 'axios';
import { DeviceStatusResponse } from '../responses/device-status-response';
import { CharacteristicValue } from 'homebridge';
import { convertNumberToHexReverse } from '../utils';
import { isAferoError } from '../responses/afero-error-response';
import { TokenService } from './token-service';

/**
 * Service for interacting with devices
 */
export class DeviceService {
  private readonly _httpClient = createHttpClientWithBearerInterceptor({
    baseURL: Endpoints.API_BASE_URL,
  });

  constructor(private readonly _platform: HubspacePlatform) {}

  /**
   * Ensures a valid token is available
   */
  private async ensureToken(): Promise<void> {
    const token = await TokenService.instance.getToken();
    if (!token) {
      throw new Error('Failed to retrieve access token.');
    }
  }

  /**
   * Sets an attribute value for a device
   * @param deviceId ID of a device
   * @param attributeId ID of the attribute to set
   * @param value Value to set to attribute
   */
  async setValue(deviceId: string, attributeId: string, value: CharacteristicValue): Promise<void> {
    await this.ensureToken();

    let response: AxiosResponse;

    try {
      const payload = {
        type: 'attribute_write',
        attrId: attributeId,
        data: this.getDataValue(value),
      };

      this._platform.log.debug('Sending request payload:', payload);

      response = await this._httpClient.post(
        `accounts/${this._platform.accountService.accountId}/devices/${deviceId}/actions`,
        payload
      );

      this._platform.log.debug('Received response:', response.data);
    } catch (ex) {
      this.handleError(<AxiosError>ex);
      return;
    }

    if (response.status === 200) return;

    this._platform.log.error(`Remote server did not accept new value ${value} for device (ID: ${deviceId}).`);
  }

  /**
   * Gets a value for attribute
   * @param deviceId ID of a device
   * @param attributeId ID of the attribute to get
   * @returns Data value
   */
  async getValue(deviceId: string, attributeId: string): Promise<CharacteristicValue | undefined> {
    await this.ensureToken();

    let deviceStatus: DeviceStatusResponse;

    try {
      const response = await this._httpClient.get<DeviceStatusResponse>(
        `accounts/${this._platform.accountService.accountId}/devices/${deviceId}?expansions=attributes,state`
      );
      deviceStatus = response.data;
    } catch (ex) {
      this.handleError(<AxiosError>ex);
      return undefined;
    }

    /* Device is offline */
    if (!deviceStatus.deviceState.available) {
      this._platform.log.warn(`Device (ID: ${deviceId}) is offline.`);
      return undefined;
    }

    const attributeResponse = deviceStatus.attributes.find((a) => a.id.toString() === attributeId);

    if (!attributeResponse) {
      this._platform.log.error(`Failed to find value for ${attributeId} for device (device ID: ${deviceId})`);
      return undefined;
    }

    return attributeResponse.value;
  }

  /**
   * Converts a characteristic value to a string representation
   * @param value Value to convert
   * @returns String representation of the value
   */
  private getDataValue(value: CharacteristicValue): string {
    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'boolean') {
      return value ? '01' : '00';
    }

    if (typeof value === 'number') {
      return convertNumberToHexReverse(value);
    }

    this._platform.log.warn('Unsupported value type:', typeof value);
    throw new Error('The value type is not supported.');
  }
/**
   * Gets a value for attribute as boolean
   * @param deviceId ID of a device
   * @param attributeId ID of the attribute to get
   * @returns Boolean value
   */
  public async getValueAsBoolean(deviceId: string, attributeId: string): Promise<boolean | undefined> {
    const value = await this.getValue(deviceId, attributeId);
    return value === '1';
  }

   public async getValueAsInteger(deviceId: string, attributeId: string): Promise<number | undefined> {
    const value = await this.getValue(deviceId, attributeId);
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return undefined;
  }
  /**
   * Handles errors from API requests
   * @param error Axios error
   */
  private handleError(error: AxiosError): void {
    const responseData = error.response?.data;
    const errorMessage = isAferoError(responseData) ? responseData.error_description : error.message;

    if (error.response?.status === 429) {
      this._platform.log.error('Rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 401) {
      this._platform.log.error('Unauthorized. Please check your credentials.');
    } else {
      this._platform.log.error('The remote service returned an error:', errorMessage);
    }
  }
}
