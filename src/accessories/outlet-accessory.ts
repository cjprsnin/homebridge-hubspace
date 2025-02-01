import { PlatformAccessory, CharacteristicValue, Service } from 'homebridge';
import { HubspacePlatform } from '../platform';
import { Device, DeviceFunction, getDeviceFunctionDef } from '../models/device';
import { AdditionalData } from './device-accessory-factory';
import { HubspaceAccessory } from './hubspace-accessory';

export class OutletAccessory extends HubspaceAccessory {
  constructor(
    protected readonly platform: HubspacePlatform,
    protected readonly accessory: PlatformAccessory,
    protected readonly device: Device,
    private readonly outletIndex: number,
    private readonly additionalData?: AdditionalData
  ) {
    super(platform, accessory, [platform.Service.Outlet]); // Call super with required services
    this.initializeService();
    this.setAccessoryInformation();
  }

 public initializeService(): void {
    const service = this.addService(this.platform.Service.Outlet); // Use addService from base class
    this.configureName(service, `${this.device.name} Outlet ${this.outletIndex + 1}`);

    // Configure outlet-specific characteristics
    service
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(() => this.getOn())
      .onSet((value) => this.setOn(value));

    this.removeStaleServices();
  }


  public updateState(state: any): void {
    const service = this.services[0];
    if (service) {
      service.updateCharacteristic(this.platform.Characteristic.On, state.power ?? false);
    }
  }

  private async getOn(): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower, undefined, this.outletIndex);
    const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.deviceValues[this.outletIndex].key);
    this.log.debug(`${this.device.name}: Received ${value} from Hubspace Power`);
    return value ?? false; // Ensure a boolean is returned
  }

  private async setOn(value: CharacteristicValue): Promise<void> {
    this.log.debug(`${this.device.name}: Received ${value} from Homekit Power`);
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower, undefined, this.outletIndex);
    await this.deviceService.setValue(this.device.deviceId, func.deviceValues[this.outletIndex].key, value);
  }

  public getServices(): Service[] {
    return this.services;
  }
}
