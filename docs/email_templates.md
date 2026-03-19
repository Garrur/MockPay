# SandboxPay - Email Growth System Templates

These email templates are designed to be imported into your Email Service Provider (ESP) like Resend, Loops.so, or Customer.io to drive developer activation and retention.

---

## 1. Welcome & Activation Nudge
**Trigger:** 15 minutes after signup if no payment has been simulated.
**Subject:** Welcome to SandboxPay! Let's get your first payment flowing 🚀
**Body:**

Hi {{user.first_name}},

Welcome to SandboxPay! You're now ready to build and test your payment integrations without the hassle of KYC or real bank account verification.

**Your next steps:**
1. Head over to your [Dashboard](https://sandboxpay.io/dashboard).
2. Grab your `sk_test_...` key.
3. Use our Node.js SDK (or raw HTTP requests) to create your first payment.

```javascript
npm install @utkarsh_raj32/sandboxpay-js
```

Need help getting started? Check out our [Quickstart Guide](https://sandboxpay.io/docs) or hit reply to this email, I'm here to help.

Happy building!
— The SandboxPay Team

---

## 2. "First Payment Worked!" (Aha Moment)
**Trigger:** Immediately after the user successfully simulates their first payment.
**Subject:** Awesome! Your first payment worked ✅
**Body:**

Hi {{user.first_name}},

Boom! 💥 We just saw you successfully simulate your first payment on SandboxPay. 

This means your integration is working perfectly. What's next?

*   **Test Webhooks:** Try simulating a `failed` payment using our Demo UI and check if your webhook endpoint catches it.
*   **Share your work:** Working on a hackathon project or a startup MVP? Your SandboxPay hosted checkout links are shareable!

Keep up the momentum.

Cheers,
— Utkarsh, Creator of SandboxPay

---

## 3. Webhook Delivery Failure Alert
**Trigger:** If a webhook fails delivery 5 times consecutively.
**Subject:** Action Required: Your webhooks are failing to deliver 🔴
**Body:**

Hey {{user.first_name}},

Just a quick heads-up: our webhook engine attempted to deliver an event to your endpoint (`{{webhook.url}}`), but it failed 5 times in a row.

Your endpoint returned a `{{webhook.last_http_status}}` error.

**How to fix this:**
1. Check your server logs and ensure you are returning a `200 OK` status.
2. If you are developing locally, make sure your tunneling service (like ngrok or localtunnel) is still running.
3. You can inspect the exact payload and headers that failed in your [Webhook Debugger](https://sandboxpay.io/dashboard/webhooks/logs).

You can easily replay the failed event from the dashboard once your server is back up!

Best,
— The SandboxPay Team

---

## 4. Upgrade to Pro Nudge (Limit Approaching)
**Trigger:** User reaches 80% of their 1,000 requests/month limit.
**Subject:** You're crushing it! Important account update inside.
**Body:**

Hi {{user.first_name}},

You've been super active on SandboxPay recently—you've almost reached your 1,000 simulated payments limit for this month on the Hobby plan!

To ensure your testing isn't interrupted, we recommend upgrading to the **Pro Plan**.

**Why go Pro?**
*   **Unlimited** simulated payments.
*   **Extended Webhook Retry Logs** to debug complex workflows.
*   **Custom Branding** for your hosted checkout pages.
*   **Team Access** to invite your co-founders or QA testers.

[Upgrade to Pro here](https://sandboxpay.io/pricing)

If you're a student building a non-profit project, reply to this email, and we'll see what we can do 😉.

Keep building,
— The SandboxPay Team
