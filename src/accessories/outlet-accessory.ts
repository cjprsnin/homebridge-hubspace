import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
import { HubspacePlatform } from '../platform';
import { isNullOrUndefined } from '../utils';
import { HubspaceAccessory } from './hubspace-accessory';
import { DeviceFunctionResponse } from '../responses/device-function-response';
import { DeviceValues, ValuesRange } from '../responses/device-values';

export class OutletAccessory extends HubspaceAccessory {
  constructor(platform: HubspacePlatform, accessory: PlatformAccessory) {
    super(platform, accessory, [platform.Service.Outlet]);

    this.configurePower();
    this.removeStaleServices();
  }

  private configurePower(): void {
    if (this.supportsFunction(DeviceFunction.OutletPower)) {
      this.services[0]
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(this.getOn.bind(this))
        .onSet(this.setOn.bind(this));
    }
  }

  private async getOn(): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower);
    
    if (!func.deviceValues || func.deviceValues.length === 0) {
      throw new Error('deviceValues not found');
    }

    const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.deviceValues[0].key);

    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }

    return value!;
  }

  private async setOn(value: CharacteristicValue): Promise<void> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower);
    
    if (!func.deviceValues || func.deviceValues.length === 0) {
      throw new Error('deviceValues not found');
    }

    await this.deviceService.setValue(this.device.deviceId, func.deviceValues[0].key, value);
  }

  protected supportsFunction(functionType: DeviceFunction): boolean {
    // Implement the logic to check if the function is supported
    return this.device.functions.some(func => func.function === functionType);
  }

  private removeStaleServices(): void {
    // Implement the logic to remove stale services
    // For example:
    // const staleServices = this.accessory.services.filter(service => !this.isServiceSupported(service));
    // staleServices.forEach(service => this.accessory.removeService(service));
  }
}
