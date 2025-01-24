import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
import { HubspacePlatform } from '../platform';
import { isNullOrUndefined } from '../utils';
import { HubspaceAccessory } from './hubspace-accessory';
import { DeviceResponse } from '../responses/device-function-response';

export abstract class HubspaceAccessory {
  // Change from 'Device' to 'DeviceResponse'
  protected readonly device: DeviceResponse;

  constructor(
    protected readonly platform: HubspacePlatform,
    protected readonly accessory: PlatformAccessory,
    services: (Service | WithUUID<typeof Service>)[]
  ) {
    // Ensure the accessory's device context is correctly typed as DeviceResponse
    this.device = accessory.context.device as DeviceResponse;
    // Other existing code...
  }
}

  private configurePower(): void {
    const outletFunctions = this.device.description.functions.filter(
      (func: DeviceFunctionResponse) => func.functionClass === DeviceFunction.OutletPower
    );

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

    return value!;
  }

  private async setOutletPower(func: DeviceFunctionResponse, value: CharacteristicValue): Promise<void> {
    await this.deviceService.setValue(
      this.device.deviceId,
      func.values[0].deviceValues[0].key,
      value
    );
  }
}
