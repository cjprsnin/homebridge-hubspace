/**
 * Response for device function
 */

export interface DeviceValues {
  /** Type of the value (e.g., "status", "temperature") */
  type: string;
  /** Unique key id for the value */
  key: string;
}

export interface ValuesRange {
  /** Minimum allowed value */
  min: number;
  /** Maximum allowed value */
  max: number;
  /** Step increment for value adjustments */
  step: number;
}

export interface DeviceFunctionValues {
  /** Name of the value (e.g., "power", "brightness") */
  name: string;
  /** Possible values for the function */
  deviceValues: DeviceValues[];
  /** Optional range of values */
  range?: ValuesRange;
}

export interface DeviceFunctionResponse {
  /** Additional device values metadata (e.g., possible statuses or configurations) */
  deviceValues: DeviceValues[];
  /** Class of the function (e.g., "power", "lighting") */
  functionClass: string;
  /** Instance name of the function (e.g., "on/off", "brightness") */
  functionInstance: string;
  /** Function values */
  values: DeviceFunctionValues[];
}
