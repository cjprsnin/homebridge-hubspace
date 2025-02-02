import { PlatformAccessory } from 'homebridge';
import { HubspacePlatform } from '../platform';
import { Device } from '../models/device';
import { DeviceType } from '../models/device-type';
import { AdditionalData } from '../models/additional-data';
import { HubspaceAccessory } from './hubspace-accessory';
import { LightAccessory } from './light-accessory';
import { FanAccessory } from './fan-accessory';
import { OutletAccessory } from './outlet-accessory';
import { MultiOutletAccessory } from './multi-outlet-accessory';
import { SprinklerAccessory } from './sprinkler-accessory';

export class createAccessoryForDevice {
  static createAccessory(
    platform: HubspacePlatform,
    accessory: PlatformAccessory,
    device: Device,
    additionalData?: AdditionalData
  ): HubspaceAccessory {
    platform.log.info(`Initializing ${device.name} (${device.type})`);

    const deviceType = device.type;

    switch (deviceType) {
      case DeviceType.Light:
        return new LightAccessory(platform, accessory, device, additionalData);

      case DeviceType.Fan:
        return new FanAccessory(platform, accessory, device, additionalData);

      case DeviceType.Outlet:
        const outletIndex = additionalData?.outletIndex ?? 0;
        return new OutletAccessory(platform, accessory, device, outletIndex);

      case DeviceType.MultiOutlet:
        return new MultiOutletAccessory(platform, accessory, device, additionalData); // Pass device

      case DeviceType.Sprinkler:
        return new SprinklerAccessory(platform, accessory, device, additionalData);

      default:
        platform.log.error(`Device type '${deviceType}' is not supported.`);
        throw new Error(`Device type '${deviceType}' is not supported.`);
    }
  }
}
