// src/accessories/outlet-accessory.ts
import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { DeviceFunction, getDeviceFunctionDef, DeviceFunctionResponse } from '../models/device-functions';
import { HubspacePlatform } from '../platform';
import { isNullOrUndefined } from '../utils';
import { HubspaceAccessory } from './hubspace-accessory';
import { DeviceResponse } from '../responses/device-function-response';

/**
 * Represents an Outlet accessory that interacts with a device's outlet functionality.
 */
export class OutletAccessory extends HubspaceAccessory {
  constructor(platform: HubspacePlatform, accessory: PlatformAccessory) {
    super(platform, accessory, [platform.Service.Outlet]);

    this.configurePower();
    this.removeStaleServices();
  }

  /**
   * Configures the power control for the outlet.
   */
  private configurePower(): void {
    if (this.supportsFunction(DeviceFunction.OutletPower)) {
      this.services[0]
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(this.getOn.bind(this)) // Bind 'getOn' to retrieve the power state
        .onSet(this.setOn.bind(this)); // Bind 'setOn' to set the power state
    }
  }

  /**
   * Retrieves the current power state of the outlet.
   * @returns {Promise<CharacteristicValue>} Power state as a boolean.
   */
  private async getOn(): Promise<CharacteristicValue> {
    // Get the function definition for OutletPower
    const func: DeviceFunctionResponse = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower);
    
    // Fetch the device value from the device service using the key
    const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.deviceValues[0].key);

    // Check if the value is valid (not null or undefined)
    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }

    return value!;
  }

  /**
   * Sets the power state of the outlet.
   * @param {CharacteristicValue} value The value to set (boolean).
   */
  private async setOn(value: CharacteristicValue): Promise<void> {
    // Get the function definition for OutletPower
    const func: DeviceFunctionResponse = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower);

    // Set the device value using the device service and the key
    await this.deviceService.setValue(this.device.deviceId, func.deviceValues[0].key, value);
  }

  /**
   * Checks whether the outlet supports a specific function.
   * @param {DeviceFunction} functionType The type of function to check.
   * @returns {boolean} True if the function is supported, false otherwise.
   */
  private supportsFunction(functionType: DeviceFunction): boolean {
    // Check if the device supports a function by verifying its presence in the device's function definitions
    return this.device.functions.some((func) => func.functionClass === functionType);
  }

  /**
   * Removes stale services from the accessory.
   */
  private removeStaleServices(): void {
    // Implement any logic to remove old or unsupported services if needed.
  }
}
