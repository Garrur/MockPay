# 💳 SandboxPay

**The Payment Gateway Simulator for Students & Developers.**

SandboxPay is a developer-first payment gateway simulator that allows you to integrate Stripe-like payment flows into your applications without KYC, real banks, or real money. Perfect for hackathons, SaaS prototypes, and learning integration patterns.

---

## 🚀 Features

- **Instant API Keys**: No ID verification. Copy your `sk_test_...` key in 10 seconds.
- **Hosted Checkout**: A beautiful, responsive checkout page out of the box.
- **Simulation Logic**: Use magic cards to test "Success", "Failure", and "Pending" states.
- **Reliable Webhooks**: Get real-time HTTP events with exponential backoff retry.
- **Developer Dashboard**: Track payments, revenue, and developer logs in a premium dark-mode UI.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS, Framer Motion, Shadcn UI
- **Backend**: Fastify (Node.js), Prisma (PostgreSQL), BullMQ (Redis)
- **Auth**: Clerk (Dashboard) + Custom API Key Middleware
- **Monorepo**: Standardized structure for easier local development

---

## 📂 Project Structure

```bash
d:\Mockpay\
├── frontend/          # Next.js Dashboard & Landing Page (Port 3000)
├── backend/           # Fastify API Server & Simulation Engine (Port 4000)
├── packages/sdk/      # SandboxPay Node.js SDK (Published to NPM)
├── client/            # External SDK Demo integration (Port 5173)
└── docs/              # API Reference & Guides
```

---

## 🏁 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database (Neon.tech recommended)
- Redis (Upstash recommended for Webhooks)
- Clerk Account (for Dashboard Auth)

### 2. Installation
Clone the repo and install dependencies:
```bash
git clone https://github.com/Garrur/MockPay.git
cd MockPay
# Install in all directories
cd frontend && npm install
cd ../backend && npm install
cd ../client && npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` in `backend`, `frontend`, and `web-app` folders and fill in your credentials.

### 4. Run Development Servers
Open multiple terminals:
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: External Demo
cd client && npm run dev
```

---

## 📜 License

Built with ❤️ for the developer community. 
Feel free to use this in your hackathons and side projects!
