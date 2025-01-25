// Updated code to handle the absence of 'values' in DeviceFunctionResponse and improve type safety.

import { DeviceFunctionResponse } from "path/to/definitions";

class LightAccessory {
    constructor(private deviceService: DeviceService, private device: Device) {}

    async handleFunction(func: DeviceFunctionResponse) {
        // Check if 'values' exists and has the expected structure
        if (!func.values || func.values.length === 0 || !func.values[0].deviceValues || func.values[0].deviceValues.length === 0) {
            console.error("Unexpected response structure", func);
            return;
        }

        // Access the key safely
        const key = func.values[0].deviceValues[0].key;
        if (!key) {
            console.error("Key not found in the response", func);
            return;
        }

        // Example usage of the key
        const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, key);
        await this.deviceService.setValue(this.device.deviceId, key, value);
    }

    async setKelvin(func: DeviceFunctionResponse, kelvin: number) {
        if (!func.values || func.values.length === 0 || !func.values[0].deviceValues || func.values[0].deviceValues.length === 0) {
            console.error("Unexpected response structure", func);
            return;
        }

        const key = func.values[0].deviceValues[0].key;
        if (!key) {
            console.error("Key not found in the response", func);
            return;
        }

        await this.deviceService.setValue(this.device.deviceId, key, kelvin);
    }

    async setRgb(func: DeviceFunctionResponse, rgb: string) {
        if (!func.values || func.values.length === 0 || !func.values[0].deviceValues || func.values[0].deviceValues.length === 0) {
            console.error("Unexpected response structure", func);
            return;
        }

        const key = func.values[0].deviceValues[0].key;
        if (!key) {
            console.error("Key not found in the response", func);
            return;
        }

        await this.deviceService.setValue(this.device.deviceId, key, rgb);
    }
}

interface DeviceService {
    getValueAsBoolean(deviceId: string, key: string): Promise<boolean>;
    getValueAsInteger(deviceId: string, key: string): Promise<number>;
    getValue(deviceId: string, key: string): Promise<string>;
    setValue(deviceId: string, key: string, value: any): Promise<void>;
}

interface Device {
    deviceId: string;
}
