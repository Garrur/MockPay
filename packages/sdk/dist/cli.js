#!/usr/bin/env node
"use strict";
/**
 * SandboxPay CLI tool
 * Used for initializing new projects and quick scaffolding.
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const args = process.argv.slice(2);
const command = args[0];
const HELP_MESSAGE = `
SandboxPay CLI - Developer Experience Tool

Usage:
  npx sandboxpay init       Initialize a new integration project
  npx sandboxpay --help     Show this help message
`;
async function initProject() {
    console.log('🚀 Initializing SandboxPay integration...');
    const cwd = process.cwd();
    // 1. Create .env template
    const envContent = `SANDBOXPAY_API_KEY=sk_test_your_key_here\nPORT=3000`;
    fs.writeFileSync(path.join(cwd, '.env.example'), envContent);
    console.log('✅ Created .env.example');
    // 2. Create basic app.js
    const appJsContent = `
const express = require('express');
const SandboxPay = require('sandboxpay-js');
require('dotenv').config();

const app = express();
app.use(express.json());

const sandboxpay = new SandboxPay({
  apiKey: process.env.SANDBOXPAY_API_KEY
});

// 1. Route to create a payment
app.post('/checkout', async (req, res) => {
  try {
    const payment = await sandboxpay.createPayment({
      amount: 50000, // ₹500.00
      currency: 'INR',
      orderId: 'ORDER_' + Date.now(),
      description: 'Test Webhook Integration'
    });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Webhook handler using SDK middleware
app.post('/webhook', sandboxpay.webhookHandler('your_webhook_secret', (event) => {
  console.log('🔔 Webhook Received:', event.type);
  if (event.type === 'payment.success') {
    console.log('✅ Payment succeeded for order:', event.data.object.orderId);
  }
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));
`.trim();
    fs.writeFileSync(path.join(cwd, 'app.js'), appJsContent);
    console.log('✅ Created app.js with basic integration');
    // 3. Create basic package.json if it doesn't exist
    if (!fs.existsSync(path.join(cwd, 'package.json'))) {
        const pkgJson = {
            name: "sandboxpay-integration",
            version: "1.0.0",
            description: "My SandboxPay integration",
            main: "app.js",
            dependencies: {
                "express": "^4.18.2",
                "sandboxpay-js": "^1.0.0",
                "dotenv": "^16.0.0"
            }
        };
        fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify(pkgJson, null, 2));
        console.log('✅ Created package.json');
    }
    console.log('\n✨ Setup Complete! Run "npm install" to get started.');
}
if (command === 'init') {
    initProject();
}
else {
    console.log(HELP_MESSAGE);
}
