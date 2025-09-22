import { NextApiRequest, NextApiResponse } from "next";
import { dispenseTokens, getRemainingRequests } from "./faucet";
import { getFaucetConfig } from "./config";

export interface FaucetRequest {
  walletAddress: string;
}

export interface FaucetResponse {
  success: boolean;
  txSignature?: string;
  error?: string;
  remainingRequests?: number;
}

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const realIP = req.headers["x-real-ip"];

  if (forwarded) {
    return Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP;
  }

  return (
    req.connection.remoteAddress || req.socket.remoteAddress || "127.0.0.1"
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FaucetResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const { walletAddress }: FaucetRequest = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: "walletAddress is required",
      });
    }

    const ipAddress = getClientIP(req);
    const config = getFaucetConfig();

    const result = await dispenseTokens(config, walletAddress, ipAddress);
    const remainingRequests = getRemainingRequests(
      config,
      walletAddress,
      ipAddress
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        txSignature: result.txSignature,
        remainingRequests,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        remainingRequests,
      });
    }
  } catch (error) {
    console.error("Faucet API error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
