import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { HubspacePlatform } from '../platform';
import { HubspaceAccessory } from './hubspace-accessory';
import { Device } from '../models/device';
import { AdditionalData } from './device-accessory-factory';
import { isNullOrUndefined } from '../utils';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';

/**
 * Fan accessory for Hubspace platform
 */
export class FanAccessory implements HubspaceAccessory {
  public services: Service[] = [];
  public log = this.platform.log;
  public config = this.platform.config;
  public deviceService = this.platform.deviceService;

  constructor(
    protected readonly platform: HubspacePlatform,
    protected readonly accessory: PlatformAccessory,
    protected readonly device: Device, // Change from private to protected
    private readonly additionalData?: AdditionalData
  ) {
    this.initializeService();
    this.setAccessoryInformation();
  }

  initializeService(): void {
    const service = this.accessory.getService(this.platform.Service.Fanv2) || this.accessory.addService(this.platform.Service.Fanv2);
    this.services.push(service);

    this.configureActive();
    this.configureRotationSpeed();

    this.removeStaleServices();
  }

  setAccessoryInformation(): void {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, this.device.manufacturer)
      .setCharacteristic(this.platform.Characteristic.Model, this.device.model.join(', '))
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.deviceId);
  }

  supportsFunction(functionName: string): boolean {
    return this.device.functions.some(f => f.name === functionName);
  }

  updateState(state: any): void {
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

  private removeStaleServices(): void {
    // Remove any stale services that are no longer needed
    const existingServices = this.accessory.services;
    const validServices = this.services.map(service => service.UUID);

    existingServices.forEach(service => {
      if (!validServices.includes(service.UUID)) {
        this.accessory.removeService(service);
      }
    });
  }
}
