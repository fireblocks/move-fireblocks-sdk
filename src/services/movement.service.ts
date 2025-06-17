import {
  AccountAuthenticator,
  Aptos,
  AptosConfig,
  CommittedTransactionResponse,
  GetAccountCoinsDataResponse,
  GetEventsResponse,
  Network,
  PendingTransactionResponse,
  SimpleTransaction,
  TransactionResponse,
} from "@aptos-labs/ts-sdk";
import {
  BuildTransactionArguments,
  CreateTransactionArguments,
  GetAccountCoinsDatataArguments,
  GetAllBalancesResponse,
  GetBalanceArguments,
  GetMoveBalanceResponse,
  GetTransactionHistoyArguments,
  MovementConfig,
  SubmitTransactionArguments,
  WaitForTransactionArguments,
} from "./types";
import {
  createSenderAuthenticator,
  createTransaction,
  serializeTransaction,
} from "../utils/movement.utils";

const fullnodeURL = process.env.APTOS_FULLNODE_URL || "";
const indexerURL = process.env.APTOS_INDEXER_URL || "";

if (!indexerURL || !fullnodeURL) {
  throw new Error(
    "Aptos configuration is not set. Please check APTOS_FULLNODE_URL and APTOS_NETWORK environment variables."
  );
}

export class MovementService {
  private readonly MovementSDK: Aptos;
  private readonly MovementConfig: AptosConfig;

  constructor(movementConfig?: MovementConfig) {
    this.MovementConfig = new AptosConfig({
      network: Network.CUSTOM,
      fullnode: movementConfig ? movementConfig.fullnodeUrl : fullnodeURL,
      indexer: movementConfig ? movementConfig.indexerUrl : indexerURL,
    });
    this.MovementSDK = new Aptos(this.MovementConfig);
  }

  public async buildTransaction(
    builtTransactionArguments: BuildTransactionArguments
  ): Promise<SimpleTransaction> {
    try {
      const { sender, data, options, withFeePayer } = builtTransactionArguments;

      const transaction = await this.MovementSDK.transaction.build.simple({
        sender,
        data,
        options,
        withFeePayer,
      });

      return transaction;
    } catch (error: any) {
      throw new Error(
        `Failed to build transaction: ${
          error?.message || error?.toString() || "Unknown error"
        }`
      );
    }
  }

  public serializeTransaction = (
    transaction: SimpleTransaction
  ): Uint8Array<ArrayBufferLike> => {
    try {
      return serializeTransaction(transaction);
    } catch (error: any) {
      throw new Error(
        `Failed to serialize transaction: ${
          error?.message || error?.toString() || "Unknown error"
        }`
      );
    }
  };

  public createSenderAuthenticator = (
    rawPubKey: string,
    signatureBytes: Buffer | ArrayBuffer
  ): AccountAuthenticator => {
    try {
      return createSenderAuthenticator(rawPubKey, signatureBytes);
    } catch (error) {
      throw new Error(
        `Failed to create sender authenticator: ${
          (error as Error)?.message || error?.toString() || "Unknown error"
        }`
      );
    }
  };

  public submitTransaction = async (
    SubmitTransactionArgumets: SubmitTransactionArguments
  ): Promise<PendingTransactionResponse> => {
    const { transaction, senderAuthenticator, feePayerAuthenticator } =
      SubmitTransactionArgumets;

    try {
      const response = await this.MovementSDK.transaction.submit.simple({
        transaction,
        senderAuthenticator,
        feePayerAuthenticator,
      });
      console.log("Submitted transaction hash:", response.hash);
      return response;
    } catch (error: any) {
      throw new Error(
        `Failed to submit transaction: ${
          error?.message || error?.toString() || "Unknown error"
        }`
      );
    }
  };

  public waitForTransaction = async (
    waitForTransaction: WaitForTransactionArguments
  ): Promise<CommittedTransactionResponse> => {
    const { transactionHash, options } = waitForTransaction;

    try {
      const response = await this.MovementSDK.waitForTransaction({
        transactionHash,
        options,
      });

      return response;
    } catch (error: any) {
      throw new Error(
        `Failed to wait for transaction: ${
          error?.message || error?.toString() || "Unknown error"
        }`
      );
    }
  };

  public getAccountCoinsData = async (
    getAccountCoinsDatataArguments: GetAccountCoinsDatataArguments
  ): Promise<GetAccountCoinsDataResponse> => {
    const { accountAddress, minimumLedgerVersion } =
      getAccountCoinsDatataArguments;

    try {
      const response = await this.MovementSDK.getAccountCoinsData({
        accountAddress,
        minimumLedgerVersion,
      });

      return response;
    } catch (error: any) {
      throw new Error(
        `Failed to get coins data: ${
          error?.message || error?.toString() || "Unknown error"
        }`
      );
    }
  };

  public getBalances = async (
    getBalanceArguments: GetBalanceArguments
  ): Promise<GetAllBalancesResponse[]> => {
    const { accountAddress, minimumLedgerVersion } = getBalanceArguments;

    try {
      const response = await this.MovementSDK.getAccountCoinsData({
        accountAddress,
        minimumLedgerVersion,
      });

      const coins: GetAllBalancesResponse[] = response.map((coin) => {
        const amount_in_octas = Number(coin.amount);
        const decimals = Number(coin.metadata?.decimals);
        const amount = amount_in_octas / 10 ** decimals;

        return {
          amount_in_octas,
          decimals,
          amount,
          is_frozen: coin.is_frozen,
          asset_type: coin.asset_type ?? "",
          name: coin.metadata?.name || "",
          symbol: coin.metadata?.symbol || "",
        };
      });

      return coins;
    } catch (error: any) {
      throw new Error(
        `Failed to get balances: ${
          error?.message || error?.toString() || "Unknown error"
        }`
      );
    }
  };

  // For more details about all account coins, use the getAccountCoinsData funtion
  public getMoveBalance = async (
    getBalanceArguments: GetBalanceArguments
  ): Promise<GetMoveBalanceResponse> => {
    const { accountAddress, minimumLedgerVersion } = getBalanceArguments;

    try {
      const response = await this.MovementSDK.getAccountCoinsData({
        accountAddress,
        minimumLedgerVersion,
      });

      const moveCoins = response
        .filter((coin) => coin.metadata?.symbol === "MOVE")
        .map((coin) => {
          const amount_in_octas = Number(coin.amount);
          const decimals = Number(coin.metadata?.decimals || 0);
          const amount = amount_in_octas / 10 ** decimals;

          return {
            amount_in_octas,
            decimals,
            amount,
            is_frozen: coin.is_frozen,
            asset_type: coin.asset_type ?? "",
            name: coin.metadata?.name || "",
          };
        });

      const total_in_octas = moveCoins.reduce(
        (sum, coin) => sum + coin.amount_in_octas,
        0
      );

      const total = moveCoins.reduce((sum, coin) => sum + coin.amount, 0);

      return {
        moveCoins,
        total_in_octas,
        total,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to get balance: ${
          error?.message || error?.toString() || "Unknown error"
        }`
      );
    }
  };

  public getTransactionHistory = async (
    getTransactionHistoyArguments: GetTransactionHistoyArguments
  ): Promise<TransactionResponse[]> => {
    try {
      const { accountAddress, options } = getTransactionHistoyArguments;
      const limit = options?.limit || 50;
      let offset: number = Number(options?.offset ?? 0);

      const sentTxs: TransactionResponse[] = [];
      while (true) {
        const page = await this.MovementSDK.getAccountTransactions({
          accountAddress,
          options: { offset, limit },
        });
        if (page.length === 0) break;
        sentTxs.push(...page);
        offset += page.length;
      }

      offset = 0;
      const depositEvents: GetEventsResponse = [];
      while (true) {
        const page = await this.MovementSDK.getAccountEventsByEventType({
          accountAddress,
          eventType: "0x1::coin::DepositEvent",
          options: { offset, limit },
        });
        if (page.length === 0) break;
        depositEvents.push(...page);
        offset += page.length;
      }

      const incomingTxs: TransactionResponse[] = [];
      for (const e of depositEvents) {
        const tx = await this.MovementSDK.getTransactionByVersion({
          ledgerVersion: e.transaction_version,
        });
        incomingTxs.push(tx);
      }

      return [...sentTxs, ...incomingTxs];
    } catch (error: any) {
      throw new Error(
        `Failed to get transaction history: ${
          error?.message || error?.toString() || "Unknown error"
        }`
      );
    }
  };

  public createTransaction = async (
    createTransactionArguments: CreateTransactionArguments
  ): Promise<CommittedTransactionResponse> => {
    try {
      const response = await createTransaction(createTransactionArguments);
      return response;
    } catch (error: any) {
      throw new Error(
        `Failed to create transaction: ${
          error?.message || error?.toString() || "Unknown error"
        }`
      );
    }
  };
}
