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
/**
 * @openapi
 * /{vaultId}/address:
 *   get:
 *     summary: Get on-chain account address
 *     description: Retrieves the Aptos/Movement account address for the given vault ID.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: Address fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 address:
 *                   type: string
 *                   example: '0x1a2b3c4d'
 *       400:
 *         description: vaultId missing
 *       500:
 *         description: Internal server error
 */
router.get("/:vaultId/address", validateVaultId, controller.getAddress);

/**
 * @openapi
 * /{vaultId}/publicKey:
 *   get:
 *     summary: Get account public key
 *     description: Retrieves the public key for the given vault ID.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: Public key fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 publicKey:
 *                   type: string
 *                   example: '0xabcdef12345'
 *       400:
 *         description: vaultId missing
 *       500:
 *         description: Internal server error
 */
router.get("/:vaultId/publicKey", validateVaultId, controller.getPublicKey);

// Balance endpoints

/**
 * @openapi
 * /{vaultId}/balance:
 *   get:
 *     summary: Get base asset balance
 *     description: Retrieves the balance of the native coin for the address of the vault ID.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: Balance fetched successfully
 *       400:
 *         description: vaultId missing
 *       500:
 *         description: Internal server error
 */
router.get("/:vaultId/balance", validateVaultId, controller.getBalance);

/**
 * @openapi
 * /{vaultId}/balances:
 *   get:
 *     summary: Get all balances
 *     description: Retrieves balances of all assets for the the address of the vault ID.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: Balances fetched successfully
 *       400:
 *         description: vaultId missing
 *       500:
 *         description: Internal server error
 */
router.get("/:vaultId/balances", validateVaultId, controller.getBalances);

/**
 * @openapi
 * /{vaultId}/coins_data:
 *   get:
 *     summary: Get coins data
 *     description: Retrieves detailed coin data (decimals, frozen status, etc.) for the vault.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     responses:
 *       200:
 *         description: Coins data fetched successfully
 *       400:
 *         description: vaultId missing
 *       500:
 *         description: Internal server error
 */
router.get("/:vaultId/coins_data", validateVaultId, controller.getCoinsData);

// Transaction history
/**
 * @openapi
 * /{vaultId}/transactions:
 *   get:
 *     summary: Get transaction history
 *     description: Retrieves historical transactions for the vault, supporting pagination and cache control.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of transactions to return.
 *       - in: query
 *         name: offset
 *         required: false
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of transactions to skip.
 *       - in: query
 *         name: getCachedTransactions
 *         required: false
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to return cached transactions.
 *     responses:
 *       '200':
 *         description: Transaction history fetched successfully
 *       '400':
 *         description: vaultId missing or invalid parameters
 *       '500':
 *         description: Internal server error
 */
router.get(
  "/:vaultId/transactions",
  validateVaultId,
  controller.getTransactionsHistory
);

// Create transactions
/**
 * @openapi
 * /{vaultId}/transfer/move:
 *   post:
 *     summary: Create native coin transfer
 *     description: Initiates transfer of native Aptos coin from vault to recipient.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientAddress, amount]
 *             properties:
 *               recipientAddress:
 *                 type: string
 *                 example: '0xabc123'
 *               amount:
 *                 type: number
 *                 example: 1.5
 *               maxGasAmount:
 *                 type: number
 *                 example: 1000
 *               gasUnitPrice:
 *                 type: number
 *                 example: 1
 *               expireTimestamp:
 *                 type: number
 *                 example: 1625097600
 *               accountSequenceNumber:
 *                 type: number
 *                 example: 42
 *     responses:
 *       200:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:vaultId/transfer/move",
  validateVaultId,
  controller.createMoveTransaction
);

/**
 * @openapi
 * /{vaultId}/transfer/token:
 *   post:
 *     summary: Create token transfer
 *     description: Initiates transfer of a token asset from vault to recipient.
 *     parameters:
 *       - $ref: '#/components/parameters/vaultId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientAddress, amount, tokenType]
 *             properties:
 *               recipientAddress:
 *                 type: string
 *                 example: '0xdef456'
 *               amount:
 *                 type: number
 *                 example: 10
 *               tokenType:
 *                 type: string
 *                 example: '0x1::aptos_coin::AptosCoin'
 *               maxGasAmount:
 *                 type: number
 *                 example: 1000
 *               gasUnitPrice:
 *                 type: number
 *                 example: 1
 *               expireTimestamp:
 *                 type: number
 *                 example: 1625097600
 *               accountSequenceNumber:
 *                 type: number
 *                 example: 42
 *     responses:
 *       200:
 *         description: Token transaction created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:vaultId/transfer/token",
  validateVaultId,
  controller.createTokenTransaction
);

// Pool metrics
/**
 * @openapi
 * /metrics:
 *   get:
 *     summary: Get SDK pool metrics
 *     description: Retrieves metrics for the Fireblocks SDK connection pool.
 *     responses:
 *       200:
 *         description: Metrics fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get("/metrics", controller.getPoolMetrics);

export default router;
