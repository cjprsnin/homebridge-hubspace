import { PlatformAccessory, Service, Characteristic } from 'hap-nodejs'; // Direct import of PlatformAccessory
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
    if (device.children && device.children.length > 0) {
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
    const accessory = new PlatformAccessory(device.name, device.uuid);
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
    if (!response.description || !response.description.device) {
      if (response.children && response.children.length > 0) {
        const parentDevice: Device = {
          id: response.id,
          uuid: this._platform.api.hap.uuid.generate(response.id),
          deviceId: response.deviceId,
          name: response.friendlyName,
          type: DeviceType.Parent, // Set device type to Parent
          manufacturer: 'Unknown',
          model: ['Unknown'],
          functions: [
            {
              functionInstance: 'toggle',
              functionClass: 'toggle',
              values: [],
              deviceValues: [],
            },
            {
              functionInstance: 'timer',
              functionClass: 'timer',
              values: [],
              deviceValues: [],
            }
          ],
          children: (response.children ?? []).map(this.mapDeviceResponseToModel.bind(this))
            .filter((child): child is Device => !!child),
        };

        const platformAccessory = new PlatformAccessory(parentDevice.name, parentDevice.uuid);
        platformAccessory.context = { device: parentDevice };

        const switchService = platformAccessory.addService(Service.Switch, parentDevice.name);
        switchService.getCharacteristic(Characteristic.On)
          .on('set', (value, callback) => {
            console.log(`Toggled parent device: ${parentDevice.name} to ${value}`);
            callback();
          });

        this._platform.api.publishExternalAccessories('homebridge-hubspace', [platformAccessory]);
        this._platform.log.info(`Parent device created for ${parentDevice.name}:`, parentDevice);
        
        return parentDevice;
      }
      
      this._platform.log.warn(`Skipping device with missing description or device info: ${response.id}`);
      return undefined;
    }
  
    const type = getDeviceTypeForKey(response.description.device.deviceClass);
    if (!type) {
      this._platform.log.warn(`Skipping device with unsupported type: ${response.id}`);
      return undefined;
    }
  
    return {
      id: response.id,
      uuid: this._platform.api.hap.uuid.generate(response.id),
      deviceId: response.deviceId,
      name: response.friendlyName,
      type: type,
      manufacturer: response.description.device.manufacturerName,
      model: response.description.device.model.split(',').map((m) => m.trim()),
      functions: this.getSupportedFunctionsFromResponse(response.description.functions),
      children: (response.children ?? []).map(this.mapDeviceResponseToModel.bind(this))
        .filter((child): child is Device => !!child),
    };
  }

  private getSupportedFunctionsFromResponse(functions: any[]): DeviceFunctionResponse[] {
    const output: DeviceFunctionResponse[] = [];

    functions.forEach((func) => {
      if (func && func.values) {
        const functionResponse: DeviceFunctionResponse = {
          functionInstance: func.id,
          functionClass: func.functionClass,
          values: this.mapFunctionValues(func.values),
          deviceValues: func.deviceValues || [],
        };
        output.push(functionResponse);
      }
    });

    return output;
  }

  private mapFunctionValues(values: any[]): DeviceFunctionValues[] {
    return values.map((value) => ({
      name: value.name,
      deviceValues: value.deviceValues || [],
      range: value.range || {} as ValuesRange,
    }));
  }

  private async exportDevicesToFile(devices: Device[]): Promise<void> {
    const filePath = path.resolve(__dirname, 'devices.json');
    fs.writeFileSync(filePath, JSON.stringify(devices, null, 2));
    this._platform.log.info(`Devices exported to file: ${filePath}`);
  }
}
