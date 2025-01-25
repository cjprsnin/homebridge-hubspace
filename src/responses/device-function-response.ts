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
  values: any;
  functionInstance: import("/vscode-vfs/github+7b2276223a312c22726566223a7b2274797065223a352c226964223a226d6173746572227d7d/cjprsnin/homebridge-hubspace/src/models/device-functions").DeviceFunction;
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
