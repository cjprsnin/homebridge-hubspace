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
  Toggle = 'toggle',
  MaxOnTime = 'max-on-time',
  BatteryLevel = 'battery-level',
  Timer = 'timer',
  Spigot1 = 'spigot-1',
  Spigot2 = 'spigot-2',
}

export const DeviceFunctions: DeviceFunctionResponse[] = [
  {
    functionClass: DeviceFunction.Power,
    functionInstance: 'fan-light-power',
    values: [],
  },
  {
    functionClass: DeviceFunction.Power,
    functionInstance: 'fan-power',
    values: [
      {
        name: 'On/Off',
        deviceValues: [
          { type: 'Boolean', key: 'power', values: [] }
        ],
        range: { min: 0, max: 1, step: 1 }
      }
    ],
    outletIndex: 0,
  },
  {
    functionClass: DeviceFunction.FanSpeed,
    functionInstance: 'fan-speed',
    values: [],
  },
  {
    functionClass: DeviceFunction.Power,
    functionInstance: 'default-power', // Add a default instance name
    values: [],
  },
  {
    functionClass: DeviceFunction.Brightness,
    functionInstance: 'default-brightness', // Add a default instance name
    values: [],
  },
  {
    functionClass: DeviceFunction.OutletPower,
    functionInstance: 'default-outlet-power', // Add a default instance name
    values: [],
  },
  {
    functionClass: DeviceFunction.LightTemperature,
    functionInstance: 'default-light-temperature', // Add a default instance name
    values: [],
  },
  {
    functionClass: DeviceFunction.LightColor,
    functionInstance: 'default-light-color', // Add a default instance name
    values: [],
  },
  {
    functionClass: DeviceFunction.ColorMode,
    functionInstance: 'default-color-mode', // Add a default instance name
    values: [],
  },
  {
    functionClass: DeviceFunction.BatteryLevel,
    functionInstance: 'default-battery-level', // Add a default instance name
    values: [],
  },
  {
    functionClass: DeviceFunction.Toggle,
    functionInstance: 'spigot-1',
    values: [],
  },
  {
    functionClass: DeviceFunction.MaxOnTime,
    functionInstance: 'spigot-1',
    values: [],
  },
  {
    functionClass: DeviceFunction.Timer,
    functionInstance: 'spigot-1',
    values: [],
  },
  {
    functionClass: DeviceFunction.Toggle,
    functionInstance: 'spigot-2',
    values: [],
  },
  {
    functionClass: DeviceFunction.MaxOnTime,
    functionInstance: 'spigot-2',
    values: [],
  },
  {
    functionClass: DeviceFunction.Timer,
    functionInstance: 'spigot-2',
    values: [],
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
  deviceFunctionInstance?: string,
  outletIndex?: number,
  logger?: any // Change to any type for mock logger
): DeviceFunctionResponse {
  // Add debug log to show the content of deviceFunctionResponse
  if (logger) {
    logger.debug(`Device Function Response: ${JSON.stringify(deviceFunctionResponse)}`);
  }

  // Look for matching functionClass, and optionally functionInstance
  const fc = deviceFunctionResponse.find(
    (fc) =>
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

// Sample population of deviceFunctionResponse and testing
export const deviceFunctionResponse: DeviceFunctionResponse[] = [
  {
    functionClass: 'power',
    functionInstance: 'outlet-1',
    values: [
      {
        name: 'On/Off',
        deviceValues: [
          { type: 'Boolean', key: 'power', values: [] }
        ],
        range: { min: 0, max: 1, step: 1 }
      }
    ],
    outletIndex: 0,
  },
  {
    functionClass: 'power',
    functionInstance: 'outlet-2',
    values: [
      {
        name: 'On/Off',
        deviceValues: [
          { type: 'Boolean', key: 'power', values: [] }
        ],
        range: { min: 0, max: 1, step: 1 }
      }
    ],
    outletIndex: 1,
  },
  {
    functionClass: 'power',
    functionInstance: 'outlet-3',
    values: [
      {
        name: 'On/Off',
        deviceValues: [
          { type: 'Boolean', key: 'power', values: [] }
        ],
        range: { min: 0, max: 1, step: 1 }
      }
    ],
    outletIndex: 2,
  },
  {
    functionClass: 'power',
    functionInstance: 'outlet-4',
    values: [
      {
        name: 'On/Off',
        deviceValues: [
          { type: 'Boolean', key: 'power', values: [] }
        ],
        range: { min: 0, max: 1, step: 1 }
      }
    ],
    outletIndex: 3,
  },
];


// Create a mock logger for testing
const mockLogger = {
  debug: console.log,
  error: console.error,
};

// Call the getDeviceFunctionDef function
try {
  const functionDef = getDeviceFunctionDef(deviceFunctionResponse, DeviceFunction.Power, 'fan-power', 0, mockLogger);
  console.log(functionDef); // Check if the correct function definition is returned
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`); // Type guard to access error message safely
  } else {
    console.error('An unknown error occurred');
  }
}
