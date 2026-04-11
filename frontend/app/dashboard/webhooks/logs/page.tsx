"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock, RefreshCw, ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";


type WhEvent = {
  id: string;
  eventType: string;
  status: "pending" | "delivered" | "failed";
  httpStatus?: number;
  attempts: number;
  payload: any;
  requestHeaders?: any;
  responseBody?: string;
  responseHeaders?: any;
  createdAt: string;
  deliveredAt?: string;
  webhook: { url: string };
  payment: { orderId: string; amount: number; currency: string; status: string };
};

function StatusBadge({ status, httpStatus }: { status: string; httpStatus?: number }) {
  if (status === "delivered") return (
    <span className="flex items-center gap-2 text-emerald-600 font-extrabold text-sm bg-emerald-100/50 px-3 py-1 rounded-xl shadow-sm">
      <CheckCircle2 className="w-4 h-4" /> Delivered {httpStatus && <span className="opacity-60 text-[10px] bg-emerald-600 text-white px-1.5 rounded-md ml-1">{httpStatus}</span>}
    </span>
  );
  if (status === "failed") return (
    <span className="flex items-center gap-2 text-red-600 font-extrabold text-sm bg-red-100/50 px-3 py-1 rounded-xl shadow-sm">
      <XCircle className="w-4 h-4" /> Failed {httpStatus && <span className="opacity-60 text-[10px] bg-red-600 text-white px-1.5 rounded-md ml-1">{httpStatus}</span>}
    </span>
  );
  return <span className="flex items-center gap-2 text-amber-600 font-extrabold text-sm bg-amber-100/50 px-3 py-1 rounded-xl shadow-sm animate-pulse"><Clock className="w-4 h-4" /> Pending</span>;
}

function JsonViewer({ data, label }: { data: any; label: string }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black text-stone-900 uppercase tracking-widest ml-1">{label}</p>
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <code className="text-[9px] text-stone-700 font-mono">JSON</code>
        </div>
        <pre className="text-xs text-emerald-400 font-mono overflow-x-auto max-h-48 scrollbar-thin leading-relaxed" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function EventRow({ event, onReplay, token }: { event: WhEvent; onReplay: (id: string) => void; token: string }) {
  const [expanded, setExpanded] = useState(false);
  const [replaying, setReplaying] = useState(false);

  const handleReplay = async () => {
    setReplaying(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webhooks/replay/${event.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Event queued for replay!");
        onReplay(event.id);
      } else {
        toast.error("Failed to replay");
      }
    } finally {
      setReplaying(false);
    }
  };

  return (
    <div className="border-b border-stone-100/50 last:border-0">
      <div
        className={`flex items-center gap-4 px-8 py-5 hover:bg-white/50 cursor-pointer transition-all ${expanded ? "bg-stone-50/50" : ""}`}
        onClick={() => setExpanded((v: boolean) => !v)}
      >
        <span className="text-stone-700">{expanded ? <ChevronDown className="w-5 h-5 text-orange-700" /> : <ChevronRight className="w-5 h-5" />}</span>
        <code className="text-[11px] text-orange-700 font-bold font-mono bg-orange-100/50 px-3 py-1.5 rounded-xl border border-orange-100 min-w-[200px]" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{event.eventType}</code>
        <StatusBadge status={event.status} httpStatus={event.httpStatus} />
        
        <div className="ml-auto flex items-center gap-6">
           <span className="text-stone-900 font-extrabold text-[10px] uppercase tracking-tighter bg-stone-100 px-2.5 py-1 rounded-md">{event.attempts} attempt{event.attempts !== 1 ? "s" : ""}</span>
           <span className="text-stone-900 font-mono text-[10px] hidden lg:block truncate max-w-[200px] opacity-80" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{event.webhook?.url}</span>
           <span className="text-stone-950 font-black text-xs whitespace-nowrap">{new Date(event.createdAt).toLocaleTimeString()}</span>
           <Button
             size="sm"
             variant="ghost"
             aria-label="Replay webhook event"
             className="h-10 px-4 bg-white border border-stone-200 text-foreground font-bold rounded-xl hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all active:scale-95 shadow-sm"
             onClick={(e) => { e.stopPropagation(); handleReplay(); }}
             disabled={replaying}
           >
             <RotateCcw className={`w-4 h-4 mr-2 ${replaying ? "animate-spin" : ""}`} aria-hidden="true" /> Replay
           </Button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white/20"
          >
            <div className="px-16 pb-10 pt-4 grid xl:grid-cols-2 gap-10">
              <div className="space-y-8">
                 <JsonViewer data={event.payload} label="Simulation Payload" />
                 {event.requestHeaders && <JsonViewer data={event.requestHeaders} label="Outgoing Headers" />}
              </div>
              <div className="space-y-8">
                {event.responseBody !== undefined && (
                  <div>
                    <p className="text-[10px] font-black text-stone-900 uppercase tracking-widest ml-1 mb-3">Response Surface</p>
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 neu-pressed">
                      <pre className="text-xs text-stone-600 font-mono overflow-x-auto max-h-48 leading-relaxed" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                        {event.responseBody || "(EMPTY_RESPONSE)"}
                      </pre>
                    </div>
                  </div>
                )}
                <div className="bg-white/40 border border-stone-100 rounded-3xl p-8 flex flex-col gap-4 shadow-sm backdrop-blur-md">
                   <p className="font-black text-stone-900 text-[10px] uppercase tracking-widest">Metadata Context</p>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                         <span className="text-[10px] font-black text-stone-900">Payment Reference</span>
                         <p className="text-sm font-black text-foreground">{event.payment?.orderId}</p>
                      </div>
                      <div className="space-y-1">
                         <span className="text-[10px] font-black text-stone-900">Amount Processed</span>
                          <p className="text-sm font-black text-orange-800">{((event.payment?.amount || 0) / 100).toFixed(2)} {event.payment?.currency}</p>
                      </div>
                      <div className="space-y-1">
                         <span className="text-[10px] font-black text-stone-900">Final Delivery</span>
                         <p className="text-sm font-black text-foreground">{event.deliveredAt ? new Date(event.deliveredAt).toLocaleString() : "Pending..."}</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WebhookLogsPage() {
  const { getToken } = useAuth();
  const [events, setEvents] = useState<WhEvent[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [userPlan, setUserPlan] = useState<string>("free");

  const fetchEvents = useCallback(async (pid: string, tok: string) => {
    const params = new URLSearchParams({ project_id: pid, page: String(page), limit: "20" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (typeFilter !== "all") params.set("event_type", typeFilter);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webhook-events?${params}`, {
      headers: { Authorization: `Bearer ${tok}` },
    });
    const data = await res.json();
    setEvents(data.events || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function init() {
      const token = await getToken();
      if (!token) return;
      const pRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, { headers: { Authorization: `Bearer ${token}` } });
      const pData = await pRes.json();
      if (pData.plan) setUserPlan(pData.plan);
      const pId = pData.projects?.[0]?.id;
      if (pId) {
        setProjectId(pId);
        fetchEvents(pId, token);
        // Poll every 5 seconds for live updates
        interval = setInterval(() => fetchEvents(pId, token), 5000);
      }
    }
    init();
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const EVENT_TYPES = ["all", "payment.created", "payment.success", "payment.failed", "payment.cancelled"];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Webhook Debugger</h1>
          <p className="text-stone-700 font-medium text-lg">Inspect every delivery attempt, payload, and response in real-time.</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-100 text-emerald-700 rounded-full font-extrabold text-sm shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" /> Live Stream
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap items-center">
        <Select value={statusFilter} onValueChange={(v: string) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44 h-12 bg-white/60 border-stone-200 rounded-2xl text-foreground font-bold shadow-sm neu-flat">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-background border-stone-200 rounded-2xl text-foreground font-bold">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={typeFilter} onValueChange={(v: string) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-64 h-12 bg-white/60 border-stone-200 rounded-2xl text-foreground font-bold shadow-sm neu-flat">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent className="bg-background border-stone-200 rounded-2xl text-foreground font-bold">
            {EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t === "all" ? "All Events" : t}</SelectItem>)}
          </SelectContent>
        </Select>

        <Button 
          variant="ghost" 
          className="h-12 px-6 bg-white border border-stone-200 text-foreground font-bold rounded-2xl hover:bg-stone-50 transition-all active:scale-95 shadow-sm" 
          onClick={async () => {
            const token = await getToken();
            if (projectId && token) fetchEvents(projectId, token);
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
        
        <span className="ml-auto text-sm font-black text-stone-950 uppercase tracking-widest opacity-80">{total} deliveries captured</span>
      </div>

      {/* Timeline */}
      <div className="rounded-[3rem] border-none bg-white/40 overflow-hidden neu-flat p-1 backdrop-blur-sm">
        {loading ? (
          <div className="py-32 text-center text-stone-600 font-medium italic">Synchronizing trace logs...</div>
        ) : events.length === 0 ? (
          <div className="py-40 text-center">
             <div className="w-20 h-20 bg-stone-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <RotateCcw className="w-8 h-8 text-stone-500" />
             </div>
            <p className="text-foreground font-extrabold text-2xl mb-2">No webhook traffic yet</p>
            <p className="text-stone-950 font-bold text-lg max-w-sm mx-auto opacity-80">Events will begin flowing here as soon as a payment simulation starts.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {events.map((ev) => (
              <EventRow
                key={ev.id}
                event={ev}
                token=""
                onReplay={async (_id: string) => {
                  const token = await getToken();
                  if (projectId && token) fetchEvents(projectId, token);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center items-center gap-6 pt-10 pb-20">
          <Button variant="ghost" className="h-12 px-8 font-black text-stone-800 hover:text-foreground hover:bg-white rounded-2xl" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
             Previous Page
          </Button>
          <div className="h-10 px-6 bg-white/60 border border-stone-100 rounded-xl flex items-center justify-center font-bold text-foreground text-sm shadow-sm">
             {page} <span className="text-stone-800 font-black mx-2">/</span> {Math.ceil(total / 20)}
          </div>
          <Button variant="ghost" className="h-12 px-8 font-bold text-foreground hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-stone-100" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>
             Next Result →
          </Button>
        </div>
      )}
    </div>
  );
}

