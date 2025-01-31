/**
 * Class for constructing endpoints for HTTP client
 */
export class Endpoints {
  /**
   * Base URL for account/token management
   */
  public static readonly ACCOUNT_BASE_URL = 'https://accounts.hubspaceconnect.com/auth/realms/thd';

  /**
   * Base URL for API interaction
   */
  public static readonly API_BASE_URL = 'https://api2.afero.net/v1/';

  /**
   * Constructs the full URL for the `/devices` endpoint
   * @returns Full URL for the devices endpoint
   */
  public static getDevicesEndpoint(): string {
    return `${Endpoints.API_BASE_URL}devices`;
  }

  /**
   * Constructs the full URL for the `/users/me` endpoint
   * @returns Full URL for the user details endpoint
   */
  public static getUserDetailsEndpoint(): string {
    return `${Endpoints.API_BASE_URL}users/me`;
  }

  /**
   * Constructs the full URL for the token endpoint
   * @returns Full URL for the token endpoint
   */
  public static getTokenEndpoint(): string {
    return `${Endpoints.ACCOUNT_BASE_URL}/protocol/openid-connect/token`;
  }

  /**
   * Constructs the full URL for a device's actions endpoint
   * @param accountId Account ID
   * @param deviceId Device ID
   * @returns Full URL for the device actions endpoint
   */
  public static getDeviceActionsEndpoint(accountId: string, deviceId: string): string {
    return `${Endpoints.API_BASE_URL}accounts/${accountId}/devices/${deviceId}/actions`;
  }

  /**
   * Constructs the full URL for a device's status endpoint
   * @param accountId Account ID
   * @param deviceId Device ID
   * @returns Full URL for the device status endpoint
   */
  public static getDeviceStatusEndpoint(accountId: string, deviceId: string): string {
    return `${Endpoints.API_BASE_URL}accounts/${accountId}/devices/${deviceId}?expansions=attributes,state`;
  }
}
