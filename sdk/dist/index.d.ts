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
export declare class SandboxPay {
    private secretKey;
    private baseUrl;
    constructor(opts: SandboxPayOptions | string);
    /**
     * Internal fetch wrapper with auth header
     */
    private request;
    payments: {
        /**
         * Creates a new payment intent and returns checkout URL
         */
        create: (payload: PaymentOptions) => Promise<PaymentResponse>;
        /**
         * Retrieve current status of a payment
         */
        retrieve: (paymentId: string) => Promise<PaymentResponse>;
    };
    webhooks: {
        /**
         * Verifies the webhook signature and returns the parsed payload
         */
        constructEvent: (payloadString: string, signatureHeader: string, endpointSecret: string) => any;
    };
}
export {};
