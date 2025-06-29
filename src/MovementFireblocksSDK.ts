/**
 * MovementFireblocksSDK provides a unified interface for interacting with Movement through Fireblocks services.
 *
 * This SDK allows you to:
 * - Retrieve Movement account address and public key associated with a Fireblocks vault account.
 * - Query balances and transaction history for the Movement account.
 * - Create MOVE and token transactions using Fireblocks raw signing.
 *
 * Usage:
 * ```typescript
 * const sdk = await MovementFireblocksSDK.create(vaultAccountId, fireblocksConfig);
 * const balance = await sdk.getBalance();
 * ```
 *
 * @remarks
 * - Use the static `create` method to instantiate the SDK asynchronously.
 * - Ensure the Fireblocks vault account is properly configured and accessible.
 * - Ensure Fireblocks workspace configuration like API Key, API Secret and Base Path are set up correctly.
 * @public
 */
import {
  AnyNumber,
  CommittedTransactionResponse,
  GetAccountCoinsDataResponse,
  TransactionResponse,
} from "@aptos-labs/ts-sdk";
import { FireblocksService } from "./services/fireblocks.service";
import { MovementService } from "./services/movement.service";
import {
  CreateTransactionArguments,
  FireblocksConfig,
  GetAccountCoinsDatataArguments,
  GetAllBalancesResponse,
  GetBalanceArguments,
  GetMoveBalanceResponse,
  GetTransactionHistoryResponse,
  GetTransactionHistoyArguments,
} from "./services/types";
import { getTransactionConstants } from "./constants";

export type MovementFireblocksSDKResponse =
  | string
  | GetMoveBalanceResponse
  | GetAllBalancesResponse[]
  | TransactionResponse[]
  | GetAccountCoinsDataResponse
  | CommittedTransactionResponse
  | GetTransactionHistoryResponse[];

export class MovementFireblocksSDK {
  private fireblocksService: FireblocksService;
  private movementService: MovementService;
  private vaultAccountId: string | number;
  private movementAddress: string | undefined;
  private movementPublicKey: string | undefined;
  private chachedTransactions: GetTransactionHistoryResponse[] = [];

  private constructor(
    vaultAccountId: string | number,
    fireblocksConfig?: FireblocksConfig
  ) {
    try {
      this.fireblocksService = new FireblocksService(fireblocksConfig);
      this.movementService = new MovementService();
    } catch (error) {
      throw new Error(
        `Failed to initialize services: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
    this.vaultAccountId = vaultAccountId;
  }

  /**
   * Creates an instance of MovementFireblocksSDK.
   * @param vaultAccountId - The Fireblocks vault account ID.
   * @param fireblocksConfig - Optional Fireblocks configuration.
   * @returns A Promise that resolves to an instance of MovementFireblocksSDK.
   * @throws Will throw an error if the instance creation fails.
   */

  public static create = async (
    vaultAccountId: string | number,
    fireblocksConfig?: FireblocksConfig
  ): Promise<MovementFireblocksSDK> => {
    try {
      const instance = new MovementFireblocksSDK(
        vaultAccountId,
        fireblocksConfig
      );
      instance.movementAddress =
        await instance.fireblocksService.getMovementAddressByVaultID(
          vaultAccountId
        );
      instance.movementPublicKey =
        await instance.fireblocksService.getPublicKeyByVaultID(vaultAccountId);
      return instance;
    } catch (error) {
      throw new Error(
        `Failed to create MovementFireblocksSDK instance: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  /**
   * Retrieves the Movement account public key associated with the Fireblocks vault account.
   * @returns A Promise that resolves to the Movement account address.
   * @throws Will throw an error if the address is not set.
   */
  public getMovementAccountPublicKey = (): string => {
    return this.movementPublicKey || "";
  };

  /**
   * Retrieves the Movement account address associated with the Fireblocks vault account.
   * @returns A Promise that resolves to the Movement account address.
   * @throws Will throw an error if the address is not set.
   */
  public getMovementAccountAddress = (): string => {
    return this.movementAddress || "";
  };

  /**
   * Retrieves the MOVE balance for the current movement address.
   *
   * @returns A promise that resolves to a {GetMoveBalanceResponse} containing the MOVE balance information.
   * @throws {Error} If the movement address is not set or if the balance retrieval fails.
   */
  public getBalance = async (): Promise<GetMoveBalanceResponse> => {
    if (!this.movementAddress) {
      throw new Error("Movement address is not set.");
    }
    const args: GetBalanceArguments = {
      accountAddress: this.movementAddress,
    };
    try {
      return await this.movementService.getMoveBalance(args);
    } catch (error) {
      throw new Error(
        `Failed to get balance: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  /**
   * Retrieves all balances for the current movement address, including MOVE and other tokens.
   *
   * @returns A promise that resolves to an array of {GetAllBalancesResponse} containing all balances.
   * @throws {Error} If the movement address is not set or if the balance retrieval fails.
   */
  public getBalances = async (): Promise<GetAllBalancesResponse[]> => {
    if (!this.movementAddress) {
      throw new Error("Movement address is not set.");
    }
    const args: GetBalanceArguments = {
      accountAddress: this.movementAddress,
    };
    try {
      return await this.movementService.getBalances(args);
    } catch (error) {
      throw new Error(
        `Failed to get balances: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  /**
   * Retrieves the transaction history for the current movement address.
   *
   * @param limit - The maximum number of transactions to return (default is 10).
   * @param offset - The offset for pagination (default is 0).
   * @returns A promise that resolves to an array of {TransactionResponse} containing transaction history.
   * @throws {Error} If the movement address is not set or if the transaction history retrieval fails.
   */
  public getTransactionsHistory = async (
    getCachedTransactions: boolean = true, // Must be manually set to false to fetch fresh transactions
    limit: number = getTransactionConstants.defaultLimit,
    offset: number = getTransactionConstants.defaultOffset
  ): Promise<GetTransactionHistoryResponse[]> => {
    if (getCachedTransactions) {
      console.log("Using cached transactions");
      return this.chachedTransactions;
    }
    if (!this.movementAddress) {
      throw new Error("Movement address is not set.");
    }
    try {
      const args: GetTransactionHistoyArguments = {
        accountAddress: this.movementAddress,
        options: {
          limit,
          offset,
        },
      };
      const txs = await this.movementService.getTransactionHistory(args);
      this.chachedTransactions = txs.map((tx) => ({
        transaction_version: tx.transaction_version,
        transaction_details: tx.transaction_details,
        error: tx.error,
      }));
      return txs;
    } catch (error) {
      throw new Error(
        `Failed to get transaction history: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  /**
   * Retrieves the coins data for the current movement address.
   *
   * @returns A promise that resolves to a {GetAccountCoinsDataResponse} containing data about all coins owned by the account.
   * @throws {Error} If the movement address is not set or if the coins data retrieval fails.
   */
  public getAccountCoinsData =
    async (): Promise<GetAccountCoinsDataResponse> => {
      if (!this.movementAddress) {
        throw new Error("Movement address is not set.");
      }
      const args: GetAccountCoinsDatataArguments = {
        accountAddress: this.movementAddress,
      };
      return await this.movementService.getAccountCoinsData(args);
    };

  /**   * Creates a MOVE transaction to transfer funds to a recipient address.
   *   * @param recipientAddress - The address of the recipient.
   * @param amount - The amount to transfer in MOVE.
   * @param maxGasAmount - Optional maximum gas amount for the transaction.
   * @param gasUnitPrice - Optional gas unit price for the transaction.
   * @param expireTimestamp - Optional expiration timestamp for the transaction.
   * @param accountSequenceNumber - Optional sequence number for the account.
   * @returns A promise that resolves to a {CommittedTransactionResponse} containing the transaction details.
   * @throws {Error} If the movement address, public key, or vault ID are not set, or if the transaction creation fails.
   */

  public createMoveTransaction = async (
    recipientAddress: string,
    amount: number,
    maxGasAmount?: number,
    gasUnitPrice?: number,
    expireTimestamp?: number,
    accountSequenceNumber?: AnyNumber
  ): Promise<CommittedTransactionResponse> => {
    if (
      !this.movementAddress ||
      !this.movementPublicKey ||
      !this.vaultAccountId
    ) {
      throw new Error("Address, Public Key or Vault ID are not set");
    }
    const args: CreateTransactionArguments = {
      movementAddress: this.movementAddress,
      movementPublicKey: this.movementPublicKey,
      movementService: this.movementService,
      fireblocksService: this.fireblocksService,
      vaultAccountId: this.vaultAccountId,
      recipientAddress,
      amount,
      maxGasAmount,
      gasUnitPrice,
      expireTimestamp,
      accountSequenceNumber,
    };
    try {
      const response = await this.movementService.createTransaction(args);
      return response;
    } catch (error: any) {
      throw new Error(
        `Failed to create move transaction: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  /**
   * Creates a token transaction to transfer a specific token type to a recipient address.
   * @param recipientAddress - The address of the recipient.
   * @param amount - The amount of the token to transfer.
   * @param tokenType - The type of the token to transfer (e.g., "USDC", "BTC").
   * @param maxGasAmount - Optional maximum gas amount for the transaction.
   * @param gasUnitPrice - Optional gas unit price for the transaction.
   * @param expireTimestamp - Optional expiration timestamp for the transaction.
   * @param accountSequenceNumber - Optional sequence number for the account.
   * @returns A promise that resolves to a {CommittedTransactionResponse} containing the transaction details.
   * @throws {Error} If the movement address, public key, or vault ID are not set, or if the transaction creation fails.
   */

  public createTokenTransaction = async (
    recipientAddress: string,
    amount: number,
    tokenType: string,
    maxGasAmount?: number,
    gasUnitPrice?: number,
    expireTimestamp?: number,
    accountSequenceNumber?: AnyNumber
  ): Promise<CommittedTransactionResponse> => {
    if (
      !this.movementAddress ||
      !this.movementPublicKey ||
      !this.vaultAccountId
    ) {
      throw new Error("Address, Public Key or Vault ID are not set");
    }
    const args: CreateTransactionArguments = {
      movementAddress: this.movementAddress,
      movementPublicKey: this.movementPublicKey,
      movementService: this.movementService,
      fireblocksService: this.fireblocksService,
      vaultAccountId: this.vaultAccountId,
      recipientAddress,
      amount,
      maxGasAmount,
      gasUnitPrice,
      expireTimestamp,
      accountSequenceNumber,
      tokenTransfer: true,
      tokenAsset: tokenType,
    };
    try {
      const response = await this.movementService.createTransaction(args);
      return response;
    } catch (error) {
      throw new Error(
        `Failed to create move transaction: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };
}
