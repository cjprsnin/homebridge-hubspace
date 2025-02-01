import { HubspaceAccessory } from '../accessories/hubspace-accessory'; // Correct import path
import { DeviceFunction, DeviceFunctionDef } from '../models/device-functions'; // Correct import
import { DeviceFunctionResponse } from '../device-function-response';

/**
 * Represents a device function definition.
 */
export interface DeviceFunctionDef {
  functionClass: string;
  functionInstanceName: string;
}

/**
 * Gets the device function definition.
 * @param functions Device functions.
 * @param functionName Function name.
 * @param outletIndex Outlet index.
 * @returns Device function response or undefined.
 */
export function getDeviceFunctionDef(
  functions: DeviceFunctionResponse[],
  functionName: DeviceFunction,
  outletIndex?: number
): DeviceFunctionResponse | undefined {
  return functions.find((func) => {
    const matchesFunction = func.functionClass === functionName;
    const matchesOutlet = outletIndex === undefined || func.values[0].deviceValues[outletIndex];
    return matchesFunction && matchesOutlet;
  });
}

// Example of a power function definition
const powerFunction: DeviceFunctionDef = {
  functionClass: DeviceFunction.Power,
  functionInstanceName: 'fan-power',
};

// Example of a brightness function definition
const brightnessFunction: DeviceFunctionDef = {
  functionClass: DeviceFunction.Brightness,
  functionInstanceName: 'default-brightness',
};
