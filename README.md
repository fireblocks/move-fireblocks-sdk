# Movement Fireblocks SDK

A stateless SDK and REST API server for interacting with Fireblocks and the Movement Network, enabling secure operations on Movement using Fireblocks services.

The SDK Typedocs can be found here:
https://fireblocks.github.io/move-fireblocks-sdk/

---

## ⚡ Project Overview

**Movement Fireblocks SDK** lets you securely execute Movement (Aptos-based) transactions using Fireblocks vaults and raw signing.
It's designed to simplify integration with Fireblocks for secure Movement transactions, supporting both direct SDK use and a REST API interface.

### **Prerequisites**

- Fireblocks workspace with raw signing enabled.
- Fireblocks API key and secret key file.
- Node.js v18+
- Docker and Docker Compose (for API server).

---

## 🚀 Features

- **Secure Movement/Aptos Transactions**: All transactions are Fireblocks-signed and submitted to Movement.
- **Fireblocks raw signing support**
- **REST API mode**: Easily integrate through HTTP requests.
- **Vault pooling**: Efficient per-vault instance management.

---

## 📦 Installation

### **Local SDK Usage**

```bash
git clone https://github.com/fireblocks/move-fireblocks-sdk
cd movement-fireblocks-sdk
npm install
cp .env.example .env
```

Edit `.env` to include your API key, private key path, and Movement config.

To start the SDK in dev mode:

```bash
npm run dev
```

### **Run as REST API (Docker)**

```bash
cp .env.example .env  # or create your .env manually
# Make sure your Fireblocks secret key is in ./secrets/fireblocks_secret.key
docker-compose up --build #(Dev Mode)
docker-compose -f docker-compose.yml up --build #(Prod Mode)
```

> API will run on port `3000` by default. Change via `PORT` in `.env`.

---

## ⚙️ Configuration

Environment variables (via `.env`) control SDK behavior:

| Variable                   | Required | Default                                                | Description                             |
| -------------------------- | -------- | ------------------------------------------------------ | --------------------------------------- |
| FIREBLOCKS_API_KEY         | Yes      | –                                                      | Your Fireblocks API key                 |
| FIREBLOCKS_SECRET_KEY_PATH | Yes      | –                                                      | Path to your Fireblocks secret key file |
| FIREBLOCKS_BASE_PATH       | No       | BasePath.US from "@fireblocks/ts-sdk"                  | Base URL of the Fireblocks API          |
| APTOS_FULLNODE_URL         | No       | https://mainnet.movementnetwork.xyz/v1                 | Movement/Aptos fullnode endpoint        |
| APTOS_INDEXER_URL          | No       | https://indexer.mainnet.movementnetwork.xyz/v1/graphql | Movement indexer (GraphQL) URL          |
| PORT                       | No       | 3000                                                   | Port to run the REST API server         |

### Sample `.env`:

```dotenv
FIREBLOCKS_BASE_PATH=https://api.fireblocks.io/v1
FIREBLOCKS_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
FIREBLOCKS_SECRET_KEY_PATH=./secrets/fireblocks_secret.key

APTOS_FULLNODE_URL=https://mainnet.movementnetwork.xyz/v1
APTOS_INDEXER_URL=https://indexer.mainnet.movementnetwork.xyz/v1/graphql

PORT=3000
```

> 🔐 Never commit your `.env` file or secret key to source control.

---

## 🔑 Secret Key Setup (Docker)

1. Place your Fireblocks private key at:

```
./secrets/fireblocks_secret.key
```

2. Your `.env` should reference this file **relative to the project root**:

```dotenv
FIREBLOCKS_SECRET_KEY_PATH=./secrets/fireblocks_secret.key
```

3. Docker Compose mounts this file automatically:

```yaml
volumes:
  - ./secrets/fireblocks_secret.key:/app/secrets/fireblocks_secret.key:ro
```

---

### REST API Example (cURL)

```bash
curl -X 'GET' \
  'http://localhost:3000/api/<VAULT-ID>/address' \
  -H 'accept: application/json'
```

---

## 🔄 Development

### Run locally with hot reload

```bash
npm run dev
```

---

## 🛍️ API Reference

| Method | Route                          | Description                                                |
| ------ | ------------------------------ | ---------------------------------------------------------- |
| GET    | `/api/:vaultId/address`        | Fetch the on-chain address associated with the given vault |
| GET    | `/api/:vaultId/balance`        | Get the native Aptos coin balance                          |
| GET    | `/api/:vaultId/balances`       | Get all token and coin balances for the vault              |
| GET    | `/api/:vaultId/coins_data`     | Fetch metadata about all coins held in the vault           |
| GET    | `/api/:vaultId/publicKey`      | Retrieve the public key for the vault account              |
| GET    | `/api/:vaultId/transactions`   | List recent submitted transactions from this vault         |
| GET    | `/api/metrics`                 | Prometheus-compatible service metrics                      |
| POST   | `/api/:vaultId/transfer/move`  | Sign and submit a generic Move transaction                 |
| POST   | `/api/:vaultId/transfer/token` | Transfer a token from the vault to another account         |

## 📗 API docs

Swagger UI API Documentation be will be availabe at http://localhost:3000/api-docs after running the project.

---

## 🚪 Security

- Never commit your `.env` or secrets.
- Use secrets management in production.

---

## 📄 License

MIT License

---
