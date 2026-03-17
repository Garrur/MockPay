"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
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
        return <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border-none shadow-none">Succeeded</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-none shadow-none">Failed</Badge>;
      case 'cancelled':
        return <Badge className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border-none shadow-none">Cancelled</Badge>;
      case 'pending':
        return <Badge className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-none shadow-none animate-pulse">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-400 border-gray-600">Created</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Payments</h1>
        <p className="text-gray-400">View and track all simulated payments for your project.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#111118] overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5 border-b border-white/10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-gray-400">AMOUNT</TableHead>
              <TableHead className="text-gray-400">STATUS</TableHead>
              <TableHead className="text-gray-400">ORDER ID</TableHead>
              <TableHead className="text-gray-400">PAYMENT ID</TableHead>
              <TableHead className="text-right text-gray-400">CHECKOUT URL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">Loading payments...</TableCell></TableRow>
            ) : payments.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-500">No payments simulated yet.</TableCell></TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id} className="border-b border-white/5 bg-[#111118] hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium text-white">
                    {/* Convert amount from cents back to readable dollars/INR based on currency, fallback nicely if error */}
                    {p.amount ? (p.amount / 100).toLocaleString('en-US', { style: 'currency', currency: p.currency || 'USD' }) : '$0.00'}
                  </TableCell>
                  <TableCell>{getStatusBadge(p.status)}</TableCell>
                  <TableCell>
                    <code className="text-xs text-gray-400">{p.orderId || 'N/A'}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-gray-400">{p.id}</code>
                      <Copy className="w-3 h-3 text-gray-500 cursor-pointer hover:text-white" onClick={() => copyToClipboard(p.id)} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="h-7 text-xs border-white/10" onClick={() => window.open(p.paymentUrl, '_blank')}>
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
  );
}
