import { PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HubspacePlatform } from '../platform';
import { Device } from '../models/device';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
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

  private async getOn(): Promise<CharacteristicValue> {
    // Add logging here to verify deviceFunctionResponse contents
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
