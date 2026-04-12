# MockPay System Design Document

This document outlines the High-Level Design (HLD) and Low-Level Design (LLD) architecture for **MockPay**, a Sandbox Payment Gateway Simulator tailored for developers.

---

## 1. High-Level Design (HLD)

MockPay uses a decoupled full-stack architecture, providing a seamless DX (Developer Experience) and robust backend webhook processing.

### 1.1 Core Architecture
- **Frontend (Client-Facing Dashboard)**:
  - Framework: Next.js 16 (App Router)
  - Styling: Tailwind CSS
  - Design Language: "Amber Tactile" (Neumorphism, Glassmorphism, highly tactile interactions).
  - Purpose: Developer dashboard for managing Projects, API Keys, viewing Payment Logs, and configuring Webhooks.
- **Backend (API & Webhook Engine)**:
  - Framework: Node.js with TypeScript (Express-like structure).
  - Purpose: Exposed API endpoints for generating dummy payments, and a worker queue for firing asynchronous webhooks simulating gateway events (e.g., `payment.success`, `payment.failed`).

### 1.2 Infrastructure Stack
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Database ORM** | Prisma | Type-safe database interactions and schema migrations. |
| **Database SQL** | PostgreSQL | Relational data persistence for users, projects, and logs. |
| **Authentication** | Clerk | Handles user registration, sessions, and social logins. |
| **Analytics/Tracking** | PostHog | Product usage tracking. |

### 1.3 SDK Layer
- Hosted in `/packages/sandboxpay-js`.
- A client and server SDK that mimics production gateways (like Stripe or Razorpay) to allow developers to drop MockPay into their systems rapidly.

---

## 2. Low-Level Design (LLD)

### 2.1 Database Schema (Entity Relationship)

The state is managed using Prisma. Below is the simplified Entity-Relationship mapping connecting the decoupled components.

#### `User` and `Project`
- **`User`**: Linked via Clerk (`clerkId`), contains `plan` (free/pro/team).
- **`Project`**: The core container for a workspace. A `User` has many `Projects`. Projects hold all subsequent entities.

#### `ApiKey`
- Associated with a `Project`.
- **Fields**: `publicKey`, `secretKeyHash`, `secretKey` (for sandbox environment), `secretKeyPreview` (last 4 chars).
- Used to authenticate incoming API requests from the merchant's backend.

#### `Payment`
- The core simulated transaction entity.
- **Fields**: `amount`, `currency`, `orderId`, `status` (Enum: `created`, `pending`, `success`, `failed`, `cancelled`), `paymentUrl`.
- **Callback links**: `successUrl`, `cancelUrl` for browser redirects.

#### Webhook Ecosystem (`Webhook`, `WebhookEvent`)
- **`Webhook`**: Configured by the developer per `Project`. Contains the `url`, the `secret` (for HMAC signature generation), and subscribed `events`.
- **`WebhookEvent`**: Represents a single log of an API call out to the developer's server.
  - Links to the `Webhook` and the `Payment`.
  - **Fields**: `eventType`, `payload`, `requestHeaders`, `responseHeaders`, `httpStatus`, `status` (`pending`, `delivered`, `failed`), `attempts`, `nextRetryAt`.

#### Advanced Tools (`PaymentFlow`, `DemoLink`)
- **`PaymentFlow`**: Stores sequenced arrays of testing workflows.
- **`DemoLink`**: Shareable, expiring URLs (`token`) configured to enforce specific outcomes (e.g., force a failure).

### 2.2 Payment Flow & Webhook Engine Sequence

This is how data moves through the system during a standard simulation:

1. **Initialization:** The Merchant's Server sends a `POST /payments` request with an API Key to the MockPay Backend.
2. **Creation:** The Backend validates the API Key via the DB, creates a `Payment` row (Status: `created`), and returns a `paymentUrl`.
3. **Checkout UI:** The Merchant redirects their end-user to the MockPay `paymentUrl`.
4. **Simulation:** The user interacts with the tactile MockPay UI and clicks "Simulate Success".
5. **State Mutation:** The Next.js frontend calls the Backend to update the `Payment` status to `success`.
6. **Webhook Triggering (Asynchronous):**
   - The Backend locates active `Webhook` items for the `Project`.
   - Generates an HMAC signature using the `Webhook.secret` and the payload.
   - Enqueues a `WebhookEvent` with status `pending`.
   - The Webhook Queue worker dispatches POST requests to the Merchant's Server.
   - If it fails, the `attempts` count increments and `nextRetryAt` is calculated. It is logged in the Developer's Webhook Debugger UI.
7. **Redirection (Synchronous):** Concurrently, the frontend redirects the end-user's browser back to the Merchant's `successUrl`.

---

## 3. Security Considerations

Even though this is a "Mock" gateway, it models production security:
- **Keys**: Public/Secret keys are generated securely. Secret keys are hashed and validated on API usage to mimic real-world secure workflows.
- **Webhook Handshakes**: MockPay signs its outgoing webhooks with crypto HMAC-SHA256. Merchants are encouraged to use the `sandboxpay-js` SDK to verify these signatures to practice securing their server endpoints before migrating to a real payment gateway.
