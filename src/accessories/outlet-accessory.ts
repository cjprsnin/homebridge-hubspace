import { PlatformAccessory, CharacteristicValue, Service } from 'homebridge'; // Import CharacteristicValue
import { HubspacePlatform } from '../platform';
import { Device, DeviceFunction, getDeviceFunctionDef } from '../models';
import { DeviceService } from '../services/device-service'; // Import DeviceService

export class OutletAccessory {
  private deviceService: DeviceService; // Add deviceService property

  constructor(
    private readonly platform: HubspacePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: Device,
    private readonly outletIndex: number, // Add outletIndex parameter
    private readonly additionalData?: any
  ) {
    this.deviceService = new DeviceService(this.platform); // Initialize deviceService
    this.configureAccessory();
  }

  private configureAccessory(): void {
    const service = this.accessory.getService(this.platform.Service.Outlet) || this.accessory.addService(this.platform.Service.Outlet);

    service.getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));
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
