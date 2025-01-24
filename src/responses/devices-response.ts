// src/responses/device-function-response.ts
import { DeviceFunctionResponse } from './device-functions';

export interface DeviceResponse {
  id: string;
  deviceId: string;
  children: DeviceResponse[];
  typeId: string;
  friendlyName: string;
  description: {
    device: {
      manufacturerName: string;
      model: string;
      deviceClass: string;
    };
    functions: DeviceFunctionResponse[];  // Now works correctly
  };
}
