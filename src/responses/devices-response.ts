import { DeviceFunctionResponse } from './device-function-response';

/**
 * HTTP response for device discovery
 */
export interface DeviceResponse{
    id: string;
    deviceId: string;
    typeId: string;
    friendlyName: string;
    description: {
        device: {
            manufacturerName: string;
            model: string;
            deviceClass: string;
        };
        functions: DeviceFunctionResponse[];
        
    };
    children?: DeviceResponse[]; // Add this to match the API response
}