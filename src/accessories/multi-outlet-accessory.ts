import { HubspaceAccessory } from './hubspace-accessory';
import { HubspacePlatform } from '../platform';
import { PlatformAccessory } from 'homebridge';
import { OutletAccessory } from './outlet-accessory';
import { Device } from '../models/device';
import { AdditionalData } from './device-accessory-factory'; // Import AdditionalData

export class MultiOutletAccessory {
  constructor(
    private readonly platform: HubspacePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly children: Device[],
    private readonly additionalData?: AdditionalData // Add additionalData parameter
  ) {
    super(platform, accessory, [platform.Service.Outlet]);

    // Check if the children array is valid
    if (!children || children.length === 0) {
      platform.log.error('No child devices found for multi-outlet accessory.');
      throw new Error('No child devices found for multi-outlet accessory.');
    }

    // Iterate over child devices (outlets) and create an OutletAccessory for each
    for (let i = 0; i < children.length; i++) {
      const outletDevice = children[i];
      
      // Create an OutletAccessory for each child device (outlet)
      const outletAccessory = new OutletAccessory(platform, accessory, i, additionalData);

      // Add each OutletAccessory's services to the parent
      this.services.push(...outletAccessory.getServices());
    }
  }
}
