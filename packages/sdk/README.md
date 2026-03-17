# SandboxPay Node.js SDK (`sandboxpay-js`)

The official Node.js SDK for **SandboxPay** — "The Postman for Payment Systems." Integrate realistic payment simulations into your app in under 2 minutes.

## 🚀 Installation

```bash
npm install sandboxpay-js
```

## ⚡ Quick Start

### 1. Initialize the Client
```javascript
const SandboxPay = require('sandboxpay-js');

const sandboxpay = new SandboxPay({
  apiKey: 'sk_test_your_key_here'
});
```

### 2. Create a Payment Session
```javascript
const payment = await sandboxpay.createPayment({
  amount: 50000,           // ₹500.00
  currency: 'INR',
  orderId: 'ORDER_123',
  description: 'Test Webhook Integration'
});

console.log('Payment URL:', payment.payment_url);
```

### 3. Verify & Handle Webhooks (Express)
```javascript
const express = require('express');
const app = express();
app.use(express.json());

// Use the built-in middleware for easy verification
app.post('/webhook', sandboxpay.webhookHandler('your_webhook_secret', (event) => {
  console.log('Received Event:', event.type);
  if (event.type === 'payment.success') {
    // Fulfill the order
    const orderId = event.data.object.orderId;
    console.log('✅ Order Success:', orderId);
  }
}));

app.listen(3000);
```

### 4. Manual Webhook Verification
```javascript
const isValid = SandboxPay.verifyWebhook({
  payload: req.body,
  signature: req.headers['x-sbp-signature'],
  secret: 'your_webhook_secret'
});

if (isValid) {
  // Process the event
}
```

## 🧪 Simulation
Trigger specific outcomes programmatically for testing:
```javascript
await sandboxpay.simulatePayment({
  paymentId: 'pay_abc123',
  status: 'success',
  delay: 2000 // simulate 2s network latency
});
```

## 🛠 CLI Tool
Scaffold a new integration project instantly:
```bash
npx sandboxpay init
```

## 📖 Features
- ✅ **Full TypeScript Support** with built-in types.
- ✅ **Express Middleware** for automatic signature verification.
- ✅ **Custom Error Handling** (`AuthenticationError`, `ApiError`).
- ✅ **Promise-based API** with async/await.

## License
MIT
