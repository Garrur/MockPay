"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxPay = void 0;
/**
 * SandboxPay SDK
 *
 * A simple wrapper over the SandboxPay REST API for creating and simulating payments
 * in a development/hackathon environment.
 */
const crypto_1 = __importDefault(require("crypto"));
class SandboxPay {
    secretKey;
    baseUrl;
    constructor(opts) {
        if (typeof opts === 'string') {
            this.secretKey = opts;
            this.baseUrl = 'https://sandboxpay-api.vercel.app/api'; // Replace with prod URL when deployed
        }
        else {
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
    async request(method, endpoint, body) {
        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: {
                'Authorization': `Bearer ${this.secretKey}`,
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        });
        const data = (await res.json().catch(() => ({})));
        if (!res.ok) {
            throw new Error(`SandboxPay API Error: ${data.error || res.statusText}`);
        }
        return data;
    }
    payments = {
        /**
         * Creates a new payment intent and returns checkout URL
         */
        create: async (payload) => {
            return this.request('POST', '/payments', payload);
        },
        /**
         * Retrieve current status of a payment
         */
        retrieve: async (paymentId) => {
            const { payment } = await this.request('GET', `/payments/${paymentId}`);
            return payment;
        }
    };
    webhooks = {
        /**
         * Verifies the webhook signature and returns the parsed payload
         */
        constructEvent: (payloadString, signatureHeader, endpointSecret) => {
            if (!signatureHeader.startsWith('sha256=')) {
                throw new Error("Invalid signature header format");
            }
            const receivedSig = signatureHeader.slice(7);
            const expectedSig = crypto_1.default.createHmac('sha256', endpointSecret).update(payloadString).digest('hex');
            if (receivedSig !== expectedSig) {
                throw new Error("Webhook signature verification failed");
            }
            return JSON.parse(payloadString);
        }
    };
}
exports.SandboxPay = SandboxPay;
