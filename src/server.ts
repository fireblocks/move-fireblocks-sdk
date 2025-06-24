import express from "express";
import { MovementFireblocksApiService } from "./api/api.service";
import cors from "cors";
import { BasePath } from "@fireblocks/ts-sdk";
import dotenv from "dotenv";
import { ApiServiceConfig } from "./pool/types";
import router from "./api/router";
import { swaggerUi, specs } from "./utils/swagger";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.use(express.json());
app.use(cors());

// Swagger UI setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.get("/api-docs-json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

const movementFireblocksApiServiceConfig: ApiServiceConfig = {
  apiKey: process.env.FIREBLOCKS_API_KEY || "",
  apiSecret: process.env.FIREBLOCKS_SECRET_KEY_PATH || "",
  basePath: (process.env.FIREBLOCKS_BASE_PATH as BasePath) || BasePath.US,
  poolConfig: {
    maxPoolSize: parseInt(process.env.POOL_MAX_SIZE || "100"),
    idleTimeoutMs: parseInt(process.env.POOL_IDLE_TIMEOUT_MS || "1800000"),
    cleanupIntervalMs: parseInt(
      process.env.POOL_CLEANUP_INTERVAL_MS || "300000"
    ),
  },
};

// Validate required environment variables
if (movementFireblocksApiServiceConfig.apiKey === "") {
  console.error("FIREBLOCKS_API_KEY is not set in environment variables");
  throw new Error("InvalidEnvParams : FIREBLOCKS_API_KEY is required");
}
if (movementFireblocksApiServiceConfig.apiSecret === "") {
  console.error("FIREBLOCKS_API_SECRET is not set in environment variables");
  throw new Error("InvalidEnvParams : FIREBLOCKS_API_SECRET is required");
}

// Initialize API service
const movementFireblocksApiService = new MovementFireblocksApiService(
  movementFireblocksApiServiceConfig
);

// Apply routes
app.use("/api", router);

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Movement-Fireblocks SDK API server running on port ${PORT}`);
});
