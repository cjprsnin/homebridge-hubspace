/**
 * Device function definition
 */
export interface DeviceFunctionDef {
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
