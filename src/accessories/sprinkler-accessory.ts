import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
import { HubspacePlatform } from '../platform';
import { isNullOrUndefined } from '../utils';
import { HubspaceAccessory } from './hubspace-accessory';
import { AdditionalData } from './device-accessory-factory';
import { Device } from '../models/device';
import { AdditionalData } from '../models/additional-data'

export class SprinklerAccessory extends HubspaceAccessory {
  constructor(
    protected readonly platform: HubspacePlatform,
    protected readonly accessory: PlatformAccessory,
    protected readonly device: Device, // Change from public to protected
    private readonly additionalData?: AdditionalData
  ) {
    super(platform, accessory, [platform.Service.Valve, platform.Service.Battery]); // Call super with required services
    this.initializeService();
    this.setAccessoryInformation();
  }

  /**
   * Initializes the services for the sprinkler accessory.
   */
  public initializeService(): void {
    const service1 = this.addService(this.platform.Service.Valve); // Use addService from base class
    const service2 = this.addService(this.platform.Service.Valve); // Use addService from base class
    const batteryService = this.addService(this.platform.Service.Battery); // Use addService from base class

    this.configureSprinkler();
    this.removeStaleServices();
  }

  /**
   * Updates the state of the accessory.
   * @param state The new state of the accessory.
   */
  public updateState(state: any): void {
    // Update the state of each service
    this.services.forEach(service => {
      if (service.subtype === '1') {
        service.updateCharacteristic(this.platform.Characteristic.Active, state.spigot1?.active ?? false);
        service.updateCharacteristic(this.platform.Characteristic.InUse, state.spigot1?.inUse ?? false);
      } else if (service.subtype === '2') {
        service.updateCharacteristic(this.platform.Characteristic.Active, state.spigot2?.active ?? false);
        service.updateCharacteristic(this.platform.Characteristic.InUse, state.spigot2?.inUse ?? false);
      }
    });
  }

  /**
   * Configures the sprinkler accessory.
   */
  private configureSprinkler(): void {
    this.configureName(this.services[0], this.accessory.displayName + ' 1');
    this.configureName(this.services[1], this.accessory.displayName + ' 2');

    if (this.supportsFunction(DeviceFunction.Toggle)) {
      this.services[0].getCharacteristic(this.platform.Characteristic.Active)
        .onGet(() => this.getActive(DeviceFunction.Spigot1))
        .onSet((value) => this.setActive(DeviceFunction.Spigot1, value));
      this.services[0].getCharacteristic(this.platform.Characteristic.InUse)
        .onGet(() => this.getInUse(DeviceFunction.Spigot1));
      this.services[0].getCharacteristic(this.platform.Characteristic.ValveType)
        .onGet(() => this.platform.api.hap.Characteristic.ValveType.IRRIGATION);

      this.services[1].getCharacteristic(this.platform.Characteristic.Active)
        .onGet(() => this.getActive(DeviceFunction.Spigot2))
        .onSet((value) => this.setActive(DeviceFunction.Spigot2, value));
      this.services[1].getCharacteristic(this.platform.Characteristic.InUse)
        .onGet(() => this.getInUse(DeviceFunction.Spigot2));
      this.services[1].getCharacteristic(this.platform.Characteristic.ValveType)
        .onGet(() => this.platform.api.hap.Characteristic.ValveType.IRRIGATION);
    }

    if (this.supportsFunction(DeviceFunction.Timer)) {
      this.services[0].getCharacteristic(this.platform.Characteristic.SetDuration)
        .onGet(() => this.getMaxDuration(DeviceFunction.Spigot1))
        .onSet((value) => this.setMaxDuration(DeviceFunction.Spigot1, value));

      this.services[1].getCharacteristic(this.platform.Characteristic.SetDuration)
        .onGet(() => this.getRemainingDuration(DeviceFunction.Spigot2))
        .onSet((value) => this.setMaxDuration(DeviceFunction.Spigot2, value));
    }

    if (this.supportsFunction(DeviceFunction.BatteryLevel)) {
      this.services[2].getCharacteristic(this.platform.Characteristic.StatusLowBattery)
        .onGet(this.getStatusLowBattery.bind(this));
      this.services[2].getCharacteristic(this.platform.Characteristic.BatteryLevel)
        .onGet(this.getBatteryLevel.bind(this));
    }
  }

  /**
   * Gets the active state of a specific spigot.
   * @param functionType The type of spigot (Spigot1 or Spigot2).
   * @returns The active state of the spigot.
   */
  private async getActive(functionType: DeviceFunction): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Toggle, functionType);
    const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.values[0].deviceValues[0].key);

    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }

    this.log.debug(`${this.device.name}: Triggered GET Active: ${value}`);
    return value! ? this.platform.api.hap.Characteristic.Active.ACTIVE : this.platform.api.hap.Characteristic.Active.INACTIVE;
  }

  /**
   * Sets the active state of a specific spigot.
   * @param functionType The type of spigot (Spigot1 or Spigot2).
   * @param value The new active state.
   */
  private async setActive(functionType: DeviceFunction, value: CharacteristicValue): Promise<void> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Toggle, functionType);
    this.log.debug(`${this.device.name}: Triggered SET Active: ${value}`);
    await this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, value);

    const service = functionType === DeviceFunction.Spigot1 ? this.services[0] : this.services[1];
    service.updateCharacteristic(this.platform.Characteristic.InUse, value);
    service.updateCharacteristic(this.platform.Characteristic.Active, value);

    if (value === this.platform.api.hap.Characteristic.Active.INACTIVE) {
      service.updateCharacteristic(this.platform.Characteristic.RemainingDuration, 0);
    } else {
      service.updateCharacteristic(this.platform.Characteristic.RemainingDuration, await this.getMaxDuration(functionType));
    }
  }

  /**
   * Gets the in-use state of a specific spigot.
   * @param functionType The type of spigot (Spigot1 or Spigot2).
   * @returns The in-use state of the spigot.
   */
  private async getInUse(functionType: DeviceFunction): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Toggle, functionType);
    const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.values[0].deviceValues[0].key);

    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }

    this.log.debug(`${this.device.name}: Triggered GET InUse: ${value}`);
    return value! ? this.platform.api.hap.Characteristic.InUse.IN_USE : this.platform.api.hap.Characteristic.InUse.NOT_IN_USE;
  }

  /**
   * Gets the remaining duration of a specific spigot.
   * @param functionType The type of spigot (Spigot1 or Spigot2).
   * @returns The remaining duration in seconds.
   */
  private async getRemainingDuration(functionType: DeviceFunction): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Timer, functionType);
    const value = await this.deviceService.getValueAsInteger(this.device.deviceId, func.values[0].deviceValues[0].key);

    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }

    this.log.debug(`${this.device.name}: Triggered GET Remaining Duration: ${value}`);
    return value!;
  }

  /**
   * Sets the maximum duration for a specific spigot.
   * @param functionType The type of spigot (Spigot1 or Spigot2).
   * @param value The new maximum duration in seconds.
   */
  private async setMaxDuration(functionType: DeviceFunction, value: CharacteristicValue): Promise<void> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.MaxOnTime, functionType);
    this.log.debug(`${this.device.name}: Triggered SET Max Duration: ${value}`);
    const minutes = (value as number) / 60;
    await this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, minutes);
  }

  /**
   * Gets the maximum duration for a specific spigot.
   * @param functionType The type of spigot (Spigot1 or Spigot2).
   * @returns The maximum duration in seconds.
   */
  private async getMaxDuration(functionType: DeviceFunction): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.MaxOnTime, functionType);
    const value = await this.deviceService.getValueAsInteger(this.device.deviceId, func.values[0].deviceValues[0].key);

    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }

    this.log.debug(`${this.device.name}: Triggered GET Max Duration: ${value}`);
    let seconds = (value as number) * 60;
    if (seconds > 3600) {
      seconds = 3600;
    }
    return seconds!;
  }

  /**
   * Gets the battery status (low or normal).
   * @returns The battery status.
   */
  private async getStatusLowBattery(): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.BatteryLevel);
    const value = await this.deviceService.getValueAsInteger(this.device.deviceId, func.values[0].deviceValues[0].key);

    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }

    const status = (value as number) <= 20
      ? this.platform.api.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
      : this.platform.api.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;

    this.log.debug(`${this.device.name}: Triggered GET Battery Level: ${status}`);
    return status!;
  }

  /**
   * Gets the battery level.
   * @returns The battery level as a percentage.
   */
  private async getBatteryLevel(): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.BatteryLevel);
    const value = await this.deviceService.getValueAsInteger(this.device.deviceId, func.values[0].deviceValues[0].key);

    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }

    this.log.debug(`${this.device.name}: Triggered GET Battery Level: ${value}`);
    return value!;
  }
}
