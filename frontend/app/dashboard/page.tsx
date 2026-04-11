import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CreditCard, Key, Check } from "lucide-react";
import { redirect } from "next/navigation";
import { OnboardingSetup } from "@/components/OnboardingSetup";

export default async function DashboardOverview() {
  let projectRes;
  try {
    projectRes = await fetchApi('/projects');
  } catch (error) {
    // If user has no project or error, we'll guide them later or handle here
    // In a real app we might redirect to onboarding
  }

  const projects = projectRes?.projects || [];
  const activeProject = projects[0];

  if (!activeProject) {
    // Optional: auto-create a default project if none exists via client component
    // For now we just show an empty state.
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Dashboard Overview</h1>
        <p className="text-stone-900 font-bold text-lg">Welcome back. Here's what's happening in your MockPay project.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white/40 border-none shadow-none neu-flat p-1 group animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-stone-900 uppercase tracking-widest px-1">Total Payments</CardTitle>
            <div className="p-2 rounded-lg bg-orange-100 group-hover:bg-orange-600 group-hover:text-white transition-all text-orange-600">
               <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">
              {activeProject?._count?.payments || 0}
            </div>
            <p className="text-[10px] text-stone-900 font-black uppercase tracking-wider mt-2 opacity-80">Simulated transactions</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/40 border-none shadow-none neu-flat p-1 group animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-stone-900 uppercase tracking-widest px-1">Active API Keys</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all text-emerald-600">
               <Key className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">
              {activeProject?._count?.apiKeys || 0}
            </div>
            <p className="text-[10px] text-stone-900 font-black uppercase tracking-wider mt-2 opacity-80">Ready for testing</p>
          </CardContent>
        </Card>

        <Card className="bg-white/40 border-none shadow-none neu-flat p-1 group animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-stone-900 uppercase tracking-widest px-1">Webhooks Fired</CardTitle>
            <div className="p-2 rounded-lg bg-orange-100 group-hover:bg-orange-600 group-hover:text-white transition-all text-orange-600">
               <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">
              0
            </div>
            <p className="text-[10px] text-stone-900 font-black uppercase tracking-wider mt-2 opacity-80">Deliveries today</p>
          </CardContent>
        </Card>
      </div>

      {!activeProject ? (
        <OnboardingSetup />
      ) : activeProject._count?.payments > 0 ? (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] p-6 flex items-center gap-4 shadow-sm animate-in fade-in zoom-in-95 duration-700">
          <div className="bg-emerald-500 text-white rounded-2xl p-3 shadow-lg shadow-emerald-200"><Check className="w-6 h-6" /></div>
          <div>
            <h3 className="text-emerald-700 font-bold text-lg">Your first payment worked! ✅</h3>
            <p className="text-emerald-600/70 font-medium">You've successfully simulated a transaction. Keep building!</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

