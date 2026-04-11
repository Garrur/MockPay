"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Trash2, Save } from "lucide-react";

export default function SettingsPage() {
  const { getToken } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const activeProject = data.projects?.[0];
        if (activeProject) {
          setProjectId(activeProject.id);
          setProjectName(activeProject.name);
        }
      } catch (err) {
        toast.error("Failed to load project details");
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [getToken]);

  const handleSave = async () => {
    if (!projectName.trim()) return toast.error("Project name cannot be empty");
    const token = await getToken();
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name: projectName })
      });
      if (res.ok) {
        toast.success("Project updated successfully");
      } else {
        toast.error("Failed to update project");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone and will delete all associated payments, api keys, and webhook logs.")) return;
    
    const token = await getToken();
    setDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Project deleted");
        window.location.href = "/dashboard";
      } else {
        toast.error("Failed to delete project");
        setDeleting(false);
      }
    } catch (err) {
      toast.error("Network error");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4 animate-pulse">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
        <p className="text-stone-900 font-black text-sm uppercase tracking-widest opacity-80">Synchronizing Workspace...</p>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="py-32 text-center rounded-[3rem] border-none bg-white/40 neu-flat backdrop-blur-sm">
        <div className="w-20 h-20 bg-stone-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
           <Trash2 className="w-8 h-8 text-stone-700" />
        </div>
        <p className="text-foreground font-extrabold text-2xl mb-2">No active workspace</p>
        <p className="text-stone-900 font-bold text-lg max-w-sm mx-auto opacity-80">Visit the overview to create your first project and begin simulations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Workspace Settings</h1>
        <p className="text-stone-900 font-bold text-lg opacity-80">Configure your project environment, team access, and destructive actions.</p>
      </div>

      {/* General Settings */}
      <div className="rounded-[2.5rem] border-none bg-white/40 neu-flat p-10 backdrop-blur-sm">
        <div className="flex items-center gap-4 mb-10">
           <div className="w-12 h-12 bg-white/60 neu-flat rounded-2xl flex items-center justify-center text-orange-600">
              <Save className="w-6 h-6" />
           </div>
           <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">General Configuration</h2>
              <p className="text-stone-900 font-black text-xs uppercase tracking-widest mt-1 opacity-70">Identity & Branding</p>
           </div>
        </div>

        <div className="space-y-8 max-w-md">
          <div className="space-y-3">
            <label className="text-sm font-bold text-stone-900 uppercase tracking-widest ml-1">Project Name</label>
            <Input 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="h-14 bg-white/50 border-stone-200 rounded-2xl text-foreground font-bold focus:ring-orange-500/20 shadow-sm neu-pressed px-5"
            />
            <p className="text-[10px] text-stone-900 font-black ml-1 italic opacity-70">This label is visible in your dashboard and checkout pages.</p>
          </div>
          
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="h-14 px-8 bg-orange-700 hover:bg-orange-600 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-700/10 active:scale-95 transition-all w-full sm:w-auto"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Workspace Changes
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-[2.5rem] border-none bg-red-500/5 neu-flat p-10 border border-red-500/10 backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
           <Trash2 className="w-32 h-32 text-red-600 -rotate-12" />
        </div>

        <div className="flex items-center gap-4 mb-10 relative z-10">
           <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
              <Trash2 className="w-6 h-6" />
           </div>
           <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-red-800">Danger Zone</h2>
              <p className="text-red-700/60 font-bold text-xs uppercase tracking-widest mt-1">Destructive & Irreversible</p>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 p-8 rounded-[1.5rem] bg-white/40 border border-red-500/20 relative z-10 shadow-sm">
          <div className="flex-1">
            <h4 className="text-lg font-black text-red-700 mb-2 leading-none">Delete this workspace</h4>
            <p className="text-sm text-red-600/70 font-medium max-w-md leading-relaxed">
              Once deleted, all payments, API keys, and logs will be permanently erased. Please be certain.
            </p>
          </div>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleting}
            className="h-14 px-8 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-2xl shadow-xl shadow-red-500/20 transition-all active:scale-95 w-full sm:w-auto shrink-0"
          >
            {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Delete Workspace
          </Button>
        </div>
      </div>
    </div>
  );
}

