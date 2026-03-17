"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = exports.AuthenticationError = exports.SandboxPayError = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
/**
 * Custom Error Classes
 */
class SandboxPayError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'SandboxPayError';
    }
}
exports.SandboxPayError = SandboxPayError;
class AuthenticationError extends SandboxPayError {
    constructor(message = 'Invalid API Key') {
        super(message, 401, 'AUTH_FAILED');
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class ApiError extends SandboxPayError {
    constructor(message, statusCode, code) {
        super(message, statusCode, code);
        this.name = 'ApiError';
    }
}
exports.ApiError = ApiError;
/**
 * The SandboxPay Client
 */
class SandboxPay {
    constructor(config) {
        if (!config.apiKey) {
            throw new AuthenticationError('API Key is required to initialize SandboxPay');
        }
        this.client = axios_1.default.create({
            baseURL: config.baseUrl || 'http://localhost:4000/api',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        // Response Interceptor for Errors
        this.client.interceptors.response.use((response) => response.data, (error) => {
            if (error.response) {
                const { status, data } = error.response;
                if (status === 401)
                    throw new AuthenticationError();
                throw new ApiError(data.error || 'API Request Failed', status, data.code || 'API_ERROR');
            }
            throw new SandboxPayError(error.message || 'Network Error');
        });
    }
    /**
     * Create a new payment session
     */
    async createPayment(params) {
        return this.client.post('/payments', {
            amount: params.amount,
            currency: params.currency,
            order_id: params.orderId,
            description: params.description,
            metadata: params.metadata,
        });
    }
    /**
     * Retrieve payment details
     */
    async getPayment(paymentId) {
        return this.client.get(`/payments/${paymentId}`);
    }
    /**
     * Simulate a payment outcome (Internal/Testing use)
     */
    async simulatePayment(params) {
        return this.client.post('/simulate-payment', {
            payment_id: params.paymentId,
            status: params.status,
            delay: params.delay,
        });
    }
    /**
     * Static Utility: Verify Webhook Signature
     */
    static verifyWebhook(options) {
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
    webhookHandler(secret, callback) {
        return async (req, res) => {
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
            }
            catch (err) {
                res.status(500).send({ error: err.message || 'Webhook processing failed' });
            }
        };
    }
}
exports.default = SandboxPay;
