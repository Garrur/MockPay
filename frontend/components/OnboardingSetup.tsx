"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check, Terminal, ExternalLink } from "lucide-react";
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
      <Card className="bg-[#111118]/80 border-white/10 p-12 text-center mt-12 max-w-2xl mx-auto shadow-2xl">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
        <h3 className="text-2xl font-bold mb-2">Setting up your workspace...</h3>
        <p className="text-gray-400">Generating secure API keys and creating your first SandboxPay project.</p>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 max-w-3xl mx-auto">
      <Card className="bg-gradient-to-br from-[#1a1a24] to-[#111118] border-primary/30 shadow-[0_0_50px_rgba(124,58,237,0.15)] overflow-hidden">
        <div className="bg-primary/20 p-8 border-b border-primary/30 text-center">
          <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_0_30px_rgba(124,58,237,0.5)]">
            🚀
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">You're ready to build!</h2>
          <p className="text-primary-100/70 text-lg">Your project and API keys have been generated securely.</p>
        </div>

        <CardContent className="p-8 space-y-8">
          {/* Step 1: Install SDK */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-white text-xs font-bold">1</div>
              <h3 className="text-lg font-bold text-white">Install the Node.js SDK</h3>
            </div>
            <div 
              className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-white/30 transition-all group ml-9"
              onClick={() => copyRef("npm install @utkarsh_raj32/sandboxpay-js", setCopiedSdk)}
            >
              <div className="flex items-center gap-3 font-mono text-sm text-gray-300">
                <Terminal className="w-4 h-4 text-primary" />
                npm install @utkarsh_raj32/sandboxpay-js
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 group-hover:text-white">
                {copiedSdk ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Step 2: Copy Secret Key */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-white text-xs font-bold">2</div>
              <h3 className="text-lg font-bold text-white">Save your Secret Key</h3>
            </div>
            <div className="ml-9">
              <p className="text-sm text-yellow-500/80 mb-3 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                ⚠️ Store this key securely. You won't be able to see it again after leaving this page!
              </p>
              <div 
                className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-white/30 transition-all group"
                onClick={() => copyRef(apiKey?.secretKey || "", setCopiedKey)}
              >
                <div className="font-mono text-sm text-green-400 break-all">
                  {apiKey?.secretKey}
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 group-hover:text-white shrink-0">
                  {copiedKey ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Step 3: Run Test Payment */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold shadow-[0_0_10px_rgba(124,58,237,0.5)]">3</div>
              <h3 className="text-lg font-bold text-white">See it in action</h3>
            </div>
            <div className="ml-9">
              <p className="text-gray-400 text-sm mb-4">Click below to simulate a backend API call and generate a working hosted checkout URL instantly.</p>
              <Button 
                onClick={handleTestPayment} 
                className="w-full h-14 text-base font-bold bg-white text-black hover:bg-gray-200 transition-all rounded-xl hover:scale-[1.02] shadow-xl"
                disabled={creatingPayment}
              >
                {creatingPayment ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                  <>Create Test Payment <ExternalLink className="w-5 h-5 ml-2" /></>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
