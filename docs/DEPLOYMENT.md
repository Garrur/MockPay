# SandboxPay - Deployment Guide

This guide explains how to deploy the SandboxPay full-stack SaaS platform.

## 1. Database (NeonDB)

The project uses PostgreSQL via NeonDB.
1. Create a project on [Neon](https://neon.tech)
2. Get the pooled connection string
3. Add it to the `:backend/.env` file as `DATABASE_URL`
4. Run migrations: `cd backend && npx prisma db push`

## 2. Authentication (Clerk)

1. Create an application on [Clerk](https://clerk.dev)
2. Get the API keys
3. Frontend `.env.local`:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
4. Backend `.env`:
   ```env
   CLERK_SECRET_KEY=sk_test_...
   CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

## 3. Backend (Railway or Render)

The backend is built with Fastify and BullMQ (requires Redis).

### Prerequisites
1. Provision a Redis instance (e.g., Upstash or Railway Redis)
2. Get the `REDIS_URL`

### Deployment Steps (Railway)
1. Commit the `backend` folder to a GitHub repository
2. Connect Railway to the repository and select the `backend` folder as the root directory
3. Add Environment Variables:
   - `DATABASE_URL`
   - `REDIS_URL`
   - `CLERK_SECRET_KEY`
   - `CLERK_PUBLISHABLE_KEY`
   - `FRONTEND_URL` (e.g., `https://sandboxpay.vercel.app`)
   - `PORT` = `4000`
4. The start command is `npm run start`

## 4. Frontend (Vercel)

The frontend is a Next.js 15 App Router application.

### Deployment Steps
1. Connect Vercel to your GitHub repository
2. Set the Root Directory to `frontend`
3. Add Environment Variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_API_URL` (URL of your deployed backend, e.g., `https://api.sandboxpay.dev/api`)
4. Click Deploy. Vercel will automatically detect Next.js and build it.

## 5. SDK / NPM Package

To publish the SDK for developers:
1. `cd sdk`
2. Update the `baseUrl` in `src/index.ts` to your production backend URL
3. `npm run build`
4. `npm publish --access public`
