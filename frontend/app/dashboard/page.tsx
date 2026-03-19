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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-400">Welcome back. Here's what's happening in your SandboxPay project.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-[#111118] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {activeProject?._count?.payments || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Simulated transactions</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#111118] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active API Keys</CardTitle>
            <Key className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {activeProject?._count?.apiKeys || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Ready for testing</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111118] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Webhooks Fired</CardTitle>
            <Activity className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {/* Derived stats would go here */}
              0
            </div>
            <p className="text-xs text-gray-500 mt-1">Deliveries today</p>
          </CardContent>
        </Card>
      </div>

      {!activeProject ? (
        <OnboardingSetup />
      ) : activeProject._count?.payments > 0 ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-green-500 text-white rounded-full p-1"><Check className="w-5 h-5" /></div>
          <div>
            <h3 className="text-green-400 font-bold text-sm">Your first payment worked! ✅</h3>
            <p className="text-green-500/70 text-xs">You've successfully simulated a transaction. Keep building!</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
