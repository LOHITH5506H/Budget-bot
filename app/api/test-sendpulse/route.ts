import { NextResponse } from "next/server";

export async function GET() {
  const userId = process.env.SENDPULSE_USER_ID;
  const secret = process.env.SENDPULSE_SECRET;

  if (!userId || !secret) {
    return NextResponse.json(
      {
        status: "❌ ERROR",
        message: "SendPulse credentials not found in environment variables",
        hasUserId: !!userId,
        hasSecret: !!secret,
        fix: "Add SENDPULSE_USER_ID and SENDPULSE_SECRET to .env.local, then restart the server",
      },
      { status: 500 }
    );
  }

  try {
    // 1️⃣ Get access token
    const tokenResponse = await fetch("https://api.sendpulse.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: userId,
        client_secret: secret,
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json(
        {
          status: "❌ FAILED",
          message: "Invalid SendPulse credentials",
          error: tokenData.error || "Unknown error",
          errorDescription: tokenData.error_description || "No description provided",
          fix: "Regenerate API credentials in SendPulse → Settings → API → REST API",
        },
        { status: 401 }
      );
    }

    // 2️⃣ Send test email
    const emailResponse = await fetch("https://api.sendpulse.com/smtp/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        email: {
          subject: "✅ SendPulse Test Email",
          from: {
            name: "Next.js App",
            email: "noreply@yourdomain.com", // must be a verified sender in SendPulse
          },
          to: [
            {
              email: "lohibunny@gmail.com",
            },
          ],
          text: "Hello! This is a test email from your Next.js API route using SendPulse.",
          html: "<h2>🚀 Test Email Successful!</h2><p>This message was sent using <b>SendPulse API</b> on a GET request.</p>",
        },
      }),
    });

    const emailData = await emailResponse.json();

    return NextResponse.json({
      status: "✅ SUCCESS",
      message: "Test email sent successfully!",
      tokenReceived: true,
      emailResponse: emailData,
      note: "Check lohibunny@gmail.com for the test email",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "💥 EXCEPTION",
        message: "Error while sending test email",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
