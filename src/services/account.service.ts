import { TokenService } from './token.service';
import { HttpClientFactory } from '../api/http-client-factory';
import { AxiosInstance } from 'axios';

port class AccountService {
  private _httpClient: AxiosInstance;
  private _tokenService: TokenService;

  constructor(baseURL: string, tokenService: TokenService) {
    this._httpClient = HttpClientFactory.createHttpClient(baseURL);
    this._tokenService = tokenService;
  }

  /**
   * Logs in a user and sets the authentication token.
   * @param username - The user's username.
   * @param password - The user's password.
   * @returns A promise that resolves when the login is complete.
   */
  public async login(username: string, password: string): Promise<void> {
    const response = await this._httpClient.post<{ token: string; expiresIn: number }>('/login', {
      username,
      password,
    });
    this._tokenService.setToken(response.data.token, response.data.expiresIn);
  }

  /**
   * Loads the user account and performs necessary setup.
   * @returns A promise that resolves when the account is loaded.
   */
  public async loadAccount(): Promise<void> {
    if (!this._tokenService.getToken()) {
      throw new Error('No authentication token available.');
    }
    try{
            const response = await this._client.get<AccountResponse>('/users/me');

            this._accountId = response.data.accountAccess[0].account.accountId;

            if(this._onAccountLoaded){
                this._onAccountLoaded();
            }
        }catch(ex){
            const axiosError = <AxiosError>ex;
            const friendlyMessage = axiosError.response?.status === 401 ? 'Incorrect username or password' : axiosError.message;

            this._log.error('Failed to load account information.', friendlyMessage);
        }
    }
}
