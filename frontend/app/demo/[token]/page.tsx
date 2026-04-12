"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Ban, Loader2, ShieldCheck, Lock, Zap, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";

type DemoMeta = {
  token: string;
  amount: number;
  currency: string;
  label: string;
  project_name: string;
  allowed_outcomes: string[];
  expires_at?: string;
};

type SimResult = {
  outcome: string;
  message: string;
  simulation_id: string;
  timestamp: string;
};

const ROAST_MESSAGES = [
  "Your fake card declined. Are you this broke in the real world too?",
  "Insufficient imaginary funds. Stay poor in the sandbox.",
  "Bank declined. Even the test simulation refuses to process this garbage.",
  "Transaction rejected. Your pretend bank has trust issues.",
  "Failed. The simulation took one look at you and said no.",
];

function getRandomRoast() {
  return ROAST_MESSAGES[Math.floor(Math.random() * ROAST_MESSAGES.length)];
}


function OutcomeButton({ outcome, onClick, loading }: { outcome: string; onClick: () => void; loading: boolean }) {
  const config: Record<string, { label: string; sub: string; icon: React.ReactNode; style: string; glow: string }> = {
    success: {
      label: "Pay Successfully",
      sub: "Simulate a completed payment",
      icon: <CheckCircle2 className="w-5 h-5" />,
      style: "from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)]",
      glow: "before:bg-emerald-400/20",
    },
    failed: {
      label: "Simulate Failure",
      sub: "Test your error handling",
      icon: <XCircle className="w-5 h-5" />,
      style: "from-rose-500 to-rose-700 hover:from-rose-400 hover:to-rose-600 text-white shadow-[0_4px_20px_rgba(244,63,94,0.35)]",
      glow: "before:bg-rose-400/20",
    },
    cancelled: {
      label: "Cancel Payment",
      sub: "Simulate user cancellation",
      icon: <Ban className="w-5 h-5" />,
      style: "from-stone-600 to-stone-800 hover:from-stone-500 hover:to-stone-700 text-white shadow-[0_4px_20px_rgba(0,0,0,0.2)]",
      glow: "before:bg-stone-400/20",
    },
  };

  const c = config[outcome];
  if (!c) return null;

  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden w-full bg-gradient-to-br ${c.style} rounded-2xl py-4 px-5 font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4 group`}
    >
      <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : c.icon}
      </div>
      <div className="text-left">
        <p className="font-semibold leading-tight">{c.label}</p>
        <p className="text-[11px] opacity-70 font-normal mt-0.5">{c.sub}</p>
      </div>
      <div className="ml-auto opacity-60 text-xs">→</div>
    </motion.button>
  );
}

// ── Result Card ───────────────────────────────────────────────
function ResultCard({ result, onReset, roastMsg }: { result: SimResult; onReset: () => void; roastMsg?: string }) {
  const isSuccess = result.outcome === "success";
  const isFailed  = result.outcome === "failed";

  const config = {
    success: { icon: <CheckCircle2 className="w-10 h-10 text-emerald-500" />, bg: "bg-emerald-50 border-emerald-200", bar: "from-emerald-400 to-emerald-600", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
    failed:  { icon: <XCircle className="w-10 h-10 text-rose-500" />,         bg: "bg-rose-50 border-rose-200",       bar: "from-rose-400 to-rose-600",       text: "text-rose-700",    badge: "bg-rose-100 text-rose-700"    },
    cancelled:{ icon: <Ban className="w-10 h-10 text-stone-500" />,           bg: "bg-stone-50 border-stone-200",     bar: "from-stone-400 to-stone-600",     text: "text-stone-700",   badge: "bg-stone-100 text-stone-700"  },
  }[result.outcome] ?? { icon: <Clock className="w-10 h-10 text-amber-500" />, bg: "bg-amber-50 border-amber-200", bar: "from-amber-400 to-amber-600", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white/90 backdrop-blur-2xl rounded-[24px] overflow-hidden shadow-[0_24px_80px_rgba(160,120,80,0.2),0_0_0_1px_rgba(255,255,255,0.8)]"
    >
      {/* Accent bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${config.bar}`} />

      <div className="p-8 text-center">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
          className={`w-20 h-20 rounded-full ${config.bg} border-2 flex items-center justify-center mx-auto mb-6 shadow-inner`}
        >
          {config.icon}
        </motion.div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-4 ${config.badge}`}>
          {result.outcome}
        </span>

        <h2 className="text-2xl font-black text-stone-900 mb-2">{result.message}</h2>
        <p className="text-stone-500 text-sm mb-7">
          {isSuccess ? "Webhook event fired. Your integration handled it correctly." :
           isFailed  ? (roastMsg || "Your error handler should have received this event.") :
                       "Payment was cancelled by the user."}
        </p>

        {/* Details */}
        <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4 mb-6 text-left space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-stone-400 uppercase font-semibold tracking-wider">Simulation ID</span>
            <span className="font-mono text-xs text-stone-600 font-semibold">{result.simulation_id.slice(0, 20)}…</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-stone-400 uppercase font-semibold tracking-wider">Timestamp</span>
            <span className="text-xs text-stone-600">{new Date(result.timestamp).toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-2 mx-auto text-sm text-stone-500 hover:text-orange-600 transition-colors font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Try another outcome
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Demo Page ────────────────────────────────────────────
export default function DemoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [meta, setMeta]         = useState<DemoMeta | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [result, setResult]         = useState<SimResult | null>(null);
  const [roastMsg, setRoastMsg]     = useState<string>("");

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetch(`${API}/public/demo/${token}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setMeta(d); })
      .catch(() => setError("Failed to load demo"))
      .finally(() => setLoading(false));
  }, [token]);

  async function simulate(outcome: string) {
    setSimulating(outcome);
    if (outcome === "failed") setRoastMsg(getRandomRoast());
    try {
      const res = await fetch(`${API}/public/demo/${token}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome }),
      });
      const data = await res.json();
      if (res.ok) setResult(data);
      else setError(data.error || "Simulation failed");
    } finally {
      setSimulating(null);
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency;
    return `${symbol}${(amount / 100).toFixed(2)}`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "#f0e6d6", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[20%] w-[500px] h-[500px] rounded-full bg-orange-200/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-[400px] h-[400px] rounded-full bg-amber-200/30 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        <AnimatePresence mode="wait">

          {/* ── Loading ── */}
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/60 border border-white shadow-[4px_4px_8px_#d4c4b4,-4px_-4px_8px_#ffffff] flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              </div>
              <p className="text-stone-500 text-sm font-semibold">Loading demo checkout…</p>
            </motion.div>
          )}

          {/* ── Error ── */}
          {!loading && error && (
            <motion.div key="error" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-xl rounded-[24px] p-10 text-center shadow-[0_24px_80px_rgba(160,120,80,0.2),0_0_0_1px_rgba(255,255,255,0.8)]"
            >
              <div className="w-20 h-20 rounded-full bg-rose-50 border-2 border-rose-200 shadow-inner flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-10 h-10 text-rose-500" />
              </div>
              <h2 className="text-xl font-black text-stone-900 mb-2">Demo Unavailable</h2>
              <p className="text-stone-500 text-sm">{error}</p>
              <Link href="/" className="inline-flex items-center gap-2 mt-6 text-sm text-orange-600 hover:text-orange-500 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" /> Return home
              </Link>
            </motion.div>
          )}

          {/* ── Result ── */}
          {!loading && !error && result && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResultCard result={result} onReset={() => setResult(null)} roastMsg={roastMsg} />
            </motion.div>
          )}

          {/* ── Main Demo Card ── */}
          {!loading && !error && !result && meta && (
            <motion.div
              key="demo"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white/80 backdrop-blur-2xl rounded-[24px] overflow-hidden shadow-[0_24px_80px_rgba(160,120,80,0.2),0_0_0_1px_rgba(255,255,255,0.8)]"
            >
              {/* ── Left-dark header strip (full width on mobile) ── */}
              <div className="bg-gradient-to-br from-[#1c1a17] to-[#2d2820] p-7 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
                <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-orange-600/10 blur-2xl" />

                {/* Brand row */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center font-black text-sm text-white shadow-lg">
                    {(meta.project_name || "M")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white/90 font-semibold text-sm leading-tight">{meta.project_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[10px] text-amber-400/80 font-semibold uppercase tracking-widest">Sandbox</span>
                    </div>
                  </div>
                  <div className="ml-auto px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                    Demo Mode
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-widest font-medium mb-1">{meta.label}</p>
                  <p className="text-4xl font-black text-white tracking-tight">{formatAmount(meta.amount, meta.currency)}</p>
                </div>
              </div>

              {/* ── Buttons ── */}
              <div className="p-6 space-y-3">
                <p className="text-[11px] text-stone-400 font-semibold uppercase tracking-widest text-center mb-5 flex items-center justify-center gap-2">
                  <Zap className="w-3 h-3 text-orange-400" />
                  Choose a simulation outcome
                  <Zap className="w-3 h-3 text-orange-400" />
                </p>

                {meta.allowed_outcomes.map(outcome => (
                  <OutcomeButton
                    key={outcome}
                    outcome={outcome}
                    onClick={() => simulate(outcome)}
                    loading={simulating === outcome}
                  />
                ))}
              </div>

              {/* ── Footer ── */}
              <div className="px-6 pb-6">
                <div className="border-t border-stone-100 pt-5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>No real money charged</span>
                  </div>
                  <Link href="/" className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-orange-600 transition-colors font-medium">
                    <span className="w-4 h-4 rounded bg-orange-600 flex items-center justify-center text-[7px] font-black text-white">M</span>
                    MockPay
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
