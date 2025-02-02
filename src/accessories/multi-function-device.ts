import { PlatformAccessory, CharacteristicValue, Service, WithUUID } from 'homebridge';
import { HubspacePlatform } from '../platform';
import { Device } from '../models/device';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
import { HubspaceAccessory } from './hubspace-accessory';
import { AdditionalData } from '../models/additional-data';
import { DeviceFunctionResponse } from '../responses/device-function-response';

export class MultiFunctionDevice extends HubspaceAccessory {
  constructor(
    protected readonly platform: HubspacePlatform,
    protected readonly accessory: PlatformAccessory,
    protected readonly device: Device,
    additionalData?: AdditionalData
  ) {
    super(platform, accessory, [platform.Service.Outlet, platform.Service.Lightbulb, platform.Service.Fan, platform.Service.Switch]);
    this.initializeService();
    this.setAccessoryInformation();
  }

  public initializeService(): void {
    if (!this.device.functions) {
      this.log.error(`${this.device.name} has no functions defined.`);
      return;
    }

    this.device.functions.forEach((func, index) => {
      this.log.info(`Initializing function ${func.functionClass} for ${this.device.name} instance ${index + 1}`);
      const functionType = this.determineFunctionType(func);
      const service = this.addService(functionType, `${this.device.name} ${functionType.name} ${index + 1}`, `${this.device.name}-${func.functionInstance}`);

      service
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(async () => this.getOn(func, index))
        .onSet((value) => this.setOn(value, func, index));

      this.log.info(`Configured service for ${this.device.name} ${functionType.name} ${index + 1}`);
    });

    this.removeStaleServices();
  }

  private determineFunctionType(func: DeviceFunctionResponse): Service | WithUUID<typeof Service> {
    this.log.info(`Determining function type for function: ${func.functionClass}`);
    if (func.functionClass === DeviceFunction.Power || func.functionClass === DeviceFunction.Toggle) {
      this.log.info(`Detected power or toggle function: ${func.functionClass}`);
      return this.platform.Service.Outlet;
    }

    if (func.functionClass === DeviceFunction.Timer) {
      this.log.info(`Detected timer function: ${func.functionClass}`);
      return this.platform.Service.Switch;
    }

    this.log.warn(`No specific function type found for function: ${func.functionClass}, defaulting to Switch`);
    return this.platform.Service.Switch; // Default fallback
  }

  public async updateState(): Promise<void> {
    if (!this.device.functions) {
      this.log.error(`${this.device.name} has no functions defined.`);
      return;
    }

    for (let index = 0; index < this.device.functions.length; index++) {
      const value = await this.getOn(this.device.functions[index], index);
      const service = this.services.find((s) => s.UUID === this.platform.Service.Outlet.UUID && s.subtype === `${this.device.name}-${this.device.functions[index].functionInstance}`);
      if (service) {
        this.log.info(`Updating ${this.device.name} function ${this.device.functions[index].functionClass} instance ${index + 1} to state ${value}`);
        service.updateCharacteristic(this.platform.Characteristic.On, value);
      }
    }
  }

  private async getOn(func: DeviceFunctionResponse, functionIndex: number): Promise<CharacteristicValue> {
    this.log.debug(`Device functions before retrieval: ${JSON.stringify(this.device.functions)}`);

    const deviceFunctionDef = getDeviceFunctionDef(this.device.functions, func.functionClass, func.functionInstance, functionIndex);
    if (!deviceFunctionDef) {
      this.log.error(`${this.device.name}: Function ${func.functionClass} not supported for instance ${func.functionInstance}.`);
      return false;
    }

    const value = await this.deviceService.getValueAsBoolean(
      this.device.deviceId,
      deviceFunctionDef.values[0].deviceValues[0].key
    );
    this.log.debug(`${this.device.name}: Received ${value} from Hubspace for function ${func.functionClass} instance ${func.functionInstance}`);
    return value ?? false;
  }

  private async setOn(value: CharacteristicValue, func: DeviceFunctionResponse, functionIndex: number): Promise<void> {
    this.log.debug(`${this.device.name}: Received ${value} from Homekit for function ${func.functionClass} instance ${func.functionInstance}`);
    const deviceFunctionDef = getDeviceFunctionDef(this.device.functions, func.functionClass, func.functionInstance, functionIndex);
    if (!deviceFunctionDef) {
      this.log.error(`${this.device.name}: Function ${func.functionClass} not supported for instance ${func.functionInstance}.`);
      return;
    }

    await this.deviceService.setValue(
      this.device.deviceId,
      deviceFunctionDef.values[0].deviceValues[0].key,
      value
    );
  }
}
