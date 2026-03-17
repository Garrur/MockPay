import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { CreditCard, Activity, Key, Settings, Webhook, BookOpen, Zap, Link2, Bug } from "lucide-react";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#0a0a0f] text-white">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-white/10 bg-[#111118]/50 p-6 flex flex-col hidden md:flex">
        <div className="flex items-center gap-2 mb-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]">
            S
          </div>
          <span className="text-xl font-bold tracking-tight">SandboxPay</span>
        </div>

        <nav className="flex-1 space-y-1">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest px-3 mb-2 mt-1">Core</p>
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white transition-all">
            <Activity className="h-4 w-4" /> Overview
          </Link>
          <Link href="/dashboard/payments" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white transition-all">
            <CreditCard className="h-4 w-4" /> Payments
          </Link>
          <Link href="/dashboard/webhooks" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white transition-all">
            <Webhook className="h-4 w-4" /> Webhooks
          </Link>
          <Link href="/dashboard/api-keys" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white transition-all">
            <Key className="h-4 w-4" /> API Keys
          </Link>

          <p className="text-[10px] text-gray-600 uppercase tracking-widest px-3 mb-2 mt-4">Developer Tools</p>
          <Link href="/dashboard/webhooks/logs" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white transition-all">
            <Bug className="h-4 w-4 text-orange-400" /> Webhook Debugger
          </Link>
          <Link href="/dashboard/flows" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white transition-all">
            <Zap className="h-4 w-4 text-yellow-400" /> Flow Studio
          </Link>
          <Link href="/dashboard/demo-links" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white transition-all">
            <Link2 className="h-4 w-4 text-blue-400" /> Demo Links
          </Link>

          <p className="text-[10px] text-gray-600 uppercase tracking-widest px-3 mb-2 mt-4">Resources</p>
          <Link href="/docs" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white transition-all">
            <BookOpen className="h-4 w-4 text-blue-400" /> Documentation
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white transition-all">
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </nav>


        <div className="mt-auto pt-6 border-t border-white/10 flex items-center gap-3">
          <UserButton appearance={{ elements: { userButtonAvatarBox: "h-8 w-8" } }} />
          <span className="text-sm font-medium text-gray-300">Developer</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-[#111118]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white">S</div>
            <span className="text-xl font-bold tracking-tight">SandboxPay</span>
          </div>
          <UserButton />
        </header>

        <div className="flex-1 p-6 md:p-10 max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
