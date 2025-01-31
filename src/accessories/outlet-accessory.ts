import { HubspacePlatform } from '../platform';
import { PlatformAccessory, Service, Characteristic } from 'homebridge';
import { Device } from '../models/device';
import { HubspaceAccessory } from './hubspace-accessory';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
import { isNullOrUndefined } from '../utils';

export class OutletAccessory extends HubspaceAccessory {
  constructor(
    platform: HubspacePlatform,
    accessory: PlatformAccessory,
    device: Device,
    additionalData?: any
  ) {
    super(platform, accessory, [platform.Service.Outlet]);
    this.configureOutlet();
  }

  private configureOutlet(): void {
    if (this.supportsFunction(DeviceFunction.OutletPower)) {
      const outletService = this.createOutletService();
      outletService
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(this.getOn.bind(this))
        .onSet(this.setOn.bind(this));
    }
  }

  private createOutletService(): Service {
    const outletService = this.accessory.getService(this.platform.Service.Outlet)
      || this.accessory.addService(this.platform.Service.Outlet);

    outletService.setCharacteristic(this.platform.Characteristic.Name, this.device.name);

    return outletService;
  }

  public getServices(): Service[] {
    return [this.createOutletService()];
  }

  private async getOn(): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower, undefined, this.outletIndex);
    if (!func) {
      throw new Error('OutletPower function not found.');
    }

    const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.deviceValues[this.outletIndex].key);
    if (isNullOrUndefined(value)) {
      throw new Error('Failed to get outlet power state.');
    }

    return value;
  }

  private async setOn(value: CharacteristicValue): Promise<void> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower, undefined, this.outletIndex);
    if (!func) {
      throw new Error('OutletPower function not found.');
    }

    await this.deviceService.setValue(this.device.deviceId, func.deviceValues[this.outletIndex].key, value);
  }
}
