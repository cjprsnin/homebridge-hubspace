import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { HubspacePlatform } from '../platform';
import { HubspaceAccessory } from './hubspace-accessory';
import { Device } from '../models/device';
import { AdditionalData } from './device-accessory-factory';
import { isNullOrUndefined, normalizeValue, hexToRgb, rgbToHsv, hsvToRgb, rgbToHex, rgbToMired, kelvinToRgb, clamp } from '../utils';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';

/**
 * Light accessory for Hubspace platform
 */
export class LightAccessory implements HubspaceAccessory {
  public services: Service[] = [];
  public log = this.platform.log;
  public config = this.platform.config;
  public deviceService = this.platform.deviceService;

  private hue: CharacteristicValue = -1;
  private saturation: CharacteristicValue = -1;

  constructor(
    private readonly platform: HubspacePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: Device,
    private readonly additionalData?: AdditionalData
  ) {
    this.initializeService();
    this.setAccessoryInformation();
  }

  initializeService(): void {
    const service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    this.services.push(service);

    this.configurePower(0);
    this.configureBrightness(0);
    this.configureName(this.services[0], this.accessory.displayName);

    // Configure color temperature or RGB color if supported
    if (this.configureColor(0) && this.config.dualColorSpace) {
      const service = new this.platform.Service.Lightbulb('2', '2');
      const initializedService =
        this.accessory.getServiceById(service.displayName, service.subtype!) ||
        this.accessory.addService(service);
      this.services.push(initializedService);

      this.configureName(this.services[1], this.accessory.displayName + ' Temperature');
      this.configurePower(1);
      this.configureBrightness(1);
      this.configureTemperature(1);
    } else {
      this.configureTemperature(0);
    }

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

  private configurePower(i: number): void {
    this.services[i].getCharacteristic(this.platform.Characteristic.On)
      .onGet(() => this.getOn(i))
      .onSet((value) => this.setOn(i, value));
  }

  private configureBrightness(i: number): void {
    if (!this.supportsFunction(DeviceFunction.Brightness)) return;

    this.services[i].getCharacteristic(this.platform.Characteristic.Brightness)
      .onGet(() => this.getBrightness(i))
      .onSet((value) => this.setBrightness(i, value));
  }

  private configureTemperature(i: number): void {
    if (!this.supportsFunction(DeviceFunction.LightTemperature)) return;

    this.services[i].getCharacteristic(this.platform.Characteristic.ColorTemperature)
      .onGet(() => this.getTemperature(i))
      .onSet((value) => this.setTemperature(i, value));
  }

  private configureColor(i: number): boolean {
    if (!this.supportsFunction(DeviceFunction.LightColor)) return false;

    this.services[i].getCharacteristic(this.platform.Characteristic.Hue)
      .onGet(() => this.getHue(i))
      .onSet((value) => this.setHue(i, value));
    this.services[i].getCharacteristic(this.platform.Characteristic.Saturation)
      .onGet(() => this.getSaturation(i))
      .onSet((value) => this.setSaturation(i, value));

    return true;
  }

  private async getOn(i: number): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Power);
    const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.values[0].deviceValues[0].key);

    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }

    this.log.debug(`${this.device.name}: Received ${value} from Hubspace Power`);
    return value!;
  }

  private async setOn(i: number, value: CharacteristicValue): Promise<void> {
    this.log.debug(`${this.device.name}: Received ${value} from Homekit Power`);
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Power);
    await this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, value);

    // Update the other 'virtual' bulb
    const serviceIdx = i === 1 ? 0 : 1;
    if (this.services[serviceIdx]) {
      this.services[serviceIdx].updateCharacteristic(this.platform.Characteristic.On, value);
    }
  }

  private async getBrightness(i: number): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Brightness);
    const value = await this.deviceService.getValueAsInteger(this.device.deviceId, func.values[0].deviceValues[0].key);
    this.throwErrorIfNullOrUndefinedInt(value, 'Received Comm Failure for get Brightness');

    this.log.debug(`${this.device.name}: Received ${value} from Hubspace Brightness`);
    return value!;
  }

  private async setBrightness(i: number, value: CharacteristicValue): Promise<void> {
    if (value === 0) {
      this.log.debug(`${this.device.name}: Received 0 from Homekit Brightness, ignoring as 0 is not valid for Hubspace`);
    } else {
      this.log.debug(`${this.device.name}: Received ${value} from Homekit Brightness`);
      const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Brightness);
      await this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, value);

      // Update the other 'virtual' bulb
      const serviceIdx = i === 1 ? 0 : 1;
      if (this.services[serviceIdx]) {
        this.services[serviceIdx].updateCharacteristic(this.platform.Characteristic.Brightness, value);
      }
    }
  }

  private async getTemperature(i: number): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.ColorMode);
    const colorMode = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.values[0].deviceValues[0].key);
    this.throwErrorIfNullOrUndefined(colorMode, 'Received Comm Failure for get Temperature');

    if (colorMode === false) {
      const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightTemperature);
      const kelvin = await this.deviceService.getValueAsInteger(this.device.deviceId, func.values[0].deviceValues[0].key);
      this.throwErrorIfNullOrUndefinedInt(kelvin, 'Received Comm Failure for get Temperature');

      const value = normalizeValue(kelvin as number, 6500, 2200, 140, 500, 1);
      this.log.debug(`${this.device.name}: Received ${kelvin} from Hubspace Color Temperature, sending ${value} to Homebridge`);
      return value!;
    } else {
      const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightColor);
      const rgb = await this.deviceService.getValue(this.device.deviceId, func.values[0].deviceValues[0].key);
      this.throwErrorIfNullOrUndefined(rgb, 'Received Comm Failure for get Temperature');

      const mired = clamp(rgbToMired(hexToRgb(rgb as string)), 140, 500);
      this.log.debug(`${this.device.name}: Received ${rgb} from Hubspace Color Temperature, sending ${Math.round(mired)} to Homebridge`);
      return Math.round(mired);
    }
  }

  private async setTemperature(i: number, value: CharacteristicValue): Promise<void> {
    this.setColorMode(0);

    const kelvin = normalizeValue(value as number, 140, 500, 6500, 2200, 100);
    this.log.debug(`${this.device.name}: Received ${value} from Homekit Color Temperature, sending ${kelvin}K to Hubridge`);
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightTemperature);
    this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, kelvin);
  }

  private async getHue(i: number): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.ColorMode);
    const colorMode = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.values[0].deviceValues[0].key);
    this.throwErrorIfNullOrUndefined(colorMode, 'Received Comm Failure for get Hue');

    let r, g, b;
    if (colorMode === true) {
      const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightColor);
      const rgb = await this.deviceService.getValue(this.device.deviceId, func.values[0].deviceValues[0].key);
      this.throwErrorIfNullOrUndefinedInt(rgb, 'Received Comm Failure for get Hue');
      [r, g, b] = hexToRgb(rgb as string);
    } else {
      const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightTemperature);
      const kelvin = await this.deviceService.getValue(this.device.deviceId, func.values[0].deviceValues[0].key);
      this.throwErrorIfNullOrUndefinedInt(kelvin, 'Received Comm Failure for get Temperature');
      [r, g, b] = kelvinToRgb(kelvin as number);
    }

    const [h, s, v] = rgbToHsv(r, g, b);
    this.log.debug(`${this.device.name}: sending ${Math.round(h)} to Homebridge for Hue`);
    return Math.round(h) as CharacteristicValue;
  }

  private async setHue(i: number, value: CharacteristicValue): Promise<void> {
    this.setColorMode(1);

    if (this.hue === -1 && this.saturation === -1) {
      this.hue = value;
      this.log.debug(`${this.device.name}: Received ${value} from Homekit Hue, waiting for Saturation`);
      return;
    } else if (this.hue === -1 && this.saturation !== -1) {
      const [r, g, b] = hsvToRgb(value as number, this.saturation as number, 100);
      this.saturation = -1;
      const hexRgb = rgbToHex(r, g, b);
      this.log.debug(`${this.device.name}: Received ${value} from Homekit Hue, sending ${hexRgb} to Hubspace Color RGB`);
      const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightColor);
      this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, hexRgb);
    } else {
      this.hue = value;
      this.log.warn(`${this.device.name}: Received another ${value} from Homekit Hue, but cannot send without a Saturation value`);
    }
  }

  private async getSaturation(i: number): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.ColorMode);
    const colorMode = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.values[0].deviceValues[0].key);
    this.throwErrorIfNullOrUndefined(colorMode, 'Received Comm Failure for get Hue');

    let r, g, b;
    if (colorMode === true) {
      const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightColor);
      const rgb = await this.deviceService.getValue(this.device.deviceId, func.values[0].deviceValues[0].key);
      this.throwErrorIfNullOrUndefinedInt(rgb, 'Received Comm Failure for get Hue');
      [r, g, b] = hexToRgb(rgb as string);
    } else {
      const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightTemperature);
      const kelvin = await this.deviceService.getValue(this.device.deviceId, func.values[0].deviceValues[0].key);
      this.throwErrorIfNullOrUndefinedInt(kelvin, 'Received Comm Failure for get Temperature');
      [r, g, b] = kelvinToRgb(kelvin as number);
    }

    const [h, s, v] = rgbToHsv(r, g, b);
    this.log.debug(`${this.device.name}: sending ${Math.round(s)} to Homebridge for Saturation`);
    return Math.round(s) as CharacteristicValue;
  }

  private async setSaturation(i: number, value: CharacteristicValue): Promise<void> {
    this.setColorMode(1);

    if (this.hue === -1 && this.saturation === -1) {
      this.saturation = value;
      this.log.debug(`${this.device.name}: Received ${value} from Homekit Saturation, waiting for Hue`);
      return;
    } else if (this.hue !== -1 && this.saturation === -1) {
      const [r, g, b] = hsvToRgb(this.hue as number, value as number, 100);
      this.hue = -1;
      const hexRgb = rgbToHex(r, g, b);
      this.log.debug(`${this.device.name}: Received ${value} from Homekit Saturation, sending ${hexRgb} to Hubspace Color RGB`);
      const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightColor);
      this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, hexRgb);
    } else {
      this.saturation = value;
      this.log.warn(`${this.device.name}: Received another ${value} from Homekit Saturation, but cannot send without a Hue value`);
    }
  }

  private setColorMode(value: number): void {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.ColorMode);
    this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, value);
  }

  private throwErrorIfNullOrUndefined(value: any, message: string): void {
    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  private throwErrorIfNullOrUndefinedInt(value: any, message: string): void {
    if (isNullOrUndefined(value) || value === -1) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
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

  private configureName(service: Service, name: string): void {
    service.setCharacteristic(this.platform.Characteristic.Name, name);
  }
}
