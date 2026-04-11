"use client";

import { Lock, ChevronRight } from "lucide-react";
import Link from "next/link";

interface PlanGateProps {
  feature: string;
  requiredPlan?: "pro" | "team";
  children: React.ReactNode;
  enabled: boolean;
}

export function PlanGate({ feature, requiredPlan = "pro", children, enabled }: PlanGateProps) {
  if (enabled) return <>{children}</>;

  return (
    <div className="relative rounded-[2rem] border border-stone-200/50 bg-white/40 backdrop-blur-sm overflow-hidden p-1 neu-flat">
      {/* Blurred preview of children */}
      <div className="opacity-40 blur-md pointer-events-none select-none" aria-hidden>
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-stone-100/40 backdrop-blur-md transition-all">
        <div className="rounded-[2rem] bg-orange-100 border-none p-6 shadow-xl shadow-orange-500/10 active:scale-95 transition-all">
          <Lock className="w-10 h-10 text-orange-600" />
        </div>
        <div className="text-center px-8">
          <h3 className="font-extrabold text-foreground text-2xl mb-2 tracking-tight">{feature}</h3>
          <p className="text-stone-500 font-medium text-base">
            This premium feature requires the{" "}
            <span className="text-orange-600 capitalize font-bold">{requiredPlan}</span> plan.
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="h-14 px-8 bg-orange-600 hover:bg-orange-500 text-white text-base font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          Upgrade to {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
