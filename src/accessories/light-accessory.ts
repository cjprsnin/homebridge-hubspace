import { DeviceFunction, DeviceFunctionResponse } from "../models";
import { HubspaceAccessory } from "./hubspace-accessory";

export class LightAccessory extends HubspaceAccessory {

    protected supportsFunction(deviceFunction: DeviceFunction): boolean {
        return ["light-power", "brightness", "color-temperature", "color-rgb"].includes(deviceFunction.type);
    }

    private getKeyFromFunctionResponse(func: DeviceFunctionResponse): string | undefined {
        if (!func.values?.[0]?.deviceValues?.[0]?.key) {
            console.error("Invalid function response: missing values or keys");
            return undefined;
        }
        return func.values[0].deviceValues[0].key;
    }

    public async getPowerState(func: DeviceFunctionResponse): Promise<boolean | undefined> {
        const key = this.getKeyFromFunctionResponse(func);
        if (!key) return undefined;

        return await this.deviceService.getValueAsBoolean(this.device.deviceId, key);
    }

    public async setPowerState(func: DeviceFunctionResponse, value: boolean): Promise<void> {
        const key = this.getKeyFromFunctionResponse(func);
        if (!key) return;

        await this.deviceService.setValue(this.device.deviceId, key, value);
    }

    public async getBrightness(func: DeviceFunctionResponse): Promise<number | undefined> {
        const key = this.getKeyFromFunctionResponse(func);
        if (!key) return undefined;

        return await this.deviceService.getValueAsInteger(this.device.deviceId, key);
    }

    public async setBrightness(func: DeviceFunctionResponse, value: number): Promise<void> {
        const key = this.getKeyFromFunctionResponse(func);
        if (!key) return;

        await this.deviceService.setValue(this.device.deviceId, key, value);
    }

    public async getColorMode(func: DeviceFunctionResponse): Promise<boolean | undefined> {
        const key = this.getKeyFromFunctionResponse(func);
        if (!key) return undefined;

        return await this.deviceService.getValueAsBoolean(this.device.deviceId, key);
    }

    public async setKelvin(func: DeviceFunctionResponse, kelvin: number): Promise<void> {
        const key = this.getKeyFromFunctionResponse(func);
        if (!key) return;

        await this.deviceService.setValue(this.device.deviceId, key, kelvin);
    }

    public async setRGB(func: DeviceFunctionResponse, rgb: string): Promise<void> {
        const key = this.getKeyFromFunctionResponse(func);
        if (!key) return;

        await this.deviceService.setValue(this.device.deviceId, key, rgb);
    }
}
