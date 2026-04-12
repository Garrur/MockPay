"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function PaymentsPage() {
  const { getToken } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const token = await getToken();
        if (!token) return;

        console.log("Fetching payments...");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("Payments API response:", data);
        setPayments(data.payments || []);
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, [getToken]);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'success':
        return <Badge className="bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/20 border-none shadow-none">Succeeded</Badge>;
      case 'failed':
        return <Badge className="bg-red-600/10 text-red-600 hover:bg-red-600/20 border-none shadow-none">Failed</Badge>;
      case 'cancelled':
        return <Badge className="bg-orange-700/10 text-orange-700 hover:bg-orange-700/20 border-none shadow-none">Cancelled</Badge>;
      case 'pending':
        return <Badge className="bg-amber-600/10 text-amber-700 hover:bg-amber-600/20 border-none shadow-none animate-pulse">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-stone-600 border-gray-600">Created</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1 w-full">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground break-words">Payments</h1>
        <p className="text-stone-900 font-bold break-words">View and track all simulated payments for your project.</p>
      </div>

      <div className="rounded-[2rem] border-none bg-white/40 neu-flat overflow-hidden p-1 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-orange-950/5 border-b border-orange-900/10">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-6">Amount</TableHead>
                <TableHead className="text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-6">Status</TableHead>
                <TableHead className="text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-6">Order ID</TableHead>
                <TableHead className="text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-6">Payment ID</TableHead>
                <TableHead className="text-right text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-6">Checkout URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 text-stone-600 font-medium italic">Loading payments...</TableCell></TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-32">
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <CreditCard className="w-16 h-16 text-stone-500" />
                      <p className="text-stone-700 font-bold text-lg">No payments simulated yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id} className="border-b border-stone-100/50 last:border-none hover:bg-white/50 transition-colors">
                    <TableCell className="font-extrabold text-foreground py-6 px-6 text-base">
                      {p.amount ? (p.amount / 100).toLocaleString('en-US', { style: 'currency', currency: p.currency || 'USD' }) : '$0.00'}
                    </TableCell>
                    <TableCell className="py-6 px-6">{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="py-6 px-6">
                      <code className="text-xs text-stone-900 font-black font-mono bg-stone-100/50 px-2 py-1 rounded-md" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{p.orderId || 'N/A'}</code>
                    </TableCell>
                    <TableCell className="py-6 px-6">
                      <div className="flex items-center gap-2 group cursor-pointer" onClick={() => copyToClipboard(p.id)}>
                        <code className="text-xs text-stone-800 font-black font-mono" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{p.id.slice(0, 12)}...</code>
                        <Copy className="w-3.5 h-3.5 text-stone-700 group-hover:text-orange-700 transition-colors" aria-hidden="true" />
                        <span className="sr-only">Copy Payment ID</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-6 px-6">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-10 px-4 font-bold text-xs bg-white border border-stone-200 shadow-sm rounded-xl hover:bg-orange-700 hover:text-white hover:border-orange-700 transition-all active:scale-95" 
                        onClick={() => window.open(p.paymentUrl, '_blank')}
                      >
                        View Checkout
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

