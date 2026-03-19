"use client";

import { useState, useEffect, useRef, Suspense, lazy, MouseEvent as ReactMouseEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Terminal, Zap, CreditCard, Webhook, Code2, Copy, Check, X, Star, ExternalLink, Cpu, GitBranch, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Lazy load the heavy 3D scene ─────────────────────────────
const PaymentFlowScene = dynamic(
  () => import("@/components/PaymentFlowScene").then((m) => m.PaymentFlowScene),
  { ssr: false, loading: () => <div className="w-full h-full" /> }
);

// ── useMousePosition hook ─────────────────────────────────────
function useMousePosition() {
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  return mouse;
}

// ── Ripple button ─────────────────────────────────────────────
function RippleButton({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "ghost" }) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const idRef = useRef(0);
  const handleClick = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = ++idRef.current;
    setRipples((r) => [...r, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);
    setTimeout(() => setRipples((r) => r.filter((rr) => rr.id !== id)), 700);
  };
  const base = "relative overflow-hidden rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 px-6 py-3 select-none";
  const variants = {
    primary: "bg-white text-black hover:bg-white/90 hover:scale-[1.03] shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:shadow-[0_0_50px_rgba(124,58,237,0.6)]",
    ghost: "border border-white/20 text-white hover:border-white/50 hover:bg-white/5",
  };
  return (
    <Link href={href} className={`${base} ${variants[variant]}`} onClick={handleClick}>
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full bg-white/30 animate-ping pointer-events-none"
          style={{ width: 120, height: 120, left: r.x - 60, top: r.y - 60 }}
        />
      ))}
      {children}
    </Link>
  );
}

// ── Code block with copy ──────────────────────────────────────
function CodeBlock({ code, lang = "javascript" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group rounded-xl bg-black/70 border border-white/10 overflow-hidden backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          <span className="ml-3 text-[10px] font-mono text-gray-500 uppercase tracking-widest">{lang}</span>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-xs"
        >
          {copied ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <pre className="p-5 text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed">
        <code dangerouslySetInnerHTML={{ __html: code }} />
      </pre>
    </div>
  );
}

// ── Glow card with tilt effect ────────────────────────────────
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
    const glare = ref.current.querySelector<HTMLSpanElement>(".glare");
    if (glare) {
      glare.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,0.08) 0%, transparent 70%)`;
    }
  };
  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    <div
      ref={ref}
      className={`relative rounded-2xl border border-white/10 bg-[#0d0d14]/80 backdrop-blur-md transition-transform duration-200 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <span className="glare absolute inset-0 rounded-2xl pointer-events-none transition-all duration-150" />
      {children}
    </div>
  );
}

// ── Flow Step Label ───────────────────────────────────────────
function FlowLabel({ label, color, status }: { label: string; color: string; status: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-xs font-bold tracking-widest uppercase`} style={{ color }}>
        {label}
      </div>
      <div className="text-[10px] text-gray-600">{status}</div>
    </div>
  );
}

const HERO_CODE = `import SandboxPay from '@utkarsh_raj32/sandboxpay-js';

const client = new SandboxPay('sk_test_...');

// Create a test payment in milliseconds
const payment = await client.payments.create({
  amount: 49900,         // ₹499.00
  currency: 'INR',
  order_id: 'order_001',
  webhook_url: 'https://yourapp.com/webhook'
});

// Share the hosted checkout link
console.log(payment.payment_url);
// → https://sandboxpay.io/pay/pay_x9k2...`;

const WEBHOOK_CODE = `// Verify & handle webhook events securely
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const event = client.webhooks.constructEvent(
    req.body, req.headers['x-sandboxpay-signature']
  );
  
  if (event.type === 'payment.success') {
    console.log('✅ Payment succeeded:', event.data.order_id);
  }
  
  res.json({ received: true });
});`;

const features = [
  { icon: Zap, title: "Instant Checkout", desc: "Generate a hosted payment page in one API call — no KYC, no bank approval, no waiting.", color: "#a78bfa" },
  { icon: Webhook, title: "Webhook Engine", desc: "Real-time delivery with retry logic, exponential backoff, and a full replay inspector.", color: "#60a5fa" },
  { icon: Code2, title: "Node.js SDK", desc: "Type-safe SDK that feels like Stripe. Ship integrations in minutes, not days.", color: "#34d399" },
  { icon: GitBranch, title: "Flow Studio", desc: "Visually design multi-step scenarios: Created → Processing → Refunded, all without code.", color: "#f59e0b" },
  { icon: Activity, title: "Live Debugger", desc: "Inspect every payload, header, and response in real-time as events flow through your system.", color: "#f43f5e" },
  { icon: Cpu, title: "Zero Config", desc: "Spin up in 60 seconds. No accounts to link, no servers to deploy, no compliance gatekeepers.", color: "#06b6d4" },
];

export default function LandingPage() {
  const mouse = useMousePosition();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.2], [0, -40]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const [showBanner, setShowBanner] = useState(true);
  const [email, setEmail] = useState("");
  const [notified, setNotified] = useState(false);

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Animated background blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-violet-700/10 blur-[120px] animate-pulse" style={{ animationDuration: "6s" }} />
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[120px] animate-pulse" style={{ animationDuration: "8s", animationDelay: "2s" }} />
        <div className="absolute bottom-[0%] left-[-5%] w-[400px] h-[400px] rounded-full bg-emerald-600/6 blur-[100px] animate-pulse" style={{ animationDuration: "10s", animationDelay: "4s" }} />
      </div>

      {/* ── Product Hunt Banner ── */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-50 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-violet-900/80 via-purple-800/80 to-violet-900/80 border-b border-violet-500/30 backdrop-blur-sm px-4 py-2.5 flex items-center justify-center gap-3 text-sm">
              <span className="text-amber-400 text-base">🚀</span>
              <span className="text-gray-200">
                We're launching on <strong className="text-white">Product Hunt</strong> — be the first to know!
              </span>
              {!notified ? (
                <form onSubmit={(e) => { e.preventDefault(); setNotified(true); }} className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-400 w-44"
                  />
                  <button type="submit" className="bg-violet-500 hover:bg-violet-400 text-white rounded-lg px-3 py-1 text-xs font-bold transition-colors">Notify me</button>
                </form>
              ) : (
                <span className="text-green-400 text-xs font-bold">✓ You're on the list!</span>
              )}
              <button onClick={() => setShowBanner(false)} className="ml-2 text-gray-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navbar ── */}
      <nav className="relative z-40 border-b border-white/5 backdrop-blur-xl bg-black/20 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold">S</div>
            SandboxPay
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <a href="https://github.com/Garrur/MockPay" target="_blank" className="hover:text-white transition-colors flex items-center gap-1">GitHub <ExternalLink className="w-3 h-3" /></a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">Sign in</Link>
            <Link href="/sign-up" className="bg-white text-black text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/90 transition-all hover:scale-105">
              Get started →
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════ */}
      {/* HERO SECTION ══════════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden">
        
        {/* 3D Canvas — fills the background BEHIND text */}
        <div className="absolute inset-0 z-0">
          <PaymentFlowScene mouse={mouse} />
        </div>

        {/* Subtle radial vignette over the scene */}
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,transparent_0%,#050508_70%)] pointer-events-none" />

        {/* Flow step labels — floated above canvas */}
        <motion.div
          style={{ y, opacity }}
          className="relative z-20 flex gap-24 mb-2 mt-32 sm:mt-0 hidden md:flex"
        >
          <FlowLabel label="Created" color="#60a5fa" status="pk_test_..." />
          <FlowLabel label="Processing" color="#a78bfa" status="~120ms" />
          <FlowLabel label="Success" color="#34d399" status="200 OK" />
        </motion.div>

        {/* Hero content */}
        <div className="relative z-20 text-center max-w-4xl mt-8 md:mt-0">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300 mb-8 backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Zero KYC · Node.js SDK · Stripe-Like DX
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.04] mb-6"
          >
            Debug and Test
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Payment Systems
            </span>
            <br />
            Without KYC.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            The fastest way to simulate Stripe, Razorpay, and PayPal flows for demos, testing, and development. 
            Spin up a hosted checkout in one API call.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <RippleButton href="/sign-up">
              Start for free <ArrowRight className="w-4 h-4" />
            </RippleButton>
            <RippleButton href="/docs" variant="ghost">
              <Terminal className="w-4 h-4" /> Read the docs
            </RippleButton>
          </motion.div>

          {/* SDK install snippet */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 flex justify-center"
          >
            <NpmInstallBadge />
          </motion.div>
        </div>

        {/* Bottom gradient fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050508] to-transparent z-20 pointer-events-none" />
      </section>

      {/* ══════════════════════════════════════════ */}
      {/* CODE SHOWCASE ═══════════════════════════ */}
      {/* ══════════════════════════════════════════ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Build in{" "}
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                minutes
              </span>
              , not days.
            </h2>
            <p className="text-gray-400 text-lg">Two snippets. That's all it takes to simulate a full payment lifecycle.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <TiltCard className="p-6 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-bold text-gray-300">Create a payment</span>
                </div>
                <CodeBlock code={HERO_CODE} lang="node.js" />
              </TiltCard>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
              <TiltCard className="p-6 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Webhook className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold text-gray-300">Handle webhooks</span>
                </div>
                <CodeBlock code={WEBHOOK_CODE} lang="express.js" />
              </TiltCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ */}
      {/* FEATURES GRID ═══════════════════════════ */}
      {/* ══════════════════════════════════════════ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">Everything you need.</h2>
            <p className="text-gray-400 text-lg">One platform, zero surprises.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <TiltCard className="p-6 hover:border-white/20 transition-all group">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                    style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}
                  >
                    <f.icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ */}
      {/* PRICING ═════════════════════════════════ */}
      {/* ══════════════════════════════════════════ */}
      <section id="pricing" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">Simple pricing.</h2>
            <p className="text-gray-400 text-lg">No surprises. No KYC. Cancel anytime.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Hobby", price: "Free", desc: "Perfect for side projects and learning.", features: ["1,000 simulated payments/mo", "Hosted checkout", "3 demo links", "Community support"] },
              { name: "Pro", price: "₹999/mo", desc: "For serious developers and startups.", features: ["Unlimited payments", "Webhook Debugger + Replayer", "Flow Testing Studio", "Priority support"], popular: true },
              { name: "Team", price: "₹2,499/mo", desc: "For engineering teams and agencies.", features: ["Everything in Pro", "5 team members", "Custom branding", "Dedicated Slack channel"] },
            ].map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <TiltCard className={`p-6 ${plan.popular ? "border-violet-500/50 shadow-[0_0_40px_rgba(124,58,237,0.15)]" : ""}`}>
                  {plan.popular && (
                    <div className="text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/30 rounded-full px-3 py-1 inline-block mb-4">Most Popular</div>
                  )}
                  <h3 className="text-xl font-extrabold text-white mb-1">{plan.name}</h3>
                  <div className="text-3xl font-extrabold text-white mb-1">{plan.price}</div>
                  <p className="text-gray-500 text-sm mb-6">{plan.desc}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((ft) => (
                      <li key={ft} className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-violet-400 shrink-0" /> {ft}
                      </li>
                    ))}
                  </ul>
                  {plan.name === "Hobby" ? (
                    <Link
                      href="/sign-up"
                      className="w-full flex justify-center items-center py-2.5 rounded-xl font-bold text-sm transition-all border border-white/10 text-white hover:bg-white/5"
                    >
                      Get started
                    </Link>
                  ) : (
                    <div
                      className={`w-full flex justify-center items-center py-2.5 rounded-xl font-bold text-sm cursor-default select-none gap-2 ${plan.popular ? "bg-violet-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]" : "bg-white/5 border border-white/10 text-white"}`}
                    >
                      It's a demo — don't pay us 😅
                    </div>
                  )}
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ */}
      {/* CTA ══════════════════════════════════════ */}
      {/* ══════════════════════════════════════════ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-900/20 to-[#050508] p-16 shadow-[0_0_80px_rgba(124,58,237,0.1)]">
              <div className="text-6xl mb-6">⚡</div>
              <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">
                Ship faster.<br />
                <span className="text-violet-400">Zero friction.</span>
              </h2>
              <p className="text-gray-400 text-lg mb-10">Make your first test payment in under 60 seconds. No card required.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <RippleButton href="/sign-up">
                  Start building for free <ArrowRight className="w-4 h-4" />
                </RippleButton>
                <RippleButton href="https://github.com/Garrur/MockPay" variant="ghost">
                  <Star className="w-4 h-4" /> Star on GitHub
                </RippleButton>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2 font-bold text-white">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[10px] font-bold">S</div>
            SandboxPay
          </div>
          <div>Built with ♥ by Utkarsh Raj · MIT License</div>
          <div className="flex gap-4">
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <a href="https://github.com/Garrur/MockPay" target="_blank" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── NPM Install Badge ─────────────────────────────────────────
function NpmInstallBadge() {
  const [copied, setCopied] = useState(false);
  const cmd = "npm install @utkarsh_raj32/sandboxpay-js";
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-3 bg-black/50 border border-white/10 rounded-xl px-5 py-2.5 text-sm font-mono text-gray-400 hover:border-violet-500/40 hover:text-white transition-all group backdrop-blur-sm"
    >
      <Terminal className="w-4 h-4 text-violet-400" />
      {cmd}
      <span className="text-gray-600 group-hover:text-violet-400 transition-colors">
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </span>
    </button>
  );
}
