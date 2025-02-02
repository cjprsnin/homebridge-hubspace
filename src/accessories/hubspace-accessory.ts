import { PlatformAccessory, PlatformConfig, Logger, Service, WithUUID } from 'homebridge';
import { Device } from '../models/device';
import { DeviceService } from '../services/device.service';
import { DeviceFunction } from '../models/device-functions';
import { HubspacePlatform } from '../platform';

export abstract class HubspaceAccessory {
  public services: Service[] = [];
  public log: Logger;
  public config: PlatformConfig;
  public deviceService: DeviceService;
  protected readonly device: Device;

  private static functionClassMap: Record<DeviceFunction, string> = {
    [DeviceFunction.Power]: 'Power',
    [DeviceFunction.FanPower]: 'Fan Power',
    [DeviceFunction.FanSpeed]: 'Fan Speed',
    [DeviceFunction.Brightness]: 'Brightness',
    [DeviceFunction.LightTemperature]: 'Color Temperature',
    [DeviceFunction.LightColor]: 'Color RGB',
    [DeviceFunction.ColorMode]: 'Color Mode',
    [DeviceFunction.Toggle]: 'Toggle',
    [DeviceFunction.MaxOnTime]: 'Max On Time',
    [DeviceFunction.BatteryLevel]: 'Battery Level',
    [DeviceFunction.Timer]: 'Timer',
    [DeviceFunction.Spigot1]: 'Spigot 1',
    [DeviceFunction.Spigot2]: 'Spigot 2',
    [DeviceFunction.FanLightPower]: 'Fan Light Power',
  };

  constructor(
    protected readonly platform: HubspacePlatform,
    protected readonly accessory: PlatformAccessory,
    services: (Service | WithUUID<typeof Service>)[]
  ) {
    services.forEach(service => this.addService(service));

    this.config = platform.config;
    this.log = platform.log;
    this.deviceService = platform.deviceService;

    if (!accessory.context.device) {
      this.platform.log.error(`Device context missing for accessory: ${accessory.displayName}`);
      throw new Error(`Device context missing for accessory: ${accessory.displayName}`);
    }

    this.device = accessory.context.device;
    this.setAccessoryInformation();
  }

  protected addService(service: Service | WithUUID<typeof Service>): Service {
    const initializedService =
      this.accessory.getServiceById(
        (service as Service).displayName,
        (service as Service).subtype!
      ) ||
      this.accessory.getService(service as WithUUID<typeof Service>) ||
      this.accessory.addService(service as Service);

    this.services.push(initializedService);
    return initializedService;
  }

  protected setAccessoryInformation(): void {
    let infoService = this.accessory.getService(this.platform.Service.AccessoryInformation);

    if (!infoService) {
      this.platform.log.warn(`Accessory Information service missing for ${this.accessory.displayName}, adding it.`);
      infoService = this.accessory.addService(this.platform.Service.AccessoryInformation);
    }

    if (!infoService) {
      this.platform.log.error(`Failed to add Accessory Information service for ${this.accessory.displayName}`);
      return;
    }

    infoService
      .setCharacteristic(this.platform.Characteristic.Manufacturer, this.device.manufacturer ?? 'N/A')
      .setCharacteristic(this.platform.Characteristic.Model, this.device.model?.join(', ') ?? 'N/A')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.deviceId ?? 'N/A');
  }

  public supportsFunction(functionName: DeviceFunction): boolean {
    const functionClass = HubspaceAccessory.functionClassMap[functionName];
    return this.device.functions.some(f => f.functionClass === functionClass);
  }

  protected removeStaleServices(): void {
    const existingServices = this.accessory.services;
    const validServices = this.services.map(service => service.UUID);

    existingServices.forEach(service => {
      if (!validServices.includes(service.UUID)) {
        this.accessory.removeService(service);
      }
    });
  }

  protected configureName(service: Service, name: string): void {
    service.setCharacteristic(this.platform.Characteristic.Name, name);
    service.setCharacteristic(this.platform.Characteristic.ConfiguredName, name);
    this.log.info(`Configured service name: ${name}`);
  }

  public abstract initializeService(): void;
  public abstract updateState(state: any): void;
}
