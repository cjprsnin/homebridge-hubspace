import { AxiosError } from 'axios';
import { Endpoints } from '../api/endpoints';
import { AccountResponse } from '../responses/account-response';
import { Logger } from 'homebridge';
import { createHttpClientWithBearerInterceptor } from '../api/http-client-factory';

/**
 * Service for managing account details
 */
export class AccountService {
    private readonly _client = createHttpClientWithBearerInterceptor({
        baseURL: Endpoints.API_BASE_URL,
    });

    private _onAccountLoaded?: () => void | Promise<void>;
    private _accountId = '';
    private _tokenExpiry: number | null = null; // Track token expiry time
    private _refreshToken: string | null = null; // Store refresh token

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
     * Checks if the token has expired
     * @returns True if the token has expired, false otherwise
     */
    public isTokenExpired(): boolean {
        if (!this._tokenExpiry) return false; // No expiry time set
        return Date.now() >= this._tokenExpiry; // Check if current time is past expiry
    }

    /**
     * Refreshes the access token
     */
    public async refreshToken(): Promise<void> {
        if (!this._refreshToken) {
            this._log.error('No refresh token available.');
            throw new Error('No refresh token available.');
        }

        try {
            this._log.debug('Refreshing access token...');

            // Make a request to refresh the token
            const response = await this._client.post('/auth/refresh', {
                refreshToken: this._refreshToken,
            });

            // Update the access token and expiry time
            this._client.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
            this._tokenExpiry = Date.now() + response.data.expiresIn * 1000; // Convert to milliseconds

            this._log.debug('Access token refreshed successfully.');
        } catch (ex) {
            const axiosError = <AxiosError>ex;
            this._log.error('Failed to refresh access token:', axiosError.message);
            throw axiosError;
        }
    }

    /**
     * Loads current user account
     * @returns True if load succeeded otherwise false
     */
    public async loadAccount(): Promise<void> {
        try {
            const response = await this._client.get<AccountResponse>('/users/me');

            this._accountId = response.data.accountAccess[0].account.accountId;

            // Set the refresh token and expiry time (if available in the response)
            if (response.data.refreshToken) {
                this._refreshToken = response.data.refreshToken;
            }
            if (response.data.expiresIn) {
                this._tokenExpiry = Date.now() + response.data.expiresIn * 1000; // Convert to milliseconds
            }

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
