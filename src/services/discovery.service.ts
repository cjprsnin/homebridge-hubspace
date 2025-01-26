import { PlatformAccessory } from 'homebridge';
import { HubspacePlatform } from '../platform';
import { DeviceResponse } from '../responses/devices-response';
import { PLATFORM_NAME, PLUGIN_NAME } from '../settings';
import { Endpoints } from '../api/endpoints';
import { createHttpClientWithBearerInterceptor } from '../api/http-client-factory';
import { DeviceType, getDeviceTypeForKey } from '../models/device-type';
import { Device } from '../models/device';
import { createAccessoryForDevice } from '../accessories/device-accessory-factory';
import { AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import {
  DeviceFunctionResponse,
  DeviceFunctionValues,
  DeviceValues,
  ValuesRange,
} from '../responses/device-function-response';

/**
 * Service for discovering and managing devices
 */
export class DiscoveryService {
  private readonly _httpClient = createHttpClientWithBearerInterceptor({
    baseURL: Endpoints.API_BASE_URL,
    headers: {
      host: 'semantics2.afero.net',
    },
  });

  private _cachedAccessories: PlatformAccessory[] = [];

  constructor(private readonly _platform: HubspacePlatform) {}

  /**
   * Receives accessory that has been cached by Homebridge
   * @param accessory Cached accessory
   */
  configureCachedAccessory(accessory: PlatformAccessory): void {
    this._cachedAccessories.push(accessory);
  }

  /**
   * Discovers new devices
   */
  async discoverDevices() {
    const devices = await this.getDevicesForAccount();
  
    for (const device of devices) {
      let existingAccessory = this._cachedAccessories.find(
        (accessory) => accessory.UUID === device.uuid
      );
  
      if (existingAccessory) {
        this._platform.log.info(
          'Restoring existing accessory from cache:',
          existingAccessory.displayName
        );
        this.registerCachedAccessory(existingAccessory, device);
      } else {
        this._platform.log.info('Adding new accessory:', device.name);
        existingAccessory = this.registerNewAccessory(device);
      }
  
      // Handle multi-outlet and single-outlet devices
      if (device.type === DeviceType.MultiOutlet && device.children) {
        this.handleMultiOutletDevice(device, existingAccessory);
      } else {
        // Skip parent devices from creating accessories
        if (device.type === DeviceType.Parent) {
          this._platform.log.info(`Skipping accessory creation for parent device: ${device.name}`);
          continue; // Skip the rest of the loop for parent devices
        }
        
        createAccessoryForDevice(device, this._platform, existingAccessory);
      }
    }
  
    this.clearStaleAccessories(
      this._cachedAccessories.filter((a) => !devices.some((d) => d.uuid === a.UUID))
    );
  
    // Export the JSON results
    await this.exportDevicesToFile(devices);
  }
  

  private handleMultiOutletDevice(device: Device, existingAccessory: PlatformAccessory) {
    // Ensure that device.children exists before accessing it
    if (device.children && device.children.length > 0) {
      // For each outlet (child), create an accessory
      device.children.forEach((childDevice, index) => {
        this._platform.log.info(`Adding outlet ${index + 1} for multi-outlet device: ${device.name}`);
        createAccessoryForDevice(childDevice, this._platform, existingAccessory, device.children?.length ?? 0);
      });
    } else {
      this._platform.log.warn(`Device ${device.name} does not have children to create outlets.`);
    }
  }
 
  private clearStaleAccessories(staleAccessories: PlatformAccessory[]): void {
    this._platform.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, staleAccessories);

    for (const accessory of staleAccessories) {
      const cacheIndex = this._cachedAccessories.findIndex((a) => a.UUID === accessory.UUID);

      if (cacheIndex < 0) continue;

      this._platform.log.info('Removing stale accessory:', accessory.displayName);
      this._cachedAccessories.splice(cacheIndex, 1);
    }
  }

  private registerCachedAccessory(accessory: PlatformAccessory, device: Device): void {
    accessory.context.device = device;
    this._platform.api.updatePlatformAccessories([accessory]);
  }

  private registerNewAccessory(device: Device): PlatformAccessory {
    const accessory = new this._platform.api.platformAccessory(device.name, device.uuid);
    accessory.context.device = device;
    this._platform.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    return accessory;
  }

  private async getDevicesForAccount(): Promise<Device[]> {
    try {
      const response = await this._httpClient.get<DeviceResponse[]>(
        `accounts/${this._platform.accountService.accountId}/metadevices`
      );
  
      return response.data
        .map(this.mapDeviceResponseToModel.bind(this))
        .filter((device): device is Device => !!device); // Filter out undefined devices
    } catch (ex) {
      this._platform.log.error('Failed to get devices for account.', (<AxiosError>ex).message);
      return [];
    }
  }

  private mapDeviceResponseToModel(response: DeviceResponse): Device | undefined {
    // If there's no description, but the device has children, treat it as a parent device
    if (!response.description || !response.description.device) {
      if (response.children && response.children.length > 0) {
        // Process as a parent device with children
        this._platform.log.warn(`Device ${response.id} lacks description, but has children.`);
        return {
          id: response.id,
          uuid: this._platform.api.hap.uuid.generate(response.id),
          deviceId: response.deviceId,
          name: response.friendlyName,
          type: DeviceType.Parent, // Set device type to Parent
          manufacturer: 'Unknown', // Fallback manufacturer name
          model: ['Unknown'], // Fallback model name
          functions: [
            {
              functionInstance: 'toggle', // A default toggle function
              functionClass: 'toggle',  // The class for toggle functionality
              values: [], // Empty values for simplicity
              deviceValues: [], // Empty device values
            },
            {
              functionInstance: 'timer', // A default timer function
              functionClass: 'timer',  // The class for timer functionality
              values: [], // Empty values for simplicity
              deviceValues: [], // Empty device values
            }
          ],
          children: response.children
            .map(this.mapDeviceResponseToModel.bind(this))
            .filter((child): child is Device => !!child), // Ensure valid children
        };
      }
      // If the device has neither description nor children, skip it
      this._platform.log.warn(`Skipping device with missing description or device info: ${response.id}`);
      return undefined;
    }
  
    // If there's a valid description, map the device normally
    const type = getDeviceTypeForKey(response.description.device.deviceClass);
    if (!type) {
      this._platform.log.warn(`Skipping device with unsupported type: ${response.id}`);
      return undefined;
    }
  
    // Return the mapped device with its functions
    return {
      id: response.id,
      uuid: this._platform.api.hap.uuid.generate(response.id),
      deviceId: response.deviceId,
      name: response.friendlyName,
      type: type,
      manufacturer: response.description.device.manufacturerName,
      model: response.description.device.model.split(',').map((m) => m.trim()),
      functions: this.getSupportedFunctionsFromResponse(response.description.functions), // Mapping functions
      children: response.children
        ?.map(this.mapDeviceResponseToModel.bind(this)) // Recursively map child devices
        .filter((child): child is Device => !!child),  // Filter out invalid children
    };
  }
  

  private getSupportedFunctionsFromResponse(functions: any[]): DeviceFunctionResponse[] {
    const output: DeviceFunctionResponse[] = [];

    functions.forEach((func) => {
      if (func && func.values) {
        const functionResponse: DeviceFunctionResponse = {
          functionInstance: func.id,
          functionClass: func.functionClass,
          values: this.mapFunctionValues(func.values), // Map values to the correct structure
          deviceValues: func.deviceValues || [], // If deviceValues exist, include them
        };
        output.push(functionResponse);
      }
    });

    return output;
  }

  private mapFunctionValues(values: any[]): DeviceFunctionValues[] {
    return values.map((value) => ({
      name: value.name,
      deviceValues: value.deviceValues.map((deviceValue: DeviceValues) => ({
        type: deviceValue.type,
        key: deviceValue.key,
      })),
      range: this.mapRange(value.range), // Map the range if available
    }));
  }

  

  private mapRange(range: any): ValuesRange {
    if (range && range.min !== undefined && range.max !== undefined && range.step !== undefined) {
      return {
        min: range.min,
        max: range.max,
        step: range.step,
      };
    }
    return { min: 0, max: 100, step: 1 }; // Default range values if not provided
  }

  private async exportDevicesToFile(devices: Device[]): Promise<void> {
    try {
      const filePath = path.resolve(__dirname, '../../devices.json'); // Path to save the file

      fs.writeFileSync(filePath, JSON.stringify(devices, null, 2), 'utf-8'); // Write JSON to file

      this._platform.log.info(`Devices exported successfully to: ${filePath}`);
    } catch (error) {
      this._platform.log.info('Device Response:', JSON.stringify(devices, null, 2));
    }
  }

  /**
   * Function to toggle device On/Off state
   * @param device The device to toggle the state for
   * @param state The desired state (true for ON, false for OFF)
   */
  async toggleDeviceState(device: Device, state: boolean): Promise<void> {
    try {
      const action = state ? 'on' : 'off';
      const response = await this._httpClient.post(
        `${Endpoints.API_BASE_URL}/devices/${device.deviceId}/state`,
        {
          state: action, // Either 'on' or 'off'
        }
      );
  
      if (response.status === 200) {
        this._platform.log.info(`Device ${device.name} is now turned ${action}.`);
      } else {
        this._platform.log.warn(`Failed to toggle device ${device.name} to ${action}.`);
      }
    } catch (error) {
      // Handle 'unknown' error type
      if (error instanceof Error) {
        this._platform.log.error(`Error toggling device ${device.name}: ${error.message}`);
      }}}}