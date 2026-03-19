"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Terminal, Zap, CreditCard, Webhook, Code2,
  Copy, Check, X, Star, Bell, ChevronRight, ExternalLink
} from "lucide-react";

// ─── Animation Variants ─────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({ 
    opacity: 1, 
    y: 0, 
    transition: { 
      delay: i * 0.08, 
      duration: 0.5, 
      ease: "easeOut" as const
    } 
  }),
};
const stagger: Variants = { 
  visible: { 
    transition: { 
      staggerChildren: 0.1 
    } 
  } 
};

// ─── Component: Animated Code Block ─────────────────────
function CodeBlock({ code, lang = "javascript", id }: { code: string; lang?: string; id: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded-xl bg-[#060910] border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{lang}</span>
        <button onClick={copy} className="text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-xs">
          {copied ? <><Check className="w-3 h-3 text-green-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <pre className="p-5 text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Component: Tweet Card ───────────────────────────────
function Tweet({ handle, name, text, avatar }: { handle: string; name: string; text: string; avatar: string }) {
  return (
    <motion.div variants={fadeUp} className="rounded-2xl border border-white/10 bg-[#111118]/80 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-500 text-white font-bold text-sm">{avatar}</div>
        <div>
          <div className="font-semibold text-sm text-white">{name}</div>
          <div className="text-xs text-gray-500">@{handle}</div>
        </div>
        <div className="ml-auto text-blue-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
        </div>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const [copied, setCopied] = useState(false);
  const [yearly, setYearly] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [notified, setNotified] = useState(false);

  const heroCode = `import { SandboxPay } from '@utkarsh_raj32/sandboxpay-js';

const sp = new SandboxPay('sk_test_...');

// Create a simulated payment
const payment = await sp.payments.create({
  amount: 50000,  // ₹500.00
  currency: 'INR',
  order_id: 'order_59f8a',
});

// Redirect your user
window.location.href = payment.payment_url;`;

  const webhookCode = `// Verify the webhook signature
const sig = req.headers['x-sandboxpay-signature'];
const isValid = SandboxPay.verifyWebhook(
  req.body,
  sig,
  process.env.WEBHOOK_SECRET
);

if (isValid && req.body.type === 'payment.success') {
  await fulfillOrder(req.body.data.order_id);
}`;

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0f] text-white selection:bg-primary/30 overflow-x-hidden">

      {/* ── Product Hunt Banner ─────────────────────────── */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-50 bg-gradient-to-r from-primary/80 via-purple-600/80 to-indigo-600/80 overflow-hidden"
          >
            <div className="container mx-auto max-w-6xl px-4 py-2 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <span className="font-semibold">🚀 Launching soon on Product Hunt!</span>
              
              {notified ? (
                <div className="flex items-center gap-2 text-green-200 font-medium">
                  <Check className="w-4 h-4" /> You're on the list!
                </div>
              ) : (
                <form 
                  onSubmit={(e) => { e.preventDefault(); setNotified(true); }}
                  className="flex items-center gap-2"
                >
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    required 
                    className="h-7 rounded-sm border-none px-2 text-xs text-black outline-none w-48"
                  />
                  <button
                    type="submit"
                    className="rounded-sm bg-white text-black px-3 py-1.5 text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Bell className="w-3 h-3" /> Notify Me
                  </button>
                </form>
              )}

              <button onClick={() => setShowBanner(false)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NAVBAR ──────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white shadow-[0_0_12px_rgba(124,58,237,0.5)]">S</div>
            <span className="text-xl font-bold tracking-tight">SandboxPay</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden md:block text-sm font-medium text-gray-400 hover:text-white transition-colors">Log in</Link>
            <Link href="/sign-up">
              <Button className="bg-primary hover:bg-primary/90 text-white border-0 shadow-[0_0_20px_rgba(124,58,237,0.3)] h-9">
                Get API Keys <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── HERO ─────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-24 pb-32">
          {/* Background grid + glow */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/20 rounded-full blur-[140px] opacity-40 pointer-events-none" />

          <motion.div initial="hidden" animate="visible" variants={stagger} className="container relative mx-auto max-w-6xl px-4 text-center">
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="mb-6 rounded-full border-primary/30 bg-primary/10 px-4 py-1.5 text-primary text-xs">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
                No KYC · No Real Money · Free Forever
              </Badge>
            </motion.div>

            <motion.h1 variants={fadeUp} className="mx-auto max-w-4xl text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none">
              Debug and Test Payment Systems{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-indigo-400">
                Without KYC
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-lg md:text-xl text-gray-400 mb-10 leading-relaxed">
              The fastest way to simulate Stripe, Razorpay, and PayPal flows for demos, testing, and development.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link href="/sign-up">
                <Button size="lg" className="h-14 px-8 text-base bg-primary hover:bg-primary/90 text-white rounded-full shadow-[0_0_35px_rgba(124,58,237,0.4)]">
                  Get API Keys in 10 Seconds <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full border-white/20 hover:bg-white/5 text-white bg-transparent gap-2">
                  <Code2 className="h-4 w-4" /> View Demo
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="mb-20 flex justify-center">
              <div 
                className="flex items-center gap-3 text-sm font-mono text-gray-400 bg-[#111118]/80 backdrop-blur-xl px-4 py-2.5 rounded-full border border-white/10 cursor-pointer hover:border-white/20 hover:text-gray-300 transition-all active:scale-95"
                onClick={() => {
                  navigator.clipboard.writeText("npm i @utkarsh_raj32/sandboxpay-js");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                <Terminal className="w-4 h-4 text-purple-400" />
                <span>npm i @utkarsh_raj32/sandboxpay-js</span>
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </div>
            </motion.div>

            {/* Code + UI Preview */}
            <motion.div variants={fadeUp} className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-[#111118]/80 p-2 backdrop-blur-xl shadow-2xl">
              <div className="flex flex-col md:flex-row rounded-xl overflow-hidden bg-black/40 border border-white/5">
                {/* Code Window */}
                <div className="w-full md:w-1/2 p-4 font-mono text-sm border-b md:border-b-0 md:border-r border-white/10">
                  <div className="flex gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="text-xs text-gray-400 text-left leading-7">
                    <span className="text-purple-400">import</span> {"{ SandboxPay }"} <span className="text-purple-400">from</span> <span className="text-green-300">'@utkarsh_raj32/sandboxpay-js'</span>;<br />
                    <br />
                    <span className="text-slate-400">// Create a simulated payment 💸</span><br />
                    <span className="text-purple-400">const</span> payment = <span className="text-purple-400">await</span> sp.payments.create({"{"}<br />
                    &nbsp;&nbsp;amount: <span className="text-orange-300">50000</span>,&nbsp;<span className="text-slate-400">// ₹500</span><br />
                    &nbsp;&nbsp;currency: <span className="text-green-300">'INR'</span>,<br />
                    &nbsp;&nbsp;order_id: <span className="text-green-300">'order_59f8a'</span><br />
                    {"}"});<br />
                    <br />
                    window.location.href = payment.<span className="text-blue-300">payment_url</span>;
                  </div>
                </div>
                {/* Dashboard Mockup */}
                <div className="w-full md:w-1/2 p-6 bg-[#0a0a0f]/50 flex items-center justify-center">
                  <div className="w-full max-w-sm bg-[#111118] border border-white/10 rounded-xl p-5 shadow-xl">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">SandboxPay Checkout</p>
                        <p className="font-bold text-lg">₹500.00</p>
                      </div>
                      <Badge className="bg-primary/20 text-primary border-none text-[10px]">TEST MODE</Badge>
                    </div>
                    {[
                      { label: "Card number", value: "4242 4242 4242 4242", success: true },
                      { label: "Expiry", value: "12 / 28" },
                      { label: "CVV", value: "•••" },
                    ].map((field) => (
                      <div key={field.label} className={`h-10 w-full rounded-md border flex items-center px-3 mb-2 ${field.success ? "border-green-500/40 bg-green-500/5" : "border-white/10 bg-white/5"}`}>
                        <CreditCard className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-400">{field.value}</span>
                        {field.success && <Check className="w-4 h-4 text-green-400 ml-auto" />}
                      </div>
                    ))}
                    <Button className="w-full bg-primary hover:bg-primary/90 mt-3 text-sm">Simulate Payment ✓</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ── SOCIAL PROOF ─────────────────────────────── */}
        <section className="py-16 border-y border-white/5 bg-black/20">
          <div className="container mx-auto px-4 max-w-6xl">
            <p className="text-center text-sm font-medium text-gray-500 mb-10 uppercase tracking-widest">Perfect for builders at</p>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-60">
              {["Hackathons", "SaaS MVPs", "College Projects", "Startup Prototypes"].map((label) => (
                <div key={label} className="text-lg font-bold tracking-tight text-white">{label}</div>
              ))}
            </div>
            <p className="text-center text-gray-500 text-sm mt-10">Simulate <span className="text-white font-semibold">thousands of payments</span> without processing a single real rupee.</p>
          </div>
        </section>

        {/* ── DEV MEMES (Viral Element) ───────────────── */}
        <section className="py-32 overflow-hidden">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}>
                <h2 className="text-4xl font-bold mb-6">Built by developers <br />who hate paperwork.</h2>
                <div className="space-y-4">
                  {[
                    "Stripe: 'We need your birth certificate and a photo of your cat.'",
                    "Razorpay: 'Please upload a 4K video of you doing a backflip.'",
                    "SandboxPay: 'sk_test_... go brrr 🚀'"
                  ].map((text, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="mt-1 h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                        {i + 1}
                      </div>
                      <p className="text-gray-400 font-mono text-sm italic">"{text}"</p>
                    </div>
                  ))}
                </div>
              </motion.div>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full" />
                <div className="relative p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl">
                  <div className="flex gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="font-mono text-xs space-y-2">
                    <p className="text-blue-400"># Thoughts while waiting for KYC</p>
                    <p className="text-gray-500">while (waiting_for_kyc) &#123;</p>
                    <p className="text-gray-300 ml-4">coding_motivation.drop();</p>
                    <p className="text-gray-300 ml-4">hair_loss++;</p>
                    <p className="text-gray-300 ml-4">is_hackathon_over = true;</p>
                    <p className="text-gray-500">&#125;</p>
                    <p className="text-green-400 mt-4">// Use SandboxPay instead</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PROBLEM SECTION ──────────────────────────── */}
        <section className="py-32">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-red-500/15 text-red-400 border-none">The Problem</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Testing Payments Should Not Require KYC</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Real payment gateways are a nightmare to onboard. We built SandboxPay so you can test everything first.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-4 px-4 text-left text-gray-400 font-normal">Feature</th>
                    {["Stripe", "Razorpay", "SandboxPay"].map((col, i) => (
                      <th key={col} className={`py-4 px-4 text-center font-bold ${i === 2 ? "text-primary" : "text-white"}`}>
                        {col} {i === 2 && <span className="text-xs align-middle ml-1 text-primary/70">← you're here</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "KYC Required", stripe: "✗", razorpay: "✗", sandbox: "✓" },
                    { feature: "Real bank account", stripe: "✗", razorpay: "✗", sandbox: "✓" },
                    { feature: "Student-friendly", stripe: "✗", razorpay: "✗", sandbox: "✓" },
                    { feature: "Instant API Keys", stripe: "~", razorpay: "~", sandbox: "✓" },
                    { feature: "Webhook Testing", stripe: "✓", razorpay: "✓", sandbox: "✓" },
                    { feature: "Free forever plan", stripe: "~", razorpay: "~", sandbox: "✓" },
                  ].map((row) => (
                    <tr key={row.feature} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="py-4 px-4 text-gray-300">{row.feature}</td>
                      {[row.stripe, row.razorpay, row.sandbox].map((val, i) => (
                        <td key={i} className={`py-4 px-4 text-center font-bold ${val === "✓" ? (i === 2 ? "text-green-400" : "text-green-400/60") : val === "✗" ? "text-red-400" : "text-gray-500"}`}>{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────── */}
        <section id="features" className="py-32 bg-black/20 border-t border-white/5">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-primary/20 text-primary border-none">Features</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need. Nothing you don't.</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Skip the merchant accounts and bank verification. Get straight to coding your integration.</p>
            </div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 gap-6">
              {[
                { icon: Zap, heading: "Instant API Keys", text: "Sign up and copy your keys in seconds. No business verification. No waiting period.", color: "text-yellow-400", bg: "bg-yellow-400/10" },
                { icon: CreditCard, heading: "Payment Simulation", text: "Use magic test cards (4242...) to simulate success, declines, and pending states. End-to-end.", color: "text-blue-400", bg: "bg-blue-400/10" },
                { icon: Webhook, heading: "Webhook Testing", text: "We fire real signed HTTP POST events to your local dev server with exponential-backoff retry.", color: "text-orange-400", bg: "bg-orange-400/10" },
                { icon: Terminal, heading: "Hosted Checkout", text: "A beautiful Stripe-like hosted checkout page at /pay/:id — zero frontend code required.", color: "text-green-400", bg: "bg-green-400/10" },
              ].map((f, i) => (
                <motion.div key={i} variants={fadeUp} custom={i} className="group relative rounded-2xl border border-white/10 bg-[#111118]/50 p-8 hover:bg-[#111118] transition-all hover:border-white/20">
                  <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${f.bg} ${f.color}`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{f.heading}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">{f.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────── */}
        <section id="how-it-works" className="py-32">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-green-500/20 text-green-400 border-none">Simple Setup</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready in under 3 minutes</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "01", heading: "Create a Project", text: "Sign up, create a project, and organize all your API keys in one place.", icon: Terminal },
                { step: "02", heading: "Copy Your API Key", text: "Generate a sk_test_... key instantly and use it in any HTTP client or SDK.", icon: Code2 },
                { step: "03", heading: "Simulate Payments", text: "Use the hosted checkout or call our API directly. Watch events in your dashboard live.", icon: Zap },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="relative p-8 rounded-2xl border border-white/10 bg-[#111118]/50"
                >
                  <div className="text-5xl font-extrabold text-white/5 mb-4 leading-none">{item.step}</div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary mb-4">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.heading}</h3>
                  <p className="text-sm text-gray-400">{item.text}</p>
                  {i < 2 && <ChevronRight className="absolute -right-4 top-1/2 -translate-y-1/2 text-white/20 hidden md:block" />}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEV EXPERIENCE / CODE ────────────────────── */}
        <section className="py-32 bg-black/20 border-t border-white/5">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-none">Developer Experience</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Copy, Paste, Ship.</h2>
              <p className="text-gray-400">You're 5 lines away from a working payment flow.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-3">Create a payment (Node.js)</p>
                <CodeBlock id="hero-code" lang="javascript" code={heroCode} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400 mb-3">Verify a webhook (Express)</p>
                <CodeBlock id="webhook-code" lang="javascript" code={webhookCode} />
              </div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ─────────────────────────────── */}
        <section className="py-32">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by developers building demos and MVPs</h2>
            </div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-3 gap-6">
              <Tweet handle="vivek_dev" name="Vivek Sharma" avatar="VS" text="Set up a full payment flow for my hackathon project in 8 minutes. No KYC, no waiting. SandboxPay is an absolute cheat code 🙌" />
              <Tweet handle="ananya_builds" name="Ananya Patel" avatar="AP" text="I wasted 3 days trying to get a Razorpay test account. SandboxPay gave me working API keys in literally 10 seconds. Why doesn't everyone use this?" />
              <Tweet handle="startup_raj" name="Raj Mehta" avatar="RM" text="Used SandboxPay to demo our SaaS to investors. They loved the checkout page. They didn't even know it was a simulator 👀" />
            </motion.div>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────── */}
        <section id="pricing" className="py-32 bg-black/20 border-t border-white/5">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <Badge className="mb-4 bg-primary/20 text-primary border-none">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for students and indie hackers</h2>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-3 mb-12 mt-8">
              <span className={`text-sm ${!yearly ? "text-white" : "text-gray-400"}`}>Monthly</span>
              <button
                onClick={() => setYearly(!yearly)}
                className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? "bg-primary" : "bg-white/20"}`}
              >
                <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${yearly ? "translate-x-6" : ""}`} />
              </button>
              <span className={`text-sm ${yearly ? "text-white" : "text-gray-400"}`}>
                Yearly <Badge className="ml-1 text-[10px] bg-green-500/20 text-green-400 border-none">Save 40%</Badge>
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-8 text-left">
              {/* Hobby */}
              <div className="rounded-2xl border border-white/10 bg-[#111118]/80 p-8">
                <h3 className="text-2xl font-bold mb-1">Hobby</h3>
                <p className="text-gray-400 text-sm mb-6">For individuals building side projects.</p>
                <div className="mb-6"><span className="text-4xl font-extrabold">$0</span><span className="text-gray-400 ml-1">/ forever</span></div>
                <ul className="mb-8 space-y-3 text-sm">
                  {["1,000 simulated payments/month", "Full webhook testing", "Hosted checkout page", "Public API access", "Community support"].map((f) => (
                    <li key={f} className="flex items-center text-gray-300 gap-2"><Check className="h-4 w-4 text-green-400 shrink-0" />{f}</li>
                  ))}
                </ul>
                <Link href="/sign-up" className="block"><Button className="w-full bg-white text-black hover:bg-gray-200">Start Building Free</Button></Link>
              </div>

              {/* Pro */}
              <div className="rounded-2xl border border-primary/40 bg-[#111118] p-8 relative shadow-[0_0_40px_rgba(124,58,237,0.15)]">
                <div className="absolute top-0 right-6 -translate-y-1/2">
                  <Badge className="bg-primary text-white border-none px-3 py-1">Most Popular</Badge>
                </div>
                <h3 className="text-2xl font-bold mb-1">Pro Prototype</h3>
                <p className="text-gray-400 text-sm mb-6">For growing teams and freelancers.</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">${yearly ? "3" : "5"}</span>
                  <span className="text-gray-400 ml-1">/ month</span>
                  {yearly && <span className="text-xs text-green-400 ml-2">billed yearly</span>}
                </div>
                <ul className="mb-8 space-y-3 text-sm">
                  {["Unlimited simulated payments", "Extended webhook retry logs", "Custom checkout branding", "Multiple team projects", "Priority support"].map((f) => (
                    <li key={f} className="flex items-center text-gray-300 gap-2"><Check className="h-4 w-4 text-primary shrink-0" />{f}</li>
                  ))}
                </ul>
                <Button className="w-full bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.3)]">It's a demo — don't pay us 😄</Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────── */}
        <section className="py-40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-indigo-900/10" />
          <div className="container relative mx-auto max-w-4xl px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                Stop Fighting<br />Payment Gateways.
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">Build and test payment flows in minutes. No bank account required.</p>
              <Link href="/sign-up">
                <Button size="lg" className="h-16 px-12 text-lg bg-white text-black hover:bg-gray-200 rounded-full transition-all hover:scale-105 shadow-2xl">
                  Start Building for Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="mt-6 text-sm text-gray-600">No credit card required · Free forever plan</p>
            </motion.div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#050508] py-16 text-sm text-gray-500">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-primary font-bold text-white text-xs">S</div>
                <span className="font-bold text-gray-300">SandboxPay</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">Built for developers who just want things to work. No KYC. No drama.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
              <div>
                <h4 className="text-gray-300 font-medium mb-4">Product</h4>
                <ul className="space-y-3">
                  <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                  <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-gray-300 font-medium mb-4">Developers</h4>
                <ul className="space-y-3">
                  <li><Link href="/docs" className="hover:text-white transition-colors">API Reference</Link></li>
                  <li><Link href="/docs" className="hover:text-white transition-colors">Quickstart</Link></li>
                  <li><Link href="https://github.com/mockpay" className="hover:text-white transition-colors">GitHub</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-gray-300 font-medium mb-4">Company</h4>
                <ul className="space-y-3">
                  <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Twitter</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p>© 2025 SandboxPay. All rights reserved.</p>
            <p className="italic">Built for developers who just want things to work. ✌️</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
