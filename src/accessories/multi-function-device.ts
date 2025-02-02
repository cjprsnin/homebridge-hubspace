import { PlatformAccessory, CharacteristicValue, Service, WithUUID } from 'homebridge';
import { HubspacePlatform } from '../platform';
import { Device } from '../models/device';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
import { HubspaceAccessory } from './hubspace-accessory';
import { AdditionalData } from '../models/additional-data';

export class MultiFunctionDevice extends HubspaceAccessory {
  constructor(
    protected readonly platform: HubspacePlatform,
    protected readonly accessory: PlatformAccessory,
    protected readonly device: Device,
    additionalData?: AdditionalData
  ) {
    super(platform, accessory, [platform.Service.Outlet, platform.Service.Lightbulb, platform.Service.Fan]);
    this.initializeService();
    this.setAccessoryInformation();
  }

  public initializeService(): void {
    if (!this.device.children) {
      this.log.error(`${this.device.name} has no children devices.`);
      return;
    }

    this.device.children.forEach((child, index) => {
      this.log.info(`Initializing ${this.device.name} child ${index + 1}: ${child.name}`);
      const functionType = this.determineFunctionType(child);
      const service = this.addService(functionType);

      const serviceName = functionType.name || 'Service';
      this.configureName(service, `${this.device.name} ${serviceName} ${index + 1}`);

      service
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(async () => this.getOn(index))
        .onSet((value) => this.setOn(value, index));

      this.log.info(`Configured service for ${this.device.name} ${serviceName} ${index + 1}`);
    });

    this.removeStaleServices();
  }

  private determineFunctionType(child: Device): Service | WithUUID<typeof Service> {
    const powerFunction = child.functions.find(f => f.functionClass === DeviceFunction.Power);
    if (powerFunction) {
      this.log.info(`Detected power function for child device: ${child.name}`);
      return this.platform.Service.Outlet;
    }

    const toggleFunction = child.functions.find(f => f.functionClass === DeviceFunction.Toggle);
    if (toggleFunction) {
      this.log.info(`Detected toggle function for child device: ${child.name}`);
      return this.platform.Service.Outlet;
    }

    const timerFunction = child.functions.find(f => f.functionClass === DeviceFunction.Timer);
    if (timerFunction) {
      this.log.info(`Detected timer function for child device: ${child.name}`);
      return this.platform.Service.Switch;
    }

    this.log.warn(`No specific function found for child device: ${child.name}, defaulting to Switch`);
    return this.platform.Service.Switch; // Default fallback
  }

  public async updateState(): Promise<void> {
    if (!this.device.children) {
      this.log.error(`${this.device.name} has no children devices.`);
      return;
    }

    for (let index = 0; index < this.device.children.length; index++) {
      const value = await this.getOn(index);
      const service = this.services.find((s) => s.UUID === this.platform.Service.Outlet.UUID && s.subtype === `outlet-${index}`);
      if (service) {
        this.log.info(`Updating ${this.device.name} Outlet ${index + 1} to state ${value}`);
        service.updateCharacteristic(this.platform.Characteristic.On, value);
      }
    }
  }

  private async getOn(outletIndex: number): Promise<CharacteristicValue> {
    const deviceFunctionInstance = `outlet-${outletIndex + 1}`;
    this.log.debug(`Device functions before retrieval: ${JSON.stringify(this.device.functions)}`);

    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Power, deviceFunctionInstance, outletIndex);
    if (!func) {
      this.log.error(`${this.device.name}: Power function not supported for outlet ${outletIndex + 1}.`);
      return false;
    }

    const value = await this.deviceService.getValueAsBoolean(
      this.device.deviceId,
      func.values[0].deviceValues[0].key
    );
    this.log.debug(`${this.device.name}: Received ${value} from Hubspace Power for outlet ${outletIndex + 1}`);
    return value ?? false;
  }

  private async setOn(value: CharacteristicValue, outletIndex: number): Promise<void> {
    const deviceFunctionInstance = `outlet-${outletIndex + 1}`;
    this.log.debug(`${this.device.name}: Received ${value} from Homekit Power for outlet ${outletIndex + 1}`);
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Power, deviceFunctionInstance, outletIndex);
    if (!func) {
      this.log.error(`${this.device.name}: Power function not supported for outlet ${outletIndex + 1}.`);
      return;
    }

    await this.deviceService.setValue(
      this.device.deviceId,
      func.values[0].deviceValues[0].key,
      value
    );
  }
}
