import { PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HubspacePlatform } from '../platform';
import { Device } from '../models/device';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
import { AdditionalData } from '../models/additional-data'; // Correct import path
import { HubspaceAccessory } from './hubspace-accessory';


export class OutletAccessory extends HubspaceAccessory {
  constructor(
    protected readonly platform: HubspacePlatform,
    protected readonly accessory: PlatformAccessory,
    protected readonly device: Device,
    private readonly outletIndex: number
  ) {
    super(platform, accessory, [platform.Service.Outlet]);
    this.initializeService();
    this.setAccessoryInformation();
  }

  public initializeService(): void {
    const service = this.addService(this.platform.Service.Outlet);
    this.configureName(service, `${this.device.name} Outlet ${this.outletIndex + 1}`);

    service
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(async () => this.getOn())
      .onSet((value) => this.setOn(value));

    this.removeStaleServices();
  }

  public async updateState(): Promise<void> {
    const value = await this.getOn();
    const service = this.services.find((s) => s.UUID === this.platform.Service.Outlet.UUID);
    if (service) {
      service.updateCharacteristic(this.platform.Characteristic.On, value);
    }
  }

  private async getOn(): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Power, undefined, this.outletIndex);
    if (!func) {
      this.log.error(`${this.device.name}: Power function not supported.`);
      return false; // Return a default value or throw an error
    }

    const value = await this.deviceService.getValueAsBoolean(
      this.device.deviceId,
      func.values[0].deviceValues[this.outletIndex].key
    );
    this.log.debug(`${this.device.name}: Received ${value} from Hubspace Power`);
    return value ?? false; // Ensure a boolean is returned
  }

  private async setOn(value: CharacteristicValue): Promise<void> {
    this.log.debug(`${this.device.name}: Received ${value} from Homekit Power`);
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Power, undefined, this.outletIndex);
    if (!func) {
      this.log.error(`${this.device.name}: Power function not supported.`);
      return;
    }

    await this.deviceService.setValue(
      this.device.deviceId,
      func.values[0].deviceValues[this.outletIndex].key,
      value
    );
  }
}
