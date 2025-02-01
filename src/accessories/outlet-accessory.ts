import { PlatformAccessory, CharacteristicValue, Service } from 'homebridge';
import { HubspacePlatform } from '../platform';
import { Device, DeviceFunction, getDeviceFunctionDef } from '../models/device'; // Correct import path
import { AdditionalData } from './device-accessory-factory'; // Import AdditionalData

export class OutletAccessory implements HubspaceAccessory {
  public services: Service[] = []; // Add required properties
  public log = this.platform.log;
  public config = this.platform.config;

  constructor(
    private readonly platform: HubspacePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: Device,
    private readonly outletIndex: number,
    private readonly additionalData?: AdditionalData
  ) {
    this.configureAccessory();
  }

  private configureAccessory(): void {
    const service = this.accessory.getService(this.platform.Service.Outlet) || this.accessory.addService(this.platform.Service.Outlet);
    this.services.push(service);

    service.getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));
  }

 private async getOn(): Promise<CharacteristicValue> {
  const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower, undefined, this.outletIndex);
  const value = await this.platform.deviceService.getValueAsBoolean(this.device.deviceId, func.deviceValues[this.outletIndex].key);
  return value ?? false; // Ensure a boolean is returned
}

  private async setOn(value: CharacteristicValue): Promise<void> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower, undefined, this.outletIndex);
    await this.platform.deviceService.setValue(this.device.deviceId, func.deviceValues[this.outletIndex].key, value);
  }
  
  public getServices(): Service[] {
  return this.services;
}
}
