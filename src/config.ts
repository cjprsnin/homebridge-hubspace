import { PlatformConfig } from 'homebridge';

/**
 * Validates the platform configuration
 * @param config Platform configuration
 * @returns True if the configuration is valid, otherwise false
 */
export function isConfigValid(config: PlatformConfig): boolean {
  if (!config.username || !config.password) {
    return false;
  }
  return true;
}
