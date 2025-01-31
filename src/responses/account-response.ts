public async loadAccount(): Promise<void> {
    try {
        // Make a GET request to the /users/me endpoint
        const response = await this._client.get<AccountResponse>('/users/me');

        // Extract the account ID from the response
        this._accountId = response.data.accountAccess[0].account.accountId;

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
