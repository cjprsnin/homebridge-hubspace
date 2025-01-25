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
import { DeviceFunction, DeviceFunctions } from '../models/device-functions';
import { DeviceFunctionResponse } from '../responses/device-function-response';
import * as fs from 'fs';
import * as path from 'path';

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
                createAccessoryForDevice(device, this._platform, existingAccessory, device.children.length);
            } else {
                createAccessoryForDevice(device, this._platform, existingAccessory);
            }
        }

        this.clearStaleAccessories(
            this._cachedAccessories.filter((a) => !devices.some((d) => d.uuid === a.UUID))
        );

        // Export the JSON results
        await this.exportDevicesToFile(devices);
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
        const type = getDeviceTypeForKey(response.description.device.deviceClass);

        if (!type) return undefined;

        return {
            id: response.id,
            uuid: this._platform.api.hap.uuid.generate(response.id),
            deviceId: response.deviceId,
            name: response.friendlyName,
            type: type,
            manufacturer: response.description.device.manufacturerName,
            model: response.description.device.model.split(',').map((m) => m.trim()),
            functions: this.getSupportedFunctionsFromResponse(response.description.functions),
            children: response.children?.map(this.mapDeviceResponseToModel.bind(this)).filter((child): child is Device => !!child), // Type guard to ensure only Device objects remain
        };
    }

    private getSupportedFunctionsFromResponse(
        supportedFunctions: DeviceFunctionResponse[]
    ): DeviceFunctionResponse[] {
        const output: DeviceFunctionResponse[] = [];

        for (const df of DeviceFunctions) {
            const type = supportedFunctions.find(
                (fc) =>
                    df.functionInstanceName === fc.functionInstance && df.functionClass === fc.functionClass
            );

            if (type === undefined || output.indexOf(type) >= 0) continue;

            output.push(type);
        }

        return output;
    }

    private async exportDevicesToFile(devices: Device[]): Promise<void> {
        try {
            const filePath = path.resolve(__dirname, '../../devices.json'); // Path to save the file

            fs.writeFileSync(filePath, JSON.stringify(devices, null, 2), 'utf-8'); // Write JSON to file

            this._platform.log.info(`Devices exported successfully to: ${filePath}`);
        } catch (error) {
            this._platform.log.error('Failed to export devices:', (error as Error).message);
        }
    }
}
