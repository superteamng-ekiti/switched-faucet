import { NextRequest, NextResponse } from "next/server";
import {
  dispenseTokens,
  getRemainingRequests,
} from "../../../../server/faucet";
import { getFaucetConfig } from "../../../../server/config";

export interface FaucetRequest {
  walletAddress: string;
  amount: string;
}

export interface FaucetResponse {
  success: boolean;
  txSignature?: string;
  error?: string;
  remainingRequests?: number;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return "127.0.0.1";
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<FaucetResponse>> {
  try {
    const body: FaucetRequest = await request.json();
    const { walletAddress, amount } = body;

    if (!walletAddress || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: "walletAddress is required",
        },
        { status: 400 }
      );
    }

    const ipAddress = getClientIP(request);
    const config = getFaucetConfig();

    const result = await dispenseTokens(
      config,
      walletAddress,
      amount,
      ipAddress
    );
    const remainingRequests = getRemainingRequests(
      config,
      walletAddress,
      ipAddress
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        txSignature: result.txSignature,
        remainingRequests,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          remainingRequests,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Faucet API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get("walletAddress");

  if (!walletAddress) {
    return NextResponse.json(
      {
        success: false,
        error: "walletAddress parameter is required",
      },
      { status: 400 }
    );
  }

  const ipAddress = getClientIP(request);
  const config = getFaucetConfig();
  const remainingRequests = getRemainingRequests(
    config,
    walletAddress,
    ipAddress
  );

  return NextResponse.json({
    success: true,
    remainingRequests,
  });
}
