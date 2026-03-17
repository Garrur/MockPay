"use client";

import { Lock } from "lucide-react";
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
    <div className="relative rounded-2xl border border-white/10 bg-[#111118] overflow-hidden">
      {/* Blurred preview of children */}
      <div className="opacity-30 blur-sm pointer-events-none select-none" aria-hidden>
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm">
        <div className="rounded-full bg-primary/20 border border-primary/30 p-4">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <div className="text-center px-6">
          <p className="font-bold text-white text-lg mb-1">{feature}</p>
          <p className="text-gray-400 text-sm">
            This feature is available on the{" "}
            <span className="text-primary capitalize font-semibold">{requiredPlan}</span> plan.
          </p>
        </div>
        <Link
          href="/pricing"
          className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Upgrade to {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} →
        </Link>
      </div>
    </div>
  );
}
