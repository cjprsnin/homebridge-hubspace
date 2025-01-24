// src/responses/device-function-response.ts

// Assuming DeviceValues, ValuesRange, and DeviceFunctionValues are defined as per your earlier structure
export interface DeviceValues {
  /** Device values */
  type: string;
  /** Key ID */
  key: string;
}

export interface ValuesRange {
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Step value */
  step: number;
}

export interface DeviceFunctionValues {
  /** Name of the value */
  name: string;
  /** Possible values */
  deviceValues: DeviceValues[];
  /** Range of Values */
  range: ValuesRange;
}

// DeviceFunctionResponse definition
export interface DeviceFunctionResponse {
  functionClass: string;
  functionInstanceName: string;
  deviceValues: DeviceValues[]; // Add this property
}

// DeviceResponse definition
export interface DeviceResponse {
  id: string;
  deviceId: string;
  children: DeviceResponse[];
  typeId: string;
  friendlyName: string;
  description: {
    device: {
      manufacturerName: string;
      model: string;
      deviceClass: string;
    };
    functions: DeviceFunctionResponse[];  // Corrected usage of DeviceFunctionResponse here
  };
}
