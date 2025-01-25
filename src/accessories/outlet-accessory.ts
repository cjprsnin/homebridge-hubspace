import { PlatformAccessory, Service, CharacteristicValue } from 'homebridge';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
import { HubspacePlatform } from '../platform';
import { HubspaceAccessory } from './hubspace-accessory';
import { isNullOrUndefined } from '../utils';

/**
 * OutletAccessory handles outlet device functionalities
 */
export class OutletAccessory extends HubspaceAccessory {
    private outletCount: number;

    /**
     * Creates a new instance of the accessory
     * @param platform Hubspace platform
     * @param accessory Platform accessory
     * @param outletCount The number of outlets (for multi-outlet devices)
     */
    constructor(platform: HubspacePlatform, accessory: PlatformAccessory, outletCount: number) {
        super(platform, accessory, [platform.Service.Outlet]);
        this.outletCount = outletCount;  // Store the outlet count
        this.configureOutlets();
        this.removeStaleServices();
    }

    private configureOutlets(): void {
        // Check if the device supports OutletPower function
        if (this.supportsFunction(DeviceFunction.OutletPower)) {
            // Iterate through the outlets and create services for each
            for (let outletIndex = 0; outletIndex < this.outletCount; outletIndex++) {
                this.services.push(this.createOutletService(outletIndex));
            }
        }
    }

    private createOutletService(outletIndex: number): Service {
        // Create a new outlet service for each outlet
        const outletService = new this.platform.api.hap.Service.Outlet(this.accessory.displayName + ` Outlet ${outletIndex + 1}`);

        // Set up handlers for the On characteristic for each outlet
        outletService
            .getCharacteristic(this.platform.Characteristic.On)
            .onGet(this.getOn.bind(this, outletIndex))  // Pass outletIndex to the handler
            .onSet(this.setOn.bind(this, outletIndex)); // Pass outletIndex to the handler

        return outletService;
    }

    private async getOn(outletIndex: number): Promise<CharacteristicValue> {
        // Get the function definition for OutletPower for a specific outlet
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower, undefined, outletIndex);

        // Fetch the outlet's value based on the outletIndex
        const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.deviceValues[outletIndex].key);

        // If the value is not defined then show 'Not Responding'
        if (isNullOrUndefined(value)) {
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }

        // Otherwise return the value
        return value!;
    }

    private async setOn(outletIndex: number, value: CharacteristicValue): Promise<void> {
        // Get the function definition for OutletPower for a specific outlet
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower, undefined, outletIndex);

        // Set the outlet's power value based on the outletIndex
        await this.deviceService.setValue(this.device.deviceId, func.deviceValues[outletIndex].key, value);
    }
}
