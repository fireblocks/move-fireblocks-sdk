import { FireblocksService } from "./services/fireblocks.service";

export class MovementFireblocksSDK {
  private fireblocksService: FireblocksService;
  private vaultAccountId: string | number;

  private constructor(vaultAccountId: string | number) {
    this.fireblocksService = new FireblocksService();
    this.vaultAccountId = vaultAccountId;
  }

  public getMovementAccountPublicKey = async (): Promise<string> => {
    return "";
  };

  public getMovementAccountAddress = async (): Promise<string> => {
    return "";
  };

  public getBalance = async (): Promise<any> => {};

  public getTransactionsHistory = async (): Promise<any> => {};

  public getAccountCoinsData = async (): Promise<any> => {};

  public createMoveTransaction = async (): Promise<any> => {};

  public createTokenTransaction = async (): Promise<any> => {};
}
