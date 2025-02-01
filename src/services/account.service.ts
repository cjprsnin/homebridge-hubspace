import { AxiosInstance, AxiosError } from 'axios';
import { TokenService } from './token.service';
import { HttpClientFactory } from '../api/http-client-factory';
import { Logger } from 'homebridge';

interface AccountResponse {
  accountAccess: {
    account: {
      accountId: string;
    };
  }[];
}

interface ErrorResponse {
  message: string;
}

export class AccountService {
  private _httpClient: AxiosInstance;
  private _tokenService: TokenService;
  private _accountId: string | null = null;
  private _onAccountLoaded: (() => void) | null = null;
  private _log: Logger;

  constructor(baseURL: string, tokenService: TokenService, log: Logger) {
    this._httpClient = HttpClientFactory.createHttpClient(baseURL);
    this._tokenService = tokenService;
    this._log = log;
  }

  public async loadAccount(): Promise<void> {
    try {
      const response = await this._httpClient.get<AccountResponse>('/users/me');
      this._accountId = response.data.accountAccess[0].account.accountId;

      if (this._onAccountLoaded) {
        this._onAccountLoaded();
      }
    } catch (ex) {
      const axiosError = ex as AxiosError;
      const friendlyMessage = (axiosError.response?.data as ErrorResponse)?.message || 'Unknown error';
      this._log.error('Failed to load account information.', friendlyMessage);
    }
  }

  public get accountId(): string | null {
    return this._accountId;
  }

  public set onAccountLoaded(callback: () => void) {
    this._onAccountLoaded = callback;
  }
}
