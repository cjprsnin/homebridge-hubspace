/**
 * HTTP response with device statuses for each attribute
 */
export interface DeviceStatusResponse {
    deviceId: string; // The unique identifier for the device
    attributes: {
        id: number; // The ID of the attribute (could be a sensor or other configurable parameter)
        data: string; // The data associated with the attribute (e.g., "temperature", "status")
        value: string; // The current value of the attribute (e.g., "on", "off", or a numerical value)
        updatedTimestamp: number; // The timestamp of the last update (in milliseconds)
    }[]; // Array of attributes for the device
    deviceState: {
        available: boolean; // Indicates if the device is currently available (online/offline)
    };
}
