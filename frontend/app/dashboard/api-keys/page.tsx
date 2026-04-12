"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ApiKeysPage() {
  const { getToken } = useAuth();
  const [keys, setKeys] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [hoveredSecretId, setHoveredSecretId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const token = await getToken();
      if (!token) return;

      // Ensure we have a project first
      const pRes = await fetch(process.env.NEXT_PUBLIC_API_URL + '/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pData = await pRes.json();
      
      let pId = pData.projects?.[0]?.id;
      if (!pId) {
        // Create default project just-in-time
        const cRes = await fetch(process.env.NEXT_PUBLIC_API_URL + '/projects', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: "Default Project" })
        });
        const cData = await cRes.json();
        pId = cData.project.id;
      }
      setProjectId(pId);
      fetchKeys(pId, token);
    }
    init();
  }, []);

  async function fetchKeys(pId: string, token: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${pId}/keys`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setKeys(data.keys || []);
    setLoading(false);
  }

  async function openCreateDialog() {
    setKeyName("");
    setNameDialogOpen(true);
  }

  async function createKey() {
    if (!keyName.trim()) return toast.error("Please enter a name for the API key");
    setNameDialogOpen(false);
    const token = await getToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/keys`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: keyName.trim() })
    });
    const data = await res.json();
    setNewSecret(data.secretKey);
    fetchKeys(projectId!, token as string);
  }

  async function revokeKey(keyId: string) {
    const token = await getToken();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/keys/${keyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success("Key revoked");
    fetchKeys(projectId!, token as string);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 w-full">
        <div className="flex flex-col gap-1 w-full">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">API Keys</h1>
          <p className="text-stone-900 font-bold text-lg break-words">Manage your project's public and secret keys to authenticate API requests.</p>
        </div>
        <Button 
          onClick={openCreateDialog} 
          className="h-12 w-full sm:w-auto px-6 bg-gradient-to-br from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/10 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 mr-2" /> Generate Key
        </Button>
      </div>

      {/* Name Dialog */}
      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent className="bg-background border-none neu-convex text-foreground rounded-[2rem] p-10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-3xl font-extrabold tracking-tight mb-2">Identify your Key</DialogTitle>
            <DialogDescription className="text-stone-950 font-bold text-lg leading-relaxed opacity-80">
              Give this key a memorable label (e.g., "Production", "Staging") so you can manage it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
             <div className="space-y-3">
                <label className="text-sm font-bold text-stone-900 uppercase tracking-widest ml-1">Key Label</label>
                <Input
                  placeholder="e.g. Production Mobile App"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createKey()}
                  className="h-14 bg-white/50 border-stone-200 rounded-2xl text-foreground font-medium focus:ring-orange-500/20 neu-pressed px-5"
                  autoFocus
                />
             </div>
             <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setNameDialogOpen(false)} className="flex-1 h-14 font-bold text-stone-800 hover:text-foreground rounded-2xl">
                  Cancel
                </Button>
                <Button onClick={createKey} className="flex-1 h-14 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-95">
                  Generate
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Secret reveal Dialog */}
      <Dialog open={!!newSecret} onOpenChange={(open) => !open && setNewSecret(null)}>
        <DialogContent className="bg-background border-none neu-convex text-foreground rounded-[2rem] p-10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center text-3xl font-extrabold tracking-tight mb-2 gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><ShieldAlert className="w-6 h-6" /></div>
              Secret Key Reveal
            </DialogTitle>
            <DialogDescription className="text-stone-950 font-bold text-lg leading-relaxed opacity-80">
              Copy your secret key now. <span className="text-amber-700 font-black">You will never see it again</span> once this window is closed.
            </DialogDescription>
          </DialogHeader>
          <div className="group relative mt-8">
            <div className="bg-stone-900 border border-stone-800 p-8 rounded-2xl overflow-hidden neu-pressed transition-all">
              <code className="text-emerald-400 font-mono text-sm block break-all leading-relaxed" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{newSecret}</code>
              
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="icon" 
                  aria-label="Copy secret key"
                  className="h-10 w-10 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md" 
                  onClick={() => copyToClipboard(newSecret!)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="mt-8">
               <Button onClick={() => setNewSecret(null)} className="w-full h-16 bg-white border border-stone-200 text-foreground font-extrabold rounded-2xl hover:bg-stone-50 shadow-sm transition-all active:scale-95">
                  I have saved it safely
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-[2.5rem] border-none bg-white/40 neu-flat overflow-hidden p-1 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-orange-950/5 border-b border-orange-900/10">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-8">Label</TableHead>
                <TableHead className="text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-8">Public Key</TableHead>
                <TableHead className="text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-8">Secret Preview</TableHead>
                <TableHead className="text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-8">Status</TableHead>
                <TableHead className="text-right text-stone-900 font-black text-[10px] uppercase tracking-widest py-5 px-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 text-stone-600 font-medium italic">Loading keys...</TableCell></TableRow>
              ) : keys.map((key) => (
                <TableRow key={key.id} className="border-b border-stone-100/50 last:border-none hover:bg-white/50 transition-colors">
                  <TableCell className="font-extrabold text-foreground py-6 px-8 text-base">{key.label}</TableCell>
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-3 group">
                      <code className="text-[11px] text-orange-700 font-bold font-mono bg-orange-50/50 px-3 py-1.5 rounded-xl border border-orange-100 neu-pressed" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{key.publicKey}</code>
                      <button className="p-2 transition-all opacity-0 group-hover:opacity-100 hover:bg-white rounded-lg text-stone-600 hover:text-orange-700 active:scale-90" onClick={() => copyToClipboard(key.publicKey)} aria-label="Copy public key">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-3 group">
                      <code className="text-[11px] text-stone-700 font-bold font-mono bg-stone-50/50 px-3 py-1.5 rounded-xl border border-stone-100 neu-pressed" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                        sk_test_......{key.secretKeyPreview}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    {key.isActive ? (
                      <Badge className="bg-emerald-600/10 text-emerald-700 shadow-none border-none px-4 py-1 font-extrabold rounded-full text-[10px] uppercase tracking-tighter">Active</Badge>
                    ) : (
                      <Badge className="bg-stone-200 text-stone-600 shadow-none border-none px-4 py-1 font-extrabold rounded-full text-[10px] uppercase tracking-tighter">Revoked</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-6 px-8">
                    {key.isActive && (
                      <Button variant="ghost" size="icon" aria-label="Revoke API key" className="h-10 w-10 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all" onClick={() => revokeKey(key.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

