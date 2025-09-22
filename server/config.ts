import { Keypair } from "@solana/web3.js";

export const getFaucetConfig = () => {
  const privateKeyString = process.env.FAUCET_PRIVATE_KEY;
  if (!privateKeyString) {
    throw new Error("FAUCET_PRIVATE_KEY environment variable is required");
  }

  const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const tokenMintAddress = process.env.TOKEN_MINT_ADDRESS;
  if (!tokenMintAddress) {
    throw new Error("TOKEN_MINT_ADDRESS environment variable is required");
  }

  const tokensPerRequest = parseInt(process.env.TOKENS_PER_REQUEST || "200");
  const maxRequestsPerDay = 1; // 200 tokens per day, 1 request of 200 tokens

  let faucetKeypair: Keypair;
  try {
    const privateKeyArray = JSON.parse(privateKeyString);
    faucetKeypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));

    // console.log(faucetKeypair)
    console.log(rpcUrl, tokenMintAddress, faucetKeypair.publicKey.toBase58());
  } catch (error) {
    throw new Error(
      "Invalid FAUCET_PRIVATE_KEY format. Expected JSON array of numbers."
    );
  }

  return {
    rpcUrl,
    tokenMintAddress,
    faucetKeypair,
    tokensPerRequest,
    maxRequestsPerDay,
  };
};
