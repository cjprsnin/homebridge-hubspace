// src/accessories/outlet-accessory.ts
import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
import { HubspacePlatform } from '../platform';
import { isNullOrUndefined } from '../utils';
import { HubspaceAccessory } from './hubspace-accessory';
import { DeviceFunctionResponse } from '../responses/device-function-response'; // Ensure this path is correct
import { DeviceValues, ValuesRange } from './responses/device-values'; // Correct import paths


export class OutletAccessory extends HubspaceAccessory {
  constructor(platform: HubspacePlatform, accessory: PlatformAccessory) {
    super(platform, accessory, [platform.Service.Outlet]);

    this.configurePower();
    this.removeStaleServices();
  }

  /**
   * Configure the power control for the outlet.
   */
  private configurePower(): void {
    if (this.supportsFunction(DeviceFunction.OutletPower)) {
      this.services[0]
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(this.getOn.bind(this)) // Getting the power state of the outlet
        .onSet(this.setOn.bind(this)); // Setting the power state of the outlet
    }
  }

  /**
   * Get the current power state of the outlet.
   * @returns {Promise<CharacteristicValue>} Power state as boolean
   */
  private async getOn(): Promise<CharacteristicValue> {
    // Get the function definition for the outlet power function
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower);
    
    // Extract the key for device value
    const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.deviceValues[0].key);

    // If the value is null or undefined, throw an error
    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }

    return value!;
  }

  /**
   * Set the power state of the outlet.
   * @param {CharacteristicValue} value - The value to set (boolean)
   */
  private async setOn(value: CharacteristicValue): Promise<void> {
    // Get the function definition for the outlet power function
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower);

    // Set the device value using the device service and the appropriate key
    await this.deviceService.setValue(this.device.deviceId, func.deviceValues[0].key, value);
  }

  /**
   * Checks if the outlet supports a particular device function.
   * @param {DeviceFunction} functionType - The device function to check
   * @returns {boolean} - True if supported, false otherwise
   */
protected supportsFunction: boolean; // Ensure this matches the visibility in the base class


  /**
   * Remove any stale services from the accessory.
   */
  private removeStaleServices(): void {
    // Logic to remove any outdated services that may not be supported
  }
}
