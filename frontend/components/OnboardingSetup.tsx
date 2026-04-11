"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check, Terminal, ExternalLink, Activity } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function OnboardingSetup() {
  const { getToken } = useAuth();
  const [step, setStep] = useState<"creating" | "done">("creating");
  const [apiKey, setApiKey] = useState<{ publicKey: string; secretKey: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSdk, setCopiedSdk] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);

  useEffect(() => {
    async function setup() {
      const token = await getToken();
      if (!token) return;

      try {
        // 1. Create Project
        const pRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name: "My First Project" }),
        });
        const pData = await pRes.json();
        
        if (!pData.project?.id) throw new Error("Failed to create project");

        // 2. Create API Key
        const kRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${pData.project.id}/keys`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ label: "Quick Start Key" }),
        });
        const kData = await kRes.json();
        
        if (kData.secretKey) {
          setApiKey(kData);
          setStep("done");
          toast.success("Project and API Keys generated!");
        }
      } catch (err) {
        toast.error("Error during onboarding. Please refresh.");
      }
    }
    setup();
  }, []);

  const copyRef = (text: string, setter: any) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleTestPayment = async () => {
    if (!apiKey) return;
    setCreatingPayment(true);
    try {
      // Simulate backend behavior by directly calling the public payment creation endpoint using the secret key
      // Ideally, a developer calls this from their backend using the SDK
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.secretKey}`
        },
        body: JSON.stringify({
          amount: 50000,
          currency: "INR",
          order_id: `test_${Math.floor(Math.random() * 10000)}`,
          description: "Onboarding Test Payment"
        })
      });
      const data = await res.json();
      if (data.payment_url) {
        window.open(data.payment_url, "_blank");
      } else {
        toast.error("Failed to generate payment url");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setCreatingPayment(false);
    }
  };

  if (step === "creating") {
    return (
      <Card className="bg-white/40 border-none shadow-none neu-flat p-16 text-center mt-12 max-w-2xl mx-auto backdrop-blur-sm">
        <div className="relative w-20 h-20 mx-auto mb-8">
           <Loader2 className="w-20 h-20 text-orange-500 animate-spin opacity-20" />
           <Activity className="w-10 h-10 text-orange-600 absolute inset-0 m-auto animate-pulse" />
        </div>
        <h3 className="text-3xl font-extrabold mb-3 text-foreground">Setting up your workspace...</h3>
        <p className="text-stone-500 font-medium text-lg leading-relaxed">Generating secure API keys and creating your first MockPay project.</p>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 max-w-3xl mx-auto pb-20">
      <Card className="bg-white/40 border-none shadow-none neu-flat overflow-hidden p-1">
        <div className="bg-gradient-to-br from-orange-600/10 to-amber-600/10 p-10 border-b border-stone-200/50 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-amber-500 text-white rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl shadow-orange-500/20">
            🚀
          </div>
          <h2 className="text-4xl font-extrabold text-foreground mb-3 tracking-tight">You're ready to build!</h2>
          <p className="text-stone-500 font-medium text-lg">Your project and API keys have been generated securely.</p>
        </div>

        <CardContent className="p-10 space-y-10">
          {/* Step 1: Install SDK */}
          <div className="group">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white shadow-sm border border-stone-100 text-foreground text-sm font-bold neu-flat">1</div>
              <h3 className="text-xl font-extrabold text-foreground">Install the Node.js SDK</h3>
            </div>
            <div 
              className="flex items-center justify-between bg-stone-900 overflow-hidden border border-stone-800 rounded-2xl p-5 cursor-pointer hover:border-orange-500/30 transition-all ml-12 neu-pressed"
              onClick={() => copyRef("npm install @utkarsh_raj32/mockpay-js", setCopiedSdk)}
            >
              <div className="flex items-center gap-4 font-mono text-sm text-stone-950 font-bold">
                <Terminal className="w-5 h-5 text-orange-700" />
                <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>npm install @utkarsh_raj32/mockpay-js</span>
              </div>
              <Button size="icon" variant="ghost" className="h-10 w-10 text-stone-500 hover:text-stone-950 hover:bg-stone-200/50">
                {copiedSdk ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Step 2: Copy Secret Key */}
          <div className="group">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white shadow-sm border border-stone-100 text-foreground text-sm font-bold neu-flat">2</div>
              <h3 className="text-xl font-extrabold text-foreground">Save your Secret Key</h3>
            </div>
            <div className="ml-12">
              <p className="text-sm text-amber-600 font-semibold mb-4 bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center gap-3">
                <span className="text-base">⚠️</span> Store this key securely. You won't be able to see it again!
              </p>
              <div 
                className="flex items-center justify-between bg-stone-900 border border-stone-800 rounded-2xl p-5 cursor-pointer hover:border-orange-500/30 transition-all neu-pressed"
                onClick={() => copyRef(apiKey?.secretKey || "", setCopiedKey)}
              >
                <div className="font-mono text-sm text-emerald-700 font-bold break-all leading-relaxed" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                  {apiKey?.secretKey}
                </div>
                <Button size="icon" variant="ghost" className="h-10 w-10 text-stone-500 hover:text-stone-950 hover:bg-stone-200/50 shrink-0">
                  {copiedKey ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Step 3: Run Test Payment */}
          <div className="pt-8 border-t border-stone-200/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-500 text-white text-lg font-bold shadow-lg shadow-orange-200 transition-transform group-hover:scale-110">3</div>
              <h3 className="text-xl font-extrabold text-foreground">See it in action</h3>
            </div>
            <div className="ml-14">
              <p className="text-stone-500 font-medium text-base mb-6 leading-relaxed">Click below to simulate a backend API call and generate a working hosted checkout URL instantly.</p>
              <Button 
                onClick={handleTestPayment} 
                className="w-full h-16 text-lg font-extrabold bg-orange-600 text-white hover:bg-orange-500 transition-all rounded-[1.5rem] hover:scale-[1.02] active:scale-95 shadow-xl shadow-orange-500/20"
                disabled={creatingPayment}
              >
                {creatingPayment ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                  <>Create Test Payment <ExternalLink className="w-6 h-6 ml-3" /></>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
