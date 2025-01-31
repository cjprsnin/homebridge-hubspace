import { AxiosError } from 'axios';
import { Endpoints } from '../api/endpoints';
import { AccountResponse } from '../responses/account-response';
import { Logger } from 'homebridge';
import { createHttpClientWithBearerInterceptor } from '../api/http-client-factory';
import { TokenService } from './token-service';

/**
 * Service for managing account details
 */
export class AccountService {
  private readonly _httpClient = createHttpClientWithBearerInterceptor({
    baseURL: Endpoints.API_BASE_URL,
  });

  private _onAccountLoaded?: () => void | Promise<void>;
  private _accountId = '';

  constructor(private readonly _log: Logger) {}

  /**
   * Gets the account ID
   */
  public get accountId(): string {
    return this._accountId;
  }

  /**
   * Sets a callback to be invoked when the account is loaded
   * @param callback Callback function
   */
  public onAccountLoaded(callback: () => Promise<void>) {
    this._onAccountLoaded = callback;
  }

  /**
   * Loads current user account
   * @returns True if load succeeded otherwise false
   */
  public async loadAccount(): Promise<void> {
    try {
      // Ensure a valid token is available
      const token = await TokenService.instance.getToken();
      if (!token) {
        throw new Error('Failed to retrieve access token.');
      }

      const response = await this._httpClient.get<AccountResponse>('/users/me');

      // Check if account access is available
      if (response.data.accountAccess.length === 0) {
        this._log.error('No account access found.');
        throw new Error('No account access found.');
      }

      // Extract the account ID
      this._accountId = response.data.accountAccess[0].account.accountId;
      this._log.debug('Account ID loaded:', this._accountId);

      // Invoke the callback if set
      if (this._onAccountLoaded) {
        await this._onAccountLoaded();
      }
    } catch (ex) {
      const axiosError = <AxiosError>ex;
      const friendlyMessage =
        axiosError.response?.status === 401 ? 'Incorrect username or password' : axiosError.message;

      this._log.error('Failed to load account information.', friendlyMessage);
      throw axiosError;
    }
  }
}
