"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WebhooksPage() {
  const { getToken } = useAuth();
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const token = await getToken();
      if (!token) return;

      const pRes = await fetch(process.env.NEXT_PUBLIC_API_URL + '/projects', { headers: { Authorization: `Bearer ${token}` } });
      const pData = await pRes.json();
      const pId = pData.projects?.[0]?.id;
      if (pId) {
        setProjectId(pId);
        fetchWebhooks(pId, token);
        fetchEvents(pId, token);
      }
    }
    init();
  }, []);

  async function fetchWebhooks(pId: string, token: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webhooks?project_id=${pId}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setWebhooks(data.webhooks || []);
    setLoading(false);
  }

  async function fetchEvents(pId: string, token: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webhook-events?project_id=${pId}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setEvents(data.events || []);
  }

  async function createWebhook() {
    if (!newUrl) return toast.error("Enter a URL");
    const token = await getToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webhooks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, url: newUrl })
    });
    
    if (res.ok) {
      const data = await res.json();
      setNewSecret(data.secret);
      setOpenNew(false);
      fetchWebhooks(projectId!, token as string);
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed finding webhook");
    }
  }

  async function deleteWebhook(id: string) {
    const token = await getToken();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webhooks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    toast.success("Webhook removed");
    fetchWebhooks(projectId!, token as string);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Webhooks</h1>
          <p className="text-gray-400">Register endpoints to receive real-time event notifications.</p>
        </div>
        
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white" />}>
            <Plus className="w-4 h-4 mr-2" /> Add Endpoint
          </DialogTrigger>
          <DialogContent className="bg-[#111118] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Add Webhook Endpoint</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Endpoint URL</label>
                <Input 
                  placeholder="https://api.yourdomain.com/webhooks/sandboxpay" 
                  value={newUrl} 
                  onChange={e => setNewUrl(e.target.value)}
                  className="bg-black border-white/10 text-white"
                />
              </div>
              <Button onClick={createWebhook} className="w-full bg-primary hover:bg-primary/90">Add Endpoint</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!newSecret} onOpenChange={(open) => !open && setNewSecret(null)}>
        <DialogContent className="bg-[#111118] border-white/10 text-white">
          <DialogHeader><DialogTitle>Webhook Signing Secret</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-400">Use this secret to verify webhook signatures. It won't be shown again.</p>
          <code className="text-primary font-mono text-sm block bg-black border border-white/10 p-3 rounded-md mt-2 break-all">{newSecret}</code>
          <div className="mt-4"><Button onClick={() => setNewSecret(null)} className="w-full">Saved safely</Button></div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="endpoints" className="w-full">
        <TabsList className="bg-[#111118] border border-white/10 rounded-md p-1 h-12 w-full max-w-sm mb-6">
          <TabsTrigger value="endpoints" className="h-10 data-[state=active]:bg-primary data-[state=active]:text-white flex-1 transition-all rounded">Endpoints</TabsTrigger>
          <TabsTrigger value="events" className="h-10 data-[state=active]:bg-primary data-[state=active]:text-white flex-1 transition-all rounded">Delivery Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="m-0">
          <div className="rounded-xl border border-white/10 bg-[#111118] overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5 border-b border-white/10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-gray-400">URL</TableHead>
                  <TableHead className="text-gray-400">STATUS</TableHead>
                  <TableHead className="text-gray-400">EVENTS DELIVERED</TableHead>
                  <TableHead className="text-right text-gray-400">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">Loading webhooks...</TableCell></TableRow>
                ) : webhooks.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-gray-500">No webhooks registered.</TableCell></TableRow>
                ) : webhooks.map((wh) => (
                  <TableRow key={wh.id} className="border-b border-white/5 bg-[#111118] hover:bg-white/5">
                    <TableCell className="font-medium text-white max-w-[200px] truncate">{wh.url}</TableCell>
                    <TableCell><Badge className="bg-green-500/10 text-green-400 shadow-none border-none">Active</Badge></TableCell>
                    <TableCell className="text-gray-300">{wh._count.webhookEvents} events</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-red-400" onClick={() => deleteWebhook(wh.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="events" className="m-0">
          <div className="rounded-xl border border-white/10 bg-[#111118] overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5 border-b border-white/10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-gray-400">EVENT TYPE</TableHead>
                  <TableHead className="text-gray-400">STATUS</TableHead>
                  <TableHead className="text-gray-400">PAYMENT</TableHead>
                  <TableHead className="text-right text-gray-400">DATE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">Loading events...</TableCell></TableRow>
                ) : events.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-gray-500">No webhook events delivered yet.</TableCell></TableRow>
                ) : events.map((ev) => (
                  <TableRow key={ev.id} className="border-b border-white/5 bg-[#111118] hover:bg-white/5">
                    <TableCell>
                      <code className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">{ev.eventType}</code>
                    </TableCell>
                    <TableCell>
                      {ev.status === 'delivered' ? <span className="flex items-center text-green-400 text-sm"><CheckCircle2 className="w-4 h-4 mr-1"/> Delivered ({ev.httpStatus})</span>
                       : ev.status === 'failed' ? <span className="flex items-center text-red-500 text-sm"><XCircle className="w-4 h-4 mr-1"/> Failed</span>
                       : <span className="flex items-center text-blue-400 text-sm"><Clock className="w-4 h-4 mr-1"/> Pending</span>}
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">{ev.paymentId}</TableCell>
                    <TableCell className="text-right text-gray-400 text-sm">{new Date(ev.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
