/**
 * Response for device function
 */

export interface DeviceValues{
    /** Device values */
    type: string;
    /** key id */
    key: string;
}

export interface ValuesRange{
    /** miniumum value */
    min: number;
    /** maximum value */
    max: number;
    /** step value */
    step: number;
}

export interface DeviceFunctionValues{
    /** Name of the value */
    name: string;
    /** Possible values */
    deviceValues: DeviceValues[];
    /** Range of Values */
    range: ValuesRange;
}

// Ensure the DeviceResponse interface is exported
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
    functions: DeviceFunctionResponse[];
  };
}
