import {
  Fireblocks,
  TransactionOperation,
  TransferPeerPathType,
  TransactionRequest,
  TransactionResponse,
  FireblocksResponse,
  TransactionStateEnum,
  SignedMessageSignature,
  VaultsApiGetPublicKeyInfoRequest,
  SignedMessageAlgorithmEnum,
} from "@fireblocks/ts-sdk";
import { derivationPath } from "../constants";
import { formatErrorMessage } from "./errorHandling";
import * as fs from "fs";
import * as path from "path";

export const validateApiCredentials = (
  apiKey: string,
  secretKeyPath: string,
  vaultAccountId?: string | number
): void => {
  // Validate API key is a valid UUID (v4)
  const uuidV4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidV4Regex.test(apiKey)) {
    throw new Error("API key is not a valid UUID v4.");
  }

  // Validate secret key path is absolute and file exists
  if (!path.isAbsolute(secretKeyPath)) {
    throw new Error("Secret key path must be an absolute path.");
  }
  if (!fs.existsSync(secretKeyPath)) {
    throw new Error(`Secret key file does not exist at path: ${secretKeyPath}`);
  }

  // Validate vaultAccountId if provided
  if (vaultAccountId !== undefined) {
    if (
      typeof vaultAccountId !== "number" &&
      (typeof vaultAccountId !== "string" ||
        isNaN(Number(vaultAccountId)) ||
        vaultAccountId.trim() === "")
    ) {
      throw new Error(
        "vaultAccountId must be a number or a string representing a number."
      );
    }
  }
};

export const getPublicKeyForDerivationPath = async (
  fireblocksSDK: Fireblocks,
  vaultAccountId: string
): Promise<string> => {
  const requestParams: VaultsApiGetPublicKeyInfoRequest = {
    derivationPath: `[${derivationPath.purpose}, ${derivationPath.coinType}, ${vaultAccountId}, ${derivationPath.change}, ${derivationPath.addressIndex}]`,
    algorithm: SignedMessageAlgorithmEnum.EddsaEd25519,
  };
  try {
    const response = await fireblocksSDK.vaults.getPublicKeyInfo(requestParams);
    const publicKey = response.data.publicKey;
    if (!publicKey) {
      throw new Error("Public key not found for the given vault account ID.");
    }
    return publicKey;
  } catch (error: any) {
    throw new Error(`Error fetching public key: ${formatErrorMessage(error)}`);
  }
};

export const createTransactionPayload = (note?: string): TransactionRequest => {
  return {
    note: note || "Raw Sinign Transaction with Fireblocks",
    source: {
      type: TransferPeerPathType.VaultAccount,
    },
    operation: TransactionOperation.Raw,
    extraParameters: {
      rawMessageData: {
        messages: [{}],
        algorithm: SignedMessageAlgorithmEnum.EddsaEd25519,
      },
    },
  };
};

let txInfo: any;

const getTxStatus = async (
  txId: string,
  fireblocks: Fireblocks
): Promise<TransactionResponse> => {
  try {
    let response: FireblocksResponse<TransactionResponse> =
      await fireblocks.transactions.getTransaction({ txId });
    let tx: TransactionResponse = response.data;
    let messageToConsole: string = `Transaction ${tx.id} is currently at status - ${tx.status}`;

    console.log(messageToConsole);
    while (tx.status !== TransactionStateEnum.Completed) {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      response = await fireblocks.transactions.getTransaction({ txId });
      tx = response.data;

      switch (tx.status) {
        case TransactionStateEnum.Blocked:
        case TransactionStateEnum.Cancelled:
        case TransactionStateEnum.Failed:
        case TransactionStateEnum.Rejected:
          throw new Error(
            `Signing request failed/blocked/cancelled: Transaction: ${tx.id} status is ${tx.status}`
          );
        default:
          console.log(messageToConsole);
          break;
      }
    }
    while (tx.status !== TransactionStateEnum.Completed);
    return tx;
  } catch (error) {
    throw error;
  }
};

export const rawSign = async (
  content: any,
  vaultAccountId: number | string,
  fireblocks: Fireblocks,
  note?: string
): Promise<SignedMessageSignature | undefined> => {
  const hexContent = Buffer.from(content).toString("hex");
  const transactionPayload = createTransactionPayload(note);

  if (typeof vaultAccountId === "string") {
    vaultAccountId = Number(vaultAccountId);
    if (isNaN(vaultAccountId)) {
      throw new Error(
        "vaultAccountId string could not be converted to a number."
      );
    }
  }

  (transactionPayload.extraParameters as any).rawMessageData = {
    messages: [
      {
        content: hexContent,
        derivationPath: [
          derivationPath.purpose,
          derivationPath.coinType,
          vaultAccountId,
          derivationPath.change,
          derivationPath.addressIndex,
        ],
      },
    ],
    algorithm: SignedMessageAlgorithmEnum.EddsaEd25519,
  };

  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      }
    );

    const txId = transactionResponse.data.id;
    if (!txId) {
      throw new Error("Transaction ID is undefined.");
    }
    txInfo = await getTxStatus(txId, fireblocks);
    console.log(JSON.stringify(txInfo, null, 2));
    const signature = txInfo.signedMessages[0].signature;

    const encodedSig =
      Buffer.from([Number.parseInt(signature.v, 16) + 31]).toString("hex") +
      signature.fullSig;

    return signature;
  } catch (error) {
    console.error(error);
    throw new Error(`Error signing message: ${formatErrorMessage(error)}`);
  }
};

export const checkSignature = (
  rawSignature: SignedMessageSignature | undefined
): Buffer<ArrayBuffer> => {
  if (!rawSignature?.fullSig) {
    throw new Error("No signature returned from rawSign()");
  }

  const signatureBytes = Buffer.from(rawSignature.fullSig, "hex");

  if (signatureBytes.length !== 64) {
    throw new Error("Invalid signature length — must be 64 bytes for Ed25519.");
  }

  return signatureBytes;
};
