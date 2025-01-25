import { DeviceFunctionDef } from './device-function-def';
import { DeviceFunctionResponse } from '../responses/device-function-response';

/**
 * Device functions types
 */
export enum DeviceFunction {
    Power = 'power',
    Brightness = 'brightness',
    FanLightPower = 'light-power',
    FanPower = 'fan-power',
    FanSpeed = 'fan-speed',
    OutletPower = 'power',
    LightTemperature = 'color-temperature',
    LightColor = 'color-rgb',
    ColorMode = 'color-mode',
    // Value Functions
    Toggle = 'toggle',
    MaxOnTime = 'max-on-time',
    BatteryLevel = 'battery-level',
    Timer = 'timer',
    Spigot1 = 'spigot-1',
    Spigot2 = 'spigot-2'
}

/**
 * Supported/implemented device functions
 * with identifiers for discovery and/or manipulation.
 */
export const DeviceFunctions: DeviceFunctionDef[] = [
    {
        functionClass: DeviceFunction.Power,
        functionInstanceName: DeviceFunction.FanLightPower
    },
    {
        functionClass: DeviceFunction.Power,
        functionInstanceName: DeviceFunction.FanPower
    },
    {
        functionClass: DeviceFunction.FanSpeed,
        functionInstanceName: DeviceFunction.FanSpeed
    },
    {
        functionClass: DeviceFunction.Power
    },
    {
        functionClass: DeviceFunction.Brightness
    },
    {
        functionClass: DeviceFunction.OutletPower
    },
    {
        functionClass: DeviceFunction.LightTemperature
    },
    {
        functionClass: DeviceFunction.LightColor
    },
    {
        functionClass: DeviceFunction.ColorMode
    },
    {
        functionClass: DeviceFunction.BatteryLevel
    },
    {
        functionClass: DeviceFunction.Toggle,
        functionInstanceName: DeviceFunction.Spigot1
    },
    {
        functionClass: DeviceFunction.MaxOnTime,
        functionInstanceName: DeviceFunction.Spigot1
    },
    {
        functionClass: DeviceFunction.Timer,
        functionInstanceName: DeviceFunction.Spigot1
    },
    {
        functionClass: DeviceFunction.Toggle,
        functionInstanceName: DeviceFunction.Spigot2
    },
    {
        functionClass: DeviceFunction.MaxOnTime,
        functionInstanceName: DeviceFunction.Spigot2
    },
    {
        functionClass: DeviceFunction.Timer,
        functionInstanceName: DeviceFunction.Spigot2
    }
];

/**
 * Gets function definition for a type
 * @param deviceFunctionResponse Function response array from device
 * @param deviceFunction Function type to find
 * @param deviceFunctionInstance Optional function instance for further specificity
 * @param outletIndex Optional outlet index for more detailed selection
 * @returns Function definition for type
 * @throws {@link Error} when a type has no definition associated with it
 */
export function getDeviceFunctionDef(
    deviceFunctionResponse: DeviceFunctionResponse[], 
    deviceFunction: DeviceFunction, 
    deviceFunctionInstance?: DeviceFunction, 
    outletIndex?: number
): DeviceFunctionResponse {
    // Look for matching functionClass, and optionally functionInstance
    const fc = deviceFunctionResponse.find(fc => 
        fc.functionClass === deviceFunction &&
        (deviceFunctionInstance ? fc.functionInstance === deviceFunctionInstance : true) &&
        (outletIndex !== undefined ? fc.outletIndex === outletIndex : true)
    );

    // Throw an error if no matching function definition is found
    if (!fc) {
        const errorDetails = {
            deviceFunctionResponse,
            deviceFunction,
            deviceFunctionInstance,
            outletIndex
        };
        throw new Error(`Failed to get function definition for '${deviceFunction}'. Each function requires to set a definition. Details: ${JSON.stringify(errorDetails)}`);
    }

    return fc;
}
