import { PlatformAccessory } from 'homebridge';
import { Device } from '../models/device';
import { DeviceType } from '../models/device-type';
import { HubspacePlatform } from '../platform';
import { FanAccessory } from './fan-accessory';
import { HubspaceAccessory } from './hubspace-accessory';
import { LightAccessory } from './light-accessory';
import { OutletAccessory } from './outlet-accessory';
import { SprinklerAccessory } from './sprinkler-accessory';
import { MultiOutletAccessory } from './multi-outlet-accessory'; // Ensure this is imported
import { DeviceFunction } from '../models/device-functions';

/**
 * Creates {@link HubspaceAccessory} for a specific {@link DeviceType}
 * @param device Device information
 * @param platform Hubspace platform
 * @param accessory Platform accessory
 * @returns {@link HubspaceAccessory}
 * @throws If device type is not supported
 */
export function createAccessoryForDevice(
  device: Device,
  platform: HubspacePlatform,
  accessory: PlatformAccessory,
  additionalData?: any // Add an optional argument
): HubspaceAccessory {
  switch (device.type) {
    case DeviceType.Light:
      return new LightAccessory(platform, accessory);
    case DeviceType.Fan:
      return new FanAccessory(platform, accessory);
    case DeviceType.Outlet:
      // Single-outlet accessory
      return new OutletAccessory(platform, accessory, 0); // Pass outlet index 0 for single-outlet devices
    case DeviceType.MultiOutlet:
      // Multi-outlet accessory
      if (!device.children || device.children.length === 0) {
        throw new Error(`Multi-outlet device '${device.name}' has no children.`);
      }
      return new MultiOutletAccessory(platform, accessory);
    case DeviceType.Sprinkler:
      return new SprinklerAccessory(platform, accessory);
    default:
      throw new Error(`Accessory of type '${device.type}' is not supported.`);
  }
}
