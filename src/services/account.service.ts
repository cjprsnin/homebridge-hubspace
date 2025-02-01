import { TokenService } from './token-service';
import { HttpClientFactory } from '../api/http-client-factory';
import { AxiosInstance } from 'axios';

export class AccountService {
  private _httpClient: AxiosInstance;
  private _tokenService: TokenService;

  /**
   * Creates a new AccountService instance.
   * @param baseURL - The base URL for the API.
   * @param tokenService - An instance of TokenService.
   */
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
    const response = await this._httpClient.post<{ token: string }>('/login', {
      username,
      password,
    });
    this._tokenService.setToken(response.data.token);
  }
}
