import { HubspaceAccessory } from './hubspace-accessory';
import { HubspacePlatform } from '../platform';
import { PlatformAccessory } from 'homebridge';
import { OutletAccessory } from './outlet-accessory';
import { Device } from '../models/device';

/**
 * Handles multi-outlet devices (parent device)
 */
export class MultiOutletAccessory extends HubspaceAccessory {
  constructor(
    platform: HubspacePlatform,
    accessory: PlatformAccessory,
    children: Device[], // Array of child devices (outlets)
    additionalData?: any // Optional additional data
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
