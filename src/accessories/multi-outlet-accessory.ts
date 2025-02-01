import { PlatformAccessory, Service, CharacteristicValue } from 'homebridge';
import { HubspacePlatform } from '../platform';
import { Device } from '../models/device';
import { DeviceFunction, getDeviceFunctionDef  } from '../models/device-functions';
import { HubspaceAccessory } from './hubspace-accessory';
import { AdditionalData } from './device-accessory-factory';
import { isNullOrUndefined } from '../utils';

/**
 * Multi-outlet accessory for Hubspace platform
 */
export class MultiOutletAccessory extends HubspaceAccessory {
  constructor(
    protected readonly platform: HubspacePlatform,
    protected readonly accessory: PlatformAccessory,
    protected readonly devices: Device[],
    private readonly additionalData?: AdditionalData
  ) {
    super(platform, accessory, devices.map(() => platform.Service.Outlet));
  }

  public initializeService(): void {
    this.devices.forEach((device, index) => {
      const service = this.addService(this.platform.Service.Outlet);
      this.configureName(service, `${device.name} Outlet ${index + 1}`);
      this.configurePower(index);
    });

    this.removeStaleServices();
  }

  public updateState(state: any): void {
    // Update the state of the accessory
  }

  private configurePower(index: number): void {
    this.services[index].getCharacteristic(this.platform.Characteristic.On)
      .onGet(() => this.getOn(index))
      .onSet((value) => this.setOn(index, value));
  }

  private async getOn(index: number): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.devices[index].functions, DeviceFunction.Power);
    const value = await this.deviceService.getValueAsBoolean(this.devices[index].deviceId, func.values[0].deviceValues[0].key);

    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }

    this.log.debug(`${this.devices[index].name}: Received ${value} from Hubspace Power`);
    return value!;
  }

  private async setOn(index: number, value: CharacteristicValue): Promise<void> {
    const func = getDeviceFunctionDef(this.devices[index].functions, DeviceFunction.Power);
    await this.deviceService.setValue(this.devices[index].deviceId, func.values[0].deviceValues[0].key, value);
  }
}
