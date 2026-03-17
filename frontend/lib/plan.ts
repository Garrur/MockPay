// Plan definitions and feature flags

export type Plan = "free" | "pro" | "team";

export const PLAN_FEATURES: Record<Plan, {
  webhookDebugger: boolean;
  flowBuilder: boolean;
  demoLinks: number;         // max demo links (0 = none, -1 = unlimited)
  webhookLogs: number;       // max log history (days)
  paymentHistory: number;    // max payments visible
}> = {
  free: {
    webhookDebugger: false,
    flowBuilder: false,
    demoLinks: 1,
    webhookLogs: 1,
    paymentHistory: 50,
  },
  pro: {
    webhookDebugger: true,
    flowBuilder: true,
    demoLinks: 10,
    webhookLogs: 30,
    paymentHistory: 5000,
  },
  team: {
    webhookDebugger: true,
    flowBuilder: true,
    demoLinks: -1,
    webhookLogs: 90,
    paymentHistory: -1,
  },
};

export function getPlanFeatures(plan: Plan) {
  return PLAN_FEATURES[plan] ?? PLAN_FEATURES.free;
}
