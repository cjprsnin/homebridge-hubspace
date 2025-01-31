import { DeviceFunctionDef } from './device-function-def';
import { DeviceFunctionResponse } from '../responses/device-function-response';
import { Logger } from 'homebridge';

/**
 * Device functions types
 */
/**
 * Device function types
 */
export enum DeviceFunction {
  /** Controls power state (on/off) */
  Power = 'power',

  /** Controls brightness level */
  Brightness = 'brightness',

  /** Controls fan light power state */
  FanLightPower = 'light-power',

  /** Controls fan power state */
  FanPower = 'fan-power',

  /** Controls fan speed */
  FanSpeed = 'fan-speed',

  /** Controls outlet power state */
  OutletPower = 'power',

  /** Controls light temperature (color temperature) */
  LightTemperature = 'color-temperature',

  /** Controls light color (RGB) */
  LightColor = 'color-rgb',

  /** Controls color mode (e.g., RGB, temperature) */
  ColorMode = 'color-mode',

  /** Toggle state (on/off) */
  Toggle = 'toggle',

  /** Maximum on time setting */
  MaxOnTime = 'max-on-time',

  /** Battery level indicator */
  BatteryLevel = 'battery-level',

  /** Timer setting */
  Timer = 'timer',

  /** Spigot 1 control */
  Spigot1 = 'spigot-1',

  /** Spigot 2 control */
  Spigot2 = 'spigot-2',
}

/**
 * Supported/implemented device functions with identifiers for discovery and/or manipulation.
 */
export const DeviceFunctions: DeviceFunctionDef[] = [
  {
    functionClass: DeviceFunction.Power,
    functionInstanceName: DeviceFunction.FanLightPower,
  },
  {
    functionClass: DeviceFunction.Power,
    functionInstanceName: DeviceFunction.FanPower,
  },
  {
    functionClass: DeviceFunction.FanSpeed,
    functionInstanceName: DeviceFunction.FanSpeed,
  },
  {
    functionClass: DeviceFunction.Power,
    functionInstanceName: 'default-power', // Add a default instance name
  },
  {
    functionClass: DeviceFunction.Brightness,
    functionInstanceName: 'default-brightness', // Add a default instance name
  },
  {
    functionClass: DeviceFunction.OutletPower,
    functionInstanceName: 'default-outlet-power', // Add a default instance name
  },
  {
    functionClass: DeviceFunction.LightTemperature,
    functionInstanceName: 'default-light-temperature', // Add a default instance name
  },
  {
    functionClass: DeviceFunction.LightColor,
    functionInstanceName: 'default-light-color', // Add a default instance name
  },
  {
    functionClass: DeviceFunction.ColorMode,
    functionInstanceName: 'default-color-mode', // Add a default instance name
  },
  {
    functionClass: DeviceFunction.BatteryLevel,
    functionInstanceName: 'default-battery-level', // Add a default instance name
  },
  {
    functionClass: DeviceFunction.Toggle,
    functionInstanceName: DeviceFunction.Spigot1,
  },
  {
    functionClass: DeviceFunction.MaxOnTime,
    functionInstanceName: DeviceFunction.Spigot1,
  },
  {
    functionClass: DeviceFunction.Timer,
    functionInstanceName: DeviceFunction.Spigot1,
  },
  {
    functionClass: DeviceFunction.Toggle,
    functionInstanceName: DeviceFunction.Spigot2,
  },
  {
    functionClass: DeviceFunction.MaxOnTime,
    functionInstanceName: DeviceFunction.Spigot2,
  },
  {
    functionClass: DeviceFunction.Timer,
    functionInstanceName: DeviceFunction.Spigot2,
  },
];

/**
 * Gets function definition for a type
 * @param deviceFunctionResponse Function response array from device
 * @param deviceFunction Function type to find
 * @param deviceFunctionInstance Optional function instance for further specificity
 * @param outletIndex Optional outlet index for more detailed selection
 * @param logger Optional logger for debugging
 * @returns Function definition for type
 * @throws {@link Error} when a type has no definition associated with it
 */
export function getDeviceFunctionDef(
  deviceFunctionResponse: DeviceFunctionResponse[],
  deviceFunction: DeviceFunction,
  deviceFunctionInstance?: DeviceFunction,
  outletIndex?: number,
  logger?: Logger
): DeviceFunctionResponse {
  // Look for matching functionClass, and optionally functionInstance
  const fc = deviceFunctionResponse.find((fc) =>
    fc.functionClass === deviceFunction &&
    (deviceFunctionInstance ? fc.functionInstance === deviceFunctionInstance : true) &&
    (outletIndex !== undefined ? fc.outletIndex === outletIndex : true)
  );

  // Log debugging information
  if (logger) {
    logger.debug(`Searching for function definition:`, {
      deviceFunction,
      deviceFunctionInstance,
      outletIndex,
      found: !!fc,
    });
  }

  // Throw an error if no matching function definition is found
  if (!fc) {
    const errorDetails = {
      deviceFunctionResponse,
      deviceFunction,
      deviceFunctionInstance,
      outletIndex,
    };
    const errorMessage = `Failed to get function definition for '${deviceFunction}'. Each function requires to set a definition. Details: ${JSON.stringify(errorDetails)}`;
    if (logger) {
      logger.error(errorMessage);
    }
    throw new Error(errorMessage);
  }

  return fc;
}
