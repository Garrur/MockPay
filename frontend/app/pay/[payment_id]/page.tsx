"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, CheckCircle2, XCircle, Loader2, Link2 } from "lucide-react";

export default function CheckoutPage() {
  const { payment_id } = useParams() as { payment_id: string };
  const router = useRouter();
  
  const [payment, setPayment] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [outcome, setOutcome] = useState<any>(null);

  // Form states
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12 / 28");
  const [cvc, setCvc] = useState("123");
  const [upiId, setUpiId] = useState("user@upi");
  
  useEffect(() => {
    async function fetchPayment() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pay-public/${payment_id}`);
        if (!res.ok) throw new Error("Payment not found");
        const data = await res.json();
        setPayment(data);
        if (['success', 'failed', 'cancelled'].includes(data.status)) {
          setOutcome(data.status);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPayment();
  }, [payment_id]);

  async function handleSimulate(method: 'card' | 'upi' | 'cancel', forcedOutcome?: 'success' | 'failed') {
    setProcessing(true);
    try {
      const payload: any = {};
      
      if (method === 'cancel') {
        payload.outcome = 'cancelled';
      } else if (forcedOutcome) {
        payload.outcome = forcedOutcome;
      } else if (method === 'card') {
        payload.card_number = cardNumber;
      } else if (method === 'upi') {
        payload.upi_id = upiId;
        payload.upi_scenario = 'success';
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/${payment_id}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setOutcome(data.new_status || payload.outcome);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>;
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 text-center">
        <Card className="bg-[#111118] border-white/10 max-w-md w-full">
          <CardHeader>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-white text-xl">Payment Unavailable</CardTitle>
            <CardDescription className="text-gray-400">{error || "This payment link is invalid or has expired."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const formatAmount = (amt: number, currency: string) => {
    return (amt / 100).toLocaleString('en-US', { style: 'currency', currency });
  };

  if (outcome) {
    const isSuccess = outcome === 'success';
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <Card className="bg-[#111118] border-white/10 max-w-sm w-full text-center py-8">
          <CardHeader>
            {isSuccess ? <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" /> : <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />}
            <CardTitle className="text-white text-2xl mb-2">
              Payment {isSuccess ? 'Successful' : outcome === 'cancelled' ? 'Cancelled' : 'Failed'}
            </CardTitle>
            <div className="text-3xl font-bold text-white mb-2">{formatAmount(payment.amount, payment.currency)}</div>
            <p className="text-gray-400 text-sm">Order ID: {payment.order_id}</p>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="bg-white/5 border-white/10 text-gray-400 mt-4">Simulated Environment</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-4 bg-[#0a0a0f] text-white">
      <div className="w-full max-w-md">
        
        {/* Merchant Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-800 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
            <span className="text-2xl font-bold">{payment.project_name?.[0]?.toUpperCase() || 'M'}</span>
          </div>
          <h2 className="text-xl font-semibold">{payment.project_name || 'SandboxPay Merchant'}</h2>
          <Badge className="mt-2 bg-primary/20 text-primary hover:bg-primary/20 border-none transition-none shadow-none uppercase text-[10px] tracking-widest px-2 py-0">Test Mode</Badge>
        </div>

        <Card className="bg-[#111118] border-white/10 shadow-2xl shadow-primary/5">
          <CardHeader className="pb-4 border-b border-white/5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400">Amount Due</span>
              <span className="text-3xl font-bold tracking-tight text-white">{formatAmount(payment.amount, payment.currency)}</span>
            </div>
            {payment.description && <p className="text-sm text-gray-400 mt-1">{payment.description}</p>}
          </CardHeader>
          
          <CardContent className="pt-6">
            <Tabs defaultValue="card" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black border border-white/10 h-12 mb-6 p-1">
                <TabsTrigger value="card" className="data-[state=active]:bg-[#111118] data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/10 rounded">Card</TabsTrigger>
                <TabsTrigger value="upi" className="data-[state=active]:bg-[#111118] data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/10 rounded">UPI</TabsTrigger>
              </TabsList>

              <TabsContent value="card" className="space-y-4 m-0">
                <div className="space-y-2">
                  <Label className="text-gray-300">Test Card Information</Label>
                  <div className="relative">
                    <Input 
                      value={cardNumber} 
                      onChange={e => setCardNumber(e.target.value)}
                      className="bg-black border-white/10 pl-10 text-white font-mono h-12"
                    />
                    <CreditCard className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <Input value={expiry} onChange={e => setExpiry(e.target.value)} className="bg-black border-white/10 text-white font-mono h-12 text-center" />
                    <Input value={cvc} onChange={e => setCvc(e.target.value)} className="bg-black border-white/10 text-white font-mono h-12 text-center" />
                  </div>
                </div>
                <div className="pt-4 grid gap-3">
                  <Button disabled={processing} onClick={() => handleSimulate('card')} className="w-full h-12 bg-primary hover:bg-primary/90 text-white shadow-[0_4px_14px_0_rgba(124,58,237,0.39)] text-lg">
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Simulate Magic Match`}
                  </Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Button disabled={processing} onClick={() => handleSimulate('card', 'success')} variant="outline" className="w-full h-10 border-green-500/30 text-green-400 hover:bg-green-500/10">Force Success</Button>
                    <Button disabled={processing} onClick={() => handleSimulate('card', 'failed')} variant="outline" className="w-full h-10 border-red-500/30 text-red-500 hover:bg-red-500/10">Force Decline</Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="upi" className="space-y-4 m-0">
                <div className="space-y-2">
                  <Label className="text-gray-300">UPI Virtual Payment Address</Label>
                  <div className="relative">
                    <Input 
                      value={upiId} 
                      onChange={e => setUpiId(e.target.value)}
                      className="bg-black border-white/10 pl-10 text-white font-mono h-12"
                    />
                    <Link2 className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                  </div>
                </div>
                <div className="pt-4">
                  <Button disabled={processing} onClick={() => handleSimulate('upi')} className="w-full h-12 bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-white shadow-[0_4px_14px_0_rgba(0,191,165,0.39)] text-lg mb-3">
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Simulate UPI Success`}
                  </Button>
                  <Button disabled={processing} onClick={() => handleSimulate('cancel')} variant="ghost" className="w-full h-10 text-gray-400 hover:text-white">
                    Cancel Payment
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

          </CardContent>
          
          <CardFooter className="flex flex-col border-t border-white/5 bg-black/20 p-4 pt-4 mt-2 rounded-b-xl gap-2 text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center">
              Powered by <span className="font-semibold text-gray-400 ml-1">SandboxPay Simulation</span>
            </p>
            <p className="text-[10px] text-gray-600 max-w-xs mx-auto">No real money will be charged. This is a testing environment for developer integration.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
