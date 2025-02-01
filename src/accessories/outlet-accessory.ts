import { HubspacePlatform } from '../platform';
import { PlatformAccessory, Service, Characteristic } from 'homebridge';
import { Device } from '../models/device';
import { HubspaceAccessory } from './hubspace-accessory';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
import { isNullOrUndefined } from '../utils';

xport class OutletAccessory {
  private outletIndex: number; // Add outletIndex property

  constructor(
    private readonly platform: HubspacePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: Device,
    outletIndex: number, // Add outletIndex parameter
    private readonly additionalData?: any
  ) {
    this.outletIndex = outletIndex; // Initialize outletIndex
    this.configureAccessory();
  }
  
  private configureAccessory(): void {
    // Configure the accessory (e.g., setup characteristics)
    this.accessory.getService(this.platform.Service.Outlet)!
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));
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
    const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.deviceValues[this.outletIndex].key);
    return value;
  }

  private async setOn(value: CharacteristicValue): Promise<void> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower, undefined, this.outletIndex);
    await this.deviceService.setValue(this.device.deviceId, func.deviceValues[this.outletIndex].key, value);
  }
}
