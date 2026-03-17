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
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {loading ? (
          <div className="text-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
            Loading demo...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">Demo Unavailable</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        ) : result ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className={`rounded-2xl border p-8 text-center ${
              result.outcome === "success" ? "border-green-500/30 bg-green-500/5" :
              result.outcome === "failed"  ? "border-red-500/30 bg-red-500/5" :
              "border-gray-500/30 bg-gray-500/5"
            }`}>
            <div className="text-5xl mb-4">
              {result.outcome === "success" ? "✅" : result.outcome === "failed" ? "❌" : "🚫"}
            </div>
            <p className="text-white font-bold text-xl mb-2">{result.message}</p>
            <p className="text-gray-500 text-xs font-mono mt-4">ID: {result.simulation_id}</p>
            <p className="text-gray-600 text-xs mt-1">{new Date(result.timestamp).toLocaleString()}</p>
            <button onClick={() => setResult(null)}
              className="mt-6 text-sm text-primary hover:text-primary/80 transition-colors">
              ← Try another outcome
            </button>
          </motion.div>
        ) : meta ? (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="rounded-2xl border border-white/10 bg-[#111118] overflow-hidden shadow-2xl">

            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 to-purple-500/10 border-b border-white/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-white text-xs font-bold">S</div>
                <span className="text-white font-semibold">{meta.project_name}</span>
                <span className="ml-auto text-xs text-gray-500 bg-black/30 px-2 py-0.5 rounded-full">Demo Mode</span>
              </div>
              <p className="text-gray-400 text-sm mb-1">{meta.label}</p>
              <p className="text-4xl font-bold text-white">{formatAmount(meta.amount, meta.currency)}</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-3">
              <p className="text-xs text-gray-500 text-center mb-4">
                This is a sandbox simulation. No real money is involved.
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
            <div className="px-6 pb-5 text-center">
              <p className="text-xs text-gray-600">
                Powered by{" "}
                <a href="/" className="text-primary hover:underline">SandboxPay</a>
                {" "}· No KYC · No real money
              </p>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
