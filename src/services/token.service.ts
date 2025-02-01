export class TokenService {
  private token: string | null = null;

  /**
   * Sets the authentication token.
   * @param token - The token to set.
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Gets the authentication token.
   * @returns The current token, or null if not set.
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Clears the authentication token.
   */
  clearToken(): void {
    this.token = null;
  }
}
