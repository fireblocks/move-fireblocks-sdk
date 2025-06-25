import dotenv from "dotenv";

export type TConfigFireblocks = { BASE_PATH: string; API_KEY: string };
export type TConfigAptos = { FULLNODE_URL: string; INDEXER: string };

dotenv.config();

export const config: {
  fireblocks: TConfigFireblocks;
  aptos: TConfigAptos;
  port: number;
} = {
  port: Number(process.env.PORT) || 3000,
  fireblocks: {
    BASE_PATH: process.env.FIREBLOCKS_BASE_PATH || "",
    API_KEY: process.env.FIREBLOCKS_API_KEY || "",
  },
  aptos: {
    FULLNODE_URL: process.env.APTOS_FULLNODE_URL || "",
    INDEXER: process.env.APTOS_INDEXER_URL || "",
  },
};
