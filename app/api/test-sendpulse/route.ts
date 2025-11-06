import { NextResponse } from "next/server"

export async function GET() {
  const userId = process.env.SENDPULSE_USER_ID;
  const secret = process.env.SENDPULSE_SECRET;
  
  // Check if env vars are loaded
  if (!userId || !secret) {
    return NextResponse.json({
      status: "❌ ERROR",
      message: "SendPulse credentials not found in environment variables",
      hasUserId: !!userId,
      hasSecret: !!secret,
      fix: "Make sure .env.local has SENDPULSE_USER_ID and SENDPULSE_SECRET, then restart the server"
    }, { status: 500 });
  }

  try {
    // Test API credentials
    const response = await fetch("https://api.sendpulse.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: userId,
        client_secret: secret,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      return NextResponse.json({
        status: "✅ SUCCESS",
        message: "SendPulse API credentials are valid!",
        tokenReceived: true,
        expiresIn: data.expires_in + " seconds",
        userId: userId.substring(0, 8) + "...",
        nextSteps: [
          "1. Verify sender email in SendPulse dashboard",
          "2. Make sure SMTP service is enabled",
          "3. Test sending an actual email"
        ]
      });
    } else {
      return NextResponse.json({
        status: "❌ FAILED",
        message: "Invalid SendPulse credentials",
        error: data.error || "Unknown error",
        errorDescription: data.error_description || "No description provided",
        userId: userId.substring(0, 8) + "...",
        fix: "Generate new API credentials from SendPulse dashboard → Settings → API → REST API"
      }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({
      status: "💥 EXCEPTION",
      message: "Error while testing SendPulse API",
      error: error.message,
      fix: "Check your internet connection and SendPulse API status"
    }, { status: 500 });
  }
}
