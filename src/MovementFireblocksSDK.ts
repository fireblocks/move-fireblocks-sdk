import {
  AnyNumber,
  CommittedTransactionResponse,
  GetAccountCoinsDataResponse,
  PaginationArgs,
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
  GetTransactionHistoyArguments,
} from "./services/types";

export type MovementFireblocksSDKResponse =
  | string
  | GetMoveBalanceResponse
  | GetAllBalancesResponse[]
  | TransactionResponse[]
  | GetAccountCoinsDataResponse
  | CommittedTransactionResponse;

export class MovementFireblocksSDK {
  private fireblocksService: FireblocksService;
  private movementService: MovementService;
  private vaultAccountId: string | number;
  private movementAddress: string | undefined;
  private movementPublicKey: string | undefined;

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

  public static async create(
    vaultAccountId: string | number,
    fireblocksConfig?: FireblocksConfig
  ): Promise<MovementFireblocksSDK> {
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
  }

  public getMovementAccountPublicKey = async (): Promise<string> => {
    return this.movementPublicKey || "";
  };

  public getMovementAccountAddress = async (): Promise<string> => {
    return this.movementAddress || "";
  };

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

  public getTransactionsHistory = async (
    limit: number = 10,
    offset: number = 0
  ): Promise<TransactionResponse[]> => {
    if (!this.movementAddress) {
      throw new Error("Movement address is not set.");
    }
    /** Pagination optiosn can be set as follows:
     * options: {
     *   limit: 10, // Number of transactions to return
     *   offset: 0, // Offset for pagination
     *   }
     */
    const args: GetTransactionHistoyArguments = {
      accountAddress: this.movementAddress,
      options: {
        limit, // Default limit
        offset, // Default offset
      },
    };
    return await this.movementService.getTransactionHistory(args);
  };

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
