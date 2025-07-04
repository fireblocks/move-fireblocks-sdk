import {
  AccountAddressInput,
  AccountAuthenticator,
  AnyNumber,
  AnyRawTransaction,
  HexInput,
  InputGenerateTransactionOptions,
  InputGenerateTransactionPayloadData,
  PaginationArgs,
  TransactionResponse,
  WaitForTransactionOptions,
} from "@aptos-labs/ts-sdk";
import { MovementService } from "./movement.service";
import { FireblocksService } from "./fireblocks.service";
import { BasePath } from "@fireblocks/ts-sdk";

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

export type AccountInfoBase = {
  accountAddress: AccountAddressInput;
  minimumLedgerVersion?: AnyNumber;
};

export type GetAccountCoinsDataArguments = AccountInfoBase;

export type GetBalanceArguments = AccountInfoBase;

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

export type MoveTransactionArguments = {
  transactionType: TransactionType.MOVE;
  movementAddress: string;
  movementPublicKey: string;
  movementService: MovementService;
  fireblocksService: FireblocksService;
  vaultAccountId: string | number;
  recipientAddress: string;
  amount: number;
  maxGasAmount?: number;
  gasUnitPrice?: number;
  expireTimestamp?: number;
  accountSequenceNumber?: AnyNumber;
};

export type TokenTransactionArguments = {
  transactionType: TransactionType.TOKEN;
  tokenAsset: string;
  movementAddress: string;
  movementPublicKey: string;
  movementService: MovementService;
  fireblocksService: FireblocksService;
  vaultAccountId: string | number;
  recipientAddress: string;
  amount: number;
  maxGasAmount?: number;
  gasUnitPrice?: number;
  expireTimestamp?: number;
  accountSequenceNumber?: AnyNumber;
};

export type CreateTransactionArguments =
  | MoveTransactionArguments
  | TokenTransactionArguments;

export type FireblocksConfig = {
  apiKey: string;
  apiSecret: string; // can be path or inline string
  basePath?: BasePath;
};

export type MovementConfig = {
  fullnodeUrl: string;
  indexerUrl: string;
};

export type GetTransactionHistoryResponse = {
  transaction_version: number;
  transaction_details: TransactionResponse | undefined;
  error?: string;
};

export enum TransactionType {
  MOVE = "move",
  TOKEN = "token",
}
