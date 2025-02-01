import { HubspaceAccessory } from '../accessories/hubspace-accessory'; // Correct import path
import { DeviceFunctionResponse, DeviceFunctionDef } from '../models/device-functions'; // Ensure correct import

/**
 * Gets the device function definition.
 * @param functions Device functions.
 * @param functionName Function name.
 * @param outletIndex Outlet index.
 * @returns Device function response or undefined.
 */
export function getDeviceFunctionDef(
  functions: DeviceFunctionResponse[],
  functionName: string,
  outletIndex?: number
): DeviceFunctionResponse | undefined {
  return functions.find(
    (func) => func.functionInstance === functionName && (outletIndex === undefined || func.outletIndex === outletIndex)
  );
}
export interface DeviceFunctionDef {
  functionClass: DeviceFunction;
  functionInstanceName: string;
}
// Example of a power function definition
const powerFunction: DeviceFunctionDef = {
  functionClass: 'power',
  functionInstanceName: 'fan-power'
};

// Example of a brightness function definition
const brightnessFunction: DeviceFunctionDef = {
  functionClass: 'brightness',
  functionInstanceName: 'default-brightness'
};
