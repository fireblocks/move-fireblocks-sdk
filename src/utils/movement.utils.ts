import { sha3_256 } from "js-sha3";
import {
  createMoveTransactionConstants,
  createTokenTransactionConstants,
  signingMessagePrefix,
} from "../constants";
import {
  AccountAddressInput,
  AccountAuthenticator,
  AccountAuthenticatorEd25519,
  CommittedTransactionResponse,
  Ed25519PublicKey,
  Ed25519Signature,
  InputEntryFunctionData,
  InputGenerateTransactionOptions,
  SimpleTransaction,
} from "@aptos-labs/ts-sdk";
import {
  BuildTransactionArguments,
  CreateTransactionArguments,
  SubmitTransactionArguments,
  WaitForTransactionArguments,
} from "../services/types";
import { checkSignature } from "./fireblocks.utils";

export function deriveAptosAddress(pubKeyHex: string): string {
  const clean = pubKeyHex.startsWith("0x") ? pubKeyHex.slice(2) : pubKeyHex;
  const pubBytes = Buffer.from(clean, "hex");
  const withScheme = Buffer.concat([pubBytes, Buffer.from([0x00])]);
  const authHex = sha3_256(withScheme);
  return `0x${authHex}`;
}

export const serializeTransaction = (
  transaction: SimpleTransaction
): Uint8Array => {
  try {
    const bcsBytes = transaction.rawTransaction.bcsToBytes();
    const prefix = new Uint8Array(
      Buffer.from(sha3_256(signingMessagePrefix), "hex")
    );
    const signingMessage = new Uint8Array(prefix.length + bcsBytes.length);
    signingMessage.set(prefix, 0);
    signingMessage.set(bcsBytes, prefix.length);
    return signingMessage;
  } catch (error: any) {
    throw new Error(
      `Failed to serialize transaction: ${
        error?.message || error?.toString() || "Unknown error"
      }`
    );
  }
};

export const createSenderAuthenticator = (
  rawPubKey: string,
  signatureBytes: Buffer | ArrayBuffer
): AccountAuthenticator => {
  try {
    const publicKey = new Ed25519PublicKey(rawPubKey);
    const sigBuffer =
      signatureBytes instanceof Buffer
        ? signatureBytes
        : Buffer.from(signatureBytes as ArrayBuffer);
    const signatureString = sigBuffer.toString("hex");
    const sig = new Ed25519Signature(signatureString);
    const senderAuthenticator = new AccountAuthenticatorEd25519(publicKey, sig);
    return senderAuthenticator;
  } catch (error: any) {
    throw new Error(
      `Failed to create sender authenticator: ${
        error?.message || error?.toString() || "Unknown error"
      }`
    );
  }
};

export const createTransaction = async (
  createTransactionArguments: CreateTransactionArguments
): Promise<CommittedTransactionResponse> => {
  const {
    movementAddress,
    recipientAddress,
    amount,
    maxGasAmount,
    gasUnitPrice,
    expireTimestamp,
    accountSequenceNumber,
    movementService,
    fireblocksService,
    vaultAccountId,
    movementPublicKey,
    tokenTransfer,
    tokenAsset,
  } = createTransactionArguments;
  if (!movementAddress) {
    throw new Error("Movement address is not set.");
  }
  const sender: AccountAddressInput = movementAddress;
  const data: InputEntryFunctionData = {
    function: tokenTransfer
      ? (createTokenTransactionConstants.function as `${string}::${string}::${string}`)
      : (createMoveTransactionConstants.function as `${string}::${string}::${string}`),
    typeArguments: tokenTransfer
      ? createTokenTransactionConstants.typeArguments
      : [],
    functionArguments: tokenTransfer
      ? [tokenAsset, recipientAddress, amount]
      : [recipientAddress, amount],
  };
  let options: InputGenerateTransactionOptions | undefined;
  options = {
    ...(maxGasAmount !== undefined && { maxGasAmount }),
    ...(gasUnitPrice !== undefined && { gasUnitPrice }),
    ...(expireTimestamp !== undefined && { expireTimestamp }),
    ...(accountSequenceNumber !== undefined && { accountSequenceNumber }),
  };
  if (Object.keys(options).length === 0) options = undefined;
  const buildArgs: BuildTransactionArguments = {
    sender,
    data,
    options,
  };
  try {
    const transaction = await movementService.buildTransaction(buildArgs);
    const signingMessage = movementService.serializeTransaction(transaction);
    const rawSignature = await fireblocksService.rawSignTransaction(
      signingMessage,
      vaultAccountId
    );
    const signatureBytes = checkSignature(rawSignature);
    if (!movementPublicKey) {
      throw new Error(
        "Movement public key is not set and is needed to create sender authenticator"
      );
    }
    const senderAuthenticator = movementService.createSenderAuthenticator(
      movementPublicKey,
      signatureBytes
    );
    const submitArgs: SubmitTransactionArguments = {
      transaction,
      senderAuthenticator,
    };
    const submittedTx = await movementService.submitTransaction(submitArgs);
    const waitArgs: WaitForTransactionArguments = {
      transactionHash: submittedTx.hash,
    };
    const response = movementService.waitForTransaction(waitArgs);
    console.log(response);
    return response;
  } catch (error: any) {
    throw new Error(
      `Failed to create move transaction: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
