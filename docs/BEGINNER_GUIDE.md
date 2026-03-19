# 💳 MockPay: The Beginner's Guide

Welcome to **MockPay**! Whether you're a student building your first project or a developer testing a complex SaaS, this guide will walk you through every step of the journey.

---

## 🌟 What is MockPay?

MockPay (formerly SandboxPay) is a **Payment Gateway Simulator**. 
- **The Problem:** Integrating real payment gateways (like Stripe or Razorpay) requires business registration, KYC, and real money.
- **The Solution:** MockPay gives you the *exact same experience* but with "magic" money and instant access. It’s like a flight simulator for developers.

---

## 🛠️ Step 1: Prerequisites

Before we start, make sure you have these installed:
1.  **Node.js (v18+)**: [Download here](https://nodejs.org/)
2.  **PostgreSQL**: A database. You can use [Neon.tech](https://neon.tech/) for a free cloud version.
3.  **Redis**: Used for handling webhooks. Use [Upstash](https://upstash.com/) for a free cloud version.
4.  **Clerk**: For user login. Create a free account at [clerk.com](https://clerk.com/).

---

## 🚀 Step 2: Local Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Garrur/MockPay.git
    cd MockPay
    ```

2.  **Install Dependencies:**
    You need to install packages in three places:
    ```bash
    # For the Dashboard
    cd frontend && npm install
    
    # For the API Server
    cd ../backend && npm install
    
    # For the External SDK Demo
    cd ../client && npm install
    ```

---

## ⚙️ Step 3: Configuration (The .env files)

Each folder needs a `.env` file to talk to your services.

### Backend (`/backend/.env`)
```env
DATABASE_URL="your_postgresql_url"
REDIS_URL="your_redis_url"
CLERK_SECRET_KEY="your_clerk_secret"
```

### Frontend (`/frontend/.env.local`)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_pub_key"
CLERK_SECRET_KEY="your_clerk_secret"
NEXT_PUBLIC_BACKEND_URL="http://localhost:4000/api"
```

---

## 🏃‍♂️ Step 4: Running the App

Open three separate terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm run db:push  # Sets up your database
npm run dev      # Starts the server on port 4000
```

**Terminal 2 (Frontend/Dashboard):**
```bash
cd frontend
npm run dev      # Starts the dashboard on port 3000
```

**Terminal 3 (Demo App):**
```bash
cd web-app
npm run dev      # Starts a demo store on port 3001
```

---

## 🎨 Step 5: Using the Dashboard

1.  Go to `http://localhost:3000`.
2.  Sign up/Login using Clerk.
3.  **Create a Project:** Give it a name (e.g., "My Awesome Store").
4.  **Get your API Key:** Copy the `sk_test_...` key. **Never share this!**

---

## 💻 Step 6: Integrating the SDK (The Fun Part)

Now, let's use MockPay in your own Node.js code.

1.  **Install the SDK:**
    ```bash
    npm install @utkarsh_raj32/sandboxpay-js
    ```

2.  **Create a Payment:**
    ```javascript
    import { SandboxPay } from '@utkarsh_raj32/sandboxpay-js';
    const sbp = new SandboxPay({ apiKey: 'YOUR_API_KEY' });

    async function startPayment() {
      const session = await sbp.createPayment({
        amount: 50000, // ₹500.00 (amount is in paise/cents)
        currency: 'INR',
        orderId: 'ORDER_123',
        description: 'Buying a cool hoodie'
      });

      console.log('Redirect your user to:', session.payment_url);
    }
    ```

---

## 🎮 Step 7: Testing the Checkout

When you open the `payment_url`, you'll see a beautiful checkout page.
- **Card:** Use any fake numbers (e.g., `4242 4242...`).
- **UPI:** Enter any dummy UPI ID (e.g., `test@upi`).
- **Simulator Panel:** Use the floating panel on the right to force the payment to "Succeed" or "Fail" to see how your app handles it.

---

## 🔔 Step 8: Success!

You've successfully set up MockPay! You can now build full payment flows without ever touching a real bank account. 

**Next Steps:**
- Explore the **Webhook Debugger** in the dashboard to see live events.
- Check out the `web-app` folder to see a full "Shopify-like" store integration.

Happy coding! 🚀
