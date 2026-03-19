"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  CreditCard, Smartphone, CheckCircle2, XCircle, Clock,
  Loader2, Copy, Check, AlertCircle, ShieldCheck, ChevronRight,
  ChevronDown, ChevronUp, Zap, ArrowLeft, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Lazy-load the 3D background scene
const CheckoutScene = dynamic(
  () => import("@/components/CheckoutScene").then((m) => m.CheckoutScene),
  { ssr: false, loading: () => null }
);

// ── 3D Tilt Card wrapper ─────────────────────────────────────
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 25 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Glowing button with ripple ────────────────────────────────
function GlowButton({
  onClick, disabled, children, variant = "white", className = ""
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "white" | "violet" | "green" | "red" | "outline";
  className?: string;
}) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const id = useRef(0);
  const styles: Record<string, string> = {
    white: "bg-white text-black hover:bg-white/90 shadow-[0_10px_40px_rgba(255,255,255,0.15)]",
    violet: "bg-violet-600 text-white hover:bg-violet-500 shadow-[0_10px_40px_rgba(124,58,237,0.4)]",
    green: "bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_10px_40px_rgba(52,211,153,0.4)]",
    red: "bg-red-500 text-white hover:bg-red-400 shadow-[0_10px_40px_rgba(239,68,68,0.35)]",
    outline: "border border-white/20 text-white hover:bg-white/5",
  };
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rid = ++id.current;
    setRipples((r) => [...r, { x: e.clientX - rect.left, y: e.clientY - rect.top, id: rid }]);
    setTimeout(() => setRipples((r) => r.filter((rr) => rr.id !== rid)), 700);
    onClick?.();
  };
  return (
    <button
      disabled={disabled}
      onClick={handleClick}
      className={`relative overflow-hidden w-full h-14 rounded-2xl font-bold text-base transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 ${styles[variant]} ${className}`}
    >
      {ripples.map((r) => (
        <span key={r.id} className="absolute rounded-full bg-white/25 animate-ping pointer-events-none"
          style={{ width: 140, height: 140, left: r.x - 70, top: r.y - 70 }} />
      ))}
      {children}
    </button>
  );
}

// ── Card Form ─────────────────────────────────────────────────
function CardForm() {
  const [num, setNum] = useState("");
  const fmt = (v: string) => {
    const d = v.replace(/\D/g, "").substring(0, 16);
    return d.match(/.{1,4}/g)?.join(" ") ?? d;
  };
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Card Number</label>
        <div className="relative">
          <Input value={num} onChange={(e) => setNum(fmt(e.target.value))}
            placeholder="4000 0000 0000 0000"
            className="bg-white/5 border-white/10 text-white pl-12 h-12 focus:border-violet-500/50 font-mono text-sm transition-all" />
          <CreditCard className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Expiry</label>
          <Input placeholder="MM / YY" maxLength={5}
            className="bg-white/5 border-white/10 text-white h-12 font-mono text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-semibold mb-1.5 block">CVC</label>
          <Input placeholder="•••" type="password" maxLength={3}
            className="bg-white/5 border-white/10 text-white h-12 font-mono text-sm" />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Cardholder Name</label>
        <Input placeholder="Full name on card"
          className="bg-white/5 border-white/10 text-white h-12 text-sm" />
      </div>
    </div>
  );
}

// ── UPI Form ──────────────────────────────────────────────────
function UpiForm() {
  const [selected, setSelected] = useState("");
  const providers = [
    { name: "GPay", emoji: "🎯", color: "from-blue-600 to-blue-400" },
    { name: "PhonePe", emoji: "💜", color: "from-purple-600 to-purple-400" },
    { name: "Paytm", emoji: "💙", color: "from-sky-600 to-sky-400" },
  ];
  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs text-gray-400 font-semibold mb-1.5 block">UPI ID</label>
        <div className="relative">
          <Input placeholder="yourname@upi"
            className="bg-white/5 border-white/10 text-white pl-12 h-12 focus:border-violet-500/50 font-mono text-sm" />
          <Smartphone className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
        </div>
      </div>
      <div>
        <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest text-center mb-3">Or pay with</p>
        <div className="grid grid-cols-3 gap-2">
          {providers.map((p) => (
            <button key={p.name} onClick={() => setSelected(p.name)}
              className={`flex flex-col items-center gap-2 py-3 rounded-xl border transition-all ${selected === p.name ? "border-violet-500/50 bg-violet-500/10" : "border-white/5 bg-white/3 hover:border-white/10"}`}>
              <span className="text-2xl">{p.emoji}</span>
              <span className="text-[10px] font-bold text-gray-400">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Simulation Panel (bottom drawer) ─────────────────────────
function SimulationPanel({ onSimulate, isProcessing }: { onSimulate: (status: any, delay: number) => void; isProcessing: boolean }) {
  const [open, setOpen] = useState(true);
  const [outcome, setOutcome] = useState<"success" | "failed" | "pending">("success");
  const [delay, setDelay] = useState(0);
  const outcomes = [
    { id: "success", label: "Success", color: "text-emerald-400", active: "bg-emerald-500" },
    { id: "failed", label: "Failed", color: "text-red-400", active: "bg-red-500" },
    { id: "pending", label: "Pending", color: "text-amber-400", active: "bg-amber-500" },
  ] as const;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-[calc(100%-44px)]"}`}>
      <div className="max-w-xl mx-auto">
        <div className="bg-[#0f0f18]/95 backdrop-blur-xl border border-white/10 rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
          <button onClick={() => setOpen((o) => !o)}
            className="w-full h-11 flex items-center justify-center gap-2 text-violet-400 hover:text-violet-300 transition-colors bg-violet-500/5 border-b border-white/5">
            <span className="w-8 h-0.5 bg-white/20 rounded-full absolute" />
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mt-1">
              {open ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              Dev Simulation Panel
              <Zap className="w-3 h-3" />
            </div>
          </button>

          {open && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest mb-2">Outcome</p>
                  <div className="bg-black/40 rounded-xl p-1 flex gap-1 border border-white/5">
                    {outcomes.map((o) => (
                      <button key={o.id} onClick={() => setOutcome(o.id)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all capitalize ${outcome === o.id ? `${o.active} text-white shadow-lg` : `${o.color} hover:bg-white/5`}`}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest mb-2">Network Delay</p>
                  <div className="bg-black/40 rounded-xl p-1 flex gap-1 border border-white/5">
                    {[0, 2, 5].map((d) => (
                      <button key={d} onClick={() => setDelay(d)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${delay === d ? "bg-violet-600 text-white shadow-lg" : "text-gray-500 hover:bg-white/5"}`}>
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <GlowButton variant="violet" onClick={() => onSimulate(outcome, delay)} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-4 h-4" /> Run Simulation</>}
              </GlowButton>
              <p className="text-center text-gray-700 text-[9px] uppercase tracking-wider">Visible in test environments only</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Checkout Page ────────────────────────────────────────
export default function CheckoutPage({ params }: { params: Promise<{ payment_id: string }> }) {
  const { payment_id } = use(params);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "failed" | "pending">("idle");
  const [simParams, setSimParams] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"card" | "upi">("card");

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

  // ── Loading skeleton ─────
  if (loading) return (
    <div className="min-h-screen bg-[#06060e] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
        </div>
        <p className="text-gray-500 text-sm animate-pulse">Securing session...</p>
      </div>
    </div>
  );

  // ── Not found ────────────
  if (!payment) return (
    <div className="min-h-screen bg-[#06060e] flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-400" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Session Expired</h1>
      <p className="text-gray-500 max-w-xs mb-8">This payment link is invalid, expired, or has already been processed.</p>
      <GlowButton variant="outline" onClick={() => (window.location.href = "/")} className="max-w-xs h-12">
        <ArrowLeft className="w-4 h-4" /> Return Home
      </GlowButton>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#06060e] text-white flex items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── 3D Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CheckoutScene status={status} />
      </div>

      {/* ── Background blobs ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[30%] w-[500px] h-[500px] rounded-full bg-violet-700/8 blur-[100px]" />
        <div className="absolute bottom-[0%] right-[20%] w-[400px] h-[400px] rounded-full bg-blue-600/6 blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">

        {/* ═══════════ CHECKOUT VIEW ═══════════ */}
        {status === "idle" && (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 w-full max-w-[920px] pb-32"
          >
            <TiltCard className="w-full rounded-[28px] border border-white/[0.07] shadow-[0_40px_120px_rgba(0,0,0,0.8)] overflow-hidden" >
              <div className="grid md:grid-cols-[1fr_1.1fr] bg-[#0c0c14]/90 backdrop-blur-2xl">

                {/* ── Left: Order Summary ── */}
                <div className="relative p-8 md:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/[0.05]">
                  {/* Subtle top glow */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

                  <div>
                    {/* Brand */}
                    <div className="flex items-center gap-3 mb-10">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center font-black text-sm shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                        {(payment.project_name || "S")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-tight">{payment.project_name || "SandboxPay"}</p>
                        <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">Demo Mode</p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="mb-8">
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">{payment.description || "Order total"}</p>
                      <p className="text-6xl font-black tracking-tight leading-none">{amount}</p>
                    </div>

                    {/* Details */}
                    <div className="space-y-3 border-t border-white/5 pt-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Order ID</span>
                        <span className="font-mono text-gray-300 text-xs">{payment.order_id}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="text-gray-300">{amount}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t border-white/5 pt-3">
                        <span className="text-white">Total</span>
                        <span className="text-white">{amount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-gray-600">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-500/60" />
                      <span>256-bit encrypted · No real money charged</span>
                    </div>
                    <p className="text-[10px] text-gray-700">This is a sandbox simulation. © SandboxPay 2026.</p>
                  </div>
                </div>

                {/* ── Right: Payment Form ── */}
                <div className="p-8 md:p-10">
                  {/* Tab switcher */}
                  <div className="flex gap-1 bg-black/30 border border-white/5 rounded-2xl p-1 mb-8">
                    {(["card", "upi"] as const).map((t) => (
                      <button key={t} onClick={() => setTab(t)}
                        className={`flex-1 h-11 rounded-xl font-bold text-xs uppercase tracking-tight flex items-center justify-center gap-2 transition-all ${tab === t ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}>
                        {t === "card" ? <><CreditCard className="w-4 h-4" /> Card</> : <><Smartphone className="w-4 h-4" /> UPI</>}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                      {tab === "card" ? <CardForm /> : <UpiForm />}
                    </motion.div>
                  </AnimatePresence>

                  {/* Pay button */}
                  <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                    <p className="text-center text-[10px] text-gray-600 leading-relaxed">
                      By clicking Pay, you agree to SandboxPay's simulated transaction terms.
                      <span className="block font-bold mt-0.5">No real money will be charged.</span>
                    </p>
                    <GlowButton variant="white" onClick={() => handleSimulate("success", 0)}>
                      Pay {amount} <ChevronRight className="w-5 h-5" />
                    </GlowButton>

                    {/* Payment marks */}
                    <div className="flex items-center justify-center gap-4">
                      {["VISA", "MC", "UPI", "PCI"].map((m) => (
                        <span key={m} className="text-[9px] font-black text-gray-700 tracking-widest">{m}</span>
                      ))}
                    </div>

                    {/* Viral badge */}
                    <div className="flex justify-center">
                      <a href="/?ref=viral_badge" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/3 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group">
                        <div className="w-4 h-4 rounded bg-violet-600/20 flex items-center justify-center text-[8px] font-black text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-all animate-pulse group-hover:animate-none">S</div>
                        <span className="text-[10px] text-gray-500 group-hover:text-white transition-colors font-medium">Built with SandboxPay</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>

            {/* Test mode badge */}
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Sandbox Mode Active
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════ PROCESSING ═══════════ */}
        {status === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center justify-center text-center p-12"
          >
            {/* Concentric spinning rings */}
            <div className="relative w-32 h-32 mb-10">
              <div className="absolute inset-0 rounded-full border border-violet-900/50" />
              <div className="absolute inset-2 rounded-full border border-violet-700/30 animate-spin" style={{ animationDuration: "3s" }} />
              <div className="absolute inset-4 rounded-full border-2 border-t-violet-500 border-violet-500/10 animate-spin" />
              <div className="absolute inset-8 rounded-full border-2 border-violet-400/20 animate-ping" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-8 h-8 text-violet-400" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Processing</h2>
            <p className="text-gray-500 max-w-xs leading-relaxed mb-4">Connecting to secure simulated networks. Firing webhook events in real-time.</p>
            {simParams?.delay > 0 && (
              <div className="px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono uppercase tracking-widest">
                Simulating {simParams.delay}s network delay...
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════ OUTCOME ═══════════ */}
        {(status === "success" || status === "failed" || status === "pending") && (
          <motion.div
            key="outcome"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md text-center"
          >
            {/* Success confetti bg */}
            {status === "success" && (
              <div className="absolute inset-0 rounded-[32px] bg-emerald-500/5 blur-xl -z-10" />
            )}

            <div className="bg-[#0c0c14]/90 backdrop-blur-2xl rounded-[32px] border overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
              style={{
                borderColor: status === "success" ? "rgba(52,211,153,0.2)" :
                  status === "failed" ? "rgba(239,68,68,0.2)" : "rgba(251,191,36,0.2)"
              }}>
              {/* Glowing top bar */}
              <div className="h-1 w-full" style={{
                background: status === "success" ? "linear-gradient(90deg, transparent, #34d399, transparent)" :
                  status === "failed" ? "linear-gradient(90deg, transparent, #ef4444, transparent)" :
                    "linear-gradient(90deg, transparent, #fbbf24, transparent)"
              }} />

              <div className="p-10">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
                  className="flex justify-center mb-8"
                >
                  <div className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{
                      background: status === "success" ? "rgba(52,211,153,0.1)" :
                        status === "failed" ? "rgba(239,68,68,0.1)" : "rgba(251,191,36,0.1)",
                      border: `1px solid ${status === "success" ? "rgba(52,211,153,0.3)" : status === "failed" ? "rgba(239,68,68,0.3)" : "rgba(251,191,36,0.3)"}`
                    }}>
                    {status === "success" && <CheckCircle2 className="w-12 h-12 text-emerald-400" />}
                    {status === "failed" && <XCircle className="w-12 h-12 text-red-400" />}
                    {status === "pending" && <Clock className="w-12 h-12 text-amber-400" />}
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-4xl font-black mb-3"
                >
                  {status === "success" ? "Payment Successful" : status === "failed" ? "Payment Failed" : "Payment Pending"}
                </motion.h1>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                  className="text-gray-400 leading-relaxed mb-8 text-sm">
                  {status === "success" && "Transaction confirmed and webhook delivered. Your integration is working perfectly."}
                  {status === "failed" && "The simulated bank declined this transaction. Adjust your test parameters and try again."}
                  {status === "pending" && "Payment is in a pending state. Webhooks will fire automatically when it resolves."}
                </motion.p>

                {/* Details card */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="bg-white/4 border border-white/5 rounded-2xl p-5 mb-8 text-left space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Payment ID</span>
                    <button onClick={() => { navigator.clipboard.writeText(payment_id); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="font-mono text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1.5 transition-colors">
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : payment_id.slice(0, 20) + "..."}
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Amount</span>
                    <span className="font-bold">{amount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Status</span>
                    <span className={`text-xs font-bold uppercase ${status === "success" ? "text-emerald-400" : status === "failed" ? "text-red-400" : "text-amber-400"}`}>{status}</span>
                  </div>
                </motion.div>

                {/* Actions */}
                <div className="space-y-3">
                  {status === "failed" ? (
                    <GlowButton variant="white" onClick={() => setStatus("idle")}>
                      <ArrowLeft className="w-4 h-4" /> Try Again
                    </GlowButton>
                  ) : (
                    <GlowButton variant={status === "success" ? "green" : "outline"} onClick={() => window.close()}>
                      {status === "success" && <><Sparkles className="w-4 h-4" /> Finish</>}
                      {status === "pending" && <>Close Window</>}
                    </GlowButton>
                  )}

                  <div className="flex justify-center">
                    <a href="/?ref=viral_badge" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group">
                      <span className="text-[10px] text-gray-600 group-hover:text-violet-400 font-medium transition-colors">⚡ Built with SandboxPay</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Simulation Panel ── */}
      <SimulationPanel onSimulate={handleSimulate} isProcessing={status === "processing"} />
    </div>
  );
}
