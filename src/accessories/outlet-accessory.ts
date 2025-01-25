import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
import { HubspacePlatform } from '../platform';
import { HubspaceAccessory } from './hubspace-accessory';
import { isNullOrUndefined } from '../utils';
import { DeviceFunctionResponse } from '../responses/device-function-response';

export class DeviceAccessoryFactory {
  constructor(private readonly platform: HubspacePlatform) {}

  createAccessory(accessory: PlatformAccessory): HubspaceAccessory {
    // Implement the logic to create the appropriate accessory
    // This is just a placeholder implementation
    return new OutletAccessory(this.platform, accessory);
  }

  private getOutletPower(func: DeviceFunctionResponse): CharacteristicValue {
    if (!func.deviceValues || func.deviceValues.length === 0) {
      throw new Error('deviceValues not found');
    }
    // Implement the logic to get outlet power
    return false; // Placeholder return
  }

  private async setOutletPower(func: DeviceFunctionResponse, value: CharacteristicValue): Promise<void> {
    if (func.deviceValues && func.deviceValues.length > 0) {
      // Implement the logic for setting outlet power
      // For example:
      // await this.platform.deviceService.setValue(func.deviceId, func.deviceValues[0].key, value);
    } else {
      throw new Error('deviceValues not found');
    }
  }

  protected removeStaleServices(accessory: PlatformAccessory): void {
    // Implement the logic for removing stale services
    // For example:
    // const staleServices = accessory.services.filter(service => !this.isServiceSupported(service));
    // staleServices.forEach(service => accessory.removeService(service));
  }

  private isServiceSupported(service: Service): boolean {
    // Implement the logic to check if a service is supported
    return true; // Placeholder return
  }
}

// Example of an accessory class that might be created by the factory
class OutletAccessory extends HubspaceAccessory {
  constructor(platform: HubspacePlatform, accessory: PlatformAccessory) {
    super(platform, accessory, [platform.Service.Outlet]);
    this.configurePower();
  }

  private configurePower(): void {
    if (this.supportsFunction(DeviceFunction.OutletPower)) {
      this.services[0]
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(this.getOn.bind(this))
        .onSet(this.setOn.bind(this));
    }
  }

  private async getOn(): Promise<CharacteristicValue>{
    // Try to get the value
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower);
    const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.values[0].deviceValues[0].key);

    // If the value is not defined then show 'Not Responding'
    if(isNullOrUndefined(value)){
        throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }

    // Otherwise return the value
    return value!;

  }

  private async setOn(value: CharacteristicValue): Promise<void>{
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower);
    await this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, value);
}

  protected supportsFunction(deviceFunction: DeviceFunction): boolean {
    return deviceFunction === DeviceFunction.OutletPower;  // Correct way to compare enums
  }
  

}
