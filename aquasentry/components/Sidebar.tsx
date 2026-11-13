'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV_GROUPS = [
  {
    group: 'REAL-TIME OPERATIONS',
    items: [
      { href: '/dashboard', icon: '⚡', label: 'Operations Overview', sub: 'System KPIs & Alerts' },
      { href: '/map', icon: '🗺️', label: 'GIS Pipeline Map', sub: 'Topology & Flow Dynamics' },
      { href: '/digital-twin', icon: '🔬', label: '3D Pipe Digital Twin', sub: 'Acoustic & Fluid Sim' },
    ],
  },
  {
    group: 'AI & WATER INTELLIGENCE',
    items: [
      { href: '/anomalies', icon: '🌲', label: 'AI Anomaly Detection', sub: 'Isolation Forest Models' },
      { href: '/water-balance', icon: '⚖️', label: 'IWA Water Balance', sub: 'Audit & NRW Matrix' },
      { href: '/priority', icon: '🎯', label: 'Repair Prioritisation', sub: 'Equity-Weighted Rank' },
    ],
  },
  {
    group: 'ACTION & VALIDATION',
    items: [
      { href: '/field-dispatch', icon: '👷', label: 'Field Crew Dispatch', sub: 'Ground Verification' },
      { href: '/simulation', icon: '🧪', label: 'Hydraulic Sandbox', sub: 'FAVAD Pressure What-If' },
      { href: '/impact', icon: '📊', label: 'Impact & ESG Analytics', sub: 'Verified Water Saved' },
      { href: '/data-quality', icon: '📡', label: 'Meter Data Quality', sub: 'Telemetry Health & Lag' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <aside className="w-68 min-h-screen bg-[#020d1c] border-r border-cyan-500/15 flex flex-col flex-shrink-0 text-slate-200 z-40">
      {/* Brand Header */}
      <div className="p-5 border-b border-cyan-500/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.5 7 4 9.5 4 14a8 8 0 0016 0c0-4.5-4.5-7-8-12z" fill="white" />
            <path d="M12 10c-2 3-4 4.5-4 7a4 4 0 008 0c0-2.5-2-4-4-7z" fill="rgba(0,0,0,0.3)" />
          </svg>
        </div>
        <div>
          <div className="font-black text-white text-base tracking-tight flex items-center gap-1">
            Aqua<span className="text-cyan-400">Sentry</span>
          </div>
          <div className="text-[9px] font-mono font-bold text-cyan-400/80 tracking-widest uppercase">
            MANTHAN 2.0 • CH-06
          </div>
        </div>
      </div>

      {/* Grid Status Pill */}
      <div className="mx-4 my-3 p-2.5 rounded-xl bg-blue-950/40 border border-cyan-500/20 text-xs">
        <div className="flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1.5 font-bold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            DMA SCADA ONLINE
          </span>
          <span className="font-mono text-cyan-300">{time}</span>
        </div>
        <div className="text-[10px] text-blue-300/80 mt-1 flex justify-between">
          <span>Bangalore Grid</span>
          <span className="text-cyan-400 font-bold">450.8 km</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((grp) => (
          <div key={grp.group} className="space-y-1">
            <div className="text-[9px] font-black tracking-widest text-blue-400/60 uppercase px-3 mb-1">
              {grp.group}
            </div>
            {grp.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 border border-cyan-500/40 text-cyan-300 shadow-sm'
                      : 'hover:bg-blue-900/20 text-blue-200 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold leading-tight truncate">{item.label}</div>
                    <div className="text-[10px] text-blue-400/70 truncate">{item.sub}</div>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Pill */}
      <div className="p-4 border-t border-cyan-500/10 text-xs">
        <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-900/50">
          <div className="flex justify-between text-[10px] font-bold mb-1">
            <span className="text-blue-300">Target NRW</span>
            <span className="text-orange-400">Current: 22.4%</span>
          </div>
          <div className="w-full bg-blue-950 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 h-full w-[65%]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
