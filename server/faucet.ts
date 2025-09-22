import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export interface FaucetConfig {
  rpcUrl: string;
  tokenMintAddress: string;
  faucetKeypair: Keypair;
  tokensPerRequest: number;
  maxRequestsPerDay: number;
}

interface RequestRecord {
  count: number;
  lastReset: number;
}

const requestLog = new Map<string, RequestRecord>();

const getKey = (walletAddress: string, ipAddress: string): string => {
  return `${walletAddress}:${ipAddress}`;
};

const isRateLimited = (
  walletAddress: string,
  ipAddress: string,
  maxRequestsPerDay: number
): boolean => {
  const key = getKey(walletAddress, ipAddress);
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  const record = requestLog.get(key);

  if (!record) {
    return false;
  }

  if (now - record.lastReset > dayInMs) {
    requestLog.delete(key);
    return false;
  }

  return record.count >= maxRequestsPerDay;
};

const updateRequestLog = (walletAddress: string, ipAddress: string): void => {
  const key = getKey(walletAddress, ipAddress);
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  const record = requestLog.get(key);

  if (!record || now - record.lastReset > dayInMs) {
    requestLog.set(key, { count: 1, lastReset: now });
  } else {
    record.count += 1;
  }
};

export const dispenseTokens = async (
  config: FaucetConfig,
  walletAddress: string,
  amount: string,
  ipAddress: string
): Promise<{ success: boolean; txSignature?: string; error?: string }> => {
  try {
    const connection = new Connection(config.rpcUrl, "confirmed");

    if (isRateLimited(walletAddress, ipAddress, config.maxRequestsPerDay)) {
      return {
        success: false,
        error: `Rate limit exceeded. Maximum ${config.maxRequestsPerDay} requests per 24 hours per wallet/IP combination.`,
      };
    }

    const recipientPublicKey = new PublicKey(walletAddress);
    const tokenMint = new PublicKey(config.tokenMintAddress);

    const faucetTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      config.faucetKeypair,
      tokenMint,
      config.faucetKeypair.publicKey
    );

    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      config.faucetKeypair,
      tokenMint,
      recipientPublicKey
    );

    console.log("recipient ATA: ", recipientTokenAccount.address);
    console.log("faucet ATA: ", faucetTokenAccount.address);

    const transferInstruction = createTransferInstruction(
      faucetTokenAccount.address,
      recipientTokenAccount.address,
      config.faucetKeypair.publicKey,
      Number(amount) * Math.pow(10, 6),
      []
    );

    const transaction = new Transaction().add(transferInstruction);

    const signature = await sendAndConfirmTransaction(connection, transaction, [
      config.faucetKeypair,
    ]);

    updateRequestLog(walletAddress, ipAddress);

    return {
      success: true,
      txSignature: signature,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const getRemainingRequests = (
  config: FaucetConfig,
  walletAddress: string,
  ipAddress: string
): number => {
  const key = getKey(walletAddress, ipAddress);
  const record = requestLog.get(key);

  if (!record) {
    return config.maxRequestsPerDay;
  }

  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  if (now - record.lastReset > dayInMs) {
    return config.maxRequestsPerDay;
  }

  return Math.max(0, config.maxRequestsPerDay - record.count);
};
