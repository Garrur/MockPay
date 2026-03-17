import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { amount, currency } = await req.json();

    // The merchant's secret key from SandboxPay
    const secretKey = process.env.SANDBOXPAY_SECRET_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

    if (!secretKey) {
      return NextResponse.json({ error: "Missing SandboxPay Secret Key in .env" }, { status: 500 });
    }

    // 1. Merchant's backend calls SandboxPay API to create a payment session
    const response = await axios.post(
      `${apiUrl}/payments`,
      {
        amount,
        currency,
        order_id: `ORDER_${Math.random().toString(36).substring(7).toUpperCase()}`,
        description: "Test Transaction from Web App Demo",
        metadata: {
          customer_id: "user_123",
          source: "demo-web-app"
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 2. Return the generated payment URL back to the frontend
    return NextResponse.json({ payment_url: response.data.payment_url });
    
  } catch (error: any) {
    console.error("Payment Creation Error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    );
  }
}
