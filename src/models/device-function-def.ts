import { HubspaceAccessory } from '../accessories/hubspace-accessory'; // Correct import path
import { DeviceFunctionResponse, DeviceFunction } from '../models/device-functions'; // Import DeviceFunction from device-functions.ts

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
  return functions.find(
    (func) => func.functionInstance === functionName && (outletIndex === undefined || func.outletIndex === outletIndex)
  );
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
