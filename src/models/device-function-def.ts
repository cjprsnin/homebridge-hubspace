import { HubspaceAccessory } from './hubspace-accessory';
/**
 * Device function definition
 */
export function getDeviceFunctionDef(
  functions: DeviceFunctionResponse[],
  functionName: DeviceFunction,
  functionInstance?: string,
  outletIndex?: number
): DeviceFunctionResponse | undefined {
  const functionClass = HubspaceAccessory.functionClassMap[functionName];
  if (!functionClass) {
    throw new Error(`Function class not found for function: ${functionName}`);
  }

  return functions.find((fc) =>
    fc.functionClass === functionClass &&
    (!functionInstance || fc.functionInstance === functionInstance) &&
    (outletIndex !== undefined ? fc.values[0].deviceValues[outletIndex] : true)
  );
}

export interface DeviceFunctionDef{
    /** API function instance name string */
    functionInstanceName?: string;

    /** Device function class */
    functionClass: string;
}
// Example of a power function definition
const powerFunction: DeviceFunctionDef = {
  functionClass: 'power',
  functionInstanceName: 'fan-power'
};

// Example of a brightness function definition
const brightnessFunction: DeviceFunctionDef = {
  functionClass: 'brightness'
};
