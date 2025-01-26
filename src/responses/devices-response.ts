export interface DeviceFunctionResponse {
    id: string; // Unique function identifier
    functionClass: string; // Type of function (toggle, timer, power, etc.)
    functionInstance: string; // Instance (e.g., outlet-1, outlet-2, etc.)
    type: string; // Category or type (e.g., category, numeric)
    schedulable: boolean; // Whether this function can be scheduled
    values: DeviceFunctionValue[]; // Values associated with the function
}

// Define the Range interface if it's not already available
export interface Range {
    min: number;
    max: number;
    step: number;
  }

export interface DeviceFunctionValue {
    id: string;
    name: string; // e.g., "on", "off"
    deviceValues: DeviceValue[];
    range: Range | {}; // Timer or power range
}

export interface DeviceValue {
    id: string;
    key: string; // Attribute key (e.g., "1" for on/off state)
    value: string; // Value (e.g., "0" or "1" for off/on)
}

export interface DeviceResponse {
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
    children?: DeviceResponse[]; // Children devices (outlets) will be added here
}
