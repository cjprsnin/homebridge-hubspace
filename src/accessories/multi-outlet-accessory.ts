import { PlatformAccessory, Service, CharacteristicValue } from 'homebridge';
import { HubspacePlatform } from '../platform';
import { Device } from '../models/device';
import { HubspaceAccessory } from './hubspace-accessory';
import { AdditionalData } from './device-accessory-factory';

/**
 * Multi-outlet accessory for Hubspace platform
 */
export class MultiOutletAccessory extends HubspaceAccessory {
  constructor(
    protected readonly platform: HubspacePlatform,
    protected readonly accessory: PlatformAccessory,
    private readonly children: Device[],
    private readonly additionalData?: AdditionalData
  ) {
    super(platform, accessory, [platform.Service.Outlet]);

    this.initializeService();
    this.setAccessoryInformation();
  }

  /**
   * Initializes the services for the multi-outlet accessory.
   */
   private initializeService(): void { // Change to private
    for (const child of this.children) {
      const service = this.accessory.getService(child.name) || this.accessory.addService(this.platform.Service.Outlet, child.name);
      this.services.push(service);

      service.getCharacteristic(this.platform.Characteristic.On)
        .onGet(() => this.getOn(child.deviceId))
        .onSet((value) => this.setOn(child.deviceId, value));

      this.configureName(service, child.name);
    }

    this.removeStaleServices();
  }

  /**
   * Updates the state of the accessory.
   * @param state The new state of the accessory.
   */
  public updateState(state: any): void {
    // Update the state of each child outlet
    for (const child of this.children) {
      const service = this.services.find(s => s.displayName === child.name);
      if (service) {
        service.updateCharacteristic(this.platform.Characteristic.On, state[child.deviceId]?.power ?? false);
      }
    }
  }

  /**
   * Gets the power state of a specific outlet.
   * @param deviceId The ID of the outlet.
   * @returns The power state of the outlet.
   */
  private async getOn(deviceId: string): Promise<CharacteristicValue> {
    const value = await this.deviceService.getValueAsBoolean(deviceId, 'power');
    this.log.debug(`${deviceId}: Received ${value} from Hubspace Power`);
    return value;
  }

  /**
   * Sets the power state of a specific outlet.
   * @param deviceId The ID of the outlet.
   * @param value The new power state.
   */
  private async setOn(deviceId: string, value: CharacteristicValue): Promise<void> {
    this.log.debug(`${deviceId}: Received ${value} from Homekit Power`);
    await this.deviceService.setValue(deviceId, 'power', value);
  }
}
