import { PlatformAccessory } from 'homebridge';
import { Device } from '../models/device';
import { DeviceType } from '../models/device-type';
import { HubspacePlatform } from '../platform';
import { FanAccessory } from './fan-accessory';
import { HubspaceAccessory } from './hubspace-accessory';
import { LightAccessory } from './light-accessory';
import { OutletAccessory } from './outlet-accessory';
import { SurgeProtectorAccessory } from './outlet-accessory';
import { SprinklerAccessory } from './sprinkler-accessory';
import { DeviceFunctionValues } from '../models/device-functions';
import { DeviceFunction } from '../models/device-functions';

// src/responses/device-function-response.ts
export interface DeviceFunctionResponse {
  functionClass: string;
  values: DeviceFunctionValues[];  // Ensure 'values' is defined here
  functionInstance?: string;       // Add functionInstance if needed
}
/**
 * Creates {@link HubspaceAccessory} for a specific {@link DeviceType}
 * @param device Device information
 * @param platform Hubspace platform
 * @param accessory Platform accessory
 * @returns {@link HubspaceAccessory}
 * @throws If device type is not supported
 */
export function createAccessoryForDevice(device: Device, platform: HubspacePlatform, accessory: PlatformAccessory): HubspaceAccessory{
    switch(device.type){
        case DeviceType.Light:
            return new LightAccessory(platform, accessory);
        case DeviceType.Fan:
            return new FanAccessory(platform, accessory);
        case DeviceType.Outlet:
            return new OutletAccessory(platform, accessory);
        case DeviceType.Sprinkler:
            return new SprinklerAccessory(platform, accessory);
        default:
            throw new Error(`Accessory of type '${device.type}' is not supported.`);
    }
}
