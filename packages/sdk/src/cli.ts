#!/usr/bin/env node

/**
 * SandboxPay CLI tool
 * Used for initializing new projects and quick scaffolding.
 */

import * as fs from 'fs';
import * as path from 'path';

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
} else {
  console.log(HELP_MESSAGE);
}
