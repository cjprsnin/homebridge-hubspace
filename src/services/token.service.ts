import axios from 'axios';
import { TokenResponse } from '../responses/token-response';
import { Endpoints } from '../api/endpoints';

/**
 * Service for managing JWT tokens
 */
export class TokenService {
  private static _instance: TokenService;

  private readonly _httpClient = axios.create({
    baseURL: Endpoints.ACCOUNT_BASE_URL,
  });

  private _accessToken?: string;
  private _accessTokenExpiration?: Date;
  private _refreshToken?: string;
  private _refreshTokenExpiration?: Date;

  /**
   * Creates a new instance of token service
   * @param _username Account username
   * @param _password Account password
   */
  private constructor(
    private readonly _username: string,
    private readonly _password: string
  ) {}

  /**
   * {@link TokenService} instance
   */
  public static get instance(): TokenService {
    if (!TokenService._instance) {
      throw new Error('TokenService has not been initialized. Call TokenService.init() first.');
    }
    return TokenService._instance;
  }

  /**
   * Initializes {@link TokenService}
   * @param username Account username
   * @param password Account password
   */
  public static init(username: string, password: string): void {
    if (!TokenService._instance) {
      TokenService._instance = new TokenService(username, password);
    }
  }

  /**
   * Gets the current access token
   * @returns Access token or undefined if not available
   */
  public async getToken(): Promise<string | undefined> {
    if (!this.hasValidToken()) {
      await this.authenticate();
    }
    return this._accessToken;
  }

  /**
   * Checks if a valid token is available
   * @returns True if a valid token is available, otherwise false
   */
  public hasValidToken(): boolean {
    return this._accessToken !== undefined && !this.isAccessTokenExpired();
  }

  /**
   * Authenticates the user and retrieves tokens
   * @returns True if authentication succeeded, otherwise false
   */
  private async authenticate(): Promise<boolean> {
    if (!this.isAccessTokenExpired() && !this.isRefreshTokenExpired()) return true;

    let tokenResponse: TokenResponse | undefined;
    const maxRetries = 3;

    for (let i = 0; i < maxRetries; i++) {
      tokenResponse = await this.getTokenFromRefreshToken() || await this.getTokenFromCredentials();
      if (tokenResponse) break;
    }

    if (!tokenResponse) {
      this.clearTokens();
      return false;
    }

    this.setTokens(tokenResponse);
    return true;
  }

  /**
   * Retrieves a new token using the refresh token
   * @returns Token response or undefined if the request fails
   */
  private async getTokenFromRefreshToken(): Promise<TokenResponse | undefined> {
    if (this.isRefreshTokenExpired()) return undefined;

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', 'hubspace_android');
    params.append('refresh_token', this._refreshToken!);

    try {
      const response = await this._httpClient.post('/protocol/openid-connect/token', params);
      return response.status === 200 ? response.data : undefined;
    } catch (exception) {
      console.error('Failed to refresh token:', exception);
      return undefined;
    }
  }

  /**
   * Retrieves a new token using credentials
   * @returns Token response or undefined if the request fails
   */
  private async getTokenFromCredentials(): Promise<TokenResponse | undefined> {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', 'hubspace_android');
    params.append('username', this._username);
    params.append('password', this._password);

    try {
      const response = await this._httpClient.post('/protocol/openid-connect/token', params);
      return response.status === 200 ? response.data : undefined;
    } catch (exception) {
      console.error('Failed to authenticate with credentials:', exception);
      return undefined;
    }
  }

  /**
   * Sets tokens to new values
   * @param response Response with tokens
   */
  private setTokens(response?: TokenResponse): void {
    if (!response || !response.access_token || !response.refresh_token || !response.expires_in || !response.refresh_expires_in) {
      this.clearTokens();
      return;
    }

    this._accessToken = response.access_token;
    this._refreshToken = response.refresh_token;

    const currentDate = new Date();
    this._accessTokenExpiration = new Date(currentDate.getTime() + response.expires_in * 1000);
    this._refreshTokenExpiration = new Date(currentDate.getTime() + response.refresh_expires_in * 1000);
  }

  /**
   * Clears stored tokens
   */
  private clearTokens(): void {
    this._accessToken = undefined;
    this._refreshToken = undefined;
    this._accessTokenExpiration = undefined;
    this._refreshTokenExpiration = undefined;
  }

  /**
   * Checks whether the access token is expired
   * @returns True if access token is expired, otherwise false
   */
  private isAccessTokenExpired(): boolean {
    if (!this._accessTokenExpiration) return true;
    const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    return this._accessTokenExpiration.getTime() - buffer < Date.now();
  }

  /**
   * Checks whether the refresh token is expired
   * @returns True if refresh token is expired, otherwise false
   */
  private isRefreshTokenExpired(): boolean {
    if (!this._refreshTokenExpiration) return true;
    const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    return this._refreshTokenExpiration.getTime() - buffer < Date.now();
  }
}
