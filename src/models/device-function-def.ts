
/**
 * Represents a device function definition.
 */
export interface DeviceFunctionDef {
  functionClass: string;
  functionInstanceName: string;
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
