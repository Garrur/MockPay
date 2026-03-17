"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  Copy, 
  Check, 
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// --- Components ---

function OrderSummary({ payment }: { payment: any }) {
  const amount = (payment.amount / 100).toFixed(2);
  return (
    <div className="flex flex-col h-full justify-between py-12 px-8 text-white">
      <div>
        <div className="flex items-center gap-3 mb-12">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold shadow-[0_0_20px_rgba(124,58,237,0.3)]">
            S
          </div>
          <span className="text-2xl font-bold tracking-tight">{payment.project_name || "SandboxPay"}</span>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-gray-500 text-sm uppercase tracking-widest font-semibold mb-1">Pay</p>
            <p className="text-5xl font-extrabold tracking-tight">
              {payment.currency === 'INR' ? '₹' : payment.currency}{amount}
            </p>
          </div>

          <div className="space-y-4 pt-8">
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
              <span className="text-gray-400">{payment.description || "Order Summary"}</span>
              <span className="font-medium">{payment.currency} {amount}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Order ID:</span>
              <span className="font-mono text-gray-300">{payment.order_id}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-gray-600 text-[10px] space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3 h-3" />
          <span>Secure encrypted transaction via SandboxPay protocol</span>
        </div>
        <p>© 2026 SandboxPay Inc. Powered by Test Environment.</p>
      </div>
    </div>
  );
}

function SimulationPanel({ onSimulate, isProcessing }: { onSimulate: (status: any, delay: number) => void, isProcessing: boolean }) {
  const [outcome, setOutcome] = useState<'success' | 'failed' | 'pending'>('success');
  const [delay, setDelay] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'}`}>
      <div className="bg-[#1a1a24] border-t border-primary/30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-w-lg mx-auto rounded-t-2xl overflow-hidden">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-10 flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            Developer Simulation Panel
          </div>
        </button>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Target Outcome</label>
              <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                {(['success', 'failed', 'pending'] as const).map(o => (
                  <button
                    key={o}
                    onClick={() => setOutcome(o)}
                    className={`text-[10px] py-2 rounded font-bold capitalize transition-all ${outcome === o ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Network Delay (s)</label>
              <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                {[0, 2, 5].map(d => (
                  <button
                    key={d}
                    onClick={() => setDelay(d)}
                    className={`text-[10px] py-2 rounded font-bold transition-all ${delay === d ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button 
            disabled={isProcessing}
            onClick={() => onSimulate(outcome, delay)}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-[0_5px_15px_rgba(124,58,237,0.4)]"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Run Payment Simulation"}
          </Button>
          <p className="text-center text-gray-600 text-[9px] uppercase tracking-tighter">This panel is only visible during development and testing.</p>
        </div>
      </div>
    </div>
  );
}

function CardForm({ isActive }: { isActive: boolean }) {
  const [num, setNum] = useState("");
  const handleNum = (e: any) => {
    const v = e.target.value.replace(/\D/g, "").substring(0, 16);
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    setNum(parts.length > 0 ? parts.join(" ") : v);
  };

  return (
    <div className="space-y-4 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 font-medium">Card Number</label>
        <div className="relative">
          <Input 
            value={num} 
            onChange={handleNum}
            placeholder="0000 0000 0000 0000" 
            className="bg-black/20 border-white/10 text-white pl-10 h-11 focus:border-primary/50 transition-all font-mono" 
          />
          <CreditCard className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium">Expiry</label>
          <Input placeholder="MM/YY" className="bg-black/20 border-white/10 text-white h-11 font-mono" maxLength={5} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium">CVV</label>
          <Input placeholder="123" type="password" className="bg-black/20 border-white/10 text-white h-11 font-mono" maxLength={3} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 font-medium">Cardholder Name</label>
        <Input placeholder="Full Name on Card" className="bg-black/20 border-white/10 text-white h-11" />
      </div>
    </div>
  );
}

function UpiForm() {
  const providers = [
    { name: "Google Pay", icon: "💎", color: "hover:bg-blue-400/5 hover:border-blue-400/20" },
    { name: "PhonePe", icon: "🟣", color: "hover:bg-purple-400/5 hover:border-purple-400/20" },
    { name: "Paytm", icon: "🔵", color: "hover:bg-blue-500/5 hover:border-blue-500/20" }
  ];

  return (
    <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 font-medium">UPI ID</label>
        <div className="relative">
          <Input placeholder="yourname@upi" className="bg-black/20 border-white/10 text-white pl-10 h-12 focus:border-primary/50 transition-all font-medium" />
          <Smartphone className="absolute left-3 top-3.5 w-5 h-5 text-gray-600" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest text-center">Quick Pay via</p>
        <div className="grid grid-cols-3 gap-3">
          {providers.map(p => (
            <button key={p.name} className={`flex flex-col items-center gap-2 p-3 rounded-xl border border-white/5 bg-white/3 transition-all ${p.color}`}>
              <span className="text-xl grayscale hover:grayscale-0 transition-all">{p.icon}</span>
              <span className="text-[9px] font-bold text-gray-500">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function CheckoutPage({ params }: { params: Promise<{ payment_id: string }> }) {
  const { payment_id } = use(params);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "failed" | "pending">("idle");
  const [simParams, setSimParams] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchPayment() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pay-public/${payment_id}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setPayment(data);
      } catch (err) {
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
        body: JSON.stringify({ 
          payment_id: payment_id, 
          status: outcome, 
          delay 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(outcome);
      } else {
        toast.error(data.error || "Simulation failed");
        setStatus("idle");
      }
    } catch (err) {
      toast.error("Failed to connect to simulation engine.");
      setStatus("idle");
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(payment_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-8">
      <div className="w-full max-w-4xl h-[600px] grid md:grid-cols-2 rounded-3xl border border-white/5 overflow-hidden animate-pulse">
        <div className="bg-[#111118]/40 border-r border-white/5" />
        <div className="bg-[#111118]/20" />
      </div>
    </div>
  );

  if (!payment) return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Payment Session Invalid</h1>
      <p className="text-gray-400 max-w-xs mb-8">This payment link is invalid, expired, or has already been completed.</p>
      <Button variant="outline" onClick={() => window.location.href = "/"}>Return to Home</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4 md:p-8 font-sans">
      <AnimatePresence mode="wait">
        {status === "idle" ? (
          <motion.div 
            key="checkout"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-5xl bg-[#111118]/80 backdrop-blur-3xl rounded-[32px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] grid md:grid-cols-2 overflow-hidden"
          >
            {/* Left Column — Summary */}
            <div className="bg-gradient-to-br from-black/40 to-primary/5 border-r border-white/5">
              <OrderSummary payment={payment} />
            </div>

            {/* Right Column — Payment Form */}
            <div className="px-8 py-12 relative">
              <div className="flex items-center gap-2 mb-8">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Payment Method</span>
                <div className="h-px bg-white/5 flex-1" />
              </div>

              <Tabs defaultValue="card" className="w-full">
                <TabsList className="grid grid-cols-2 w-full bg-black/40 border border-white/5 p-1 rounded-xl h-12 mb-8">
                  <TabsTrigger value="card" className="data-[state=active]:bg-white/10 data-[state=active]:text-white font-bold text-xs uppercase tracking-tight">
                    <CreditCard className="w-4 h-4 mr-2" /> Card
                  </TabsTrigger>
                  <TabsTrigger value="upi" className="data-[state=active]:bg-white/10 data-[state=active]:text-white font-bold text-xs uppercase tracking-tight">
                    <Smartphone className="w-4 h-4 mr-2" /> UPI
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="card"><CardForm isActive={status === "idle"} /></TabsContent>
                <TabsContent value="upi"><UpiForm /></TabsContent>
              </Tabs>

              <div className="mt-8 pt-8 border-t border-white/5">
                <p className="text-[10px] text-gray-600 mb-6 text-center leading-relaxed">
                  By clicking Pay, you agree to allow SandboxPay to simulate this transaction for testing purposes. 
                  <span className="block mt-1 font-bold">No real money will be charged.</span>
                </p>
                
                <Button 
                  className="w-full h-14 bg-white text-black hover:bg-gray-200 transition-all font-bold text-base rounded-2xl shadow-[0_15px_30px_rgba(255,255,255,0.1)] group"
                  onClick={() => handleSimulate("success", 0)} // Default action if simulate panel is hidden
                >
                  Pay {payment.currency === 'INR' ? '₹' : payment.currency}{(payment.amount / 100).toFixed(2)}
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="flex justify-center mt-6 gap-6 grayscale opacity-40">
                <span className="text-[10px] font-bold">VISA</span>
                <span className="text-[10px] font-bold">MASTERCARD</span>
                <span className="text-[10px] font-bold">PCI-DSS</span>
              </div>
            </div>
          </motion.div>
        ) : status === "processing" ? (
          <motion.div 
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-12 text-center"
          >
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
              <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Processing Payment</h2>
            <p className="text-gray-500 max-w-xs">Connecting to secure simulated networks. Please do not refresh.</p>
            {simParams?.delay > 0 && (
              <p className="mt-4 text-[10px] text-primary font-mono uppercase tracking-widest">
                simulating {simParams.delay}s network delay...
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="outcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg bg-[#111118] border border-white/10 rounded-[40px] p-12 text-center relative overflow-hidden shadow-3xl"
          >
            {status === "success" && <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]" />}
            {status === "failed" && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]" />}
            {status === "pending" && <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]" />}

            <div className="mb-8 flex justify-center">
              {status === "success" && (
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
              )}
              {status === "failed" && (
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
              )}
              {status === "pending" && (
                <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                  <Clock className="w-12 h-12 text-yellow-500" />
                </div>
              )}
            </div>

            <h1 className="text-4xl font-black text-white mb-4">
              {status === "success" ? "Payment Successful" : status === "failed" ? "Payment Failed" : "Payment Pending"}
            </h1>
            <p className="text-gray-500 mb-10 leading-relaxed font-semibold">
              {status === "success" ? "Your transaction has been confirmed and the merchant has been notified via webhook." : 
               status === "failed" ? "The bank declined the transaction. Check your simulation settings and try again." : 
               "Your payment is in a pending state. It will be updated automatically."}
            </p>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 mb-8 text-left space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Payment ID</span>
                <button onClick={copyId} className="text-xs text-primary flex items-center gap-1.5 hover:underline">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-4 h-4" />}
                  <span className="font-mono">{copied ? "Copied" : payment_id}</span>
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Amount</span>
                <span className="text-sm font-bold text-white">{payment.currency} {(payment.amount / 100).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              {status === "failed" ? (
                <Button onClick={() => setStatus("idle")} className="w-full bg-white text-black font-bold h-14 rounded-2xl">Try Again</Button>
              ) : (
                <Button onClick={() => window.close()} className="w-full bg-white text-black font-bold h-14 rounded-2xl">Go Back to App</Button>
              )}
              <div className="flex items-center gap-2 justify-center text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3 text-green-500/50" />
                Powered by SandboxPay Safety
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Developer simulation panel */}
      <SimulationPanel 
        onSimulate={handleSimulate} 
        isProcessing={status === "processing"} 
      />

      {/* Floating hints on mobile */}
      <div className="fixed top-4 left-4 p-2 bg-blue-500/10 border border-blue-500/20 rounded-full hidden md:flex items-center gap-2 text-[10px] font-bold text-blue-400">
        <Info className="w-3 h-3" />
        TEST MODE ACTIVE
      </div>
    </div>
  );
}
