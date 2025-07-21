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
  TokenTransactionArguments,
  TransactionType,
} from "../services/types";
import { checkSignature } from "./fireblocks.utils";
import { formatErrorMessage } from "./errorHandling";
import { g } from "@aptos-labs/ts-sdk/dist/common/accountAddress-AL8HRxQC";

export const deriveAptosAddress = (pubKeyHex: string): string => {
  const clean = pubKeyHex.startsWith("0x") ? pubKeyHex.slice(2) : pubKeyHex;
  const pubBytes = Buffer.from(clean, "hex");
  const withScheme = Buffer.concat([pubBytes, Buffer.from([0x00])]);
  const authHex = sha3_256(withScheme);
  return `0x${authHex}`;
};

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
      `Failed to serialize transaction: ${formatErrorMessage(error)}`
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
      `Failed to create sender authenticator: ${formatErrorMessage(error)}`
    );
  }
};

export const createTransaction = async (
  createTransactionArguments: CreateTransactionArguments,
  grossTransaction: boolean = false
): Promise<CommittedTransactionResponse> => {
  const {
    transactionType,
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
  } = createTransactionArguments;

  // Narrow type for tokenAsset if present
  const tokenTransfer = "tokenAsset" in createTransactionArguments;
  const tokenAsset = tokenTransfer
    ? (createTransactionArguments as TokenTransactionArguments).tokenAsset
    : undefined;
  if (!movementAddress) {
    throw new Error("Movement address is not set.");
  }
  const sender: AccountAddressInput = movementAddress;

  const data: InputEntryFunctionData = {
    function:
      transactionType === TransactionType.TOKEN
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
    let transaction = await movementService.buildTransaction(buildArgs);
    if (grossTransaction) {
      console.log(
        " ---- Gross transaction is enabled, adjusting amount to account for fees ----"
      );
      const publicKey = new Ed25519PublicKey(movementPublicKey);
      const response = await movementService.simulateTransaction(
        transaction,
        publicKey
      );
      const feesInOctas =
        Number(response.gas_used) * Number(response.gas_unit_price);
      const netAmount = amount - feesInOctas;
      data.functionArguments[data.functionArguments.length - 1] = netAmount; // Adjust the amount in function arguments array to account for fees
      console.log(
        `Adjusted amount for gross transaction: ${
          data.functionArguments[data.functionArguments.length - 1]
        } (original: ${amount}, fees: ${feesInOctas})`
      );
      transaction = await movementService.buildTransaction(buildArgs); // rebuild after adjusting amount
    }

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
      `Failed to create transaction: ${formatErrorMessage(error)}`
    );
  }
};
