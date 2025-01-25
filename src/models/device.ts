import { DeviceFunctionResponse } from '../responses/device-function-response';
import { DeviceType } from './device-type';

/**
 * Device definition
 */
export interface Device{
    /** Unique UUID within Hubspace */
    id: string;
    /** Unique UUID within HomeKit */
    uuid: string;
    /** Hubspace device ID */
    deviceId: string;
    /** Device name */
    name: string;
    /** Type of the device */
    type: DeviceType;
    /** Device manufacturer */
    manufacturer: string;
    /** Device model */
    model: string[];
    /** Supported device functions */
    functions: DeviceFunctionResponse[];
    children?: Device[]; // Add this to support child devices
}