// src/models/device-values.ts

/**
 * Represents a device's key-value pair for a specific device attribute.
 */
export interface DeviceValues {
  /** Unique identifier for the value */
  key: string;
  /** Value associated with the key, can be a string, number, or boolean */
  value: string | number | boolean;
}

/**
 * Represents the valid range of values for a specific device function.
 */
export interface ValuesRange {
  /** Minimum value allowed in the range */
  min?: number;
  /** Maximum value allowed in the range */
  max?: number;
}
