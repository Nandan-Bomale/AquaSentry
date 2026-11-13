'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const ZONES = [
  { id: 'Z-001', name: 'Koramangala', lat: 12.9279, lng: 77.6271, households: 12400, vulnerability: 0.3, avg_loss_pct: 14.2, status: 'WARNING', daily_supply_L: 1860000, daily_loss_L: 264120 },
  { id: 'Z-002', name: 'Whitefield', lat: 12.9698, lng: 77.7499, households: 18700, vulnerability: 0.2, avg_loss_pct: 10.1, status: 'NORMAL', daily_supply_L: 2805000, daily_loss_L: 283305 },
  { id: 'Z-003', name: 'Jayanagar', lat: 12.9230, lng: 77.5922, households: 9800, vulnerability: 0.6, avg_loss_pct: 31.8, status: 'CRITICAL', daily_supply_L: 1470000, daily_loss_L: 467460 },
  { id: 'Z-004', name: 'Yelahanka', lat: 13.1004, lng: 77.5963, households: 15200, vulnerability: 0.4, avg_loss_pct: 22.4, status: 'WARNING', daily_supply_L: 2280000, daily_loss_L: 511200 },
  { id: 'Z-005', name: 'Hebbal', lat: 13.0352, lng: 77.5952, households: 11100, vulnerability: 0.5, avg_loss_pct: 28.6, status: 'CRITICAL', daily_supply_L: 1665000, daily_loss_L: 476190 },
  { id: 'Z-006', name: 'Electronic City', lat: 12.8458, lng: 77.6624, households: 22000, vulnerability: 0.2, avg_loss_pct: 9.4, status: 'NORMAL', daily_supply_L: 3300000, daily_loss_L: 310200 },
  { id: 'Z-007', name: 'Rajajinagar', lat: 12.9867, lng: 77.5533, households: 8900, vulnerability: 0.7, avg_loss_pct: 38.2, status: 'CRITICAL', daily_supply_L: 1335000, daily_loss_L: 510270 },
  { id: 'Z-008', name: 'Marathahalli', lat: 12.9591, lng: 77.6971, households: 16500, vulnerability: 0.3, avg_loss_pct: 13.7, status: 'WARNING', daily_supply_L: 2475000, daily_loss_L: 339075 },
];

const ALERTS = [
  { id: 'ALT-001', zone: 'Jayanagar', type: 'LEAK_SIGNAL', severity: 'CRITICAL', message: 'Night flow 3.1x above baseline — possible main break on Trunk P-103', time: '12 min ago', loss: '480 L/min' },
  { id: 'ALT-002', zone: 'Rajajinagar', type: 'PRESSURE_DROP', severity: 'HIGH', message: 'Pressure dropped 0.8 bar in 2 hours — investigate service zone P-104', time: '35 min ago', loss: '380 L/min' },
  { id: 'ALT-003', zone: 'Hebbal', type: 'METER_FAULT', severity: 'HIGH', message: '15 smart meters reporting zero — billing gap 41,000 L today', time: '2 hr ago', loss: '—' },
  { id: 'ALT-004', zone: 'Yelahanka', type: 'NRW_SPIKE', severity: 'MEDIUM', message: 'NRW exceeded 25% threshold for 3 consecutive diurnal cycles', time: '6 hr ago', loss: '150 L/min' },
];

function genSeries() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    const supply = 100 + (Math.sin(i * 0.3) * 3);
    const billed = 77.6 + (Math.cos(i * 0.3) * 2.5);
    const nrw = ((supply - billed) / supply) * 100;
    return {
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      supply: parseFloat(supply.toFixed(1)),
      billed: parseFloat(billed.toFixed(1)),
      nrw: parseFloat(nrw.toFixed(1)),
    };
  });
}

const SYSTEM_SERIES = genSeries();

const WATER_BALANCE = [
  { name: 'Billed Auth.', value: 65.6, color: '#00ff88' },
  { name: 'Unbilled Auth.', value: 4.4, color: '#00d4ff' },
  { name: 'Physical Mains Loss', value: 18.0, color: '#ff3366' },
  { name: 'Commercial Meter Loss', value: 12.0, color: '#ff6b35' },
];

const ZONE_BAR = ZONES.map((z) => ({
  name: z.name.split(' ')[0],
  nrw: z.avg_loss_pct,
  color: z.status === 'CRITICAL' ? '#ff3366' : z.status === 'WARNING' ? '#ff6b35' : '#00ff88',
}));

export default function Dashboard() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [liveNrw, setLiveNrw] = useState<number>(22.4);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setLiveNrw((prev) => parseFloat((prev + (Math.random() - 0.5) * 0.15).toFixed(1)));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-6 md:p-8 min-h-screen bg-[#020b18] text-slate-100 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cyan-500/15">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight">Municipal SCADA Operations Overview</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              GRID SYNCHRONIZED
            </span>
          </div>
          <p className="text-xs text-blue-300/80 mt-1">
            Bangalore City Water Grid • 114,600 Connections • 8 Active District Metered Areas (DMAs)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#031629] border border-cyan-500/30 flex items-center gap-2">
            <span className="text-xs text-blue-300 font-medium">Live NRW Rate:</span>
            <span className="text-base font-black font-mono text-cyan-400">{liveNrw}%</span>
          </div>

          <Link
            href="/field-dispatch"
            className="px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:scale-105 transition-all shadow-lg shadow-cyan-500/20"
          >
            + Dispatch Ground Team
          </Link>
        </div>
      </div>

      {/* 8 Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'System Input Volume', val: '100.0', unit: 'MLD', sub: 'Treated Water Input', color: '#00d4ff' },
          { label: 'Billed Consumption', val: '77.6', unit: 'MLD', sub: 'Revenue Generating', color: '#00ff88' },
          { label: 'Unaccounted NRW Gap', val: '22.4', unit: 'MLD', sub: 'Physical + Commercial Loss', color: '#ff3366' },
          { label: 'Revenue Exposure', val: '₹69.4', unit: 'Lakh/day', sub: 'Tariff: ₹8.50/KL', color: '#ff6b35' },
          { label: 'Active Pipeline Leaks', val: '2 Mains', unit: '', sub: 'P-103 & P-104 Flagged', color: '#ff3366' },
          { label: 'Recovered This Month', val: '12.7', unit: 'ML', sub: '+18% vs Baseline', color: '#00ff88' },
          { label: 'Mean Response Time', val: '18.4', unit: 'hrs', sub: 'Down from 42.0 hrs', color: '#ffd700' },
          { label: 'Meter Health Telemetry', val: '91.2%', unit: '', sub: 'Active Reading Feeds', color: '#38bdf8' },
        ].map((k) => (
          <div
            key={k.label}
            className="glass-card p-4 rounded-2xl border border-cyan-500/15 bg-[#031629]/80 backdrop-blur-md shadow-xl"
          >
            <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">{k.label}</div>
            <div className="text-2xl md:text-3xl font-black mt-1" style={{ color: k.color }}>
              {k.val} <span className="text-xs font-normal text-blue-300">{k.unit}</span>
            </div>
            <div className="text-[10px] text-blue-300/70 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* 30-Day Trend (8 cols) */}
        <div className="col-span-12 lg:col-span-8 glass-card p-5 rounded-2xl border border-cyan-500/15 bg-[#031629]/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">System Water Balance — 30 Day Diurnal History</h3>
              <p className="text-xs text-blue-400">Total Supply vs Billed Authorised Consumption (MLD)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Supply (MLD)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Billed (MLD)
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SYSTEM_SERIES} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="supGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="billGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff88" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#00ff88" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.08)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#8bb8d4', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#8bb8d4', fontSize: 10 }} unit=" MLD" domain={[60, 110]} />
                  <Tooltip contentStyle={{ background: '#031629', borderColor: 'rgba(0,212,255,0.2)', fontSize: 11 }} />
                  <Area type="monotone" dataKey="supply" stroke="#00d4ff" strokeWidth={2} fill="url(#supGrad)" />
                  <Area type="monotone" dataKey="billed" stroke="#00ff88" strokeWidth={2.5} fill="url(#billGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Water Balance Donut (4 cols) */}
        <div className="col-span-12 lg:col-span-4 glass-card p-5 rounded-2xl border border-cyan-500/15 bg-[#031629]/80 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Water Loss Breakdown</h3>
            <p className="text-xs text-blue-400 mb-2">Share of 100 MLD System Input</p>

            <div style={{ width: '100%', height: 180 }}>
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={WATER_BALANCE} cx="50%" cy="50%" innerRadius={48} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {WATER_BALANCE.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#031629', borderColor: 'rgba(0,212,255,0.2)', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="space-y-1.5 pt-2 text-xs">
            {WATER_BALANCE.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-blue-200">{item.name}</span>
                </div>
                <span className="font-bold font-mono" style={{ color: item.color }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Zone Comparison Bar (7 cols) */}
        <div className="col-span-12 lg:col-span-7 glass-card p-5 rounded-2xl border border-cyan-500/15 bg-[#031629]/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">NRW Loss Percentage by DMA</h3>
              <p className="text-xs text-blue-400">Comparing all 8 Bangalore distribution zones</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-rose-400 font-bold">&gt;25% Critical</span>
              <span className="text-blue-500">•</span>
              <span className="text-emerald-400 font-bold">&lt;15% Optimal</span>
            </div>
          </div>

          <div style={{ width: '100%', height: 220 }}>
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ZONE_BAR} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#8bb8d4', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#8bb8d4', fontSize: 10 }} unit="%" domain={[0, 45]} />
                  <Tooltip contentStyle={{ background: '#031629', borderColor: 'rgba(0,212,255,0.2)', fontSize: 11 }} />
                  <Bar dataKey="nrw" radius={[6, 6, 0, 0]}>
                    {ZONE_BAR.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Active Alerts Feed (5 cols) */}
        <div className="col-span-12 lg:col-span-5 glass-card p-5 rounded-2xl border border-cyan-500/15 bg-[#031629]/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Live AI Alarm Stream</h3>
              <p className="text-xs text-blue-400">Anomalies flagged by Isolation Forest</p>
            </div>
            <Link href="/anomalies" className="text-xs text-cyan-400 font-bold hover:underline">
              View All →
            </Link>
          </div>

          <div className="space-y-2.5">
            {ALERTS.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/50 hover:border-cyan-500/30 transition-all text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : alert.severity === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-[10px] text-blue-400">{alert.time}</span>
                </div>
                <div className="font-semibold text-white mt-1 leading-snug">{alert.message}</div>
                <div className="flex items-center justify-between text-[10px] text-blue-300 mt-2 pt-1 border-t border-blue-900/40">
                  <span>DMA: <b>{alert.zone}</b></span>
                  {alert.loss !== '—' && <span className="text-rose-400 font-bold">💧 {alert.loss}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
