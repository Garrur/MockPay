"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock, RefreshCw, ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { PlanGate } from "@/components/PlanGate";

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
    <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
      <CheckCircle2 className="w-4 h-4" /> Delivered {httpStatus && <span className="text-green-300/60 text-xs">({httpStatus})</span>}
    </span>
  );
  if (status === "failed") return (
    <span className="flex items-center gap-1.5 text-red-400 text-sm font-medium">
      <XCircle className="w-4 h-4" /> Failed {httpStatus && <span className="text-red-300/60 text-xs">({httpStatus})</span>}
    </span>
  );
  return <span className="flex items-center gap-1.5 text-yellow-400 text-sm font-medium"><Clock className="w-4 h-4" /> Pending</span>;
}

function JsonViewer({ data, label }: { data: any; label: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <pre className="bg-black/40 border border-white/10 rounded-lg p-4 text-xs text-green-300 font-mono overflow-x-auto max-h-48 scrollbar-thin">
        {JSON.stringify(data, null, 2)}
      </pre>
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
    <div className="border-b border-white/5 last:border-0">
      <div
        className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 cursor-pointer transition-colors"
        onClick={() => setExpanded((v: boolean) => !v)}
      >
        <span className="text-gray-500">{expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</span>
        <code className="text-xs text-primary bg-primary/10 px-2 py-1 rounded font-mono min-w-[180px]">{event.eventType}</code>
        <StatusBadge status={event.status} httpStatus={event.httpStatus} />
        <span className="text-gray-600 text-xs ml-auto">{event.attempts} attempt{event.attempts !== 1 ? "s" : ""}</span>
        <span className="text-gray-600 text-xs hidden md:block truncate max-w-[200px]">{event.webhook?.url}</span>
        <span className="text-gray-600 text-xs">{new Date(event.createdAt).toLocaleTimeString()}</span>
        <Button
          size="sm"
          variant="ghost"
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 h-8 px-2"
          onClick={(e) => { e.stopPropagation(); handleReplay(); }}
          disabled={replaying}
        >
          <RotateCcw className={`w-3.5 h-3.5 mr-1 ${replaying ? "animate-spin" : ""}`} /> Replay
        </Button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-12 pb-6 pt-2 grid md:grid-cols-2 gap-6 bg-black/20">
              <JsonViewer data={event.payload} label="Request Payload" />
              {event.requestHeaders && <JsonViewer data={event.requestHeaders} label="Request Headers" />}
              {event.responseBody !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Response Body</p>
                  <pre className="bg-black/40 border border-white/10 rounded-lg p-4 text-xs text-gray-300 font-mono overflow-x-auto max-h-32">
                    {event.responseBody || "(empty)"}
                  </pre>
                </div>
              )}
              <div className="text-xs text-gray-500 space-y-1">
                <p>Payment: <span className="text-gray-300">{event.payment?.orderId}</span></p>
                <p>Amount: <span className="text-gray-300">{((event.payment?.amount || 0) / 100).toFixed(2)} {event.payment?.currency}</span></p>
                {event.deliveredAt && <p>Delivered: <span className="text-gray-300">{new Date(event.deliveredAt).toLocaleString()}</span></p>}
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
    <PlanGate feature="Webhook Debugger" requiredPlan="pro" enabled={userPlan === "pro" || userPlan === "team"}>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Webhook Debugger</h1>
          <p className="text-gray-400 text-sm">Inspect every delivery attempt, payload, and response.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={(v: string) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36 h-9 bg-[#111118] border-white/10 text-white text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#111118] border-white/10 text-white">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v: string) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-52 h-9 bg-[#111118] border-white/10 text-white text-sm">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent className="bg-[#111118] border-white/10 text-white">
            {EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t === "all" ? "All Events" : t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-9" onClick={async () => {
          const token = await getToken();
          if (projectId && token) fetchEvents(projectId, token);
        }}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
        </Button>
        <span className="ml-auto text-sm text-gray-500 self-center">{total} total events</span>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-white/10 bg-[#111118] overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-500">Loading webhook events...</div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-500 mb-2">No webhook events found</p>
            <p className="text-gray-600 text-sm">Events will appear here after payments are processed.</p>
          </div>
        ) : (
          events.map((ev) => (
            <EventRow
              key={ev.id}
              event={ev}
              token=""
              onReplay={async (_id: string) => {
                const token = await getToken();
                if (projectId && token) fetchEvents(projectId, token);
              }}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-3">
          <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
          <span className="text-gray-400 text-sm self-center">Page {page} of {Math.ceil(total / 20)}</span>
          <Button variant="ghost" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next →</Button>
        </div>
      )}
      </div>
    </PlanGate>
  );
}
