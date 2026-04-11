"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Check, Trash2, Link2, ExternalLink, Calendar, Hash } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type DemoLink = {
  id: string;
  token: string;
  public_url: string;
  amount: number;
  currency: string;
  label?: string;
  allowedOutcomes: string[];
  expiresAt?: string;
  useCount: number;
  maxUses?: number;
  createdAt: string;
};

function CopyUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2 bg-stone-100/50 border border-stone-200/50 rounded-2xl px-4 py-3 mt-4 neu-pressed group">
      <code className="text-orange-700 font-bold font-mono truncate flex-1 text-xs" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{url}</code>
      <div className="flex items-center gap-1.5 ml-2">
        <button onClick={copy} className="p-2 transition-all hover:bg-white rounded-xl text-stone-600 hover:text-orange-700 active:scale-90 shadow-sm border border-transparent hover:border-stone-100" aria-label="Copy demo checkout URL">
          {copied ? <Check className="w-4.5 h-4.5 text-emerald-500" aria-hidden="true" /> : <Copy className="w-4.5 h-4.5" aria-hidden="true" />}
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 transition-all hover:bg-white rounded-xl text-stone-600 hover:text-amber-600 active:scale-90 shadow-sm border border-transparent hover:border-stone-100" aria-label="Open demo checkout in new tab">
          <ExternalLink className="w-4.5 h-4.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

export default function DemoLinksPage() {
  const { getToken } = useAuth();
  const [links, setLinks] = useState<DemoLink[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ amount: "500", currency: "INR", label: "", expires_in_days: "" });

  useEffect(() => {
    async function init() {
      const token = await getToken();
      if (!token) return;
      const pRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, { headers: { Authorization: `Bearer ${token}` } });
      const pData = await pRes.json();
      const pId = pData.projects?.[0]?.id;
      if (pId) { setProjectId(pId); fetchLinks(pId, token); }
    }
    init();
  }, []);

  async function fetchLinks(pId: string, token: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/demo-links?project_id=${pId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setLinks(data.links || []);
    setLoading(false);
  }

  async function createLink() {
    if (!form.amount) return toast.error("Enter an amount");
    const token = await getToken();
    const body: any = {
      project_id: projectId,
      amount: Math.round(parseFloat(form.amount) * 100),
      currency: form.currency,
      label: form.label || undefined,
    };
    if (form.expires_in_days) body.expires_in_days = parseInt(form.expires_in_days);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/demo-links`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success("Demo link created!");
      setCreateOpen(false);
      fetchLinks(projectId!, token as string);
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to create link");
    }
  }

  async function deleteLink(id: string) {
    const token = await getToken();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/demo-links/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Link deleted");
    fetchLinks(projectId!, token as string);
  }

  const isExpired = (link: DemoLink) => link.expiresAt && new Date() > new Date(link.expiresAt);
  const isMaxed = (link: DemoLink) => link.maxUses && link.useCount >= link.maxUses;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Demo Links</h1>
          <p className="text-stone-700 font-medium text-lg">Create shareable public checkout pages — no login required for viewers.</p>
        </div>
        <Button 
          className="h-12 px-6 bg-gradient-to-br from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/10 active:scale-95 transition-all" 
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-5 h-5 mr-2" /> Create Link
        </Button>
      </div>

      {/* Use case cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { icon: "🎓", title: "College Submissions", text: "Show a working payment flow to your professor.", color: "bg-amber-50" },
          { icon: "💼", title: "Client Demos", text: "Share a live checkout experience without real money.", color: "bg-emerald-50" },
          { icon: "🚀", title: "Portfolio Projects", text: "Impress interviewers with a demo anyone can try.", color: "bg-orange-50" },
        ].map(item => (
          <div key={item.title} className="rounded-[2rem] border-none bg-white p-8 neu-flat transition-all hover:-translate-y-1">
            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm`}>{item.icon}</div>
            <p className="font-extrabold text-xl text-foreground mb-2">{item.title}</p>
            <p className="text-sm text-stone-700 font-medium leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>

      {/* Links list */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
           <Link2 className="w-5 h-5 text-stone-600" />
           <h2 className="font-extrabold text-lg text-stone-700 uppercase tracking-widest">Active Demo Interfaces</h2>
        </div>
        
        {loading ? (
          <div className="text-center py-20 text-stone-600 font-medium italic">Loading demo links...</div>
        ) : links.length === 0 ? (
          <div className="rounded-[3rem] border-none bg-white/40 neu-flat py-32 text-center backdrop-blur-sm">
            <div className="relative w-24 h-24 mx-auto mb-8">
               <Link2 className="w-24 h-24 text-stone-500 opacity-20 rotate-45" />
               <div className="absolute inset-0 m-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Plus className="w-6 h-6 text-orange-600" />
               </div>
            </div>
            <p className="text-foreground font-extrabold text-2xl mb-3">No demo links yet</p>
            <p className="text-stone-700 font-medium text-lg mb-10 max-w-sm mx-auto">Generate a public shareable payment page for your project in seconds.</p>
            <Button onClick={() => setCreateOpen(true)} className="h-14 px-10 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-[1.5rem] shadow-xl shadow-orange-500/20 transition-all active:scale-95">
              <Plus className="w-6 h-6 mr-3" /> Create First Link
            </Button>
          </div>
        ) : (
          links.map(link => (
            <div key={link.id} className="rounded-[2.5rem] border-none bg-white/40 neu-flat p-10 overflow-hidden backdrop-blur-sm transition-all hover:scale-[1.01] flex flex-col md:flex-row gap-10 md:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="font-extrabold text-foreground text-3xl tracking-tight leading-none">{link.label || "Untitled Demo"}</h3>
                  {(isExpired(link) || isMaxed(link)) ? (
                    <Badge className="bg-red-100 text-red-600 border-none px-4 py-1.5 font-extrabold rounded-full text-xs">Expired</Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-600 border-none px-4 py-1.5 font-extrabold rounded-full text-xs">Active</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-6 text-stone-600">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-1">Currency Interface</span>
                     <span className="text-2xl font-black text-foreground">
                        ₹{(link.amount / 100).toFixed(2)} <span className="text-stone-600 text-lg">{link.currency}</span>
                     </span>
                  </div>
                  <div className="w-px h-10 bg-stone-200" />
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-1">Total Interactions</span>
                     <span className="text-2xl font-black text-orange-700">
                        {link.useCount}<span className="text-stone-600 text-lg">{link.maxUses ? `/${link.maxUses}` : ""}</span>
                     </span>
                  </div>
                </div>

                <CopyUrl url={link.public_url} />

                <div className="flex flex-wrap gap-6 mt-8 text-xs font-bold text-stone-600">
                  {link.expiresAt && (
                    <span className="flex items-center gap-2">
                       <Calendar className="w-4 h-4 text-orange-500" /> 
                       Expires {new Date(link.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-amber-500" />
                     Outcomes: <span className="text-stone-600 uppercase tracking-tighter ml-1">{link.allowedOutcomes.join(" • ")}</span>
                  </span>
                </div>
              </div>

              <div className="md:w-px md:h-24 bg-stone-200" />
              
              <div className="flex flex-row md:flex-col gap-3 shrink-0">
                 <Button 
                   onClick={() => window.open(link.public_url, '_blank')}
                   className="flex-1 md:w-40 h-14 bg-white border border-stone-200 text-foreground font-extrabold rounded-2xl hover:bg-stone-50 transition-all active:scale-95 shadow-sm group"
                 >
                    <ExternalLink className="w-5 h-5 mr-3 group-hover:text-amber-600 transition-colors" />
                    Open Live
                 </Button>
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   aria-label="Delete demo link"
                   className="h-14 w-14 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all" 
                   onClick={() => deleteLink(link.id)}
                 >
                    <Trash2 className="w-6 h-6" aria-hidden="true" />
                 </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-background border-none neu-convex text-foreground rounded-[2rem] p-10 max-w-xl">
          <DialogHeader><DialogTitle className="text-3xl font-extrabold tracking-tight mb-2">Create Demo Link</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <label className="text-sm font-bold text-stone-700 uppercase tracking-widest ml-1">Label (Title)</label>
              <Input 
                placeholder="e.g. E-commerce Checkout Demo"
                value={form.label} 
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                className="h-14 bg-white/50 border-stone-200 rounded-2xl text-foreground font-medium focus:ring-orange-500/20 neu-pressed px-5" 
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-stone-700 uppercase tracking-widest ml-1">Amount (₹)</label>
                <Input 
                  type="number" 
                  placeholder="500"
                  value={form.amount} 
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="h-14 bg-white/50 border-stone-200 rounded-2xl text-foreground font-medium focus:ring-orange-500/20 neu-pressed px-5" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-stone-700 uppercase tracking-widest ml-1">Expiry (Days)</label>
                <Input 
                  type="number" 
                  placeholder="Never"
                  value={form.expires_in_days} 
                  onChange={e => setForm(f => ({ ...f, expires_in_days: e.target.value }))}
                  className="h-14 bg-white/50 border-stone-200 rounded-2xl text-foreground font-medium focus:ring-orange-500/20 neu-pressed px-5" 
                />
              </div>
            </div>
            <p className="text-xs text-stone-600 font-medium italic bg-stone-50 p-4 rounded-xl border border-stone-100">All outcomes (success, failed, cancelled) are enabled by default for these links.</p>
            <Button onClick={createLink} className="w-full h-16 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-[1.5rem] shadow-xl shadow-orange-500/20 transition-all active:scale-95 mt-4">
               Generate Checkout Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

