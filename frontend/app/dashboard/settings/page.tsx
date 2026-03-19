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
    return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  if (!projectId) {
    return (
      <div className="py-20 text-center text-gray-400">
        You don't have an active project yet. Go to the dashboard to create one.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Project Settings</h1>
        <p className="text-gray-400 text-sm">Manage your active workspace configuration and billing.</p>
      </div>

      <Card className="bg-[#111118] border-white/10">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Update your project details and configuration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Project Name</label>
            <Input 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-black border-white/10 text-white max-w-sm"
            />
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-primary hover:bg-primary/90"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-[#111118] border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Delete Project</h4>
              <p className="text-xs text-gray-400">Permanently delete this project and all of its data.</p>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Workspace
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
