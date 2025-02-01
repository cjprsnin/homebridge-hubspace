export class TokenService {
  private static _instance: TokenService;
  private token: string | null = null;

  private constructor() {}

  /**
   * Initializes the TokenService by logging in the user and setting the token.
   * @param username - The user's username.
   * @param password - The user's password.
   */
  public static init(username: string, password: string): void {
    if (!TokenService._instance) {
      TokenService._instance = new TokenService();
    }
    // Perform login and set the token
    // This could be done using the AccountService or directly via an API call
  }

  public static get instance(): TokenService {
    if (!TokenService._instance) {
      throw new Error('TokenService has not been initialized.');
    }
    return TokenService._instance;
  }

  public setToken(token: string, expiresIn?: number): void {
    this.token = token;
    if (expiresIn) {
      this.tokenExpiration = Date.now() + expiresIn * 1000; // Convert to milliseconds
    } else {
      this.tokenExpiration = null;
    }
  }

  public getToken(): string | null {
    if (this.tokenExpiration && Date.now() >= this.tokenExpiration) {
      this.clearToken(); // Token has expired
    }
    return this.token;
  }

  public clearToken(): void {
    this.token = null;
    this.tokenExpiration = null;
  }

  public isTokenValid(): boolean {
    return !!this.token && (!this.tokenExpiration || Date.now() < this.tokenExpiration);
  }
}
