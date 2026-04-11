"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink,
  Zap,
  Webhook,
  Code2,
  Lock,
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const SECTIONS = [
  { id: "intro", title: "Introduction", icon: Zap },
  { id: "auth", title: "Authentication", icon: Lock },
  { id: "create-payment", title: "Create Payment", icon: CreditCardIcon },
  { id: "webhooks", title: "Webhooks", icon: Webhook },
];

function CreditCardIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("intro");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CodePanel = ({ code, language = "bash", id }: { code: string; language?: string; id: string }) => (
    <div className="relative group rounded-xl bg-black border border-white/10 overflow-hidden my-6">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
        <span className="text-[10px] font-mono text-stone-600 uppercase tracking-widest">{language}</span>
        <button 
          onClick={() => copyToClipboard(code, id)}
          className="text-stone-600 hover:text-white transition-colors"
        >
          {copiedId === id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-stone-200/50 bg-white/40 backdrop-blur-xl p-6 hidden lg:block">
        <div className="flex items-center gap-2 mb-12">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-orange-600 font-bold text-white text-xs">M</div>
            <span className="text-lg font-bold tracking-tight text-foreground">MockPay Docs</span>
          </Link>
        </div>

        <nav className="space-y-1">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                activeSection === section.id 
                  ? "bg-orange-600/10 text-orange-700 border border-orange-600/20" 
                  : "text-stone-700 hover:text-foreground hover:bg-stone-100/50"
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.title}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <Link href="/dashboard">
            <Button variant="outline" className="w-full border-stone-200 text-foreground text-xs gap-2 hover:bg-stone-50 transition-all rounded-xl shadow-sm">
              Back to Dashboard <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:ml-64 p-8 lg:p-16 max-w-5xl">
        
        {/* INTRODUCTION */}
        <section id="intro" className="mb-24 pt-8">
          <Badge className="mb-4 bg-orange-100 text-orange-700 hover:bg-orange-200 border-none px-4 py-1.5 font-bold rounded-full">Quickstart</Badge>
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight text-foreground">Integrating MockPay</h1>
          <p className="text-lg text-stone-700 leading-relaxed mb-8">
            MockPay is a developer-first tool designed to help you build and test your payment integrations without ever 
            touching real money. Our API mimics the workflow of Stripe and Razorpay, allowing you to prototype checkouts, 
            subscriptions, and webhook handlers in minutes.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div className="p-8 rounded-[2rem] border-none bg-white/40 neu-flat backdrop-blur-sm">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-orange-600" /> API First
              </h3>
              <p className="text-sm text-stone-700 leading-relaxed">All features are accessible via our REST API. Perfect for backend-to-backend integrations.</p>
            </div>
            <div className="p-8 rounded-[2rem] border-none bg-white/40 neu-flat backdrop-blur-sm">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Webhook className="w-4 h-4 text-amber-600" /> Webhook Testing
              </h3>
              <p className="text-sm text-stone-700 leading-relaxed">Simulate events like payment succcess locally or on your staging server with signed payloads.</p>
            </div>
          </div>
        </section>

        <hr className="border-white/5 mb-24" />

        {/* AUTHENTICATION */}
        <section id="auth" className="mb-24">
          <h2 className="text-3xl font-extrabold mb-6 text-foreground tracking-tight">Authentication</h2>
          <p className="text-stone-700 mb-6 leading-relaxed">
            The MockPay API uses API keys to authenticate requests. You can view and manage your API keys in the 
            <Link href="/dashboard/api-keys" className="text-orange-600 hover:underline font-bold ml-1">Dashboard</Link>.
          </p>
          <p className="text-stone-700 mb-6 leading-relaxed">
            Authentication is performed via the <code className="text-orange-700 font-mono bg-orange-50 px-2 py-0.5 rounded">Authorization</code> header using the Bearer scheme.
          </p>

          <CodePanel 
            id="curl-auth"
            language="curl"
            code={`curl -X GET "http://localhost:4000/api/projects" \\
  -H "Authorization: Bearer sk_test_your_key_here"`}
          />
          
          <div className="mt-8 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm text-orange-200">
            <p className="font-bold mb-1 italic opacity-80">Important:</p>
            Your Secret Keys (sk_test_...) carry significant privileges. Keep them secure and never share them in client-side code or public repositories.
          </div>
        </section>

        <hr className="border-white/5 mb-24" />

        {/* CREATE PAYMENT */}
        <section id="create-payment" className="mb-24">
          <Badge className="mb-2 bg-orange-100 text-orange-700 border-none font-bold">POST /api/payments</Badge>
          <h2 className="text-4xl font-extrabold mb-6 text-foreground tracking-tight">Create a Payment</h2>
          <p className="text-stone-700 mb-6 leading-relaxed">
            To start a simulation flow, create a payment intent. This returns a <code className="text-orange-700 font-bold">payment_url</code> 
            which you should redirect your customer to.
          </p>

          <h3 className="text-lg font-bold mb-4 text-white/90">Request Body Parameters</h3>
          <div className="space-y-4 mb-8">
            <div className="flex border-b border-stone-100 pb-3">
              <div className="w-32 font-mono text-sm text-orange-600 font-bold">amount</div>
              <div className="flex-1 text-sm text-stone-700">Required. Amount in cents (e.g., 2000 for $20.00)</div>
            </div>
            <div className="flex border-b border-stone-100 pb-3">
              <div className="w-32 font-mono text-sm text-orange-600 font-bold">currency</div>
              <div className="flex-1 text-sm text-stone-700">Optional. Three-letter ISO code. Defaults to INR.</div>
            </div>
            <div className="flex border-b border-stone-100 pb-3">
              <div className="w-32 font-mono text-sm text-orange-600 font-bold">order_id</div>
              <div className="flex-1 text-sm text-stone-700">Required. Your internal reference ID.</div>
            </div>
          </div>

          <CodePanel 
            id="node-payment"
            language="javascript (nodejs)"
            code={`const axios = require('axios');

const createPayment = async () => {
  const response = await axios.post('http://localhost:4000/api/payments', {
    amount: 2500,
    currency: 'USD',
    order_id: 'order_12345',
    description: 'Fresh Pizza Order'
  }, {
    headers: { 'Authorization': 'Bearer sk_test_...' }
  });

  console.log('Redirect user to:', response.data.payment_url);
};`}
          />
        </section>

        <hr className="border-white/5 mb-24" />

        {/* WEBHOOKS */}
        <section id="webhooks" className="mb-24">
          <h2 className="text-4xl font-extrabold mb-6 text-foreground tracking-tight">Webhook Delivery</h2>
          <p className="text-stone-700 mb-6 leading-relaxed">
            MockPay sends HTTP POST requests to your server when payment events occur. You can configure your 
            webhook endpoints in the <Link href="/dashboard/webhooks" className="text-orange-600 hover:underline font-bold ml-1">Settings</Link>.
          </p>

          <h3 className="text-lg font-bold mb-4 text-white/90">Event Types</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            <div className="px-3 py-2 rounded bg-white/5 text-xs font-mono text-green-400 border border-white/5">payment.created</div>
            <div className="px-3 py-2 rounded bg-white/5 text-xs font-mono text-green-400 border border-white/5">payment.success</div>
            <div className="px-3 py-2 rounded bg-white/5 text-xs font-mono text-red-400 border border-white/5">payment.failed</div>
            <div className="px-3 py-2 rounded bg-white/5 text-xs font-mono text-stone-600 border border-white/5">payment.cancelled</div>
          </div>

          <h3 className="text-lg font-bold mb-4 text-foreground tracking-tight">Verifying Signatures</h3>
          <p className="text-sm text-stone-700 mb-6 leading-relaxed">
            Each request includes a <code className="text-orange-700 font-bold">X-MockPay-Signature</code> header. Use your webhook 
            signing secret to verify that the request came from us.
          </p>

          <CodePanel 
            id="webhook-verify"
            language="javascript (express)"
            code={`const crypto = require('crypto');

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-mockpay-signature'];
  const secret = 'whsec_...'; // Your webhook secret

  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(req.body)).digest('hex');

  if (signature === \`sha256=\${digest}\`) {
    console.log('Valid Webhook:', req.body.type);
    res.status(200).send('Verified');
  } else {
    res.status(401).send('Invalid Signature');
  }
});`}
          />
        </section>

        <footer className="text-center pt-12 pb-24 border-t border-white/5">
          <p className="text-stone-700 text-sm mb-4 italic">Happy coding! Need help? Open an issue on GitHub.</p>
          <div className="flex justify-center gap-4">
            <Link href="https://github.com/mockpay" className="text-stone-600 hover:text-white transition-colors">
              <Code2 className="w-5 h-5" />
            </Link>
          </div>
        </footer>

      </main>
    </div>
  );
}

