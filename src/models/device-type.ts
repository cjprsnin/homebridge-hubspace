import { Logger } from 'homebridge';
/**
 * Type of a device
 */
export enum DeviceType {
  /** Represents a light device */
  Light = 'light',

  /** Represents a fan device */
  Fan = 'fan',

  /** Represents an outlet device */
  Outlet = 'power-outlet',

  /** Represents a sprinkler device */
  Sprinkler = 'sprinkler',

  /** Represents a multi-outlet device */
  MultiOutlet = 'multi-outlet-accessory',

  /** Represents a parent device (e.g., a hub or controller) */
  Parent = 'parent',
}

/**
 * Gets {@link DeviceType} for a specific key
 * @param key Device key
 * @param logger Optional logger for debugging
 * @returns {@link DeviceType} if key is found, otherwise undefined
 */
export function getDeviceTypeForKey(key: string, logger?: Logger): DeviceType | undefined {
  const lowerKey = key.toLowerCase(); // Ensure case insensitivity

  switch (lowerKey) {
    case 'light':
      return DeviceType.Light;
    case 'fan':
      return DeviceType.Fan;
    case 'power-outlet':
      return DeviceType.Outlet;
    case 'water-timer':
      return DeviceType.Sprinkler;
    case 'multi-outlet-accessory':
      return DeviceType.MultiOutlet;
    case 'parent':
      return DeviceType.Parent;
    default:
      if (logger) {
        logger.warn(`Unknown device type key: ${key}`);
      }
      return undefined;
  }
}
