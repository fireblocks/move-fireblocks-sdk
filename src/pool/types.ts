import { BasePath } from "@fireblocks/ts-sdk";
import { MovementFireblocksSDK } from "../MovementFireblocksSDK";

export interface PoolConfig {
  maxPoolSize: number;
  idleTimeoutMs: number;
  cleanupIntervalMs: number;
}

export interface SdkPoolItem {
  sdk: MovementFireblocksSDK;
  lastUsed: Date;
  isInUse: boolean;
}

export interface ApiServiceConfig {
  apiKey: string;
  apiSecret: string;
  basePath: BasePath | string;
  poolConfig?: Partial<PoolConfig>;
}

export enum ActionType {
  CREATE_MOVE_TRANSACTION = "createMoveTransaction",
  CREATE_TOKEN_TRANSACTION = "createTokenTransaction",
  GET_BALANCE = "getBalance",
  GET_BALANCES = "getBalances",
  GET_TRANSACTIONS_HISTORY = "getTransactionsHistory",
  GET_ACCOUNT_COINS_DATA = "getAccountCoinsData",
  GET_ACCOUNT_ADDRESS = "getMovementAccountAddress",
  GET_ACCOUNT_PUBLIC_KEY = "getMovementAccountPublicKey",
}

export interface SdkManagerMetrics {
  totalInstances: number;
  activeInstances: number;
  idleInstances: number;
  instancesByVaultAccount: Record<string, boolean>;
}
