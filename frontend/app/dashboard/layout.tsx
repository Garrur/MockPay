import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { CreditCard, Activity, Key, Settings, Webhook, BookOpen, Zap, Link2, Bug } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background text-foreground selection:bg-orange-200/30">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-background/60 p-6 flex flex-col hidden md:flex relative z-10 border-r border-orange-900/10">
        <div className="flex items-center gap-3 mb-10 px-2 transition-all hover:scale-105 cursor-pointer">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-amber-500 font-bold text-white shadow-lg shadow-orange-500/10">
            M
          </div>
          <span className="text-xl font-extrabold tracking-tight text-foreground">MockPay</span>
        </div>

        <nav className="flex-1 space-y-1.5">
          <p className="text-[10px] text-stone-800 font-bold uppercase tracking-[0.2em] px-3 mb-3 mt-1 opacity-100">Core</p>
          <Link href="/dashboard" className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-stone-800 hover:bg-orange-950/5 hover:text-foreground transition-all">
            <Activity className="h-4 w-4 transition-colors group-hover:text-orange-600" /> 
            <span className="font-semibold text-sm">Overview</span>
          </Link>
          <Link href="/dashboard/payments" className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-stone-800 hover:bg-white/50 hover:text-foreground transition-all neu-flat-hover">
            <CreditCard className="h-4 w-4 transition-colors group-hover:text-orange-700" /> 
            <span className="font-semibold text-sm">Payments</span>
          </Link>
          <Link href="/dashboard/webhooks" className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-stone-800 hover:bg-white/50 hover:text-foreground transition-all neu-flat-hover">
            <Webhook className="h-4 w-4 transition-colors group-hover:text-orange-700" /> 
            <span className="font-semibold text-sm">Webhooks</span>
          </Link>
          <Link href="/dashboard/api-keys" className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-stone-800 hover:bg-white/50 hover:text-foreground transition-all neu-flat-hover">
            <Key className="h-4 w-4 transition-colors group-hover:text-orange-700" /> 
            <span className="font-semibold text-sm">API Keys</span>
          </Link>

          <p className="text-[10px] text-stone-800 font-bold uppercase tracking-[0.2em] px-3 mb-3 mt-6 opacity-100">Developer Tools</p>
          <Link href="/dashboard/webhooks/logs" className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-stone-800 hover:bg-white/50 hover:text-foreground transition-all neu-flat-hover">
            <Bug className="h-4 w-4 text-rose-700 opacity-90 group-hover:opacity-100" /> 
            <span className="font-semibold text-sm">Webhook Debugger</span>
          </Link>
          <Link href="/dashboard/flows" className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-stone-800 hover:bg-white/50 hover:text-foreground transition-all neu-flat-hover">
            <Zap className="h-4 w-4 text-amber-950/80 opacity-90 group-hover:opacity-100" /> 
            <span className="font-semibold text-sm">Flow Studio</span>
          </Link>
          <Link href="/dashboard/demo-links" className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-stone-800 hover:bg-white/50 hover:text-foreground transition-all neu-flat-hover">
            <Link2 className="h-4 w-4 text-orange-900/80 opacity-90 group-hover:opacity-100" /> 
            <span className="font-semibold text-sm">Demo Links</span>
          </Link>

          <p className="text-[10px] text-stone-800 font-bold uppercase tracking-[0.2em] px-3 mb-3 mt-6 opacity-100">Resources</p>
          <Link href="/docs" className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-stone-800 hover:bg-white/50 hover:text-foreground transition-all neu-flat-hover">
            <BookOpen className="h-4 w-4 text-emerald-900 opacity-90 group-hover:opacity-100" /> 
            <span className="font-semibold text-sm">Documentation</span>
          </Link>
          <Link href="/dashboard/settings" className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-stone-800 hover:bg-white/50 hover:text-foreground transition-all neu-flat-hover">
            <Settings className="h-4 w-4 transition-colors group-hover:text-orange-700" /> 
            <span className="font-semibold text-sm">Settings</span>
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-stone-200/50 flex items-center gap-3 px-2">
          <div className="p-1 rounded-xl bg-white/40 neu-flat">
            <UserButton appearance={{ elements: { userButtonAvatarBox: "h-8 w-8" } }} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">Developer</span>
            <span className="text-[10px] text-stone-800 font-black">Free Plan</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Ambient background glow inside dashboard */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-300/5 blur-[120px] pointer-events-none" />

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-stone-200/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <MobileNav />
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-600 to-amber-500 font-bold text-white shadow-lg">M</div>
            <span className="text-xl font-bold tracking-tight">MockPay</span>
          </div>
          <UserButton />
        </header>

        <div className="flex-1 p-4 md:p-12 max-w-6xl w-full mx-auto relative z-10 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

