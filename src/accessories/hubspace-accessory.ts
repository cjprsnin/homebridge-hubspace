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
    [DeviceFunction.LightPower]: 'Light Power',
    [DeviceFunction.LightTemperature]: 'Color Temperature',
    [DeviceFunction.LightColor]: 'Color RGB',
    [DeviceFunction.ColorMode]: '',
    [DeviceFunction.Toggle]: '',
    [DeviceFunction.MaxOnTime]: '',
    [DeviceFunction.BatteryLevel]: '',
    [DeviceFunction.Timer]: '',
    [DeviceFunction.Spigot1]: '',
    [DeviceFunction.Spigot2]: '',
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
   * Initializes a service by either retrieving an existing one or adding a new one.
   */
  private initializeService(service: Service | WithUUID<typeof Service>): void {
    const initializedService =
      this.accessory.getServiceById(
        (service as Service).displayName,
        (service as Service).subtype!
      ) ||
      this.accessory.getService(service as WithUUID<typeof Service>) ||
      this.accessory.addService(service as Service);

    this.services.push(initializedService);
  }

  /**
   * Sets the accessory information (Manufacturer, Model, SerialNumber).
   */
  private setAccessoryInformation(): void {
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        this.device.manufacturer ?? 'N/A'
      )
      .setCharacteristic(
        this.platform.Characteristic.Model,
        Array.isArray(this.device.model) && this.device.model.length > 0
          ? this.device.model[0]
          : 'N/A'
      )
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        this.device.deviceId ?? 'N/A'
      );
  }

  /**
   * Determines if the given device function is supported by the accessory.
   * Can be overridden by derived classes.
   */
  public supportsFunction(deviceFunction: DeviceFunction): boolean {
    const functionClass = HubspaceAccessory.functionClassMap[deviceFunction];
    return this.device.functions.some(
      (func) => func.functionClass === functionClass
    );
  }

  /**
   * Removes stale services that are no longer used.
   */
  protected removeStaleServices(): void {
    const staleServices = this.accessory.services
      .slice(1)
      .filter(
        (service) =>
          !this.services.some(
            (activeService) =>
              activeService.UUID === service.UUID &&
              activeService.displayName === service.displayName
          )
      );

    for (const staleService of staleServices) {
      this.accessory.removeService(staleService);
      this.log.info(`Removed stale service: ${staleService.displayName}`);
    }
  }

  /**
   * Configures the name for a service.
   */
  protected configureName(service: Service, name: string): void {
    service.setCharacteristic(this.platform.Characteristic.Name, name);
    service.setCharacteristic(
      this.platform.Characteristic.ConfiguredName,
      name
    );
    this.log.info(`Configured service name: ${name}`);
  }

  /**
   * Abstract method to initialize the service.
   * Must be implemented by derived classes.
   */
  /**
 * Adds a service to the accessory.
 */
private addService(service: Service | WithUUID<typeof Service>): void {
  const initializedService =
    this.accessory.getServiceById(
      (service as Service).displayName,
      (service as Service).subtype!
    ) ||
    this.accessory.getService(service as WithUUID<typeof Service>) ||
    this.accessory.addService(service as Service);

  this.services.push(initializedService);
}

  /**
   * Abstract method to update the state of the accessory.
   * Must be implemented by derived classes.
   */
  public abstract updateState(state: any): void;
}
