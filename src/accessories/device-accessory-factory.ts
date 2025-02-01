import { PlatformAccessory } from 'homebridge';
import { Device } from '../models/device';
import { DeviceType } from '../models/device-type';
import { HubspacePlatform } from '../platform';
import { FanAccessory } from './fan-accessory';
import { HubspaceAccessory } from './hubspace-accessory';
import { LightAccessory } from './light-accessory';
import { OutletAccessory } from './outlet-accessory';
import { SprinklerAccessory } from './sprinkler-accessory';
import { MultiOutletAccessory } from './multi-outlet-accessory';
import { DeviceFunction } from '../models/device-functions';

/**
 * Additional data that can be passed to the accessory constructor
 */
interface AdditionalData {
  outletIndex?: number;
  config?: any; // Optional configuration object
  metadata?: any; // Optional metadata object
}

/**
 * Creates a {@link HubspaceAccessory} for a specific {@link DeviceType}.
 * @param device Device information.
 * @param platform Hubspace platform.
 * @param accessory Platform accessory.
 * @param additionalData Optional additional data for the accessory.
 * @returns {@link HubspaceAccessory}
 * @throws If the device type is not supported.
 */
export class DeviceAccessoryFactory {
  static createAccessory(platform: HubspacePlatform, accessory: PlatformAccessory, device: Device, additionalData?: AdditionalData): HubspaceAccessory {
    switch (device.deviceType) {
    case DeviceType.Light:
      // Create a LightAccessory for light devices
      return new LightAccessory(platform, accessory, additionalData);

    case DeviceType.Fan:
      // Create a FanAccessory for fan devices
      return new FanAccessory(platform, accessory, additionalData);

    case DeviceType.Outlet:
      const outletIndex = additionalData?.outletIndex ?? 0; // Extract outletIndex from additionalData
        return new OutletAccessory(platform, accessory, device, outletIndex, additionalData);
      
    case DeviceType.MultiOutlet:
      // Create a MultiOutletAccessory for multi-outlet devices
      if (!device.children || device.children.length === 0) {
        // Log an error and throw an exception if the multi-outlet device has no children
        platform.log.error(`Multi-outlet device '${device.name}' has no children.`);
        throw new Error(`Multi-outlet device '${device.name}' has no children.`);
      }
      return new MultiOutletAccessory(platform, accessory, device.children, additionalData);

    case DeviceType.Sprinkler:
      // Create a SprinklerAccessory for sprinkler devices
      return new SprinklerAccessory(platform, accessory, additionalData);

    default:
      // Log an error and throw an exception for unsupported device types
      platform.log.error(`Accessory of type '${device.type}' is not supported.`);
      throw new Error(`Accessory of type '${device.type}' is not supported.`);
  }
}
