/**
 * The MovementService class provides a high-level interface for interacting with the Aptos blockchain
 * using the Movement SDK. It supports building, serializing, signing, submitting, and tracking transactions,
 * as well as querying account balances, coin data, and transaction history.
 *
 * @remarks
 * This service abstracts the complexity of direct SDK usage and provides utility methods for common blockchain operations.
 */
import {
  AccountAuthenticator,
  Aptos,
  AptosConfig,
  CommittedTransactionResponse,
  GetAccountCoinsDataResponse,
  Network,
  PendingTransactionResponse,
  SimpleTransaction,
} from "@aptos-labs/ts-sdk";
import {
  BuildTransactionArguments,
  CreateTransactionArguments,
  GetAccountCoinsDatataArguments,
  GetAllBalancesResponse,
  GetBalanceArguments,
  GetMoveBalanceResponse,
  GetTransactionHistoryResponse,
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
import { AptosSDKConstants, getTransactionConstants } from "../constants";
import { formatErrorMessage } from "../utils/errorHandling";

const fullnodeURL =
  process.env.APTOS_FULLNODE_URL || AptosSDKConstants.fullnodeUrl;
const indexerURL =
  process.env.APTOS_INDEXER_URL || AptosSDKConstants.indexerUrl;

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

  /**
   *  Builds a transaction using the Movement SDK.
   *  This method prepares a transaction based on the provided params.
   * @param builtTransactionArguments - object containing the parameters to build the transaction e.g sender, data.
   * @returns A Promise that resolves to a SimpleTransaction object.
   * @throws Will throw an error if the transaction building fails.
   */
  public buildTransaction = async (
    builtTransactionArguments: BuildTransactionArguments
  ): Promise<SimpleTransaction> => {
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
        `Failed to build transaction: ${formatErrorMessage(error)}`
      );
    }
  };

  /**
   * Serializes a transaction into a byte array and prefixes
   * the transaction with the correct prefix before signing it.
   * @param transaction - The {@link SimpleTransaction} object to serialize.
   * @returns A Uint8Array representing the serialized transaction.
   * @throws Will throw an error if serialization fails.
   */
  public serializeTransaction = (
    transaction: SimpleTransaction
  ): Uint8Array<ArrayBufferLike> => {
    try {
      return serializeTransaction(transaction);
    } catch (error: any) {
      throw new Error(
        `Failed to serialize transaction: ${formatErrorMessage(error)}`
      );
    }
  };

  /**
   * Creates a sender authenticator using the provided public key and signature.
   * @param rawPubKey - The public key of the sender in hex format.
   * @param signatureBytes - The signature bytes to authenticate the sender.
   * @returns An AccountAuthenticator object for the sender.
   * @throws Will throw an error if the authenticator creation fails.
   */
  public createSenderAuthenticator = (
    rawPubKey: string,
    signatureBytes: Buffer | ArrayBuffer
  ): AccountAuthenticator => {
    try {
      return createSenderAuthenticator(rawPubKey, signatureBytes);
    } catch (error) {
      throw new Error(
        `Failed to create sender authenticator: ${formatErrorMessage(error)}`
      );
    }
  };

  /**
   * Submits a transaction to the Movement blockchain.
   * @param SubmitTransactionArgumets - An object containing the transaction and sender authenticator.
   * @returns A Promise that resolves to a {@link PendingTransactionResponse} object.
   * @throws Will throw an error if the transaction submission fails.
   */
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
        `Failed to submit transaction: ${formatErrorMessage(error)}`
      );
    }
  };

  /**
   * Waits for a transaction to be committed on the Movement blockchain.
   * @param waitForTransaction - An object containing the transaction hash and options.
   * @returns A Promise that resolves to a {@link CommittedTransactionResponse} object.
   * @throws Will throw an error if waiting for the transaction fails.
   */
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
        `Failed to wait for transaction: ${formatErrorMessage(error)}`
      );
    }
  };

  /**
   * Retrieves account coins data from the Movement blockchain.
   * @param getAccountCoinsDatataArguments - An object containing the account address and minimum ledger version.
   * @returns A Promise that resolves to a {@link GetAccountCoinsDataResponse} object.
   * @throws Will throw an error if fetching account coins data fails.
   */
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
      throw new Error(`Failed to get coins data: ${formatErrorMessage(error)}`);
    }
  };

  /**
   * Retrieves all balances for a given account address.
   * @param getBalanceArguments - An object containing the account address and minimum ledger version.
   * @returns A Promise that resolves to an array of {@link GetAllBalancesResponse} objects.
   * @throws Will throw an error if fetching balances fails.
   */
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
      throw new Error(`Failed to get balances: ${formatErrorMessage(error)}`);
    }
  };

  /**
   * Retrieves the MOVE coin balance for a given account address.
   * @param getBalanceArguments - An object containing the account address and minimum ledger version.
   * @returns A Promise that resolves to a {@link GetMoveBalanceResponse} object.
   * @throws Will throw an error if fetching MOVE balance fails.
   * For more details about all account coins, use the getAccountCoinsData funtion
   */
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
      throw new Error(`Failed to get balance: ${formatErrorMessage(error)}`);
    }
  };

  /**
   * Retrieves the transaction history for a given account address.
   * @param getTransactionHistoyArguments - An object containing the account address and options for pagination.
   * @returns A Promise that resolves to an array of {@link getTransactionHistoryResponse} objects.
   * @throws Will throw an error if fetching transaction history fails.
   */
  public getTransactionHistory = async (
    getTransactionHistoyArguments: GetTransactionHistoyArguments
  ): Promise<GetTransactionHistoryResponse[]> => {
    const { accountAddress, options } = getTransactionHistoyArguments;
    const address = accountAddress as string;
    const limit = options?.limit || getTransactionConstants.defaultLimit;
    const offset = options?.offset || getTransactionConstants.defaultOffset;
    try {
      const result = await fetch(getTransactionConstants.indexerURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: getTransactionConstants.GET_ACCOUNT_TRANSACTIONS_QUERY,
          variables: { address, limit, offset },
        }),
      });

      if (!result.ok) {
        throw new Error(
          `Network response was not ok: ${result.status} ${result.statusText}`
        );
      }

      let data;
      try {
        data = await result.json();
      } catch (jsonErr) {
        throw new Error("Failed to parse JSON response");
      }

      if (data.errors) {
        throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
      }

      if (
        !data?.data?.account_transactions ||
        !Array.isArray(data.data.account_transactions)
      ) {
        throw new Error("No account_transactions found in response");
      }

      const transactions: GetTransactionHistoryResponse[] = [];
      for (const tx of data.data.account_transactions) {
        const version = tx.transaction_version;
        try {
          const tx = await this.MovementSDK.getTransactionByVersion({
            ledgerVersion: version,
          });
          transactions.push({
            transaction_version: version,
            transaction_details: tx,
          });
        } catch (err: any) {
          console.error(`Error fetching transaction version ${version}:`, err);
          transactions.push({
            transaction_version: version,
            transaction_details: undefined,
            error:
              err.message ||
              "Failed to fetch transaction details for version " + version,
          });
        }
      }
      return transactions;
    } catch (error: any) {
      console.error("Error in fetchTransactions:", error);
      throw new Error(
        `Failed to get transaction history: ${formatErrorMessage(error)}`
      );
    }
  };

  /**
   * Creates a transaction on the Movement blockchain.
   * @param createTransactionArguments - An object containing the parameters to create the transaction.
   * creates MOVE or token transactions depending on the tokenTransfer boolean parameter.
   * @returns A Promise that resolves to a {@link CommittedTransactionResponse} object.
   * @throws Will throw an error if the transaction creation fails.
   */
  public createTransaction = async (
    createTransactionArguments: CreateTransactionArguments
  ): Promise<CommittedTransactionResponse> => {
    try {
      const response = await createTransaction(createTransactionArguments);
      return response;
    } catch (error: any) {
      throw new Error(
        `Failed to create transaction: ${formatErrorMessage(error)}`
      );
    }
  };
}
