import { PlatformAccessory, CharacteristicValue, Service } from 'homebridge';
import { HubspacePlatform } from '../platform';
import { Device, DeviceFunction, getDeviceFunctionDef } from '../models/device'; // Correct import path
import { AdditionalData } from './device-accessory-factory'; // Import AdditionalData
import { HubspaceAccessory } from './hubspace-accessory'; // Import HubspaceAccessory interface

export class OutletAccessory extends HubspaceAccessory {
  public services: Service[] = []; // List of services provided by the accessory
  public log = this.platform.log; // Logger instance
  public config = this.platform.config; // Configuration object
  public deviceService = this.platform.deviceService; // Device service instance

  constructor(
    protected readonly platform: HubspacePlatform,
    protected readonly accessory: PlatformAccessory,
    protected readonly device: Device,
    private readonly outletIndex: number,
    private readonly additionalData?: AdditionalData
  ) {
    super(platform, accessory, [platform.Service.Outlet]);
  }

  /**
   * Initializes the service for the outlet accessory.
   */
 public initializeService(): void {
    const service = this.services[0];
    this.configureName(service, `${this.device.name} Outlet ${this.outletIndex + 1}`);

    // Configure outlet-specific characteristics
    service
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(() => this.getOn())
      .onSet((value) => this.setOn(value));

    this.removeStaleServices();
  }
  /**
   * Sets the accessory information (Manufacturer, Model, SerialNumber).
   */
  public setAccessoryInformation(): void {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, this.device.manufacturer ?? 'N/A')
      .setCharacteristic(this.platform.Characteristic.Model, this.device.model.join(', ') ?? 'N/A')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.deviceId ?? 'N/A');
  }

  /**
   * Determines if the given device function is supported by the accessory.
   * @param functionName The name of the device function.
   * @returns True if the function is supported, otherwise false.
   */
  public supportsFunction(functionName: string): boolean {
    return this.device.functions.some(f => f.name === functionName);
  }

  /**
   * Updates the state of the accessory.
   * @param state The new state of the accessory.
   */
  public updateState(state: any): void {
    const service = this.services[0];
    if (service) {
      service.updateCharacteristic(this.platform.Characteristic.On, state.power ?? false);
    }
  }

  /**
   * Gets the power state of the outlet.
   * @returns The power state of the outlet.
   */
  private async getOn(): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower, undefined, this.outletIndex);
    const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.deviceValues[this.outletIndex].key);
    this.log.debug(`${this.device.name}: Received ${value} from Hubspace Power`);
    return value ?? false; // Ensure a boolean is returned
  }

  /**
   * Sets the power state of the outlet.
   * @param value The new power state.
   */
  private async setOn(value: CharacteristicValue): Promise<void> {
    this.log.debug(`${this.device.name}: Received ${value} from Homekit Power`);
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.OutletPower, undefined, this.outletIndex);
    await this.deviceService.setValue(this.device.deviceId, func.deviceValues[this.outletIndex].key, value);
  }

  /**
   * Configures the name for a service.
   * @param service The service to configure.
   * @param name The name to set.
   */
  private configureName(service: Service, name: string): void {
    service.setCharacteristic(this.platform.Characteristic.Name, name);
    service.setCharacteristic(this.platform.Characteristic.ConfiguredName, name);
    this.log.info(`Configured service name: ${name}`);
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
  /**
   * Returns the list of services provided by the accessory.
   * @returns The list of services.
   */
  public getServices(): Service[] {
    return this.services;
  }
}
