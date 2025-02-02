import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { HubspacePlatform } from '../platform';
import { Device } from '../models/device';
import { isNullOrUndefined } from '../utils';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
import { AdditionalData } from '../models/additional-data'; // Correct import path
import { HubspaceAccessory } from './hubspace-accessory';

/**
 * Fan accessory for Hubspace platform
 */
export class FanAccessory extends HubspaceAccessory {
  constructor(
    protected readonly platform: HubspacePlatform,
    protected readonly accessory: PlatformAccessory,
    protected readonly device: Device,
    private readonly additionalData?: AdditionalData
  ) {
    super(platform, accessory, [platform.Service.Fanv2]); // Call super with required services
    this.initializeService();
    this.setAccessoryInformation();
  }

  public initializeService(): void {
    const service = this.addService(this.platform.Service.Fanv2); // Use addService from base class
    this.configureName(service, this.device.name); // Call configureName from base class
    this.configureActive();
    this.configureRotationSpeed();
    this.removeStaleServices();
  }

  public updateState(state: any): void {
    // Update the state of the accessory
  }

  private configureActive(): void {
    this.services[0].getCharacteristic(this.platform.Characteristic.Active)
      .onGet(() => this.getActive())
      .onSet((value) => this.setActive(value));
  }

  private configureRotationSpeed(): void {
    this.services[0].getCharacteristic(this.platform.Characteristic.RotationSpeed)
      .onGet(() => this.getRotationSpeed())
      .onSet((value) => this.setRotationSpeed(value))
      .setProps({
        minValue: 0,
        maxValue: 100,
        minStep: 25,
      });
  }

  private async setActive(value: CharacteristicValue): Promise<void> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.FanPower);
    await this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, value);
  }

  private async getActive(): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.FanPower);
    const value = await this.deviceService.getValue(this.device.deviceId, func.values[0].deviceValues[0].key);

    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }

    this.log.debug(`${this.device.name}: Received ${value} from Hubspace Fan Power`);
    return value!;
  }

  private async getRotationSpeed(): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.FanSpeed);
    const value = await this.deviceService.getValue(this.device.deviceId, func.values[0].deviceValues[0].key);

    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }

    this.log.debug(`${this.device.name}: Received ${value} from Hubspace Fan Speed`);
    return value!;
  }

  private async setRotationSpeed(value: CharacteristicValue): Promise<void> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.FanSpeed);
    await this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, value);
    this.log.debug(`${this.device.name}: Set fan speed to ${value}`);
  }
}
