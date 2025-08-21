import dotenv from "dotenv";
import { MovementSDKConstants } from "./constants";

export type TConfigFireblocks = { BASE_PATH: string; API_KEY: string };
export type TConfigMovement = { FULLNODE_URL: string; INDEXER: string };

dotenv.config();

export const config: {
  fireblocks: TConfigFireblocks;
  movement: TConfigMovement;
  port: number;
} = {
  port: Number(process.env.PORT) || 3000,
  fireblocks: {
    BASE_PATH: process.env.FIREBLOCKS_BASE_PATH || "",
    API_KEY: process.env.FIREBLOCKS_API_KEY || "",
  },
  movement: {
    FULLNODE_URL:
      process.env.MOVEMENT_FULLNODE_URL || MovementSDKConstants.fullnodeUrl,
    INDEXER:
      process.env.MOVEMENT_INDEXER_URL || MovementSDKConstants.indexerUrl,
  },
};
