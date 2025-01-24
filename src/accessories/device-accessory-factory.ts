// src/accessories/device-accessory-factory.ts
import { CharacteristicValue, PlatformAccessory, Service, WithUUID } from 'homebridge';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
import { HubspacePlatform } from '../platform';
import { HubspaceAccessory } from './hubspace-accessory';
import { DeviceResponse } from '../responses/device-function-response';  // Import DeviceResponse

/**
 * Factory class to handle device accessories
 */
export class DeviceAccessoryFactory extends HubspaceAccessory {
  constructor(platform: HubspacePlatform, accessory: PlatformAccessory) {
    super(platform, accessory, [platform.Service.Outlet]);  // Adjust for multiple services as needed
    this.configureDeviceFunctions();
    this.removeStaleServices();
  }

  /**
   * Configures the device functions and creates appropriate services.
   */
  private configureDeviceFunctions(): void {
    // Here we handle multiple device functions
    const outletFunctions = this.getOutletFunctions();

    outletFunctions.forEach((func, index) => {
      const outletService = this.accessory.addService(this.platform.Service.Outlet, `Outlet ${index + 1}`);
      
      // Configure the power control for each outlet
      outletService
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(() => this.getOutletPower(func))
        .onSet((value) => this.setOutletPower(func, value));
    });
  }

  /**
   * Get all the outlet functions from the device.
   * @returns {DeviceFunctionResponse[]} Array of outlet functions
   */
  private getOutletFunctions(): DeviceFunctionResponse[] {
    // Filter outlet power functions from the device description
    const outletFunctions = (this.device as DeviceResponse).description.functions.filter(
      (func) => func.functionClass === DeviceFunction.OutletPower
    );

    if (!outletFunctions || outletFunctions.length === 0) {
      throw new Error('No outlet functions found for this device');
    }

    return outletFunctions;
  }

  /**
   * Get the current power state of the outlet.
   * @param {DeviceFunctionResponse} func - The device function for outlet power
   * @returns {Promise<CharacteristicValue>} Current power state (boolean)
   */
  private async getOutletPower(func: DeviceFunctionResponse): Promise<CharacteristicValue> {
    const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.deviceValues[0].key);

    // Handle potential null or undefined values
    if (value === null || value === undefined) {
      throw new this.platform.api.hap.HapStatusError(
        this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE
      );
    }

    return value!;
  }

  /**
   * Set the power state of the outlet.
   * @param {DeviceFunctionResponse} func - The device function for outlet power
   * @param {CharacteristicValue} value - The new power state
   */
  private async setOutletPower(func: DeviceFunctionResponse, value: CharacteristicValue): Promise<void> {
    // Set the device value using the appropriate key
    await this.deviceService.setValue(this.device.deviceId, func.deviceValues[0].key, value);
  }

  /**
   * Remove stale services from the accessory.
   */
  private removeStaleServices(): void {
    // Logic to remove outdated services, if necessary
  }
}
