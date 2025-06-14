import {
  AccountAddressInput,
  AccountAuthenticator,
  AnyNumber,
  AnyRawTransaction,
  GetAccountCoinsDataResponse,
  HexInput,
  InputGenerateTransactionOptions,
  InputGenerateTransactionPayloadData,
  OrderByArg,
  PaginationArgs,
  WaitForTransactionOptions,
  WhereArg,
} from "@aptos-labs/ts-sdk";

export type BuildTransactionArguments = {
  sender: AccountAddressInput;
  data: InputGenerateTransactionPayloadData;
  options?: InputGenerateTransactionOptions;
  withFeePayer?: boolean;
};

export type SubmitTransactionArguments = {
  transaction: AnyRawTransaction;
  senderAuthenticator: AccountAuthenticator;
  feePayerAuthenticator?: AccountAuthenticator;
};

export type WaitForTransactionArguments = {
  transactionHash: HexInput;
  options?: WaitForTransactionOptions;
};

export type GetAccountCoinsDatataArguments = {
  accountAddress: AccountAddressInput;
  minimumLedgerVersion?: AnyNumber;
};

export type GetBalanceArguments = {
  accountAddress: AccountAddressInput;
  minimumLedgerVersion?: AnyNumber;
};

export type GetMoveBalanceResponse = {
  moveCoins: {
    amount_in_octas: number;
    decimals: number;
    amount: number;
    is_frozen: boolean;
    asset_type: string;
    name: string;
  }[];
  total_in_octas: number;
  total: number;
};

export type GetTransactionHistoyArguments = {
  accountAddress: AccountAddressInput;
  options?: PaginationArgs;
};

export type GetAllBalancesResponse = {
  amount_in_octas: number;
  decimals: number;
  amount: number;
  is_frozen: boolean;
  asset_type: string;
  name: string;
  symbol: string;
};
