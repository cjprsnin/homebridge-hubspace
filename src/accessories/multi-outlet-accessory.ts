import { HubspaceAccessory } from './hubspace-accessory';
import { HubspacePlatform } from '../platform';
import { PlatformAccessory } from 'homebridge';
import { OutletAccessory } from './outlet-accessory';

/**
 * Handles multi-outlet devices (parent device)
 */
export class MultiOutletAccessory extends HubspaceAccessory {
  constructor(platform: HubspacePlatform, accessory: PlatformAccessory) {
    super(platform, accessory, [platform.Service.Outlet]);

    // Determine the number of outlets (child devices)
    const outletCount = accessory.context.device.children.length;

    // Iterate over child devices (outlets) and create an OutletAccessory for each
    for (let i = 0; i < outletCount; i++) {
      const outletDevice = accessory.context.device.children[i];
      
      // Create an OutletAccessory for each child device (outlet)
      const outletAccessory = new OutletAccessory(platform, accessory, i);

      // Add each OutletAccessory's services to the parent
      this.services.push(...outletAccessory.getServices());
    }
  }
}
