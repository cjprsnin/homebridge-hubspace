export class TokenService {
  private static _instance: TokenService;
  private token: string | null = null;

  private constructor() {}

  public static init(username: string, password: string): void {
    // Initialize the token service
  }

  public static get instance(): TokenService {
    if (!TokenService._instance) {
      TokenService._instance = new TokenService();
    }
    return TokenService._instance;
  }

  public setToken(token: string): void {
    this.token = token;
  }

  public getToken(): string | null {
    return this.token;
  }

  public clearToken(): void {
    this.token = null;
  }
}
