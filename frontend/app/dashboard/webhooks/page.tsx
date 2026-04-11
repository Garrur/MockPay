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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Webhooks</h1>
          <p className="text-stone-900 font-bold text-lg">Register endpoints to receive real-time event notifications.</p>
        </div>
        
        <Dialog open={openNew} onOpenChange={setOpenNew}>
        <Button onClick={() => setOpenNew(true)} className="h-12 px-6 bg-gradient-to-br from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/10 active:scale-95 transition-all">
          <Plus className="w-5 h-5 mr-2" /> Add Endpoint
        </Button>
          <DialogContent className="bg-background border-none neu-convex text-foreground rounded-[2rem] p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold tracking-tight">Add Webhook Endpoint</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <label className="text-sm font-bold text-stone-900 uppercase tracking-widest ml-1">Endpoint URL</label>
                <Input 
                  placeholder="https://api.yourdomain.com/webhooks/mockpay" 
                  value={newUrl} 
                  onChange={e => setNewUrl(e.target.value)}
                  className="h-14 bg-white/50 border-stone-200 rounded-2xl text-foreground font-medium focus:ring-orange-500/20 neu-pressed"
                />
              </div>
              <Button onClick={createWebhook} className="w-full h-14 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-95">Add Endpoint</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!newSecret} onOpenChange={(open) => !open && setNewSecret(null)}>
        <DialogContent className="bg-background border-none neu-convex text-foreground rounded-[2rem] p-10 max-w-lg">
          <DialogHeader><DialogTitle className="text-3xl font-extrabold tracking-tight mb-2">Signing Secret</DialogTitle></DialogHeader>
          <p className="text-stone-950 font-bold text-lg leading-relaxed opacity-80">Use this secret to verify webhook signatures. Store it safely; it won't be shown again.</p>
          <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl mt-6 group cursor-pointer relative overflow-hidden neu-pressed">
             <code className="text-emerald-400 font-mono text-sm block break-all leading-relaxed" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{newSecret}</code>
          </div>
          <div className="mt-8 flex gap-3">
             <Button onClick={() => setNewSecret(null)} className="flex-1 h-14 bg-white border border-stone-200 text-foreground font-bold rounded-2xl hover:bg-stone-50 transition-all active:scale-95">I've saved it</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="endpoints" className="w-full">
        <TabsList className="bg-stone-200/40 border-none rounded-2xl p-1.5 h-16 w-full max-w-sm mb-10 neu-pressed">
          <TabsTrigger value="endpoints" className="h-full data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:neu-flat text-stone-900 font-black text-sm flex-1 transition-all rounded-xl">Endpoints</TabsTrigger>
          <TabsTrigger value="events" className="h-full data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:neu-flat text-stone-900 font-black text-sm flex-1 transition-all rounded-xl">Delivery Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="m-0 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="rounded-[2rem] border-none bg-white/40 neu-flat overflow-hidden p-1 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-stone-100/50 border-b border-stone-200/50">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-6">URL</TableHead>
                    <TableHead className="text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-6">Status</TableHead>
                    <TableHead className="text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-6">Events Delivered</TableHead>
                    <TableHead className="text-right text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-20 text-stone-600 font-medium italic">Loading webhooks...</TableCell></TableRow>
                  ) : webhooks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-32">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                          <Plus className="w-16 h-16 text-stone-700" />
                          <p className="text-stone-700 font-bold text-lg">No webhooks registered yet</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : webhooks.map((wh) => (
                    <TableRow key={wh.id} className="border-b border-stone-100/50 last:border-none hover:bg-white/50 transition-colors">
                      <TableCell className="font-extrabold text-foreground py-6 px-6 max-w-[300px] truncate text-base">{wh.url}</TableCell>
                      <TableCell className="py-6 px-6"><Badge className="bg-emerald-100 text-emerald-700 shadow-none border-none px-3 py-1 font-bold">Active</Badge></TableCell>
                      <TableCell className="text-stone-900 font-black py-6 px-6">{wh._count.webhookEvents} events</TableCell>
                      <TableCell className="text-right py-6 px-6">
                        <Button variant="ghost" size="icon" aria-label="Delete webhook endpoint" className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" onClick={() => deleteWebhook(wh.id)}>
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="events" className="m-0 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="rounded-[2rem] border-none bg-white/40 neu-flat overflow-hidden p-1 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-stone-100/50 border-b border-stone-200/50">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-6">Event Type</TableHead>
                    <TableHead className="text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-6">Status</TableHead>
                    <TableHead className="text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-6">Payment</TableHead>
                    <TableHead className="text-right text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-6">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-20 text-stone-600 font-medium italic">Loading events...</TableCell></TableRow>
                  ) : events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-32">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                          <CheckCircle2 className="w-16 h-16 text-stone-700" />
                          <p className="text-stone-700 font-bold text-lg">No delivery logs yet</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : events.map((ev) => (
                    <TableRow key={ev.id} className="border-b border-stone-100/50 last:border-none hover:bg-white/50 transition-colors">
                      <TableCell className="py-6 px-6">
                        <code className="text-xs text-orange-700 bg-orange-100 px-3 py-1.5 rounded-xl font-bold font-mono" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{ev.eventType}</code>
                      </TableCell>
                      <TableCell className="py-6 px-6">
                        {ev.status === 'delivered' ? <span className="flex items-center text-emerald-600 font-bold text-sm bg-emerald-100/50 px-3 py-1 rounded-xl w-fit"><CheckCircle2 className="w-4 h-4 mr-2"/> Delivered ({ev.httpStatus})</span>
                         : ev.status === 'failed' ? <span className="flex items-center text-red-600 font-bold text-sm bg-red-100/50 px-3 py-1 rounded-xl w-fit"><XCircle className="w-4 h-4 mr-2"/> Failed</span>
                         : <span className="flex items-center text-amber-600 font-bold text-sm bg-amber-100/50 px-3 py-1 rounded-xl w-fit"><Clock className="w-4 h-4 mr-2"/> Pending</span>}
                      </TableCell>
                      <TableCell className="text-stone-900 font-black font-mono text-xs py-6 px-6" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{ev.paymentId.slice(0, 12)}...</TableCell>
                      <TableCell className="text-right text-stone-900 font-black text-xs py-6 px-6 whitespace-nowrap">{new Date(ev.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

