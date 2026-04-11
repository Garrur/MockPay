/**
 * Custom Error Classes
 */
export declare class SandboxPayError extends Error {
    message: string;
    statusCode?: number | undefined;
    code?: string | undefined;
    constructor(message: string, statusCode?: number | undefined, code?: string | undefined);
}
export declare class AuthenticationError extends SandboxPayError {
    constructor(message?: string);
}
export declare class ApiError extends SandboxPayError {
    constructor(message: string, statusCode: number, code: string);
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
export declare class SandboxPay {
    private client;
    constructor(config: SandboxPayConfig);
    /**
     * Create a new payment session
     */
    createPayment(params: PaymentParams): Promise<{
        payment_id: string;
        payment_url: string;
    }>;
    /**
     * Retrieve payment details
     */
    getPayment(paymentId: string): Promise<any>;
    /**
     * Simulate a payment outcome (Internal/Testing use)
     */
    simulatePayment(params: SimulationParams): Promise<{
        success: boolean;
        status: string;
    }>;
    /**
     * Static Utility: Verify Webhook Signature
     */
    static verifyWebhook(options: {
        payload: any;
        signature: string;
        secret: string;
    }): boolean;
    /**
     * Express Middleware for Webhooks
     */
    webhookHandler(secret: string, callback: (event: any) => void | Promise<void>): (req: any, res: any) => Promise<any>;
}
export default SandboxPay;
