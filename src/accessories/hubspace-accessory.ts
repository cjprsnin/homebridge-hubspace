import { PlatformConfig, Logger, PlatformAccessory, Service, WithUUID } from 'homebridge';
import { Device } from '../models/device';
import { DeviceFunction } from '../models/device-functions';
import { HubspacePlatform } from '../platform';
import { DeviceService } from '../services/device.service';

/**
 * Base class for Hubspace accessories
 */
export abstract class HubspaceAccessory {
  public services: Service[] = [];
  public log: Logger;
  public config: PlatformConfig;
  public deviceService: DeviceService;
  protected readonly device: Device;

  // Define the mapping between DeviceFunction enum and functionClass strings
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
    // Initialize services
    services.forEach(service => this.addService(service));

    this.config = platform.config;
    this.log = platform.log;
    this.deviceService = platform.deviceService;
    this.device = accessory.context.device;

    // Set accessory information
    this.setAccessoryInformation();
  }

  /**
   * Adds a service to the accessory and returns it.
   */
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

  /**
   * Sets the accessory information (Manufacturer, Model, SerialNumber).
   */
  protected setAccessoryInformation(): void {
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, this.device.manufacturer ?? 'N/A')
      .setCharacteristic(this.platform.Characteristic.Model, this.device.model.join(', ') ?? 'N/A')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.deviceId ?? 'N/A');
  }

  /**
   * Determines if the given device function is supported by the accessory.
   * @param functionName The name of the device function.
   * @returns True if the function is supported, otherwise false.
   */
  public supportsFunction(functionName: DeviceFunction): boolean {
    const functionClass = HubspaceAccessory.functionClassMap[functionName];
    return this.device.functions.some(f => f.functionClass === functionClass);
  }

  /**
   * Removes stale services that are no longer used.
   */
  protected removeStaleServices(): void {
    const existingServices = this.accessory.services;
    const validServices = this.services.map(service => service.UUID);

    existingServices.forEach(service => {
      if (!validServices.includes(service.UUID)) {
        this.accessory.removeService(service);
      }
    });
  }

  /**
   * Configures the name for a service.
   */
  protected configureName(service: Service, name: string): void {
    service.setCharacteristic(this.platform.Characteristic.Name, name);
    service.setCharacteristic(this.platform.Characteristic.ConfiguredName, name);
    this.log.info(`Configured service name: ${name}`);
  }

  /**
   * Abstract method to initialize the service.
   * Must be implemented by derived classes.
   */
  public abstract initializeService(): void;

  /**
   * Abstract method to update the state of the accessory.
   * Must be implemented by derived classes.
   */
  public abstract updateState(state: any): void;
}
