import { PlatformAccessory, CharacteristicValue, Service } from 'homebridge';
import { HubspacePlatform } from '../platform';
import { Device } from '../models/device';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
import { HubspaceAccessory } from './hubspace-accessory';
import { AdditionalData } from '../models/additional-data';

export class MultiOutletAccessory extends HubspaceAccessory {
  constructor(
    protected readonly platform: HubspacePlatform,
    protected readonly accessory: PlatformAccessory,
    protected readonly device: Device,
    additionalData?: AdditionalData
  ) {
    super(platform, accessory, [platform.Service.Outlet]);
    this.initializeService();
    this.setAccessoryInformation();
  }

  public initializeService(): void {
    // Iterate through each child (representing an outlet) and configure the service
    this.device.children.forEach((child, index) => {
      const service = this.addService(this.platform.Service.Outlet);
      this.configureName(service, `${this.device.name} Outlet ${index + 1}`);

      service
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(async () => this.getOn(index))
        .onSet((value) => this.setOn(value, index));
    });

    this.removeStaleServices();
  }

  public async updateState(): Promise<void> {
    for (let index = 0; index < this.device.children.length; index++) {
      const value = await this.getOn(index);
      const service = this.services.find((s) => s.UUID === this.platform.Service.Outlet.UUID && s.subtype === `outlet-${index}`);
      if (service) {
        service.updateCharacteristic(this.platform.Characteristic.On, value);
      }
    }
  }

  private async getOn(outletIndex: number): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Power, undefined, outletIndex);
    if (!func) {
      this.log.error(`${this.device.name}: Power function not supported for outlet ${outletIndex + 1}.`);
      return false; // Return a default value or throw an error
    }

    const value = await this.deviceService.getValueAsBoolean(
      this.device.deviceId,
      func.values[0].deviceValues[outletIndex].key
    );
    this.log.debug(`${this.device.name}: Received ${value} from Hubspace Power for outlet ${outletIndex + 1}`);
    return value ?? false; // Ensure a boolean is returned
  }

  private async setOn(value: CharacteristicValue, outletIndex: number): Promise<void> {
    this.log.debug(`${this.device.name}: Received ${value} from Homekit Power for outlet ${outletIndex + 1}`);
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Power, undefined, outletIndex);
    if (!func) {
      this.log.error(`${this.device.name}: Power function not supported for outlet ${outletIndex + 1}.`);
      return;
    }

    await this.deviceService.setValue(
      this.device.deviceId,
      func.values[0].deviceValues[outletIndex].key,
      value
    );
  }
}
