import { BasePath, TransactionResponse } from "@fireblocks/ts-sdk";
import { SdkManager } from "../pool/SdkManager";
import { ActionType, ApiServiceConfig } from "../pool/types";
import { MovementFireblocksSDKResponse } from "../MovementFireblocksSDK";

export class MovementFireblocksApiService {
  private sdkManager: SdkManager;

  constructor(config: ApiServiceConfig) {
    const baseConfig = {
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      basePath: (config.basePath as BasePath) || BasePath.US,
      vaultAccountId: "", // Will be overridden per request
    };

    this.sdkManager = new SdkManager(baseConfig, config.poolConfig);
  }

  /**
   * Execute an action using the appropriate SDK method
   */
  public async executeAction(
    vaultAccountId: string,
    actionType: ActionType,
    params: any
  ): Promise<MovementFireblocksSDKResponse | TransactionResponse> {
    let sdk;
    try {
      // Get SDK instance from the pool
      sdk = await this.sdkManager.getSdk(vaultAccountId);

      // Execute the appropriate transaction based on type
      let result;
      switch (actionType) {
        case ActionType.CREATE_MOVE_TRANSACTION:
          result = await sdk.createMoveTransaction(
            params.recipientAddress,
            params.amount,
            params.maxGasAmount,
            params.gasUnitPrice,
            params.expireTimestamp,
            params.accountSequenceNumber
          );
          break;
        case ActionType.CREATE_TOKEN_TRANSACTION:
          result = await sdk.createTokenTransaction(
            params.recipientAddress,
            params.amount,
            params.tokenType,
            params.maxGasAmount,
            params.gasUnitPrice,
            params.expireTimestamp,
            params.accountSequenceNumber
          );
          break;
        case ActionType.GET_BALANCE:
          result = await sdk.getBalance();
          break;
        case ActionType.GET_BALANCES:
          result = await sdk.getBalances();
          break;
        case ActionType.GET_TRANSACTIONS_HISTORY:
          result = await sdk.getTransactionsHistory();
          break;
        case ActionType.GET_ACCOUNT_COINS_DATA:
          result = await sdk.getAccountCoinsData();
          break;
        case ActionType.GET_ACCOUNT_ADDRESS:
          result = await sdk.getMovementAccountAddress();
          break;
        case ActionType.GET_ACCOUNT_PUBLIC_KEY:
          result = await sdk.getMovementAccountPublicKey();
          break;
        default:
          throw new Error(
            `InvalidType :
            Unknown transaction type: ${actionType}`
          );
      }

      return result;
    } catch (error) {
      console.error(
        `Error executing ${actionType} for vault ${vaultAccountId}:`,
        error
      );
      throw error;
    } finally {
      // Always release the SDK back to the pool
      if (sdk) {
        this.sdkManager.releaseSdk(vaultAccountId);
      }
    }
  }

  /**
   * Get metrics about the SDK pool
   */
  public getPoolMetrics() {
    return this.sdkManager.getMetrics();
  }

  /**
   * Shut down the API service and all SDK instances
   */
  public async shutdown(): Promise<void> {
    return this.sdkManager.shutdown();
  }
}
