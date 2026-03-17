"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Trash2, CheckCircle2, Clock, Zap, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";

type FlowStep = { type: string; delayMs: number; triggerWebhook: boolean };
type Flow = {
  id: string;
  name: string;
  steps: FlowStep[];
  status: "idle" | "running" | "completed" | "failed";
  lastRunAt?: string;
  createdAt: string;
};

const STEP_TYPES = [
  { type: "payment.created", label: "Payment Created", color: "text-blue-400", bg: "bg-blue-400/10" },
  { type: "payment.pending", label: "Payment Pending", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { type: "payment.success", label: "Payment Success", color: "text-green-400", bg: "bg-green-400/10" },
  { type: "payment.failed",  label: "Payment Failed",  color: "text-red-400",   bg: "bg-red-400/10"   },
  { type: "payment.cancelled", label: "Cancelled",     color: "text-gray-400",  bg: "bg-gray-400/10"  },
];

const DEFAULT_STEPS: FlowStep[] = [
  { type: "payment.created", delayMs: 0,    triggerWebhook: true  },
  { type: "payment.pending", delayMs: 1000, triggerWebhook: false },
  { type: "payment.success", delayMs: 3000, triggerWebhook: true  },
];

function StepNode({ step, index }: { step: FlowStep; index: number }) {
  const meta = STEP_TYPES.find(s => s.type === step.type) || STEP_TYPES[0];
  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 ${meta.bg}`}>
        <Zap className={`w-3.5 h-3.5 ${meta.color}`} />
        <span className={`text-xs font-mono ${meta.color}`}>{meta.label}</span>
        {step.delayMs > 0 && <span className="text-gray-600 text-[10px]">+{step.delayMs}ms</span>}
        {step.triggerWebhook && <span className="text-primary text-[9px] bg-primary/10 px-1 rounded">webhook</span>}
      </div>
      <ChevronRight className="w-4 h-4 text-gray-700 shrink-0" />
    </div>
  );
}

export default function FlowsPage() {
  const { getToken } = useAuth();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSteps, setNewSteps] = useState<FlowStep[]>(DEFAULT_STEPS);
  const [lastResult, setLastResult] = useState<any | null>(null);

  useEffect(() => {
    async function init() {
      const token = await getToken();
      if (!token) return;
      const pRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, { headers: { Authorization: `Bearer ${token}` } });
      const pData = await pRes.json();
      const pId = pData.projects?.[0]?.id;
      if (pId) { setProjectId(pId); fetchFlows(pId, token); }
    }
    init();
  }, []);

  async function fetchFlows(pId: string, token: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/flows?project_id=${pId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setFlows(data.flows || []);
    setLoading(false);
  }

  async function createFlow() {
    if (!newName.trim()) return toast.error("Enter a flow name");
    const token = await getToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/flows`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, name: newName, steps: newSteps }),
    });
    if (res.ok) {
      toast.success("Flow created!");
      setCreateOpen(false);
      setNewName("");
      fetchFlows(projectId!, token as string);
    }
  }

  async function runFlow(flowId: string) {
    setRunning(flowId);
    setLastResult(null);
    const token = await getToken();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/flows/${flowId}/run`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Flow started! ${data.queued_events?.length || 0} events queued.`);
        setLastResult(data);
        fetchFlows(projectId!, token as string);
      } else {
        toast.error(data.error || "Failed to run flow");
      }
    } finally {
      setRunning(null);
    }
  }

  async function deleteFlow(flowId: string) {
    const token = await getToken();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/flows/${flowId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Flow deleted");
    fetchFlows(projectId!, token as string);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Flow Testing Studio</h1>
          <p className="text-gray-400 text-sm">Simulate complete payment lifecycles and trigger webhook sequences.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Flow
        </Button>
      </div>

      {/* Last run result */}
      {lastResult && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-green-500/30 bg-green-500/5 p-5">
          <p className="text-green-400 font-medium mb-2">✅ {lastResult.message}</p>
          <div className="text-sm text-gray-400 space-y-1">
            <p>Payment ID: <code className="text-white font-mono">{lastResult.payment_id}</code></p>
            <div className="flex flex-wrap gap-2 mt-2">
              {lastResult.queued_events?.map((ev: any, i: number) => (
                <Badge key={i} className="bg-primary/20 text-primary border-none text-xs">
                  {ev.step} in {ev.delayMs}ms
                </Badge>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Flow list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading flows...</div>
        ) : flows.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#111118] py-24 text-center">
            <Zap className="w-10 h-10 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 font-medium mb-2">No flows yet</p>
            <p className="text-gray-600 text-sm mb-6">Create a flow to simulate a full payment lifecycle.</p>
            <Button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Create First Flow
            </Button>
          </div>
        ) : (
          flows.map(flow => (
            <div key={flow.id} className="rounded-2xl border border-white/10 bg-[#111118] p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{flow.name}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {flow.lastRunAt ? `Last run: ${new Date(flow.lastRunAt).toLocaleString()}` : "Never run"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => runFlow(flow.id)}
                    disabled={running === flow.id}
                  >
                    {running === flow.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                    Run Flow
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-400" onClick={() => deleteFlow(flow.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Flow step visualization */}
              <div className="flex flex-wrap items-center gap-0">
                {(flow.steps as FlowStep[]).map((step, i) => (
                  <StepNode key={i} step={step} index={i} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create flow dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#111118] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Payment Flow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Flow Name</label>
              <Input
                placeholder="e.g. Happy Path, Failure Scenario"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="bg-black border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Steps (in sequence)</label>
              <div className="space-y-2">
                {newSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
                    <code className="text-primary text-xs font-mono">{step.type}</code>
                    <span className="text-gray-600 text-xs">+{step.delayMs}ms</span>
                    {step.triggerWebhook && <Badge className="ml-auto bg-primary/20 text-primary border-none text-[10px]">webhook</Badge>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">Using default flow: created → pending → success</p>
            </div>
            <Button onClick={createFlow} className="w-full bg-primary hover:bg-primary/90">
              Create Flow
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
