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
  private _onAccountLoaded: (() => void) | null = null;

  constructor(
    private baseURL: string,
    private tokenService: TokenService,
    private log: Logger
  ) {}

  public onAccountLoaded(callback: () => void): void {
    this._onAccountLoaded = callback;
  }

  public async loadAccount(): Promise<void> {
    try {
      // Implement account loading logic
      this.log.info('Account loaded successfully.');

      // Trigger the callback if it exists
      if (this._onAccountLoaded) {
        this._onAccountLoaded();
      }
    } catch (ex) {
      this.log.error('Failed to load account:', ex);
    }
  }
}
