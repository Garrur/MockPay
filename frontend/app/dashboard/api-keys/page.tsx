"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ApiKeysPage() {
  const { getToken } = useAuth();
  const [keys, setKeys] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  async function createKey() {
    const token = await getToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/keys`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: "Live Key" })
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">API Keys</h1>
          <p className="text-gray-400">Manage your project's public and secret keys to authenticate API requests.</p>
        </div>
        <Button onClick={createKey} className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" /> Generate New Key
        </Button>
      </div>

      <Dialog open={!!newSecret} onOpenChange={(open) => !open && setNewSecret(null)}>
        <DialogContent className="bg-[#111118] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-orange-400">
              <ShieldAlert className="w-5 h-5 mr-2" /> Save this Secret Key
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Please copy your new secret key now. You won't be able to see it again after closing this dialog.
            </DialogDescription>
          </DialogHeader>
          <div className="flex bg-black border border-white/10 p-3 rounded-md mt-4 items-center">
            <code className="text-primary font-mono text-sm flex-1 break-all mr-4">{newSecret}</code>
            <Button size="icon" variant="ghost" className="shrink-0 text-gray-400 hover:text-white" onClick={() => copyToClipboard(newSecret!)}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setNewSecret(null)} className="w-full">I have saved it safely</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border border-white/10 bg-[#111118] overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5 border-b border-white/10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-gray-400">NAME</TableHead>
              <TableHead className="text-gray-400">PUBLIC KEY</TableHead>
              <TableHead className="text-gray-400">SECRET KEY</TableHead>
              <TableHead className="text-gray-400">STATUS</TableHead>
              <TableHead className="text-right text-gray-400">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">Loading keys...</TableCell></TableRow>
            ) : keys.map((key) => (
              <TableRow key={key.id} className="border-b border-white/5 bg-[#111118] hover:bg-white/5 transition-colors">
                <TableCell className="font-medium text-white">{key.label}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-gray-400 bg-black px-2 py-1 rounded">{key.publicKey}</code>
                    <Copy className="w-3 h-3 text-gray-500 cursor-pointer hover:text-white" onClick={() => copyToClipboard(key.publicKey)} />
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-xs text-gray-400 bg-black px-2 py-1 rounded">sk_test_......{key.secretKeyPreview}</code>
                </TableCell>
                <TableCell>
                  {key.isActive ? (
                    <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20 shadow-none border-none">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500 border-gray-500">Revoked</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {key.isActive && (
                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => revokeKey(key.id)}>
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
  );
}
