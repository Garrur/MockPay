import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

/**
 * Custom Error Classes
 */
export class SandboxPayError extends Error {
  constructor(public message: string, public statusCode?: number, public code?: string) {
    super(message);
    this.name = 'SandboxPayError';
  }
}

export class AuthenticationError extends SandboxPayError {
  constructor(message = 'Invalid API Key') {
    super(message, 401, 'AUTH_FAILED');
    this.name = 'AuthenticationError';
  }
}

export class ApiError extends SandboxPayError {
  constructor(message: string, statusCode: number, code: string) {
    super(message, statusCode, code);
    this.name = 'ApiError';
  }
}

/**
 * SDK Interfaces
 */
export interface SandboxPayConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface PaymentParams {
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  success_url?: string;
  cancel_url?: string;
  metadata?: Record<string, any>;
}

export interface SimulationParams {
  paymentId: string;
  status: 'success' | 'failed' | 'pending';
  delay?: number;
}

/**
 * The SandboxPay Client
 */
export class SandboxPay {
  private client: AxiosInstance;

  constructor(config: SandboxPayConfig) {
    if (!config.apiKey) {
      throw new AuthenticationError('API Key is required to initialize SandboxPay');
    }

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://mockpay.onrender.com/api',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Response Interceptor for Errors
    this.client.interceptors.response.use(
      (response: any) => response.data,
      (error: any) => {
        if (error.response) {
          const { status, data } = error.response;
          if (status === 401) throw new AuthenticationError();
          throw new ApiError(data.error || 'API Request Failed', status, data.code || 'API_ERROR');
        }
        throw new SandboxPayError(error.message || 'Network Error');
      }
    );
  }

  /**
   * Create a new payment session
   */
  async createPayment(params: PaymentParams): Promise<{ payment_id: string; payment_url: string }> {
    return this.client.post('/payments', {
      amount: params.amount,
      currency: params.currency,
      order_id: params.orderId,
      description: params.description,
      success_url: params.success_url,
      cancel_url: params.cancel_url,
      metadata: params.metadata,
    });
  }

  /**
   * Retrieve payment details
   */
  async getPayment(paymentId: string): Promise<any> {
    return this.client.get(`/payments/${paymentId}`);
  }

  /**
   * Simulate a payment outcome (Internal/Testing use)
   */
  async simulatePayment(params: SimulationParams): Promise<{ success: boolean; status: string }> {
    return this.client.post('/simulate-payment', {
      payment_id: params.paymentId,
      status: params.status,
      delay: params.delay,
    });
  }

  /**
   * Static Utility: Verify Webhook Signature
   */
  static verifyWebhook(options: { payload: any; signature: string; secret: string }): boolean {
    const { payload, signature, secret } = options;
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expected = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return expected === signature;
  }

  /**
   * Express Middleware for Webhooks
   */
  webhookHandler(secret: string, callback: (event: any) => void | Promise<void>) {
    return async (req: any, res: any) => {
      const signature = req.headers['x-sbp-signature'];
      
      if (!signature) {
        return res.status(400).send({ error: 'Missing x-sbp-signature header' });
      }

      const isValid = SandboxPay.verifyWebhook({
        payload: req.body,
        signature,
        secret
      });

      if (!isValid) {
        return res.status(401).send({ error: 'Invalid webhook signature' });
      }

      try {
        await callback(req.body);
        res.status(200).send({ received: true });
      } catch (err: any) {
        res.status(500).send({ error: err.message || 'Webhook processing failed' });
      }
    };
  }
}

export default SandboxPay;
