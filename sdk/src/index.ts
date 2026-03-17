/**
 * SandboxPay SDK
 * 
 * A simple wrapper over the SandboxPay REST API for creating and simulating payments
 * in a development/hackathon environment.
 */
import crypto from 'crypto';

interface SandboxPayOptions {
  secretKey: string;
  baseUrl?: string;
}

interface PaymentOptions {
  amount: number;
  currency?: string;
  order_id: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface PaymentResponse {
  payment_id: string;
  payment_url: string;
  amount: number;
  currency: string;
  status: 'created' | 'pending' | 'success' | 'failed' | 'cancelled';
  created_at: string;
}

export class SandboxPay {
  private secretKey: string;
  private baseUrl: string;

  constructor(opts: SandboxPayOptions | string) {
    if (typeof opts === 'string') {
      this.secretKey = opts;
      this.baseUrl = 'https://sandboxpay-api.vercel.app/api'; // Replace with prod URL when deployed
    } else {
      this.secretKey = opts.secretKey;
      this.baseUrl = opts.baseUrl || 'https://sandboxpay-api.vercel.app/api';
    }

    if (!this.secretKey.startsWith('sk_test_')) {
      throw new Error("SandboxPay Error: Secret key must start with 'sk_test_'");
    }
  }

  /**
   * Internal fetch wrapper with auth header
   */
  private async request(method: string, endpoint: string, body?: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      throw new Error(`SandboxPay API Error: ${data.error || res.statusText}`);
    }
    return data;
  }

  public payments = {
    /**
     * Creates a new payment intent and returns checkout URL
     */
    create: async (payload: PaymentOptions): Promise<PaymentResponse> => {
      return this.request('POST', '/payments', payload);
    },

    /**
     * Retrieve current status of a payment
     */
    retrieve: async (paymentId: string): Promise<PaymentResponse> => {
      const { payment } = await this.request('GET', `/payments/${paymentId}`);
      return payment;
    }
  };

  public webhooks = {
    /**
     * Verifies the webhook signature and returns the parsed payload
     */
    constructEvent: (payloadString: string, signatureHeader: string, endpointSecret: string) => {
      if (!signatureHeader.startsWith('sha256=')) {
        throw new Error("Invalid signature header format");
      }

      const receivedSig = signatureHeader.slice(7);
      const expectedSig = crypto.createHmac('sha256', endpointSecret).update(payloadString).digest('hex');

      if (receivedSig !== expectedSig) {
        throw new Error("Webhook signature verification failed");
      }

      return JSON.parse(payloadString);
    }
  };
}
