/**
 * HTTP response with account details
 */
export interface AccountResponse {
  accountAccess: {
    account: {
      accountId: string;
    };
  }[];
}
