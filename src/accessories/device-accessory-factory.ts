import { PlatformAccessory } from 'homebridge';
import { DeviceFunction, DeviceFunctionResponse } from '../models/device-functions';
import { HubspacePlatform } from '../platform';
import { HubspaceAccessory } from './hubspace-accessory';

/**
 * Factory for creating device accessories.
 */
export class DeviceAccessoryFactory extends HubspaceAccessory {
  constructor(
    platform: HubspacePlatform,
    accessory: PlatformAccessory,
    private readonly services: (Service | WithUUID<typeof Service>)[]
  ) {
    super(platform, accessory, services);

    this.configurePower();
  }

  private configurePower(): void {
    const outletFunctions = this.device.description?.functions?.filter(
      (func) => func.functionClass === DeviceFunction.OutletPower
    ) || [];

    outletFunctions.forEach((func, index) => {
      const outletService = this.accessory.addService(this.platform.Service.Outlet, `Outlet ${index + 1}`);
      outletService
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(() => this.getOutletPower(func))
        .onSet((value) => this.setOutletPower(func, value));
    });
  }

  private async getOutletPower(func: DeviceFunctionResponse): Promise<CharacteristicValue> {
    const value = await this.deviceService.getValueAsBoolean(
      this.device.deviceId,
      func.values[0].deviceValues[0].key
    );

    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(
        this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE
      );
    }

    return value;
  }

  private async setOutletPower(func: DeviceFunctionResponse, value: CharacteristicValue): Promise<void> {
    await this.deviceService.setValue(
      this.device.deviceId,
      func.values[0].deviceValues[0].key,
      value
    );
  }
}
