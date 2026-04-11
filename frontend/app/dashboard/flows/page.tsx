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
  { type: "payment.created", label: "Payment Created", color: "text-amber-500", bg: "bg-amber-400/10" },
  { type: "payment.pending", label: "Payment Pending", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { type: "payment.success", label: "Payment Success", color: "text-green-400", bg: "bg-green-400/10" },
  { type: "payment.failed",  label: "Payment Failed",  color: "text-red-400",   bg: "bg-red-400/10"   },
  { type: "payment.cancelled", label: "Cancelled",     color: "text-stone-600",  bg: "bg-gray-400/10"  },
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
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border-none neu-flat ${meta.bg.replace('/10', '/5')}`}>
        <Zap className={`w-4 h-4 ${meta.color.replace('-400', '-600')}`} />
        <span className={`text-sm font-extrabold font-mono transition-colors ${meta.color.replace('-400', '-600')}`} style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{meta.label}</span>
        {step.delayMs > 0 && <span className="text-stone-900 font-extrabold text-[10px] bg-stone-100 px-1.5 py-0.5 rounded-md">+{step.delayMs}ms</span>}
        {step.triggerWebhook && <span className="text-white text-[9px] font-bold uppercase tracking-widest bg-orange-700 px-1.5 py-0.5 rounded-md shadow-sm border border-orange-800/20">webhook</span>}
      </div>
      <ChevronRight className="w-5 h-5 text-stone-700 shrink-0" />
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
  const [userPlan, setUserPlan] = useState<string>("free");

  useEffect(() => {
    async function init() {
      const token = await getToken();
      if (!token) return;
      const pRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, { headers: { Authorization: `Bearer ${token}` } });
      const pData = await pRes.json();
      if (pData.plan) setUserPlan(pData.plan);
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Flow Testing Studio</h1>
          <p className="text-stone-900 font-bold opacity-80">Simulate complete payment lifecycles and trigger webhook sequences.</p>
        </div>
        <Button 
          className="h-12 px-6 bg-gradient-to-br from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/10 active:scale-95 transition-all" 
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-5 h-5 mr-2" /> New Flow
        </Button>
      </div>

      {/* Last run result */}
      {lastResult && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-[2rem] border-none bg-orange-500/5 p-8 flex flex-col gap-3 shadow-sm border border-orange-500/20">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-200"><CheckCircle2 className="w-6 h-6" /></div>
             <p className="text-orange-700 font-extrabold text-xl">{lastResult.message}</p>
          </div>
          <div className="text-stone-900 font-bold ml-12 space-y-3 opacity-80">
            <p className="flex items-center gap-2">Payment ID: <code className="text-orange-900 font-black font-mono bg-orange-50 px-3 py-1 rounded-lg" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{lastResult.payment_id}</code></p>
            <div className="flex flex-wrap gap-3 mt-4">
              {lastResult.queued_events?.map((ev: any, i: number) => (
                <div key={i} className="bg-white/60 border border-stone-200 text-stone-900 px-4 py-2 rounded-xl text-xs font-black shadow-sm flex items-center gap-2">
                  <Clock className="w-3 h-3 text-orange-700" />
                  {ev.step} in {ev.delayMs}ms
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Flow list */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-20 text-stone-600 font-medium italic">Loading flows...</div>
        ) : flows.length === 0 ? (
          <div className="rounded-[3rem] border-none bg-white/40 neu-flat py-24 text-center backdrop-blur-sm">
            <div className="relative w-24 h-24 mx-auto mb-10">
               <Zap className="w-24 h-24 text-stone-700 opacity-20" />
            </div>
            <Button onClick={() => setCreateOpen(true)} className="h-16 px-10 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-[1.5rem] shadow-xl shadow-orange-500/20 transition-all active:scale-95">
              <Plus className="w-6 h-6 mr-3" /> Create First Flow
            </Button>
          </div>
        ) : (
          flows.map(flow => (
            <div key={flow.id} className="rounded-[2rem] border-none bg-white/40 neu-flat p-8 transition-all hover:scale-[1.01] backdrop-blur-sm group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/60 neu-flat rounded-2xl flex items-center justify-center text-orange-600">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-foreground text-2xl tracking-tight">{flow.name}</h3>
                    <p className="text-stone-950 font-black text-xs uppercase tracking-widest mt-1 opacity-60">
                      {flow.lastRunAt ? `Last run: ${new Date(flow.lastRunAt).toLocaleString()}` : "Never run"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="h-12 px-6 bg-white border border-stone-200 text-foreground font-bold rounded-2xl hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all shadow-sm active:scale-95"
                    onClick={() => runFlow(flow.id)}
                    disabled={running === flow.id}
                  >
                    {running === flow.id ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
                    Run Flow
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Delete flow" className="h-12 w-12 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all" onClick={() => deleteFlow(flow.id)}>
                    <Trash2 className="w-5 h-5" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {/* Flow step visualization */}
              <div className="flex flex-wrap items-center gap-2 p-6 bg-stone-100/30 rounded-[1.5rem] border border-stone-200/50 neu-pressed">
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
        <DialogContent className="bg-background border-none neu-convex text-foreground rounded-[2rem] p-10 max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-extrabold tracking-tight mb-2">Create Payment Flow</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <label className="text-sm font-black text-stone-900 uppercase tracking-widest ml-1">Flow Name</label>
              <Input
                placeholder="e.g. Happy Path, Failure Scenario"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="h-14 bg-white/50 border-stone-200 rounded-2xl text-foreground font-medium focus:ring-orange-500/20 neu-pressed px-5"
              />
            </div>
            <div>
              <label className="text-sm font-black text-stone-900 uppercase tracking-widest ml-1 mb-4 block">Default Step Sequence</label>
              <div className="grid gap-3">
                {newSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 border border-stone-100 shadow-sm">
                    <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 font-bold text-xs">{i + 1}</div>
                    <code className="text-foreground font-mono font-bold text-sm flex-1">{step.type}</code>
                    <div className="flex items-center gap-3">
                       <span className="text-stone-900 font-black text-[10px] bg-stone-100 px-2 py-1 rounded-md">+{step.delayMs}ms</span>
                       {step.triggerWebhook && <span className="text-white text-[9px] font-bold uppercase tracking-widest bg-orange-600 px-2 py-1 rounded-md shadow-sm">webhook</span>}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-stone-950 font-bold mt-6 bg-stone-50 p-4 rounded-xl border border-stone-100 italic leading-relaxed opacity-70">
                Note: In the free beta, custom logic sequences are fixed to the standard "Success" lifecycle. Custom sequence editing is coming soon to the Pro plan.
              </p>
            </div>
            <Button onClick={createFlow} className="w-full h-16 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-[1.5rem] shadow-xl shadow-orange-500/20 transition-all active:scale-95 mt-4">
              Create Flow
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

