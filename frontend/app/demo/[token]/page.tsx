"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Ban, Loader2 } from "lucide-react";

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

function OutcomeButton({
  outcome,
  onClick,
  loading,
}: {
  outcome: string;
  onClick: () => void;
  loading: boolean;
}) {
  const styles: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    success:   { label: "Pay Successfully",    className: "bg-green-500 hover:bg-green-400 text-white", icon: <CheckCircle2 className="w-5 h-5" /> },
    failed:    { label: "Simulate Failure",    className: "bg-red-500 hover:bg-red-400 text-white",    icon: <XCircle className="w-5 h-5" /> },
    cancelled: { label: "Cancel Payment",      className: "bg-gray-700 hover:bg-gray-600 text-white",  icon: <Ban className="w-5 h-5" /> },
  };
  const s = styles[outcome];
  if (!s) return null;
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center justify-center gap-2 w-full rounded-xl py-3.5 font-semibold text-sm transition-all ${s.className} disabled:opacity-50`}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : s.icon}
      {s.label}
    </button>
  );
}

export default function DemoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [meta, setMeta] = useState<DemoMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [result, setResult] = useState<SimResult | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetch(`${API}/public/demo/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setMeta(d);
      })
      .catch(() => setError("Failed to load demo"))
      .finally(() => setLoading(false));
  }, [token]);

  async function simulate(outcome: string) {
    setSimulating(outcome);
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative w-full max-w-md">
        {loading ? (
          <div className="text-center text-stone-700 font-extrabold uppercase tracking-[0.2em] text-xs">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-700" />
            Synchronizing Demo...
          </div>
        ) : error ? (
          <div className="rounded-[2.5rem] border-none bg-red-500/5 p-12 text-center neu-flat backdrop-blur-sm">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-foreground font-extrabold text-xl mb-2">Demo Unavailable</p>
            <p className="text-stone-900 text-sm font-bold opacity-80">{error}</p>
          </div>
        ) : result ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className={`rounded-[2.5rem] border-none p-10 text-center neu-flat backdrop-blur-sm ${
              result.outcome === "success" ? "bg-emerald-500/5" :
              result.outcome === "failed"  ? "bg-red-500/5" :
              "bg-amber-500/5"
            }`}>
            <div className="text-5xl mb-6">
              {result.outcome === "success" ? "✅" : result.outcome === "failed" ? "❌" : "🚫"}
            </div>
            <p className="text-foreground font-extrabold text-2xl mb-2">{result.message}</p>
            <p className="text-stone-900 text-[10px] font-mono font-black uppercase tracking-widest mt-6 opacity-70">Simulation ID: {result.simulation_id}</p>
            <p className="text-stone-900 text-[10px] font-black mt-1 opacity-70">{new Date(result.timestamp).toLocaleString()}</p>
            <button onClick={() => setResult(null)}
              className="mt-8 text-sm text-orange-600 font-bold hover:text-orange-500 transition-colors">
              ← Try another outcome
            </button>
          </motion.div>
        ) : meta ? (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="rounded-[3rem] border-none bg-white/40 overflow-hidden shadow-2xl neu-flat backdrop-blur-xl">

            {/* Header */}
            <div className="bg-gradient-to-br from-orange-100/50 to-amber-50/50 border-b border-stone-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-orange-600 to-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-orange-500/20">M</div>
                <span className="text-foreground font-extrabold text-lg tracking-tight">{meta.project_name}</span>
                <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-stone-800 bg-white/60 px-2 py-1 rounded-md shadow-sm">Demo Mode</span>
              </div>
              <p className="text-stone-900 font-black text-xs uppercase tracking-widest mb-1 opacity-70">{meta.label}</p>
              <p className="text-5xl font-black text-foreground tracking-tighter">{formatAmount(meta.amount, meta.currency)}</p>
            </div>

            {/* Body */}
            <div className="p-8 space-y-4">
              <p className="text-xs font-black text-stone-900 uppercase tracking-widest text-center mb-6 opacity-60">
                Test Mode Simulation
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

            {/* Footer */}
            <div className="px-8 pb-8 text-center">
              <p className="text-[10px] font-black text-stone-800 uppercase tracking-widest leading-relaxed opacity-70">
                Powered by{" "}
                <a href="/" className="text-orange-600 hover:text-orange-500 transition-colors">MockPay</a>
                {" "}· Secure Sandbox
              </p>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
