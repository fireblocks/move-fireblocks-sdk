export const derivationPath = {
  purpose: 44,
  coinType: 637,
  change: 0,
  addressIndex: 0,
};

export const createMoveTransactionConstants = {
  function: "0x1::aptos_account::transfer",
};

export const createTokenTransactionConstants = {
  function: "0x1::primary_fungible_store::transfer",
  typeArguments: ["0x1::fungible_asset::Metadata"],
};

export const signingMessagePrefix = "APTOS::RawTransaction";
