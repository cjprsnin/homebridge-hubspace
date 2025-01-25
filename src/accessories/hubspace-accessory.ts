import {
  PlatformConfig,
  Logger,
  PlatformAccessory,
  Service,
  WithUUID,
} from 'homebridge';
import { Device } from '../models/device';
import { DeviceFunction } from '../models/device-functions';
import { HubspacePlatform } from '../platform';
import { DeviceService } from '../services/device.service';

/**
 * Base class for Hubspace accessories
 */
export abstract class HubspaceAccessory {
  protected readonly services: Service[] = [];
  protected readonly log: Logger;
  protected readonly config: PlatformConfig;
  protected readonly deviceService: DeviceService;
  protected readonly device: Device;

  // Define the mapping between DeviceFunction enum and functionClass strings
  private static functionClassMap: Record<DeviceFunction, string> = {
    power: 'Power',
    'fan-power': 'Fan Power',
    'fan-speed': 'Fan Speed',
    brightness: 'Brightness',
    'light-power': 'Light Power',
    'color-temperature': 'Color Temperature',
    'color-rgb': 'Color RGB',
    [DeviceFunction.ColorMode]: '',
    [DeviceFunction.Toggle]: '',
    [DeviceFunction.MaxOnTime]: '',
    [DeviceFunction.BatteryLevel]: '',
    [DeviceFunction.Timer]: '',
    [DeviceFunction.Spigot1]: '',
    [DeviceFunction.Spigot2]: ''
  };

  constructor(
    protected readonly platform: HubspacePlatform,
    protected readonly accessory: PlatformAccessory,
    services: (Service | WithUUID<typeof Service>)[]
  ) {
    // Initialize services
    for (const service of services) {
      const initializedService =
        accessory.getServiceById(
          (service as Service).displayName,
          (service as Service).subtype!
        ) ||
        accessory.getService(service as WithUUID<typeof Service>) ||
        this.accessory.addService(service as Service);

      this.services.push(initializedService);
    }

    this.config = platform.config;
    this.log = platform.log;
    this.deviceService = platform.deviceService;
    this.device = accessory.context.device;

    // Set accessory information
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
  protected supportsFunction(deviceFunction: DeviceFunction): boolean {
    const functionClass = HubspaceAccessory.functionClassMap[deviceFunction];
    return this.device.functions.some(
      (func) => func.functionClass === functionClass
    );
  }

  /**
   * Removes stale services that are no longer used
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
    }
  }

  /**
   * Configures the name for a service
   */
  protected configureName(service: Service, name: string): void {
    service.setCharacteristic(this.platform.Characteristic.Name, name);
    service.setCharacteristic(
      this.platform.Characteristic.ConfiguredName,
      name
    );
  }
}
