"use client";

import { useState, useEffect, use, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  CreditCard, Smartphone, CheckCircle2, XCircle, Clock,
  Loader2, Copy, Check, AlertCircle, ShieldCheck, ChevronRight,
  Zap, ArrowLeft, Sparkles, Lock, Building2, Star
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

// Lazy-load the 3D background scene
const CheckoutScene = dynamic(
  () => import("@/components/CheckoutScene").then((m) => m.CheckoutScene),
  { ssr: false, loading: () => null }
);

// ── Subtle 3D Tilt Card ───────────────────────────────────────
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [3, -3]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-3, 3]), { stiffness: 200, damping: 30 });

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={(e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Premium Pay Button ────────────────────────────────────────
function PayButton({ onClick, disabled, children, variant = "primary", className = "" }: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "success" | "danger" | "ghost";
  className?: string;
}) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const id = useRef(0);
  const styles = {
    primary: "bg-gradient-to-br from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 text-white shadow-[0_4px_24px_rgba(234,88,12,0.4)] hover:shadow-[0_8px_32px_rgba(234,88,12,0.5)]",
    success: "bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white shadow-[0_4px_24px_rgba(16,185,129,0.4)]",
    danger:  "bg-gradient-to-br from-rose-500 to-rose-700 hover:from-rose-400 hover:to-rose-600 text-white shadow-[0_4px_24px_rgba(244,63,94,0.4)]",
    ghost:   "bg-white/60 backdrop-blur-sm border border-stone-200 text-stone-700 hover:bg-white/80 shadow-sm",
  };
  return (
    <button
      disabled={disabled}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const rid = ++id.current;
        setRipples((r) => [...r, { x: e.clientX - rect.left, y: e.clientY - rect.top, id: rid }]);
        setTimeout(() => setRipples((r) => r.filter((rr) => rr.id !== rid)), 700);
        onClick?.();
      }}
      className={`relative overflow-hidden w-full h-14 rounded-2xl font-semibold text-base tracking-tight transition-all duration-200 hover:scale-[1.015] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 ${styles[variant]} ${className}`}
    >
      {ripples.map((r) => (
        <span key={r.id} className="absolute rounded-full bg-white/20 animate-ping pointer-events-none"
          style={{ width: 160, height: 160, left: r.x - 80, top: r.y - 80 }} />
      ))}
      {children}
    </button>
  );
}

// ── Card Form ─────────────────────────────────────────────────
function CardForm() {
  const [num, setNum] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const fmt = (v: string) => {
    const d = v.replace(/\D/g, "").substring(0, 16);
    return d.match(/.{1,4}/g)?.join(" ") ?? d;
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="group">
      <label className="text-[11px] font-semibold text-stone-500 mb-1.5 block uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );

  const inputClass = (name: string) =>
    `bg-white border-2 transition-all duration-150 h-12 rounded-xl text-stone-800 font-medium text-sm placeholder:text-stone-300 ${focused === name ? "border-orange-400 shadow-[0_0_0_3px_rgba(234,88,12,0.12)]" : "border-stone-200 hover:border-stone-300 shadow-sm"}`;

  return (
    <div className="space-y-4">
      <Field label="Card Number">
        <div className="relative">
          <Input
            value={num}
            onChange={(e) => setNum(fmt(e.target.value))}
            onFocus={() => setFocused("num")}
            onBlur={() => setFocused(null)}
            placeholder="4000 0000 0000 0000"
            className={`${inputClass("num")} pl-12 font-mono tracking-wider`}
          />
          <CreditCard className="absolute left-4 top-3.5 w-5 h-5 text-stone-400" />
          {num.length === 19 && <Check className="absolute right-4 top-3.5 w-4 h-4 text-emerald-500" />}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Expiry">
          <Input
            placeholder="MM / YY"
            maxLength={7}
            onFocus={() => setFocused("exp")}
            onBlur={() => setFocused(null)}
            className={`${inputClass("exp")} font-mono text-center`}
          />
        </Field>
        <Field label="Security Code">
          <div className="relative">
            <Input
              placeholder="CVC"
              type="password"
              maxLength={3}
              onFocus={() => setFocused("cvc")}
              onBlur={() => setFocused(null)}
              className={`${inputClass("cvc")} font-mono pr-10`}
            />
            <Lock className="absolute right-3 top-3.5 w-4 h-4 text-stone-300" />
          </div>
        </Field>
      </div>
      <Field label="Cardholder Name">
        <Input
          placeholder="Full name as on card"
          onFocus={() => setFocused("name")}
          onBlur={() => setFocused(null)}
          className={inputClass("name")}
        />
      </Field>
    </div>
  );
}

// ── UPI Form ──────────────────────────────────────────────────
function UpiForm() {
  const [selected, setSelected] = useState("");
  const [focused, setFocused] = useState(false);
  const providers = [
    { name: "GPay", emoji: "🟢", label: "Google Pay" },
    { name: "PhonePe", emoji: "🟣", label: "PhonePe" },
    { name: "Paytm",  emoji: "🔵", label: "Paytm" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <label className="text-[11px] font-semibold text-stone-500 mb-1.5 block uppercase tracking-wider">UPI ID</label>
        <div className="relative">
          <Input
            placeholder="yourname@upi"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`bg-white border-2 h-12 rounded-xl text-stone-800 font-mono text-sm pl-12 transition-all ${focused ? "border-orange-400 shadow-[0_0_0_3px_rgba(234,88,12,0.12)]" : "border-stone-200 hover:border-stone-300 shadow-sm"}`}
          />
          <Smartphone className="absolute left-4 top-3.5 w-5 h-5 text-stone-400" />
        </div>
      </div>
      <div>
        <p className="text-[11px] text-stone-400 uppercase font-semibold tracking-widest text-center mb-3">or choose app</p>
        <div className="grid grid-cols-3 gap-2">
          {providers.map((p) => (
            <button
              key={p.name}
              onClick={() => setSelected(p.name)}
              className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all text-sm font-medium ${
                selected === p.name
                  ? "border-orange-400 bg-orange-50 shadow-[0_0_0_3px_rgba(234,88,12,0.12)] text-orange-700"
                  : "border-stone-200 bg-white hover:border-stone-300 text-stone-600 shadow-sm"
              }`}
            >
              <span className="text-2xl">{p.emoji}</span>
              <span className="text-[11px] font-semibold">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dev Panel ─────────────────────────────────────────────────
function DevPanel({ onSimulate, isProcessing }: { onSimulate: (status: any, delay: number) => void; isProcessing: boolean }) {
  const [outcome, setOutcome] = useState<"success" | "failed" | "pending">("success");
  const [delay, setDelay] = useState(0);
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-semibold text-stone-400 hover:text-orange-600 transition-colors uppercase tracking-widest"
      >
        <Zap className="w-3 h-3" />
        Dev Simulation Panel
        <span className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3 border-t border-stone-100 mt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-stone-400 uppercase font-semibold tracking-widest mb-1.5">Outcome</p>
                  <div className="flex rounded-xl overflow-hidden border border-stone-200 bg-white shadow-sm">
                    {(["success", "failed", "pending"] as const).map((o) => (
                      <button key={o} onClick={() => setOutcome(o)}
                        className={`flex-1 py-2 text-[10px] font-bold capitalize transition-all ${
                          outcome === o
                            ? o === "success" ? "bg-emerald-500 text-white" : o === "failed" ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                            : "text-stone-400 hover:bg-stone-50"
                        }`}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-stone-400 uppercase font-semibold tracking-widest mb-1.5">Delay</p>
                  <div className="flex rounded-xl overflow-hidden border border-stone-200 bg-white shadow-sm">
                    {[0, 2, 5].map((d) => (
                      <button key={d} onClick={() => setDelay(d)}
                        className={`flex-1 py-2 text-[10px] font-bold transition-all ${delay === d ? "bg-orange-600 text-white" : "text-stone-400 hover:bg-stone-50"}`}>
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <PayButton variant="primary" onClick={() => onSimulate(outcome, delay)} disabled={isProcessing} className="h-11 text-sm">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-3.5 h-3.5" /> Run Simulation</>}
              </PayButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Checkout Page ────────────────────────────────────────
export default function CheckoutPage({ params }: { params: Promise<{ payment_id: string }> }) {
  const { payment_id } = use(params);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "failed" | "pending">("idle");
  const isProcessing = status === "processing";
  const [simParams, setSimParams] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"card" | "upi">("card");
  const [roastError, setRoastError] = useState("");

  useEffect(() => {
    async function fetchPayment() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pay-public/${payment_id}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setPayment(data);
      } catch {
        toast.error("Payment session not found or expired.");
      } finally {
        setLoading(false);
      }
    }
    fetchPayment();
  }, [payment_id]);

  const handleSimulate = async (outcome: any, delay: number) => {
    setStatus("processing");
    setSimParams({ outcome, delay });
    if (outcome === "failed") {
      const roasts = [
        "Your fake card declined. Are you this broke in the real world too?",
        "Insufficient imaginary funds. Stay poor in the sandbox.",
        "Bank declined. Even the test simulation refuses to process this garbage.",
      ];
      setRoastError(roasts[Math.floor(Math.random() * roasts.length)]);
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/simulate-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id, status: outcome, delay }),
      });
      if (res.ok) setStatus(outcome);
      else { toast.error("Simulation failed"); setStatus("idle"); }
    } catch {
      toast.error("Network error");
      setStatus("idle");
    }
  };

  const amount = payment ? `${payment.currency === "INR" ? "₹" : payment.currency}${(payment.amount / 100).toFixed(2)}` : "";

  // ── Loading ──────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#f0e6d6] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 border-2 border-orange-100 flex items-center justify-center shadow-[4px_4px_8px_#d4c4b4,-4px_-4px_8px_#ffffff]">
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
        </div>
        <p className="text-stone-500 text-sm font-semibold">Loading secure checkout…</p>
      </div>
    </div>
  );

  // ── Not found ────────────────────────────────
  if (!payment) return (
    <div className="min-h-screen bg-[#f0e6d6] flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 rounded-full bg-rose-50 border-2 border-rose-100 flex items-center justify-center mb-6 shadow-inner">
        <AlertCircle className="w-10 h-10 text-rose-500" />
      </div>
      <h1 className="text-2xl font-bold text-stone-800 mb-2">Session Expired</h1>
      <p className="text-stone-500 max-w-xs mb-8 leading-relaxed">This payment link is invalid, expired, or has already been processed.</p>
      <PayButton variant="ghost" onClick={() => (window.location.href = "/")} className="max-w-xs h-12">
        <ArrowLeft className="w-4 h-4" /> Return Home
      </PayButton>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0e6d6] flex items-start md:items-center justify-center p-4 md:p-6 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* 3D Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
        <CheckoutScene status={status} />
      </div>

      {/* Warm blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-orange-200/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full bg-amber-200/30 blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">

        {/* ═══════════ CHECKOUT ═══════════ */}
        {status === "idle" && (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-[860px] my-8"
          >
            <TiltCard className="w-full rounded-[24px] overflow-hidden shadow-[0_24px_80px_rgba(160,120,80,0.25),0_0_0_1px_rgba(255,255,255,0.8)]">
              <div className="grid md:grid-cols-[380px_1fr] bg-white/80 backdrop-blur-2xl">

                {/* ── Left Panel ── */}
                <div className="bg-gradient-to-br from-[#1c1a17] to-[#2d2820] p-8 md:p-10 flex flex-col text-white relative overflow-hidden">
                  {/* Ambient glow */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
                  <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-orange-600/10 blur-3xl" />

                  {/* Brand */}
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center font-black text-sm shadow-lg">
                      {(payment.project_name || "M")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white/90 leading-tight">{payment.project_name || "MockPay"}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-[10px] text-amber-400/80 font-semibold uppercase tracking-widest">Sandbox</span>
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-2">{payment.description || "Order total"}</p>
                    <p className="text-5xl font-black tracking-tight leading-none text-white mb-8">{amount}</p>

                    {/* Line items */}
                    <div className="space-y-2.5 border-t border-white/8 pt-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Order ID</span>
                        <span className="font-mono text-white/40 text-xs">{payment.order_id?.slice(0, 16)}…</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Subtotal</span>
                        <span className="text-white/60">{amount}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t border-white/8 pt-2.5">
                        <span className="text-white/70">Total</span>
                        <span className="text-white">{amount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trust signals */}
                  <div className="mt-10 space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400/70" />
                      <span className="text-[11px] text-white/40 font-medium">Encrypted · No real money charged</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-white/20" />
                      <span className="text-[11px] text-white/25">mockpay.dev · Sandbox 2026</span>
                    </div>
                  </div>
                </div>

                {/* ── Right Panel ── */}
                <div className="p-8 md:p-10 flex flex-col">
                  <h2 className="text-base font-semibold text-stone-800 mb-6">Payment details</h2>

                  {/* Tab switcher */}
                  <div className="flex bg-stone-100 rounded-xl p-1 mb-7 gap-1">
                    {(["card", "upi"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 h-10 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                          tab === t ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                        }`}
                      >
                        {t === "card" ? <><CreditCard className="w-4 h-4" /> Card</> : <><Smartphone className="w-4 h-4" /> UPI</>}
                      </button>
                    ))}
                  </div>

                  {/* Form */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tab}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1"
                    >
                      {tab === "card" ? <CardForm /> : <UpiForm />}
                    </motion.div>
                  </AnimatePresence>

                  {/* CTA */}
                  <div className="mt-7 space-y-3">
                    <PayButton
                      variant="primary"
                      onClick={() => handleSimulate("success", 0)}
                    >
                      <Lock className="w-4 h-4 opacity-80" />
                      Pay {amount}
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </PayButton>

                    {payment?.cancel_url && (
                      <button
                        onClick={() => {
                          const redirectUrl = payment.cancel_url.includes("?")
                            ? `${payment.cancel_url}&payment_id=${payment_id}`
                            : `${payment.cancel_url}?payment_id=${payment_id}`;
                          window.location.href = redirectUrl;
                        }}
                        className="w-full text-center text-[11px] text-stone-400 hover:text-stone-600 transition-colors py-1 font-medium"
                      >
                        Cancel & return to merchant
                      </button>
                    )}

                    {/* Trust row */}
                    <div className="flex items-center justify-center gap-5 pt-1">
                      {["VISA", "MC", "AMEX", "UPI"].map((m) => (
                        <span key={m} className="text-[9px] font-black text-stone-300 tracking-widest">{m}</span>
                      ))}
                    </div>

                    {/* Dev panel */}
                    <DevPanel onSimulate={handleSimulate} isProcessing={isProcessing} />
                  </div>
                </div>

              </div>
            </TiltCard>

            {/* Powered by badge */}
            <div className="flex justify-center mt-4">
              <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-white/80 hover:bg-white/70 transition-all shadow-sm text-[11px] text-stone-400 font-medium hover:text-stone-600">
                <span className="w-4 h-4 rounded bg-orange-600 flex items-center justify-center text-[8px] font-black text-white">M</span>
                Secured by MockPay
              </Link>
            </div>
          </motion.div>
        )}

        {/* ═══════════ PROCESSING ═══════════ */}
        {status === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 flex flex-col items-center justify-center text-center p-12"
          >
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 rounded-full bg-white/60 backdrop-blur-sm border-2 border-orange-100 shadow-inner" />
              <div className="absolute inset-2 rounded-full border-2 border-orange-200 animate-spin" style={{ animationDuration: "3s" }} />
              <div className="absolute inset-4 rounded-full border-2 border-t-orange-500 border-orange-100 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">Processing</h2>
            <p className="text-stone-500 max-w-xs text-sm leading-relaxed">Connecting to sandbox network and firing webhook events.</p>
            {simParams?.delay > 0 && (
              <div className="mt-4 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-xs font-mono">
                Simulating {simParams.delay}s delay…
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════ OUTCOME ═══════════ */}
        {(status === "success" || status === "failed" || status === "pending") && (
          <motion.div
            key="outcome"
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md"
          >
            <div className={`bg-white/90 backdrop-blur-2xl rounded-[24px] overflow-hidden shadow-[0_24px_80px_rgba(160,120,80,0.2),0_0_0_1px_rgba(255,255,255,0.8)]`}>
              {/* Top accent bar */}
              <div className="h-1.5 w-full" style={{
                background: status === "success"
                  ? "linear-gradient(90deg, #10b981, #34d399)"
                  : status === "failed"
                  ? "linear-gradient(90deg, #f43f5e, #fb7185)"
                  : "linear-gradient(90deg, #f59e0b, #fbbf24)"
              }} />

              <div className="p-10 text-center">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 22 }}
                  className="flex justify-center mb-7"
                >
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-inner ${
                    status === "success" ? "bg-emerald-50 border-2 border-emerald-200" :
                    status === "failed"  ? "bg-rose-50 border-2 border-rose-200" :
                                          "bg-amber-50 border-2 border-amber-200"
                  }`}>
                    {status === "success" && <CheckCircle2 className="w-10 h-10 text-emerald-500" />}
                    {status === "failed"  && <XCircle className="w-10 h-10 text-rose-500" />}
                    {status === "pending" && <Clock className="w-10 h-10 text-amber-500" />}
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-black text-stone-900 mb-2.5"
                >
                  {status === "success" ? "Payment Successful" : status === "failed" ? "Payment Failed" : "Payment Pending"}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-stone-500 text-sm leading-relaxed mb-7 max-w-xs mx-auto"
                >
                  {status === "success" && "Transaction confirmed. Webhook fired successfully. Your integration is solid."}
                  {status === "failed"  && roastError}
                  {status === "pending" && "Payment is pending. Webhooks will fire automatically when it resolves."}
                </motion.p>

                {/* Details */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-stone-50 border border-stone-100 rounded-2xl p-5 mb-7 text-left space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-stone-400 uppercase font-semibold tracking-widest">Payment ID</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(payment_id); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="font-mono text-xs text-orange-600 hover:text-orange-500 flex items-center gap-1.5 transition-colors font-semibold"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : payment_id.slice(0, 18) + "…"}
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-stone-400 uppercase font-semibold tracking-widest">Amount</span>
                    <span className="font-bold text-stone-800">{amount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-stone-400 uppercase font-semibold tracking-widest">Status</span>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                      status === "success" ? "bg-emerald-100 text-emerald-700" :
                      status === "failed"  ? "bg-rose-100 text-rose-700" :
                                            "bg-amber-100 text-amber-700"
                    }`}>{status}</span>
                  </div>
                </motion.div>

                {/* Actions */}
                <div className="space-y-3">
                  {status === "failed" ? (
                    <PayButton variant="ghost" onClick={() => setStatus("idle")}>
                      <ArrowLeft className="w-4 h-4" /> Try Again
                    </PayButton>
                  ) : (
                    <PayButton
                      variant={status === "success" ? "success" : "ghost"}
                      onClick={() => {
                        if (payment.success_url) {
                          const url = payment.success_url.includes("?")
                            ? `${payment.success_url}&payment_id=${payment_id}`
                            : `${payment.success_url}?payment_id=${payment_id}`;
                          window.location.href = url;
                        } else {
                          window.close();
                        }
                      }}
                    >
                      {status === "success" ? <><Sparkles className="w-4 h-4" /> Return to Merchant</> : <>Close Window</>}
                    </PayButton>
                  )}

                  <Link href="/" className="flex items-center justify-center gap-2 mt-2 text-[11px] text-stone-400 hover:text-orange-600 transition-colors font-medium">
                    <span className="w-3.5 h-3.5 rounded bg-orange-600 flex items-center justify-center text-[7px] font-black text-white">M</span>
                    Secured by MockPay
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
