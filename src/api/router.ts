import { Router, Request, Response, NextFunction } from "express";
import * as controller from "./controller";

// Middleware to validate vaultAccountId parameter
function validateVaultId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { vaultId } = req.params;
  if (!vaultId) {
    res
      .status(400)
      .json({ error: "vaultAccountId (vaultId) parameter is required" });
    return;
  }
  next();
}

const router = Router();

// Use JSON body parser in your app setup (e.g., app.use(express.json()))

// Account endpoints
router.get("/:vaultId/address", validateVaultId, controller.getAddress);
router.get("/:vaultId/publicKey", validateVaultId, controller.getPublicKey);

// Balance endpoints
router.get("/:vaultId/balance", validateVaultId, controller.getBalance);
router.get("/:vaultId/balances", validateVaultId, controller.getBalances);
router.get("/:vaultId/coins_data", validateVaultId, controller.getCoinsData);

// Transaction history
router.get(
  "/:vaultId/transactions",
  validateVaultId,
  controller.getTransactionsHistory
);

// Create transactions
router.post(
  "/:vaultId/transfer/move",
  validateVaultId,
  controller.createMoveTransaction
);
router.post(
  "/:vaultId/transfer/token",
  validateVaultId,
  controller.createTokenTransaction
);

// Pool metrics
router.get("/metrics", controller.getPoolMetrics);

export default router;
