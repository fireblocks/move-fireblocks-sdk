import { Request, Response, NextFunction } from "express";
import { MovementFireblocksApiService } from "./api.service";
import { ActionType, ApiServiceConfig } from "../pool/types";
import { BasePath } from "@fireblocks/ts-sdk";
import { getTransactionConstants } from "../constants";

// Configure the API Service once for all handlers
const apiConfig: ApiServiceConfig = {
  apiKey: process.env.FIREBLOCKS_API_KEY || "",
  apiSecret: process.env.FIREBLOCKS_SECRET_KEY_PATH || "",
  basePath: (process.env.FIREBLOCKS_BASE_PATH as BasePath) || BasePath.US,
  // Optional: customize pool size/timeouts here
  poolConfig: {},
};
const apiService = new MovementFireblocksApiService(apiConfig);

// Handler utilities
type Handler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// GET /:vaultId/address
export const getAddress: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;
    const address = await apiService.executeAction(
      vaultId,
      ActionType.GET_ACCOUNT_ADDRESS,
      {}
    );
    res.json({ address });
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/publicKey
export const getPublicKey: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;
    const pubKey = await apiService.executeAction(
      vaultId,
      ActionType.GET_ACCOUNT_PUBLIC_KEY,
      {}
    );
    res.json({ publicKey: pubKey });
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/balance
export const getBalance: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;
    const balance = await apiService.executeAction(
      vaultId,
      ActionType.GET_BALANCE,
      {}
    );
    res.json(balance);
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/balances
export const getBalances: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;
    const balances = await apiService.executeAction(
      vaultId,
      ActionType.GET_BALANCES,
      {}
    );
    res.json(balances);
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/coins_data
export const getCoinsData: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;
    const balances = await apiService.executeAction(
      vaultId,
      ActionType.GET_ACCOUNT_COINS_DATA,
      {}
    );
    res.json(balances);
  } catch (err) {
    next(err);
  }
};

// GET /:vaultId/transactions
export const getTransactionsHistory: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;
    const limit =
      parseInt(req.query.limit as string, 10) ||
      getTransactionConstants.defaultLimit;
    const offset =
      parseInt(req.query.offset as string, 10) ||
      getTransactionConstants.defaultOffset;
    const getCachedTransactions =
      req.query.getCachedTransactions === "false" ? false : true;
    const history = await apiService.executeAction(
      vaultId,
      ActionType.GET_TRANSACTIONS_HISTORY,
      { getCachedTransactions, limit, offset }
    );
    res.json(history);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/transfer/move
export const createMoveTransaction: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;
    const {
      recipientAddress,
      amount,
      maxGasAmount,
      gasUnitPrice,
      expireTimestamp,
      accountSequenceNumber,
    } = req.body;
    if (!recipientAddress || !amount) {
      res.status(400).json({
        error: "Bad Request : recipientAddress and amount are required",
      });
      return;
    }
    const tx = await apiService.executeAction(
      vaultId,
      ActionType.CREATE_MOVE_TRANSACTION,
      {
        recipientAddress,
        amount,
        maxGasAmount,
        gasUnitPrice,
        expireTimestamp,
        accountSequenceNumber,
      }
    );
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// POST /:vaultId/transfer/token
export const createTokenTransaction: Handler = async (req, res, next) => {
  try {
    const { vaultId } = req.params;
    const {
      recipientAddress,
      amount,
      tokenType,
      maxGasAmount,
      gasUnitPrice,
      expireTimestamp,
      accountSequenceNumber,
    } = req.body;
    if (!recipientAddress || !amount || !tokenType) {
      res.status(400).json({
        error:
          "Bad Request : recipientAddress, amount & tokenType are required",
      });
      return;
    }
    const tx = await apiService.executeAction(
      vaultId,
      ActionType.CREATE_TOKEN_TRANSACTION,
      {
        recipientAddress,
        amount,
        tokenType,
        maxGasAmount,
        gasUnitPrice,
        expireTimestamp,
        accountSequenceNumber,
      }
    );
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// GET /metrics
export const getPoolMetrics: Handler = async (req, res, next) => {
  try {
    const metrics = apiService.getPoolMetrics();
    res.json(metrics);
  } catch (err) {
    next(err);
  }
};
