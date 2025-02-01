export interface DeviceValues {
  type: string;
  key: string;
  values: DeviceFunctionValues[];
}

export interface ValuesRange {
  min: number;
  max: number;
  step: number;
}

export interface DeviceFunctionValues {
  name: string;
  deviceValues: DeviceValues[];
  range: ValuesRange;
}

export interface DeviceFunctionResponse {
  functionClass: string;
  functionInstance: string;
  values: DeviceFunctionValues[];
  outletIndex?: number;
}
