import { CharacteristicValue, PlatformAccessory, Service, WithUUID } from 'homebridge';
import { DeviceFunctionResponse } from '../responses/device-function-response';
import { HubspacePlatform } from '../platform';
import { HubspaceAccessory } from './hubspace-accessory';
import { DeviceResponse } from '../responses/device-function-response';

export class DeviceAccessoryFactory extends HubspaceAccessory {
  constructor(platform: HubspacePlatform, accessory: PlatformAccessory) {
    super(platform, accessory, [platform.Service.Outlet]);
    this.configureDeviceFunctions();
    this.removeStaleServices();
  }

  private getOutletFunctions(): DeviceFunctionResponse[] {
    const outletFunctions = (this.device as unknown as DeviceResponse).description.functions.filter(
      (func) => func.functionClass === 'OutletPower'
    );

    if (!outletFunctions || outletFunctions.length === 0) {
      throw new Error('No outlet functions found for this device');
    }

    return outletFunctions;
  }

  private configureDeviceFunctions(): void {
    const outletFunctions = this.getOutletFunctions();

    outletFunctions.forEach((func, index) => {
      const outletService = this.accessory.addService(this.platform.Service.Outlet, `Outlet ${index + 1}`);

      outletService
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(() => this.getOutletPower(func))
        .onSet((value) => this.setOutletPower(func, value));
    });
  }

  private async getOutletPower(func: DeviceFunctionResponse): Promise<CharacteristicValue> {
    if (func.deviceValues && func.deviceValues.length > 0) {
      const value = await this.deviceService.getValueAsBoolean(
        this.device.deviceId,
        func.deviceValues[0].key
      );

      if (value === null || value === undefined) {
        throw new this.platform.api.hap.HapStatusError(
          this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE
        );
      }

      return value;
    }

    throw new Error('deviceValues not found');
  }

  private async setOutletPower(func: DeviceFunctionResponse, value: CharacteristicValue): Promise<void> {
    if (func.deviceValues && func.deviceValues.length > 0) {
      await this.deviceService.setValue(this.device.deviceId, func.deviceValues[0].key, value);
    } else {
      throw new Error('deviceValues not found');
    }
  }

  protected removeStaleServices(): void {
    // Implement logic for removing stale services
  }
}

export function createAccessoryForDevice(device: DeviceResponse, platform: HubspacePlatform, existingAccessory: PlatformAccessory) {
  // Add your implementation for accessory creation
}
