class FanAccessory extends HubspaceAccessory {
  constructor(platform: HubspacePlatform, accessory: PlatformAccessory) {
    super(platform, accessory, [platform.Service.Fanv2]);
    this.configureActive();
    this.configureRotationSpeed();
    this.removeStaleServices();
  }

  private async setActive(value: CharacteristicValue): Promise<void> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.FanPower);
    await this.deviceService.setValue(this.device.deviceId, func.deviceValues[0].key, value);
  }

  private async getActive(): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.FanPower);
    const value = await this.deviceService.getValue(this.device.deviceId, func.deviceValues[0].key);
    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
    return value!;
  }

  private async getRotationSpeed(): Promise<CharacteristicValue> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.FanSpeed);
    const value = await this.deviceService.getValue(this.device.deviceId, func.deviceValues[0].key);
    if (isNullOrUndefined(value)) {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
    return value!;
  }

  private async setRotationSpeed(value: CharacteristicValue): Promise<void> {
    const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.FanSpeed);
    await this.deviceService.setValue(this.device.deviceId, func.deviceValues[0].key, value);
  }
}
