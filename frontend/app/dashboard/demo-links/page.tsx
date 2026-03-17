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
    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2 mt-2">
      <code className="text-primary text-xs font-mono truncate flex-1">{url}</code>
      <button onClick={copy} className="text-gray-500 hover:text-white shrink-0 transition-colors">
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white shrink-0 transition-colors">
        <ExternalLink className="w-4 h-4" />
      </a>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Demo Links</h1>
          <p className="text-gray-400 text-sm">Create shareable public checkout pages — no login required for viewers.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Demo Link
        </Button>
      </div>

      {/* Use case cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: "🎓", title: "College Submissions", text: "Show a working payment flow to your professor." },
          { icon: "💼", title: "Client Demos", text: "Share a live checkout experience without real money." },
          { icon: "🚀", title: "Portfolio Projects", text: "Impress interviewers with a demo anyone can try." },
        ].map(item => (
          <div key={item.title} className="rounded-xl border border-white/10 bg-[#111118]/50 p-5">
            <p className="text-2xl mb-2">{item.icon}</p>
            <p className="font-semibold text-sm text-white mb-1">{item.title}</p>
            <p className="text-xs text-gray-500">{item.text}</p>
          </div>
        ))}
      </div>

      {/* Links list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading demo links...</div>
        ) : links.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#111118] py-24 text-center">
            <Link2 className="w-10 h-10 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 font-medium mb-2">No demo links yet</p>
            <p className="text-gray-600 text-sm mb-6">Generate a public shareable payment page in seconds.</p>
            <Button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Create First Link
            </Button>
          </div>
        ) : (
          links.map(link => (
            <div key={link.id} className="rounded-2xl border border-white/10 bg-[#111118] p-6 overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-white">{link.label || "Untitled Demo"}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-gray-400 text-sm font-mono">
                      ₹{(link.amount / 100).toFixed(2)} {link.currency}
                    </span>
                    {(isExpired(link) || isMaxed(link)) ? (
                      <Badge className="bg-red-500/10 text-red-400 border-none text-xs">Expired</Badge>
                    ) : (
                      <Badge className="bg-green-500/10 text-green-400 border-none text-xs">Active</Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-red-400" onClick={() => deleteLink(link.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <CopyUrl url={link.public_url} />

              <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" /> {link.useCount}{link.maxUses ? `/${link.maxUses}` : ""} uses
                </span>
                {link.expiresAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Expires {new Date(link.expiresAt).toLocaleDateString()}
                  </span>
                )}
                <span>Outcomes: {link.allowedOutcomes.join(", ")}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#111118] border-white/10 text-white">
          <DialogHeader><DialogTitle>Create Demo Link</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Label (optional)</label>
              <Input placeholder="e.g. E-commerce Checkout Demo"
                value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                className="bg-black border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Amount (₹)</label>
                <Input type="number" placeholder="500"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="bg-black border-white/10 text-white" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Expires (days)</label>
                <Input type="number" placeholder="Never"
                  value={form.expires_in_days} onChange={e => setForm(f => ({ ...f, expires_in_days: e.target.value }))}
                  className="bg-black border-white/10 text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-600">All outcomes (success, failed, cancelled) are allowed by default.</p>
            <Button onClick={createLink} className="w-full bg-primary hover:bg-primary/90">Generate Link</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
