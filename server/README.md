# Token Faucet Server

A Solana SPL token faucet with rate limiting (200 tokens per wallet address per IP per 24 hours).

## Setup

1. Copy `.env.example` to `.env.local` and configure:
   ```bash
   cp .env.example .env.local
   ```

2. Set the required environment variables:
   - `SOLANA_RPC_URL`: Solana RPC endpoint (defaults to devnet)
   - `TOKEN_MINT_ADDRESS`: Your SPL token mint address
   - `FAUCET_PRIVATE_KEY`: Faucet wallet private key as JSON array
   - `TOKENS_PER_REQUEST`: Number of tokens to dispense (default: 200)

## API Endpoints

### POST /api/faucet
Request tokens from the faucet.

**Request Body:**
```json
{
  "walletAddress": "recipient_wallet_address"
}
```

**Response:**
```json
{
  "success": true,
  "txSignature": "transaction_signature",
  "remainingRequests": 0
}
```

### GET /api/faucet?walletAddress=address
Check remaining requests for a wallet/IP combination.

**Response:**
```json
{
  "success": true,
  "remainingRequests": 1
}
```

## Rate Limiting

- Maximum 1 request per wallet address per IP address per 24 hours
- Each request dispenses 200 tokens
- Rate limiting is based on wallet address + IP address combination

## Key Features

- ✅ SPL token support via @solana/spl-token
- ✅ Rate limiting (200 tokens per wallet/IP per 24hrs)
- ✅ IP address detection
- ✅ Automatic token account creation
- ✅ Error handling and validation
- ✅ Next.js 15 App Router compatible