# 💳 MockPay

**The Ultimate Payment Gateway Simulator for Developers.**

MockPay is a highly realistic, developer-first payment gateway simulator that allows you to integrate Stripe-like payment flows into your applications instantly. Build, debug, and test complex checkout flows without KYC blocks, real bank integrations, or risking real money. Perfect for hackathons, SaaS MVP validation, and testing edge cases.

---

## 🛠️ Technology Stack

MockPay is built with modern, high-performance tooling to ensure a premium developer experience:

### Frontend (Dashboard & Landing Page)
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4 + Custom "Rich Amber Sand" neubrutalist/glassmorphic design system
- **Animations:** Framer Motion for fluidity and micro-interactions
- **3D Assets:** `@react-three/fiber` & `@react-three/drei` for interactive hero elements
- **Components:** Shadcn/ui & Radix Primitives

### Backend & Core Simulation Engine
- **Server:** Fastify (Node.js) for high-throughput, low-latency API handling
- **Database:** PostgreSQL (via Prisma ORM) for robust transactional state management
- **Queue/Webhooks:** Redis (via BullMQ) for robust async processing and exponential backoff webhook delivery
- **Authentication:** Clerk for secure, unified dashboard access control

---

## ⚡ Core Features

- **Instant API Provisioning:** Generate zero-setup `sk_test_...` and `pk_test_...` keys in seconds.
- **Hosted Checkout Sessions:** Drop in a beautiful, responsive checkout page that feels native to your app.
- **Webhook Delivery Engine:** Visually inspect payloads, debug headers, and replay failed events directly from the dashboard.
- **Deterministic Testing:** Use "Magic Cards" to deliberately simulate success, decline, insufficient funds, or network timeouts.

---

## 🔌 How to Connect & Use

MockPay offers a fully-typed Node.js SDK for seamless integration. It's designed to act as a drop-in replacement for mainstream providers like Stripe or Razorpay.

### 1. Install the SDK
```bash
npm install @utkarsh_raj32/mockpay-js
```

### 2. Initialize & Create a Payment
In your backend application, securely create a payment session:

```javascript
import MockPay from '@utkarsh_raj32/mockpay-js';

// Initialize with your secret key from the MockPay Dashboard
const client = new MockPay('sk_test_1234567890abcdef');

// Create a test payment
const payment = await client.payments.create({
  amount: 49900,         // Amount in smallest currency unit (₹499.00)
  currency: 'INR',
  order_id: 'order_abc123',
  webhook_url: 'https://your-app.com/api/webhooks/mockpay', // Where we will send the success event
});

// Redirect the user to the hosted checkout URL
console.log(payment.checkout_url); 
```

### 3. Handle Webhooks
Verify and process simulated payments asynchronously when MockPay pings your server:

```javascript
import express from 'express';
const app = express();
app.use(express.json());

app.post('/api/webhooks/mockpay', (req, res) => {
  const event = req.body;
  
  if (event.type === 'payment.success') {
    console.log('✅ Payment succeeded for order:', event.data.order_id);
    // Unlock digital goods, update database, etc.
  }
  
  if (event.type === 'payment.failed') {
    console.error('❌ Payment declined:', event.data.error_message);
  }
  
  res.json({ received: true });
});
```

---

## 💳 Magic Cards for Testing

MockPay provides specific card numbers to intentionally trigger edge cases during the hosted checkout flow:

| Card Number | Expiry | CVV | Expected Outcome |
|-------------|--------|-----|------------------|
| `4242 4242 4242 4242` | Any | Any | **Success** (Triggers `payment.success`) |
| `4000 0000 0000 0051` | Any | Any | **Declined** (Insufficient Funds) |
| `4000 0000 0000 0069` | Any | Any | **Timeout** (Simulates network failure) |

---

## 🏁 Local Development Setup

To run the MockPay platform and dashboard locally, follow these steps:

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database (Local or Neon.tech)
- Redis Server (Local or Upstash)
- Clerk Account (Generate API keys for auth)

### 2. Installation
```bash
git clone https://github.com/Garrur/MockPay.git
cd MockPay

# Install dependencies across workspaces
cd frontend && npm install
cd ../backend && npm install
```

### 3. Environment Configuration
Copy the sample environment variables and apply your credentials:

**In `backend/`:**
```env
PORT=4000
DATABASE_URL="postgres://user:pass@localhost:5432/mockpay"
REDIS_URL="redis://localhost:6379"
FRONTEND_URL="http://localhost:3000"
```

**In `frontend/`:**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_BACKEND_URL="http://localhost:4000"
```

### 4. Run Development Servers
Start both servers in split terminal windows:

```bash
# Terminal 1: Backend API Engine
cd backend && npm run dev

# Terminal 2: Frontend Dashboard & Docs
cd frontend && npm run dev
```
Navigate to `http://localhost:3000` to access your local MockPay instance.

---

## 🧠 Architecture Intelligence

MockPay isn't just a static mock server; it's a dynamic, stateful event engine:
- **Resilient Webhook Dispatch:** Utilizing Redis and BullMQ, our webhook worker safely isolates outbound network requests. If your local webhook receiver is down, MockPay automatically applies an exponential backoff retry strategy.
- **Isolated Developer Sandboxes:** Every user receives isolated API keys mapped exclusively to their generated event logs and traffic history.
- **Latency Emulation:** We mathematically model network latency and banking delays to accurately simulate real-world transaction timing before sending responses.

---

Built with ❤️ for the developer community.
