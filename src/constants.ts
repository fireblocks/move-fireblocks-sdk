export const derivationPath = {
  purpose: 44,
  coinType: 637,
  change: 0,
  addressIndex: 0,
};

export const moveDecimalPlaces = 8;

export const createMoveTransactionConstants = {
  function: "0x1::aptos_account::transfer",
};

export const createTokenTransactionConstants = {
  function: "0x1::primary_fungible_store::transfer",
  typeArguments: ["0x1::fungible_asset::Metadata"],
};

export const signingMessagePrefix = "APTOS::RawTransaction";

export const getTransactionConstants = {
  GET_ACCOUNT_TRANSACTIONS_QUERY: `
  query GetAccountTransactionsData($address: String, $limit: Int, $offset: Int) {
account_transactions(
  where: { account_address: { _eq: $address } }
  order_by: {transaction_version: desc}
  limit: $limit
  offset: $offset
) {
  transaction_version
  __typename
}
}
`,
  indexerURL: "https://indexer.mainnet.movementnetwork.xyz/v1/graphql",
  defaultLimit: 50,
  defaultOffset: 0,
};

export const MovementSDKConstants = {
  fullnodeUrl: "https://mainnet.movementnetwork.xyz/v1",
  indexerUrl: "https://indexer.mainnet.movementnetwork.xyz/v1/graphql",
  fullnodeUrlTestnet: "https://testnet.movementnetwork.xyz/v1",
  indexerUrlTestnet: "https://indexer.testnet.movementnetwork.xyz/v1/graphql",
};

export const BRIDGING_ADDRESS =
  "0x9fdeccebb619da64a0922cf32738611d101340934f5087ac39c884b4a5d6f1";
