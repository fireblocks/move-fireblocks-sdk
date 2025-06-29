/**
 * Service class for interacting with the Fireblocks SDK.
 *
 * Provides methods to initialize the Fireblocks SDK, retrieve public keys and Movement addresses
 * by vault ID, and sign transactions using Fireblocks.
 *
 * Handles configuration via environment variables or explicit configuration objects.
 */
import {
  BasePath,
  Fireblocks,
  SignedMessageSignature,
} from "@fireblocks/ts-sdk";
import { config } from "../config";
import fs, { readFileSync } from "fs";
import {
  getPublicKeyForDerivationPath,
  rawSign,
} from "../utils/fireblocks.utils";
import { deriveAptosAddress } from "../utils/movement.utils";
import { FireblocksConfig } from "./types";

const secretKeyPath = process.env.FIREBLOCKS_SECRET_KEY_PATH || "";
const basePath = process.env.FIREBLOCKS_BASE_PATH || BasePath.US;

if (!secretKeyPath) {
  throw new Error(
    "FIREBLOCKS_SECRET_KEY_PATH environment variable is not set."
  );
}

export class FireblocksService {
  private readonly fireblocksSDK: Fireblocks;

  constructor(fireblocksConfig?: FireblocksConfig) {
    var privateKey: string;
    if (fireblocksConfig && fireblocksConfig.apiSecret) {
      privateKey =
        fireblocksConfig.apiSecret.endsWith(".pem") ||
        fireblocksConfig.apiSecret.endsWith(".key")
          ? readFileSync(fireblocksConfig.apiSecret, "utf8")
          : fireblocksConfig.apiSecret;
    } else {
      privateKey = fs.readFileSync(secretKeyPath, "utf8");
    }
    this.fireblocksSDK = new Fireblocks({
      apiKey: fireblocksConfig
        ? fireblocksConfig.apiKey
        : config.fireblocks.API_KEY,
      secretKey: privateKey,
      basePath:
        fireblocksConfig && fireblocksConfig.basePath
          ? fireblocksConfig.basePath
          : basePath,
    });
  }

  /**
   * @returns The initialized Fireblocks SDK instance of this Service class.
   */
  public getFireblocksSDK = (): Fireblocks => {
    return this.fireblocksSDK;
  };

  /**
   * Retrieves the Movement address associated with a given Fireblocks vault ID.
   *
   * This method converts the provided `vaultID` to a non-negative integer, validates it,
   * and then derives the corresponding public key using the Fireblocks SDK. It then
   * generates the Aptos movement address from the public key and validates its format.
   *
   * @param vaultID - The Fireblocks vault ID as a string or number. Must be a valid non-negative integer.
   * @returns A promise that resolves to the derived Aptos movement address as a string (66-character hex string starting with "0x").
   * @throws {Error} If the vault ID is invalid, the public key format is incorrect, the derived address format is incorrect, or if any error occurs during the process.
   */
  public getMovementAddressByVaultID = async (
    vaultID: string | number
  ): Promise<string> => {
    const id = typeof vaultID === "string" ? Number(vaultID) : vaultID;
    if (!Number.isInteger(id) || id < 0) {
      throw new Error("vaultID must be a valid non-negative integer.");
    }

    try {
      const publicKey = await getPublicKeyForDerivationPath(
        this.fireblocksSDK,
        vaultID.toString()
      );
      if (typeof publicKey !== "string" || publicKey.length !== 64) {
        throw new Error(
          `Invalid public key format: ${publicKey}. Expected a 64-character hex string.`
        );
      }
      const movementAddress = deriveAptosAddress(publicKey);
      if (
        typeof movementAddress !== "string" ||
        !movementAddress.startsWith("0x") ||
        movementAddress.length !== 66
      ) {
        throw new Error(
          `Invalid movement address format: ${movementAddress}. Expected a string starting with 0x and 64 hex characters.`
        );
      }

      return movementAddress;
    } catch (error: any) {
      throw new Error(
        `Error getting movement address by vault ID: ${error.message}`
      );
    }
  };

  /**
   * Retrieves the public key associated with a given Fireblocks vault ID.
   *
   * This method converts the provided `vaultID` to a non-negative integer, validates it,
   * and then retrieves the corresponding public key using the Fireblocks SDK.
   *
   * @param vaultID - The Fireblocks vault ID as a string or number. Must be a valid non-negative integer.
   * @returns A promise that resolves to the public key as a string.
   * @throws {Error} If the vault ID is invalid or if any error occurs during the process.
   */
  public getPublicKeyByVaultID = async (
    vaultID: string | number
  ): Promise<string> => {
    const id = typeof vaultID === "string" ? Number(vaultID) : vaultID;
    if (!Number.isInteger(id) || id < 0) {
      throw new Error("vaultID must be a valid non-negative integer.");
    }

    try {
      const publicKey = await getPublicKeyForDerivationPath(
        this.fireblocksSDK,
        vaultID.toString()
      );

      return publicKey;
    } catch (error: any) {
      throw new Error(
        `Error getting movement address by vault ID: ${error.message}`
      );
    }
  };

  /**
   * Signs a transaction using the Fireblocks SDK.
   *
   * This method takes a message object and a vault ID, and uses the Fireblocks SDK to raw sign the message.
   * It returns a promise that resolves to a SignedMessageSignature object containing the full signature.
   *
   * @param message - The message object to be signed.
   * @param vaultID - The Fireblocks vault ID as a string or number. Must be a valid non-negative integer.
   * @returns A promise that resolves to a SignedMessageSignature object containing the full signature.
   * @throws {Error} If the signing process fails or if no signature is returned.
   */
  public rawSignTransaction = async (
    message: any,
    vaultID: string | number
  ): Promise<SignedMessageSignature | undefined> => {
    try {
      const signature = await rawSign(
        message,
        Number(vaultID),
        this.fireblocksSDK
      );
      if (!signature?.fullSig) {
        throw new Error("No signature returned from rawSign()");
      }
      return signature;
    } catch (error: any) {
      throw new Error(
        `Error signing transaction: ${error.message || error.toString()}`
      );
    }
  };
}
