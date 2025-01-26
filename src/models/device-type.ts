/**
 * Type of a device
 */
export enum DeviceType {
    Light = 'light',
    Fan = 'fan',
    Outlet = 'power-outlet',
    Sprinkler = 'sprinkler',
    MultiOutlet = "multi-outlet-accessory",
    Parent = 'parent',  // Add this line for parent devices
}

/**
 * Gets {@link DeviceType} for a specific key
 * @param key Device key
 * @returns {@link DeviceType} if key is found, otherwise undefined
 */
export function getDeviceTypeForKey(key: string): DeviceType | undefined {
    switch(key.toLowerCase()) { // Added to ensure case-insensitivity
        case 'light':
            return DeviceType.Light;
        case 'fan':
            return DeviceType.Fan;
        case 'power-outlet':
            return DeviceType.Outlet;
        case 'water-timer':
            return DeviceType.Sprinkler;
        case 'multi-outlet-accessory':  // Added case for MultiOutlet
            return DeviceType.MultiOutlet;
        default:
            return undefined; // Can log invalid types if needed for debugging
    }
}
