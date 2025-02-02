import fs from 'fs';
import { HubspacePlatform } from '../platform';
import { Endpoints } from '../api/endpoints';
import { createHttpClientWithBearerInterceptor } from '../api/http-client-factory';
import { AxiosError, AxiosResponse } from 'axios';
import { DeviceStatusResponse } from '../responses/device-status-response';
import { CharacteristicValue } from 'homebridge';
import { convertNumberToHexReverse } from '../utils';
import { isAferoError } from '../responses/afero-error-response';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';

/**
 * Service for interacting with devices
 */
export class DeviceService {

    private readonly _httpClient = createHttpClientWithBearerInterceptor({
        baseURL: Endpoints.API_BASE_URL
    });

    constructor(private readonly _platform: HubspacePlatform) { }

    /**
     * Sets an attribute value for a device
     * @param deviceId ID of a device
     * @param deviceFunction Function to set value for
     * @param value Value to set to attribute
     */
    async setValue(deviceId: string, attributeId: string, value: CharacteristicValue): Promise<void> {
        let response: AxiosResponse;

        try {
            response = await this._httpClient.post(`accounts/${this._platform.accountService.accountId}/devices/${deviceId}/actions`, {
                type: 'attribute_write',
                attrId: attributeId,
                data: this.getDataValue(value)
            });
        } catch (ex) {
            this.handleError(<AxiosError>ex);
            return;
        }

        if (response.status === 200) return;

        this._platform.log.error(`Remote server did not accept new value ${value} for device (ID: ${deviceId}).`);
    }

    /**
     * Gets a value for attribute
     * @param deviceId ID of a device
     * @param deviceFunction Function to get value for
     * @returns Data value
     */
    async getValue(deviceId: string, attributeId: string): Promise<CharacteristicValue | undefined> {
        let deviceStatus: DeviceStatusResponse;

        try {
            const response = await this._httpClient
                .get<DeviceStatusResponse>(`accounts/${this._platform.accountService.accountId}/devices/${deviceId}?expansions=attributes,state`);
            deviceStatus = response.data;

            // Save the JSON response for debugging
            this.saveJsonResponse(deviceStatus, `device-status-${deviceId}.json`);

        } catch (ex) {
            this.handleError(<AxiosError>ex);
            return undefined;
        }

        /* device is offline */
        if (!deviceStatus.deviceState.available) {
            return undefined;
        }

        const attributeResponse = deviceStatus.attributes.find(a => a.id.toString() === attributeId);

        if (!attributeResponse) {
            this._platform.log.error(`Failed to find value for ${attributeId} for device (device ID: ${deviceId})`);
            return undefined;
        }

        return attributeResponse.value;
    }

    /**
     * Gets a value for attribute as boolean
     * @param deviceId ID of a device
     * @param deviceFunction Function to get value for
     * @returns Boolean value
     */
    async getValueAsBoolean(deviceId: string, attributeId: string): Promise<boolean | undefined> {
        const value = await this.getValue(deviceId, attributeId);

        if (!value) return undefined;

        return value === '1';
    }

    /**
     * Gets a value for attribute as integer
     * @param deviceId ID of a device
     * @param deviceFunction Function to get value for
     * @returns Integer value
     */
    async getValueAsInteger(deviceId: string, attributeId: string): Promise<number | undefined> {
        const value = await this.getValue(deviceId, attributeId);

        if (!value || typeof value !== 'string') return undefined;

        const numberValue = Number.parseInt(value);

        return Number.isNaN(numberValue) ? undefined : numberValue;
    }

    private getDataValue(value: CharacteristicValue): string {

        if (typeof value === 'string') {
            return value;
        }

        if (typeof value === 'boolean') {
            return value ? '01' : '00';
        }

        if (typeof value === 'number') {
            return convertNumberToHexReverse(value);
        }

        throw new Error('The value type is not supported.');
    }

    private handleError(error: AxiosError): void {
        const responseData = error.response?.data;
        const errorMessage = isAferoError(responseData) ? responseData.error_description : error.message;

        this._platform.log.error('The remote service returned an error.', errorMessage);
    }

    // Function to save JSON response
    private saveJsonResponse(data: any, filename: string) {
        fs.writeFile(filename, JSON.stringify(data, null, 2), (err) => {
            if (err) {
                this._platform.log.error('Error writing file:', err);
            } else {
                this._platform.log.info('JSON response saved to', filename);
            }
        });
    }
}
