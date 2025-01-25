import { DeviceFunctionResponse } from './device-function-response';

/**
 * HTTP response for device discovery
 */
export interface DeviceResponse {
    id: string; // Unique device identifier
    deviceId: string; // The device's specific identifier
    typeId: string; // Type ID of the device
    friendlyName: string; // Human-readable name of the device
    description: {
        device: {
            manufacturerName: string; // Manufacturer name
            model: string; // Model information (could be a string or array)
            deviceClass: string; // Class/type of the device (e.g., power-outlet, light)
        };
        functions: DeviceFunctionResponse[]; // List of functions available for the device
    };
    children?: DeviceResponse[]; // Optional field to handle child devices (nested devices)
}
