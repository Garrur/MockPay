/**
 * Example Express application using sandboxpay-js
 */

const express = require('express');
const SandboxPay = require('../dist/index').default; // Use dist for example
require('dotenv').config();

const app = express();
app.use(express.json());

// Initialize SDK
const sandboxpay = new SandboxPay({
  apiKey: process.env.SANDBOXPAY_API_KEY || 'sk_test_demo'
});

/**
 * Route: Create a payment
 */
app.post('/api/checkout', async (req, res) => {
  try {
    const payment = await sandboxpay.createPayment({
      amount: req.body.amount || 1000,
      currency: 'INR',
      orderId: 'ORD_' + Math.random().toString(36).slice(2, 9),
      description: 'SDK Example Payment'
    });
    
    res.json({
      message: 'Payment session created',
      payment_url: payment.payment_url,
      payment_id: payment.payment_id
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ 
      error: err.message,
      code: err.code 
    });
  }
});

/**
 * Route: Simulating a successful payment (for local testing)
 */
app.post('/api/simulate-success/:id', async (req, res) => {
  try {
    const result = await sandboxpay.simulatePayment({
      paymentId: req.params.id,
      status: 'success',
      delay: 0
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Route: Webhook receiver
 */
app.post('/api/webhook', sandboxpay.webhookHandler('whsec_test', (event) => {
  console.log('🔔 RECEIVED EVENT:', event.type);
  console.log('📦 DATA:', JSON.stringify(event.data.object, null, 2));

  switch (event.type) {
    case 'payment.success':
      console.log('🎉 PAYMENT SUCCESSFUL!');
      break;
    case 'payment.failed':
      console.log('❌ PAYMENT FAILED!');
      break;
  }
}));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Example app running at http://localhost:${PORT}`);
  console.log(`- POST /api/checkout to create a payment`);
  console.log(`- POST /api/webhook to receive events`);
});
