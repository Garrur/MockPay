"use client";

import { useState, useEffect, useRef, Suspense, lazy, MouseEvent as ReactMouseEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Terminal, Zap, CreditCard, Webhook, Code2, Copy, Check, X, Star, ExternalLink, Cpu, GitBranch, Activity, ShieldAlert, Loader2 } from "lucide-react";
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
    primary: "bg-primary text-white hover:bg-primary/90 hover:scale-[1.03] shadow-[0_10px_25px_rgba(194,65,12,0.25)]",
    ghost: "bg-background text-foreground neu-flat hover:neu-convex",
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
    <div className="relative group rounded-2xl bg-[#0d0d12] overflow-hidden border border-stone-800 shadow-2xl neu-pressed-dark-container">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-stone-900/40 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1.5 px-1">
             <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
             <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
             <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <span className="ml-3 text-[10px] font-mono text-stone-700 uppercase tracking-widest">{lang}</span>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="text-stone-700 hover:text-white transition-colors flex items-center gap-1 text-xs"
        >
          {copied ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <pre className="p-6 text-sm font-mono text-[#d4d4d8] overflow-x-auto leading-relaxed scrollbar-thin scrollbar-thumb-stone-800">
        <code className="font-mono" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }} dangerouslySetInnerHTML={{ __html: code }} />
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
      className={`relative rounded-3xl bg-background transition-transform duration-200 ease-out neu-flat ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <span className="glare absolute inset-0 rounded-3xl pointer-events-none transition-all duration-150" />
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
      <div className="text-[10px] text-stone-800 font-bold">{status}</div>
    </div>
  );
}

const HERO_CODE = `<span style="color: #c678dd">import</span> MockPay <span style="color: #c678dd">from</span> <span style="color: #98c379">'@utkarsh_raj32/mockpay-js'</span>;

<span style="color: #c678dd">const</span> client = <span style="color: #c678dd">new</span> <span style="color: #e5c07b">MockPay</span>(<span style="color: #98c379">'sk_test_...'</span>);

<span style="color: #7f848e">// Create a test payment in milliseconds</span>
<span style="color: #c678dd">const</span> payment = <span style="color: #c678dd">await</span> client.payments.<span style="color: #61afef">create</span>({
  <span style="color: #d19a66">amount</span>: <span style="color: #d19a66">49900</span>,         <span style="color: #7f848e">// ₹499.00</span>
  <span style="color: #d19a66">currency</span>: <span style="color: #98c379">'INR'</span>,
  <span style="color: #d19a66">order_id</span>: <span style="color: #98c379">'order_001'</span>,
  <span style="color: #d19a66">webhook_url</span>: <span style="color: #98c379">'https://yourapp.com/webhook'</span>
});

<span style="color: #7f848e">// Share the hosted checkout link</span>
<span style="color: #e5c07b">console</span>.<span style="color: #61afef">log</span>(payment.payment_url);
<span style="color: #7f848e">// → https://mockpay.io/pay/pay_x9k2...</span>`;

const WEBHOOK_CODE = `<span style="color: #7f848e">// Verify & handle webhook events securely</span>
app.<span style="color: #61afef">post</span>(<span style="color: #98c379">'/webhook'</span>, express.<span style="color: #61afef">raw</span>({ <span style="color: #d19a66">type</span>: <span style="color: #98c379">'application/json'</span> }), (req, res) => {
  <span style="color: #c678dd">const</span> event = client.webhooks.<span style="color: #61afef">constructEvent</span>(
    req.body, req.headers[<span style="color: #98c379">'x-mockpay-signature'</span>]
  );
  
  <span style="color: #c678dd">if</span> (event.type === <span style="color: #98c379">'payment.success'</span>) {
    <span style="color: #e5c07b">console</span>.<span style="color: #61afef">log</span>(<span style="color: #98c379">'✅ Payment succeeded:'</span>, event.data.order_id);
  }
  
  res.<span style="color: #61afef">json</span>({ <span style="color: #d19a66">received</span>: <span style="color: #d19a66">true</span> });
});`;

const features = [
  { icon: Webhook, title: "Webhook Debugger", desc: "See exactly what your server receives. Inspect payloads, headers, and simulate events.", color: "#c2410c" },
  { icon: GitBranch, title: "Flow Simulator", desc: "Test every edge case visually. Force create payments, simulate delays, and trigger refunds.", color: "#b45309" },
  { icon: Zap, title: "Demo Links", desc: "Share payment flows instantly. Generate hosted checkouts for client demos in one click.", color: "#d97706" },
  { icon: Code2, title: "Node.js SDK", desc: "Type-safe SDK built for speed. Drop-in replacement for Stripe/Razorpay in your test environment.", color: "#059669" },
  { icon: Activity, title: "Live Inspector", desc: "Watch API calls and webhook deliveries stream in real-time as your app processes payments.", color: "#be123c" },
  { icon: Cpu, title: "Zero Setup", desc: "No KYC, no bank accounts, no compliance forms. Get a working API key in 5 seconds.", color: "#0e7490" },
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
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Animated background blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[20%] w-[1000px] h-[1000px] rounded-full bg-orange-300/25 blur-[160px] animate-pulse" style={{ animationDuration: "6s" }} />
        <div className="absolute top-[30%] right-[-10%] w-[800px] h-[800px] rounded-full bg-amber-300/15 blur-[150px] animate-pulse" style={{ animationDuration: "8s", animationDelay: "2s" }} />
        <div className="absolute bottom-[0%] left-[-5%] w-[800px] h-[800px] rounded-full bg-orange-200/10 blur-[140px] animate-pulse" style={{ animationDuration: "10s", animationDelay: "4s" }} />
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
            <div className="relative bg-white/40 backdrop-blur-2xl border-b border-orange-200/40 px-4 py-2 shadow-[0_0_15px_rgba(245,158,11,0.15)] flex justify-center">
              {/* Ambient mesh gradient overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(251,146,60,0.1),rgba(252,211,77,0.15),rgba(217,119,6,0.05))] pointer-events-none mix-blend-overlay"></div>
              
              {/* Single line strict flex container */}
              <div className="relative z-10 flex items-center justify-center gap-4 w-full whitespace-nowrap overflow-x-auto scrollbar-none hide-scrollbar">
                <span className="flex items-center gap-2 text-stone-950 font-extrabold text-sm shrink-0">
                  <span className="text-base">🚀</span>
                  We're launching on <strong className="font-black text-black">Product Hunt</strong> — be the first to know!
                </span>
                
                {!notified ? (
                  <form onSubmit={(e) => { e.preventDefault(); setNotified(true); }} className="flex items-center gap-2 shrink-0">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="bg-white/50 shadow-inner border border-white/60 rounded-xl px-3 py-1.5 text-xs text-stone-950 font-bold placeholder:text-stone-700/60 focus:outline-none focus:ring-1 focus:ring-orange-400 w-44 neu-pressed transition-all"
                    />
                    <button type="submit" className="bg-gradient-to-tr from-orange-600 to-orange-400 hover:to-orange-500 text-white rounded-xl px-4 py-1.5 text-xs font-extrabold shadow-[0_2px_10px_rgba(234,88,12,0.3)] transition-all hover:scale-[1.02] active:scale-95 border border-orange-400/50">
                      Notify me
                    </button>
                  </form>
                ) : (
                  <span className="text-emerald-700 bg-emerald-100/50 px-3 py-1.5 flex items-center gap-1 rounded-xl text-xs font-bold border border-emerald-200/50 shrink-0">
                    <Check className="w-3.5 h-3.5"/> You're on the list!
                  </span>
                )}
                <button onClick={() => setShowBanner(false)} className="shrink-0 ml-1 text-stone-500 hover:text-stone-900 transition-colors p-1 rounded-md hover:bg-black/5">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navbar ── */}
      <nav className="relative z-40 backdrop-blur-2xl bg-white/10 sticky top-0 border-b border-orange-900/5">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight text-foreground">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-600 to-amber-500 flex items-center justify-center text-xs font-bold text-white">M</div>
            MockPay
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[13px] text-stone-950 font-extrabold uppercase tracking-widest">
            <Link href="/docs" className="hover:text-orange-700 transition-colors opacity-90 hover:opacity-100">Docs</Link>
            <Link href="/#pricing" className="hover:text-orange-700 transition-colors opacity-90 hover:opacity-100">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-[13px] text-stone-950 font-extrabold uppercase tracking-widest hover:text-orange-700 transition-colors opacity-90 hover:opacity-100 hidden sm:block">Sign in</Link>
            <Link href="/sign-up" className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-all hover:scale-105 shadow-md">
              Get started →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-16 overflow-hidden">
        
        {/* 3D Canvas — fills the background BEHIND text */}
        <div className="absolute inset-0 z-0">
          <PaymentFlowScene mouse={mouse} />
        </div>

        {/* Subtle radial vignette over the scene */}
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,transparent_0%,var(--background)_70%)] pointer-events-none" />

        {/* Flow step labels — floated above canvas */}
        <motion.div
          style={{ y, opacity }}
          className="relative z-20 flex gap-24 mb-2 mt-20 sm:mt-0 hidden md:flex"
        >
          <FlowLabel label="Created" color="#c2410c" status="pk_test_..." />
          <FlowLabel label="Simulated" color="#b45309" status="~120ms" />
          <FlowLabel label="Success" color="#059669" status="200 OK" />
        </motion.div>

        {/* Hero content - Two Column Layout */}
        <div className="relative z-30 w-full max-w-7xl mx-auto mt-12 grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Copy & CTAs */}
          <div className="text-left">
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-orange-200/50 bg-orange-50/50 px-4 py-1.5 text-xs font-medium text-orange-700 mb-8 backdrop-blur-sm shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Built for developers
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.04] mb-6"
            >
              Debug
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                Payment Systems
              </span>
              <br />
              Without KYC.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-stone-950/80 max-w-xl mb-10 leading-relaxed font-medium"
            >
              Simulate Stripe, Razorpay, and PayPal flows in seconds. Test webhooks, edge cases, and payment states — without real money.
            </motion.p>

            {/* SDK install snippet above fold */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-8"
            >
              <NpmInstallBadge />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 items-center"
            >
              <RippleButton href="/demo/test_db_demo">
                Try Live Demo <ArrowRight className="w-4 h-4" />
              </RippleButton>
              <RippleButton href="/sign-up" variant="ghost">
                <Terminal className="w-4 h-4" /> Get API Key
              </RippleButton>
            </motion.div>
            
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-6 flex flex-wrap items-center gap-8 text-xs font-black text-stone-950 uppercase tracking-widest opacity-80"
             >
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-700" /> No real money processed</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-700" /> Free forever</span>
             </motion.div>
          </div>

          {/* Right: Interactive WOW Element Mini Checkout */}
          <motion.div 
             initial={{ opacity: 0, scale: 0.95, x: 20 }}
             animate={{ opacity: 1, scale: 1, x: 0 }}
             transition={{ duration: 0.8, delay: 0.3 }}
             className="relative mx-auto w-full max-w-md"
          >
             <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-orange-700 to-amber-600 opacity-20 blur-2xl"></div>
             <TiltCard className="p-1 overflow-hidden">
                <div className="bg-background rounded-3xl p-6 shadow-sm">
                   <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2 font-bold text-foreground">
                         <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-600 to-amber-500 flex items-center justify-center text-[10px] font-bold text-white">M</div>
                         MockPay
                      </div>
                      <div className="text-right">
                         <div className="text-xs text-stone-700">Test Amount</div>
                         <div className="text-xl font-bold font-mono text-foreground">₹500.00</div>
                      </div>
                   </div>
                   
                   <div className="space-y-4 mb-6">
                      <div className="h-11 w-full bg-background border-none rounded-2xl flex items-center px-4 gap-3 text-sm text-stone-900 font-black neu-pressed">
                         <CreditCard className="w-4 h-4 text-stone-700" /> 4242 4242 4242 4242
                      </div>
                      <div className="flex gap-4">
                         <div className="h-11 w-1/2 bg-background border-none rounded-2xl flex items-center px-4 text-sm text-stone-900 font-black neu-pressed">12 / 28</div>
                         <div className="h-11 w-1/2 bg-background border-none rounded-2xl flex items-center px-4 text-sm text-stone-900 font-black neu-pressed">123</div>
                      </div>
                   </div>

                   <MiniCheckoutPayButton />
                   
                   <p className="mt-4 text-center text-[10px] text-stone-700 uppercase tracking-wider flex justify-center items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Test Mode Only
                   </p>
                </div>
             </TiltCard>
          </motion.div>
        </div>

        {/* Bottom gradient fade into next section - adjusted for light theme */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />
      </section>

      {/* Use Case Cards */}
      <section className="relative z-10 py-24 px-6 bg-white/5">
         <div className="max-w-6xl mx-auto">
            <motion.div
               initial={{ opacity: 0, y: 32 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6 }}
               className="text-center mb-16"
            >
               <h2 className="text-3xl font-extrabold tracking-tight mb-4 text-foreground">
                  Built for developers who need to <span className="text-orange-700 hover:text-amber-600 transition-colors cursor-pointer">move fast.</span>
               </h2>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-4">
               {[
                  { title: "Hackathons", desc: "Don't waste 4 hours waiting for API keys to be approved. Build instantly." },
                  { title: "SaaS MVPs", desc: "Validate your product flows before you even register a company." },
                  { title: "Payment Debugging", desc: "Simulate exact failure states to bulletproof your error handling." },
                  { title: "College Projects", desc: "Build realistic E-commerce platforms without using real credentials." }
               ].map((uc, i) => (
                  <TiltCard key={uc.title} className="p-6 bg-white/20">
                     <h3 className="font-bold text-foreground mb-2 text-lg">{uc.title}</h3>
                     <p className="text-stone-700 text-sm leading-relaxed">{uc.desc}</p>
                  </TiltCard>
               ))}
            </div>
         </div>
      </section>

      {/* Code Showcase */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
              Everything via SDK.
            </h2>
            <p className="text-stone-700 text-lg">Two snippets. That's all it takes to simulate a full payment lifecycle.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <TiltCard className="p-6 h-full bg-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-bold text-gray-700">Create a payment</span>
                </div>
                <CodeBlock code={HERO_CODE} lang="javascript" />
              </TiltCard>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
              <TiltCard className="p-6 h-full bg-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <Webhook className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-bold text-gray-700">Handle webhooks</span>
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
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-foreground">Everything you need.</h2>
            <p className="text-stone-700 text-lg">One platform, zero surprises.</p>
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
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 shadow-sm"
                    style={{ background: `${f.color}20`, border: `1px solid ${f.color}40` }}
                  >
                    <f.icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="font-extrabold text-foreground mb-2 text-lg uppercase tracking-wide">
                    {f.title}
                  </h3>
                  <p className="text-stone-950 font-bold text-sm leading-relaxed opacity-80">
                    {f.desc}
                  </p>
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
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-foreground">Simple pricing.</h2>
            <p className="text-stone-700 text-lg">No surprises. No KYC. Cancel anytime.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Hobby", price: "Free", desc: "Perfect for side projects and learning.", features: ["1,000 simulated payments/mo", "Hosted checkout", "3 demo links", "Community support"] },
              { name: "Pro", price: "₹999/mo", desc: "For serious developers and startups.", features: ["Unlimited payments", "Webhook Debugger + Replayer", "Flow Testing Studio", "Priority support"], popular: true },
              { name: "Team", price: "₹2,499/mo", desc: "For engineering teams and agencies.", features: ["Everything in Pro", "5 team members", "Custom branding", "Dedicated Slack channel"] },
            ].map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <TiltCard className={`p-6 ${plan.popular ? "bg-orange-100/40 shadow-[0_20px_50px_rgba(194,65,12,0.1)]" : "bg-white/10"}`}>
                  {plan.popular && (
                    <div className="text-xs font-bold text-orange-700 bg-orange-100 border border-orange-200 rounded-full px-3 py-1 inline-block mb-4 shadow-sm">Most Popular</div>
                  )}
                  <h3 className="text-xl font-black text-foreground mb-1 uppercase tracking-tight">{plan.name}</h3>
                  <div className="text-3xl font-black text-foreground mb-1">{plan.price}</div>
                  <p className="text-stone-900 text-sm mb-6 font-bold opacity-80">{plan.desc}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((ft) => (
                      <li key={ft} className="flex items-center gap-2 text-sm text-stone-950 font-bold">
                        <Check className="w-4 h-4 text-orange-700 shrink-0" /> {ft}
                      </li>
                    ))}
                  </ul>
                  {plan.name === "Hobby" ? (
                    <Link
                      href="/sign-up"
                      className="w-full flex justify-center items-center py-2.5 rounded-xl font-bold text-sm transition-all border border-gray-200 text-foreground hover:bg-white/50 shadow-sm"
                    >
                      Get started
                    </Link>
                  ) : (
                    <div
                      className={`w-full flex justify-center items-center py-2.5 rounded-xl font-bold text-sm cursor-default select-none gap-2 ${plan.popular ? "bg-orange-600 text-white shadow-lg" : "bg-white/20 border border-gray-100 text-foreground"}`}
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
            <div className="rounded-[3rem] bg-background p-16 neu-flat">
              <div className="text-6xl mb-6">⚡</div>
              <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 text-foreground">
                Stop fighting payment gateways.
              </h2>
              <p className="text-gray-600 text-lg mb-10">Get your API key in seconds. Start simulating immediately.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <RippleButton href="/sign-up">
                  Start Building for Free <ArrowRight className="w-4 h-4" />
                </RippleButton>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-800 font-medium">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-orange-600 to-amber-500 flex items-center justify-center text-[10px] font-bold text-white">M</div>
            MockPay
          </div>
          <div>Built with ♥ by Utkarsh Raj · MIT License</div>
          <div className="flex gap-4">
            <Link href="/docs" className="hover:text-black transition-colors">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── NPM Install Badge ─────────────────────────────────────────
function NpmInstallBadge() {
  const [copied, setCopied] = useState(false);
  const cmd = "npm install @utkarsh_raj32/mockpay-js";
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-3 bg-stone-900 border border-white/10 rounded-xl px-5 py-2.5 text-sm font-mono text-stone-200 hover:border-orange-500/40 hover:text-white transition-all group backdrop-blur-sm shadow-xl"
    >
      <Terminal className="w-4 h-4 text-orange-500" />
      <span className="opacity-90">{cmd}</span>
      <span className="text-stone-400 group-hover:text-orange-500 transition-colors">
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </span>
    </button>
  );
}

// ── Mini Checkout Pay Button ──────────────────────────────────
function MiniCheckoutPayButton() {
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");

  const handlePay = () => {
    if (state !== "idle") return;
    setState("loading");
    setTimeout(() => {
      setState("success");
      setTimeout(() => setState("idle"), 3000);
    }, 1500);
  };

  return (
    <button
      onClick={handlePay}
      disabled={state !== "idle"}
      className="relative w-full h-12 rounded-xl font-bold text-white overflow-hidden transition-all flex items-center justify-center
                 bg-orange-800 hover:bg-orange-700 disabled:opacity-90 disabled:cursor-not-allowed neu-button shadow-lg"
    >
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.span key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2">
            Pay ₹500.00
          </motion.span>
        )}
        {state === "loading" && (
          <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Processing...
          </motion.span>
        )}
        {state === "success" && (
          <motion.span key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} className="flex items-center gap-2 text-green-100">
            <Check className="w-5 h-5" /> Payment Successful
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

