import {
  BasePath,
  Fireblocks,
  SignedMessageSignature,
} from "@fireblocks/ts-sdk";
import { config } from "../config";
import fs from "fs";
import {
  getPublicKeyForDerivationPath,
  rawSign,
} from "../utils/fireblocks.utils";
import { deriveAptosAddress } from "../utils/movement.utils";

const secretKeyPath = process.env.FIREBLOCKS_SECRET_KEY_PATH || "";
const basePath = process.env.FIREBLOCKS_BASE_PATH || BasePath.US;

console.log(
  `Using Fireblocks base path: ${basePath} and secret key path: ${secretKeyPath}`
);

if (!secretKeyPath) {
  throw new Error(
    "FIREBLOCKS_SECRET_KEY_PATH environment variable is not set."
  );
}

export class FireblocksService {
  private readonly fireblocksSDK: Fireblocks;

  constructor() {
    const privateKey = fs.readFileSync(secretKeyPath, "utf8");
    this.fireblocksSDK = new Fireblocks({
      apiKey: config.fireblocks.API_KEY,
      secretKey: privateKey,
      basePath: basePath,
    });
  }

  public getFireblocksSDK(): Fireblocks {
    return this.fireblocksSDK;
  }

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
