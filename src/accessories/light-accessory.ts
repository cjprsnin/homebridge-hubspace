import { CharacteristicValue, PlatformAccessory, Service, WithUUID } from 'homebridge';
import { HubspacePlatform } from '../platform';
import { HubspaceAccessory } from './hubspace-accessory';
import { isNullOrUndefined, normalizeValue, hexToRgb, rgbToHsv, hsvToRgb, rgbToHex, rgbToMired, kelvinToRgb, clamp } from '../utils';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';

/**
 * Light accessory for Hubspace platform
 */
export class LightAccessory extends HubspaceAccessory{

    /**
     * Crates a new instance of the accessory
     * @param platform Hubspace platform
     * @param accessory Platform accessory
     * @param rgbColorSpace The "Forced" Color Space of the Accessory
     */
    constructor(platform: HubspacePlatform, accessory: PlatformAccessory) {
        super(platform, accessory, [new platform.Service.Lightbulb('1', '1')]);

        this.configurePower(0);
        this.configureBrightness(0);
        this.configureName(this.services[0], this.accessory.displayName);

        // * If [Color Temperature] characteristic is included in the `Light Bulb`, `Hue` and `Saturation` must not be included as optional
        // * characteristics in `Light Bulb`. This characteristic must not be used for lamps which support color.
        if(this.configureColor(0) && this.config.dualColorSpace) {
            // TODO: move this to a common place...
            const service = new platform.Service.Lightbulb('2', '2');
            const initializedService =
                accessory.getServiceById((service as Service).displayName, (service as Service).subtype!) ||
                this.accessory.addService(service as Service);
            this.services.push(initializedService);

            this.configureName(this.services[1], this.accessory.displayName + ' Temperature');
            this.configurePower(1);
            this.configureBrightness(1);
            this.configureTemperature(1);
        } else {
            this.configureTemperature(0);
        }

        this.removeStaleServices();
    }

    private configurePower(i: number): void{
        this.services[i].getCharacteristic(this.platform.Characteristic.On)
            .onGet(() => this.getOn(i))
            .onSet((value) => this.setOn(i, value));
    }

    private configureBrightness(i: number): void{
        if(!this.supportsFunction(DeviceFunction.Brightness)) return;

        this.services[i].getCharacteristic(this.platform.Characteristic.Brightness)
            .onGet(() => this.getBrightness(i))
            .onSet((value) => this.setBrightness(i, value));
    }

    private configureTemperature(i: number): void{
        if(!this.supportsFunction(DeviceFunction.LightTemperature)) return;

        this.services[i].getCharacteristic(this.platform.Characteristic.ColorTemperature)
            .onGet(() => this.getTemperature(i))
            .onSet((value) => this.setTemperature(i, value));
    }

    private configureColor(i: number): boolean{
        if(!this.supportsFunction(DeviceFunction.LightColor)) return false;

        this.services[i].getCharacteristic(this.platform.Characteristic.Hue)
            .onGet(() => this.getHue(i))
            .onSet((value) => this.setHue(i, value));
        this.services[i].getCharacteristic(this.platform.Characteristic.Saturation)
            .onGet(() => this.getSaturation(i))
            .onSet((value) => this.setSaturation(i, value));

        return true;
    }

    private async getOn(i: number): Promise<CharacteristicValue>{
        // Try to get the value
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Power);
        const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.values[0].deviceValues[0].key);

        // If the value is not defined then show 'Not Responding'
        if(isNullOrUndefined(value)){
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }

        this.log.debug(`${this.device.name}: Received ${value} from Hubspace Power`);

        // Otherwise return the value
        return value!;
    }

    private async setOn(i: number, value: CharacteristicValue): Promise<void>{
        this.log.debug(`${this.device.name}: Received ${value} from Homekit Power`);
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Power);
        await this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, value);

        /* update the other 'virtual' bulb */
        const service_idx = i === 1 ? 0 : 1;
        if (this.services[service_idx]) {
            this.services[service_idx].updateCharacteristic(this.platform.Characteristic.On, value);
        }
    }

    private async getBrightness(i: number): Promise<CharacteristicValue>{
        // Try to get the value
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Brightness);
        const value = await this.deviceService.getValueAsInteger(this.device.deviceId, func.values[0].deviceValues[0].key);
        this.throwErrorIfNullOrUndefinedInt(value, 'Received Comm Failure for get Brightness');

        this.log.debug(`${this.device.name}: Received ${value} from Hubspace Brightness`);

        // Otherwise return the value
        return value!;
    }

    private async setBrightness(i: number, value: CharacteristicValue): Promise<void>{
        // Homekit can send a 0 value for brightness when sliding to off, which is not valid for Hubspace
        if (value === 0) {
            // TODO: should be call power off?
            this.log.debug(`${this.device.name}: Received 0 from Homekit Brightness, ignoring as 0 is not valid for Hubspace`);
        } else {
            this.log.debug(`${this.device.name}: Received ${value} from Homekit Brightness`);
            const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Brightness);
            await this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, value);

            /* update the other 'virtual' bulb */
            const service_idx = i === 1 ? 0 : 1;
            if (this.services[service_idx]) {
                this.services[service_idx].updateCharacteristic(this.platform.Characteristic.Brightness, value);
            }
        }
    }

    private async getTemperature(i: number): Promise<CharacteristicValue>{
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.ColorMode);
        const colorMode = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.values[0].deviceValues[0].key);
        this.throwErrorIfNullOrUndefined(colorMode, 'Received Comm Failure for get Temperature');

        // Lightbulb is currently in the Temperature Color Space
        if(colorMode === false) {
            // Try to get the value
            const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightTemperature);
            const kelvin = await this.deviceService.getValueAsInteger(this.device.deviceId, func.values[0].deviceValues[0].key);
            this.throwErrorIfNullOrUndefinedInt(kelvin, 'Received Comm Failure for get Temperature');

            const value = normalizeValue(kelvin as number, 6500, 2200, 140, 500, 1);
            this.log.debug(`${this.device.name}: Received ${kelvin} from Hubspace Color Temperature, sending ${value} to Homebridge`);

            // Otherwise return the value
            return value!;
        }
        // Lightbulb is currently in the RGB Color Space
        else {
            const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightColor);
            const rgb = await this.deviceService.getValue(this.device.deviceId, func.values[0].deviceValues[0].key);
            this.throwErrorIfNullOrUndefined(rgb, 'Received Comm Failure for get Temperature');

            const mired = clamp(rgbToMired(hexToRgb(rgb as string)), 140, 500);
            this.log.debug(
                `${this.device.name}: Received ${rgb} from Hubspace Color Temperature, sending ${Math.round(mired)} to Homebridge`);

            // Try to give it something reasonable to display
            return Math.round(mired);
        }
    }

    private async setTemperature(i: number, value: CharacteristicValue): Promise<void>{
        this.setColorMode(0);

        // HomeKit Sends values with a min of 140 and a max of 500 with a step of 1
        // and Hubbridge expects values of a different scale such as 2200K to 6500K
        // with a step of 100
        const kelvin = normalizeValue(value as number, 140, 500, 6500, 2200, 100);
        this.log.debug(`${this.device.name}: Received ${value} from Homekit Color Temperature, sending ${kelvin}K to Hubridge`);
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightTemperature);
        this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, kelvin);
    }

    /**
     * Hue and Saturation work odd in Homekit. As Hubspace works in RGB color space with one item, Hue and Saturation
     * can come over in any order from Homekit. So we need to keep track of who is sent first and update once the other
     * comes over.
     */
    private hue : CharacteristicValue = -1;
    private saturation : CharacteristicValue = -1;

    private async getHue(i: number): Promise<CharacteristicValue>{
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.ColorMode);
        const colorMode = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.values[0].deviceValues[0].key);
        this.throwErrorIfNullOrUndefined(colorMode, 'Received Comm Failure for get Hue');

        let r, g, b;
        // Lightbulb is currently in the RGB Color Space
        if(colorMode === true) {
            // Try to get the value
            const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightColor);
            const rgb = await this.deviceService.getValue(this.device.deviceId, func.values[0].deviceValues[0].key);
            this.throwErrorIfNullOrUndefinedInt(rgb, 'Received Comm Failure for get Hue');

            [r, g, b] = hexToRgb(rgb as string);
        }
        // Lightbulb is currently in the Temperature Color Space
        else {
            const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightTemperature);
            const kelvin = await this.deviceService.getValue(this.device.deviceId, func.values[0].deviceValues[0].key);
            this.throwErrorIfNullOrUndefinedInt(kelvin, 'Received Comm Failure for get Temperature');

            [r, g, b] = kelvinToRgb(kelvin as number);
        }


        const [h, s, v] = rgbToHsv(r, g, b);
        this.log.debug(`${this.device.name}: sending ${Math.round(h)} to Homebridge for Hue`);

        // Otherwise return the value
        return (Math.round(h) as CharacteristicValue)!;
    }

    private async setHue(i: number, value: CharacteristicValue): Promise<void>{
        this.setColorMode(1);

        // Both values are unknown, so set Hue and expect Saturation to send it over once that is received
        if (this.hue === -1 && this.saturation === -1) {
            this.hue = value;

            this.log.debug(
                `${this.device.name}: Received ${value} from Homekit Hue, waiting for Saturation`);

            return;
        }
        // Saturation has already been sent over, it's now Hue job to send over the RGB value with the saturation value
        else if (this.hue === -1 && this.saturation !== -1) {
            const [r, g, b] = hsvToRgb(value as number, this.saturation as number, 100);

            // Set Saturation back to unknown
            this.saturation = -1;

            const hexRgb = rgbToHex(r, g, b);

            this.log.debug(
                `${this.device.name}: Received ${value} from Homekit Hue, sending ${hexRgb} from to Hubspace Color RGB`);

            const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightColor);
            this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, hexRgb);
        } else {
            this.hue = value;
            this.log.warn(`${this.device.name}: Received another ${value} from Homekit Hue, but cannot send without a Saturation value`);
        }

    }

    private async getSaturation(i: number): Promise<CharacteristicValue>{
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.ColorMode);
        const colorMode = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.values[0].deviceValues[0].key);
        this.throwErrorIfNullOrUndefined(colorMode, 'Received Comm Failure for get Hue');

        let r, g, b;
        // Lightbulb is currently in the RGB Color Space
        if(colorMode === true) {
            // Try to get the value
            const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightColor);
            const rgb = await this.deviceService.getValue(this.device.deviceId, func.values[0].deviceValues[0].key);
            this.throwErrorIfNullOrUndefinedInt(rgb, 'Received Comm Failure for get Hue');

            [r, g, b] = hexToRgb(rgb as string);
        }
        // Lightbulb is currently in the Temperature Color Space
        else {
            const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightTemperature);
            const kelvin = await this.deviceService.getValue(this.device.deviceId, func.values[0].deviceValues[0].key);
            this.throwErrorIfNullOrUndefinedInt(kelvin, 'Received Comm Failure for get Temperature');

            [r, g, b] = kelvinToRgb(kelvin as number);
        }

        const [h, s, v] = rgbToHsv(r, g, b);
        this.log.debug(`${this.device.name}: sending ${Math.round(s)} to Homebridge for Saturation`);

        // Otherwise return the value
        return (Math.round(s) as CharacteristicValue)!;
    }

    private async setSaturation(i: number, value: CharacteristicValue): Promise<void>{
        this.setColorMode(1);

        // Both values are unknown, so set Saturation and expect Hue to send it over once that is received
        if (this.hue === -1 && this.saturation === -1) {
            this.saturation = value;

            this.log.debug(
                `${this.device.name}: Received ${value} from Homekit Saturation, waiting for Hue`);

            return;
        }
        // Saturation has already been sent over, it's now Hue job to send over the RGB value with the saturation value
        else if (this.hue !== -1 && this.saturation === -1) {
            const [r, g, b] = hsvToRgb(this.hue as number, value as number, 100);

            // Set hue back to unknown
            this.hue = -1;

            const hexRgb = rgbToHex(r, g, b);

            this.log.debug(
                `${this.device.name}: Received ${value} from Homekit Saturation, sending ${hexRgb} from to Hubspace Color RGB`);

            const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.LightColor);
            this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, hexRgb);
        } else {
            this.saturation = value;
            this.log.warn(`${this.device.name}: Received another ${value} from Homekit Saturation, but cannot send without a Hue value`);
        }
    }

    private setColorMode(value: number): void{
        // Color Mode is a boolean value used to switch between temperature and color modes, 1 is for Color RGB Mode and 0 is for
        // Color Temperature Mode. It is possible for a user to change it back in to Color Temperature Mode using the Hubspace app
        // but homekit should only be working in color RGB mode if the lightbulb supports color.
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.ColorMode);
        this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, value);
    }

    private throwErrorIfNullOrUndefined(value: any, message: string): void {
        // If the value is not defined then show 'Not Responding'
        if (isNullOrUndefined(value)) {
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }
    }

    private throwErrorIfNullOrUndefinedInt(value: any, message: string): void {
        // If the value is not defined then show 'Not Responding'
        if (isNullOrUndefined(value) || value === -1) {
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }
    }
}