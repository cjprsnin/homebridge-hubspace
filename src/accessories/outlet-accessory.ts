import { HubspaceAccessory } from './hubspace-accessory';
import { HubspacePlatform } from '../platform';
import { PlatformAccessory, Service, CharacteristicValue } from 'homebridge';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
import { isNullOrUndefined } from '../utils';

/**
 * OutletAccessory handles outlet device functionalities
 */
export class OutletAccessory extends HubspaceAccessory {
  constructor(
    platform: HubspacePlatform,
    accessory: PlatformAccessory,
    device: Device,
    additionalData?: any // Add additionalData parameter
  ) {
        super(platform, accessory, [platform.Service.Outlet]);
        this.outletIndex = outletIndex;  // Store the outlet index
        this.configureOutlet();
        this.removeStaleServices();
    }

    private configureOutlet(): void {
        // Check if the device supports OutletPower function
        if (this.supportsFunction(DeviceFunction.OutletPower)) {
            this.services.push(this.createOutletService());
        }
    }

    private createOutletService(): Service {
        // Create a new outlet service for the outlet device
        const outletService = new this.platform.api.hap.Service.Outlet(this.accessory.displayName + ` Outlet ${this.outletIndex + 1}`);

        // Set up handlers for the On characteristic for this outlet
        outletService
            .getCharacteristic(this.platform.Characteristic.On)
            .onGet(this.getOn.bind(this))  // Handler for getting the state of the outlet
            .onSet(this.setOn.bind(this)); // Handler for setting the state of the outlet
            return outletService;
        }
    
        public getServices(): Service[] {
            return this.services;
        }

    private async getOn(): Promise<CharacteristicValue> {
        // Get the function definition for OutletPower for this outlet
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower, undefined, this.outletIndex);

        // Fetch the outlet's value based on the outletIndex
        const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.deviceValues[this.outletIndex].key);

        // If the value is not defined, show 'Not Responding'
        if (isNullOrUndefined(value)) {
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }

        // Otherwise return the value
        return value!;
    }

    private async setOn(value: CharacteristicValue): Promise<void> {
        // Get the function definition for OutletPower for this outlet
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower, undefined, this.outletIndex);

        // Set the outlet's power value based on the outletIndex
        await this.deviceService.setValue(this.device.deviceId, func.deviceValues[this.outletIndex].key, value);
    }
}
