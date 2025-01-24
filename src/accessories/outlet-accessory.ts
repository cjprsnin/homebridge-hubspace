import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
import { HubspacePlatform } from '../platform';
import { isNullOrUndefined } from '../utils';
import { HubspaceAccessory } from './hubspace-accessory';
import { DeviceResponse, DeviceFunctionResponse } from '../responses/device-function-response';  // Ensure this is correct

export class OutletAccessory extends HubspaceAccessory {
  /**
   * Creates a new instance of the accessory
   * @param platform Hubspace platform
   * @param accessory Platform accessory
   */
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
    // Try to get the value
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower);
    const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.values[0].deviceValues[0].key);

    // If the value is not defined then show 'Not Responding'
    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }

    // Otherwise return the value
    return value!;
  }

  private async setOn(value: CharacteristicValue): Promise<void> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower);
    await this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, value);
  }
}

export class SurgeProtectorAccessory extends HubspaceAccessory {
  constructor(platform: HubspacePlatform, accessory: PlatformAccessory) {
    super(platform, accessory, []);
    this.configureOutlets();
    this.removeStaleServices();
  }

  private configureOutlets(): void {
    const outletFunctions = this.device.description.functions.filter((func) =>
      func.functionClass === DeviceFunction.OutletPower
    );

    // Create and configure a service for each outlet
    outletFunctions.forEach((func, index) => {
      const outletService = this.accessory.addService(
        this.platform.Service.Outlet,
        `Outlet ${index + 1}`,
        `outlet-${index + 1}`
      );

      outletService
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(() => this.getOutletPower(func))
        .onSet((value) => this.setOutletPower(func, value));
    });
  }

  private async getOutletPower(func: DeviceFunction): Promise<CharacteristicValue> {
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

  private async setOutletPower(func: DeviceFunction, value: CharacteristicValue): Promise<void> {
    await this.deviceService.setValue(
      this.device.deviceId,
      func.values[0].deviceValues[0].key,
      value
    );
  }
}
