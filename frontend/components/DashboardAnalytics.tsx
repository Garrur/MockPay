"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────
function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-US", { weekday: "short" });
  });
}

function buildChartData(payments: any[]) {
  const days = getLast7Days();
  const map: Record<string, { success: number; failed: number; pending: number; volume: number }> = {};
  days.forEach(d => { map[d] = { success: 0, failed: 0, pending: 0, volume: 0 }; });

  payments.forEach((p: any) => {
    // Prisma returns camelCase; support both variants
    const ts = p.createdAt || p.created_at;
    if (!ts) return;
    const day = new Date(ts).toLocaleDateString("en-US", { weekday: "short" });
    if (map[day]) {
      if (p.status === "success") { map[day].success++; map[day].volume += (p.amount ?? 0) / 100; }
      else if (p.status === "failed")  map[day].failed++;
      else if (p.status === "pending") map[day].pending++;
    }
  });

  return days.map(d => ({ name: d, ...map[d] }));
}

// ── Tooltip ───────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-stone-200 rounded-2xl px-4 py-3 shadow-lg text-xs">
      <p className="font-bold text-stone-800 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-stone-600 capitalize">{p.name}:</span>
          <span className="font-semibold text-stone-900">{p.name === "volume" ? `₹${p.value.toFixed(0)}` : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stat chip ─────────────────────────────────────────────────
function Trend({ value }: { value: number }) {
  if (value === 0) return <span className="flex items-center gap-0.5 text-stone-400 text-xs"><Minus className="w-3 h-3" /> No change</span>;
  const up = value > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? "text-emerald-600" : "text-rose-600"}`}>
      {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {Math.abs(value)}% vs last week
    </span>
  );
}

// ── Main Analytics Component ──────────────────────────────────
export function DashboardAnalytics() {
  const { getToken } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPayments(data.payments || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [getToken]);

  const chartData = buildChartData(payments);

  const succeeded = payments.filter(p => p.status === "success").length;
  const failed    = payments.filter(p => p.status === "failed").length;
  const pending   = payments.filter(p => p.status === "pending").length;
  const totalVol  = payments.filter(p => p.status === "success").reduce((s, p) => s + p.amount / 100, 0);

  const pieData = [
    { name: "Success",  value: succeeded, color: "#10b981" },
    { name: "Failed",   value: failed,    color: "#f43f5e" },
    { name: "Pending",  value: pending,   color: "#f59e0b" },
  ].filter(d => d.value > 0);

  if (loading) return (
    <div className="h-64 flex items-center justify-center text-stone-400 text-sm font-semibold animate-pulse">
      Loading analytics…
    </div>
  );

  if (payments.length === 0) return (
    <div className="neu-flat rounded-[2rem] p-10 text-center text-stone-500">
      <p className="text-4xl mb-3">📊</p>
      <p className="font-bold text-lg text-stone-700 mb-1">No data yet</p>
      <p className="text-sm">Run a payment simulation to see live analytics here.</p>
    </div>
  );

  const fadeIn = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Payments", value: payments.length, sub: "All time",         color: "from-orange-500 to-amber-600"  },
          { label: "Succeeded",      value: succeeded,       sub: `${totalVol > 0 ? `₹${totalVol.toFixed(0)} volume` : "Total"}`, color: "from-emerald-500 to-green-600"  },
          { label: "Failed",         value: failed,          sub: "Declined",          color: "from-rose-500 to-red-600"      },
          { label: "Pending",        value: pending,         sub: "Awaiting webhook",  color: "from-amber-400 to-yellow-500"  },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            {...fadeIn}
            transition={{ delay: i * 0.07 }}
            className="neu-flat rounded-2xl p-5 relative overflow-hidden group"
          >
            {/* Color accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${kpi.color}`} />
            <p className="text-[11px] font-bold text-stone-600 uppercase tracking-widest mb-2">{kpi.label}</p>
            <p className="text-3xl font-black text-stone-900 tabular-nums">{kpi.value}</p>
            <p className="text-xs text-stone-500 mt-1 font-medium">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Volume Area Chart ── */}
      <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="neu-flat rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Transaction Volume</h3>
            <p className="text-xs text-stone-600 mt-0.5">Last 7 days · Amount in ₹</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-600 font-medium">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />Volume</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7ddd3" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#57534e" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="volume" stroke="#f97316" strokeWidth={2.5} fill="url(#volGrad)" dot={{ r: 3, fill: "#f97316", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#f97316" }} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Status Bar Chart + Pie ── */}
      <div className="grid md:grid-cols-2 gap-4">

        <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="neu-flat rounded-2xl p-6">
          <div className="mb-5">
            <h3 className="font-bold text-stone-900 text-sm">Daily Outcomes</h3>
            <p className="text-xs text-stone-600 mt-0.5">Success vs failed per day</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={10} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7ddd3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#57534e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="success" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed"  fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3">
            {[["Success", "#10b981"], ["Failed", "#f43f5e"], ["Pending", "#f59e0b"]].map(([name, color]) => (
              <span key={name} className="flex items-center gap-1.5 text-[11px] text-stone-600 font-semibold">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />{name}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.5 }} className="neu-flat rounded-2xl p-6 flex flex-col">
          <div className="mb-5">
            <h3 className="font-bold text-stone-900 text-sm">Status Breakdown</h3>
            <p className="text-xs text-stone-600 mt-0.5">All-time distribution</p>
          </div>
          {pieData.length > 0 ? (
            <div className="flex items-center justify-between gap-4 flex-1">
              <ResponsiveContainer width="60%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {pieData.map(d => {
                  const pct = Math.round((d.value / payments.length) * 100);
                  return (
                    <div key={d.name}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-semibold text-stone-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />{d.name}
                        </span>
                        <span className="text-[11px] font-bold text-stone-800">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: d.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">No breakdown yet</div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
