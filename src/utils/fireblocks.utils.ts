import { readFileSync } from "fs";
import {
  Fireblocks,
  BasePath,
  TransactionOperation,
  TransferPeerPathType,
  TransactionRequest,
  TransactionResponse,
  FireblocksResponse,
  TransactionStateEnum,
  CreateTransactionResponse,
  SignedMessageSignature,
  VaultsApiGetPublicKeyInfoRequest,
  SignedMessageAlgorithmEnum,
} from "@fireblocks/ts-sdk";
import { createHash } from "crypto";

const FIREBLOCKS_API_SECRET_PATH =
  "/Users/saleemaraidy/work/rsa/fireblocks_secret.key";
const API_KEY = "79169abd-695f-40e8-8762-47bfb6072b63";

// Initialize a Fireblocks API instance with local variables
const fireblocks = new Fireblocks({
  apiKey: API_KEY,
  basePath: BasePath.US, // Basepath.Sandbox for the sandbox env
  secretKey: readFileSync(FIREBLOCKS_API_SECRET_PATH, "utf8"),
});

export const getPublicKeyForDerivationPath = async (
  fireblocksSDK: Fireblocks,
  vaultAccountId: string
): Promise<string> => {
  const requestParams: VaultsApiGetPublicKeyInfoRequest = {
    derivationPath: `[44, 637, ${vaultAccountId}, 0, 0]`,
    algorithm: "MPC_EDDSA_ED25519",
  };
  try {
    const response = await fireblocksSDK.vaults.getPublicKeyInfo(requestParams);
    const publicKey = response.data.publicKey;
    if (!publicKey) {
      throw new Error("Public key not found for the given vault account ID.");
    }
    return publicKey;
  } catch (error: any) {
    throw new Error(`Error fetching public key: ${error.message}`);
  }
};

const transactionPayload2: TransactionRequest = {
  assetId: "BTC",
  operation: TransactionOperation.Raw,
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "229",
  },
  note: ``,
  extraParameters: {
    rawMessageData: {},
  },
};

const transactionPayload: TransactionRequest = {
  note: "raw signing test",
  source: {
    type: TransferPeerPathType.VaultAccount,
  },
  operation: TransactionOperation.Raw,
  extraParameters: {
    rawMessageData: {
      messages: [{}],
      algorithm: "MPC_EDDSA_ED25519",
    },
  },
};

let txInfo: any;

const getTxStatus = async (txId: string): Promise<TransactionResponse> => {
  try {
    let response: FireblocksResponse<TransactionResponse> =
      await fireblocks.transactions.getTransaction({ txId });
    let tx: TransactionResponse = response.data;
    let messageToConsole: string = `Transaction ${tx.id} is currently at status - ${tx.status}`;

    // console.log(messageToConsole);
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
          // console.log(messageToConsole);
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
  vaultAccountId: number
): Promise<SignedMessageSignature | undefined> => {
  const hexContent = Buffer.from(content).toString("hex");
  // const hexContent = content.replace(/^0x/, "");

  (transactionPayload.extraParameters as any).rawMessageData = {
    messages: [
      {
        content: hexContent,
        derivationPath: [44, 637, vaultAccountId, 0, 0],
      },
    ],
    algorithm: SignedMessageAlgorithmEnum.EddsaEd25519,
  };
  transactionPayload.note = `Aptos Transaction: ${hexContent}`;
  // console.log(
  //   "⚠️ ⚠️ ⚠️ ⚠️ Transaction Payload:",
  //   JSON.stringify(transactionPayload, null, 2)
  // );
  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      }
    );

    // console.log(transactionPayload.extraParameters.rawMessageData);
    const txId = transactionResponse.data.id;
    if (!txId) {
      throw new Error("Transaction ID is undefined.");
    }
    txInfo = await getTxStatus(txId);
    // console.log(JSON.stringify(txInfo, null, 2));
    const signature = txInfo.signedMessages[0].signature;

    // console.log("Signature: ", JSON.stringify(signature));

    const encodedSig =
      Buffer.from([Number.parseInt(signature.v, 16) + 31]).toString("hex") +
      signature.fullSig;
    // console.log(
    //   "Encoded Signature:",
    //   Buffer.from(encodedSig, "hex").toString("base64")
    // );
    return signature;
  } catch (error) {
    console.error(error);
  }
};

//rawSign("My message23");
