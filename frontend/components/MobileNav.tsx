"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Menu, Activity, CreditCard, Webhook, Key, Bug, Zap, Link2, BookOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
        <Menu className="w-5 h-5" />
        <span className="sr-only">Toggle Menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0 flex flex-col bg-background/95 backdrop-blur-md">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex flex-col h-full overflow-y-auto w-full">
          <div className="flex items-center gap-3 p-6 pb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-amber-500 font-bold text-white shadow-lg shadow-orange-500/10">
              M
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground">MockPay</span>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <p className="text-[10px] text-stone-800 font-bold uppercase tracking-[0.2em] px-3 mb-3 mt-1 opacity-100">Core</p>
            <NavItem href="/dashboard" icon={Activity} label="Overview" pathname={pathname} onClick={() => setOpen(false)} />
            <NavItem href="/dashboard/payments" icon={CreditCard} label="Payments" pathname={pathname} onClick={() => setOpen(false)} />
            <NavItem href="/dashboard/webhooks" icon={Webhook} label="Webhooks" pathname={pathname} onClick={() => setOpen(false)} />
            <NavItem href="/dashboard/api-keys" icon={Key} label="API Keys" pathname={pathname} onClick={() => setOpen(false)} />

            <p className="text-[10px] text-stone-800 font-bold uppercase tracking-[0.2em] px-3 mb-3 mt-6 opacity-100">Developer Tools</p>
            <NavItem href="/dashboard/webhooks/logs" icon={Bug} iconClass="text-rose-700" label="Webhook Debugger" pathname={pathname} onClick={() => setOpen(false)} />
            <NavItem href="/dashboard/flows" icon={Zap} iconClass="text-amber-950/80" label="Flow Studio" pathname={pathname} onClick={() => setOpen(false)} />
            <NavItem href="/dashboard/demo-links" icon={Link2} iconClass="text-orange-900/80" label="Demo Links" pathname={pathname} onClick={() => setOpen(false)} />

            <p className="text-[10px] text-stone-800 font-bold uppercase tracking-[0.2em] px-3 mb-3 mt-6 opacity-100">Resources</p>
            <NavItem href="/docs" icon={BookOpen} iconClass="text-emerald-900" label="Documentation" pathname={pathname} onClick={() => setOpen(false)} />
            <NavItem href="/dashboard/settings" icon={Settings} label="Settings" pathname={pathname} onClick={() => setOpen(false)} />
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NavItem({ href, icon: Icon, label, pathname, onClick, iconClass = "" }: any) {
  const isActive = pathname === href;
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-stone-800 hover:bg-orange-950/5 hover:text-foreground transition-all ${isActive ? "bg-white/50 shadow-sm font-black" : "font-semibold"}`}
    >
      <Icon className={`h-4 w-4 transition-colors ${iconClass || "group-hover:text-orange-600"} ${isActive && !iconClass ? "text-orange-600" : ""}`} /> 
      <span className="text-sm">{label}</span>
    </Link>
  );
}
