'use client';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export default function WaterBalancePage() {
  // Input parameters (in Million Litres per Day - MLD)
  const [siv, setSiv] = useState<number>(100.0); // System Input Volume
  const [billedMetered, setBilledMetered] = useState<number>(65.6);
  const [billedUnmetered, setBilledUnmetered] = useState<number>(2.0);
  const [unbilledMetered, setUnbilledMetered] = useState<number>(1.4);
  const [unbilledUnmetered, setUnbilledUnmetered] = useState<number>(3.0);
  const [unauthorizedConsumption, setUnauthorizedConsumption] = useState<number>(4.8);
  const [meterErrors, setMeterErrors] = useState<number>(7.2);
  const [storageOverflow, setStorageOverflow] = useState<number>(1.2);
  const [tariffPerKl, setTariffPerKl] = useState<number>(8.5); // INR per 1,000 Litres

  // Derived calculations according to IWA Standard
  const authorizedConsumption = billedMetered + billedUnmetered + unbilledMetered + unbilledUnmetered;
  const revenueWater = billedMetered + billedUnmetered;
  const nonRevenueWater = siv - revenueWater;
  const nrwPercentage = (nonRevenueWater / siv) * 100;

  const apparentLosses = unauthorizedConsumption + meterErrors;
  // Real losses are the residual unaccounted volume
  const realLosses = Math.max(0, siv - authorizedConsumption - apparentLosses);
  const mainsLeakage = Math.max(0, realLosses - storageOverflow);

  // Economic valuation
  // 1 MLD = 1,000 KL/day = 365,000 KL/year
  const annualRevenueLossCrore = (nonRevenueWater * 1000 * 365 * tariffPerKl) / 10000000;
  const realLossRevenueWasteCrore = (realLosses * 1000 * 365 * tariffPerKl) / 10000000;

  // Infrastructure Leakage Index (ILI) calculation
  // ILI = CARL / UARL (Current Annual Real Losses / Unavoidable Annual Real Losses)
  // For Bangalore 450km network, UARL ~ 4.2 MLD
  const uarl = 4.2;
  const ili = parseFloat((realLosses / uarl).toFixed(2));
  const iliRating = ili < 2.0 ? 'Band A (Excellent)' : ili < 4.0 ? 'Band B (Good - Manageable)' : 'Band C (Poor - Action Needed)';

  const waterBalanceData = [
    { name: 'Billed Metered', value: billedMetered, color: '#00ff88', category: 'Revenue Water' },
    { name: 'Billed Unmetered', value: billedUnmetered, color: '#00d4ff', category: 'Revenue Water' },
    { name: 'Unbilled Auth', value: unbilledMetered + unbilledUnmetered, color: '#38bdf8', category: 'Non-Revenue' },
    { name: 'Apparent Loss', value: apparentLosses, color: '#ff6b35', category: 'Commercial Loss' },
    { name: 'Real Loss (Mains)', value: mainsLeakage, color: '#ff3366', category: 'Physical Leak' },
    { name: 'Storage Overflow', value: storageOverflow, color: '#e11d48', category: 'Physical Leak' },
  ];

  return (
    <div className="p-6 min-h-screen" style={{ background: 'linear-gradient(135deg, #020b18, #031629)' }}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-cyan-500/10 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight">IWA Standard Water Balance Audit</h1>
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
              style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' }}
            >
              IWA / AWWA M36 METHODOLOGY
            </span>
          </div>
          <p className="text-xs text-blue-300/80 mt-1">
            Standardized water audit decomposition • Isolating physical infrastructure bursts from commercial billing discrepancies.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all flex items-center gap-2"
        >
          <span>📄</span>
          <span>Export IWA Audit PDF</span>
        </button>
      </div>

      {/* High-Level Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="text-[11px] font-semibold text-blue-300 uppercase">System Input Volume (SIV)</div>
          <div className="text-2xl font-black text-cyan-400 mt-1">{siv.toFixed(1)} <span className="text-xs font-normal">MLD</span></div>
          <div className="text-[10px] text-blue-400/80 mt-1">100,000,000 Litres/Day treated</div>
        </div>

        <div className="glass-card p-4">
          <div className="text-[11px] font-semibold text-blue-300 uppercase">Non-Revenue Water (NRW)</div>
          <div className="text-2xl font-black text-rose-400 mt-1">{nrwPercentage.toFixed(1)}%</div>
          <div className="text-[10px] text-rose-300/80 mt-1">{nonRevenueWater.toFixed(1)} MLD unaccounted gap</div>
        </div>

        <div className="glass-card p-4">
          <div className="text-[11px] font-semibold text-blue-300 uppercase">Annual Revenue at Risk</div>
          <div className="text-2xl font-black text-amber-400 mt-1">₹{annualRevenueLossCrore.toFixed(2)} <span className="text-xs font-normal">Cr</span></div>
          <div className="text-[10px] text-amber-300/80 mt-1">At ₹{tariffPerKl.toFixed(2)}/KL utility tariff</div>
        </div>

        <div className="glass-card p-4">
          <div className="text-[11px] font-semibold text-blue-300 uppercase">Leakage Index (ILI)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{ili}</div>
          <div className="text-[10px] text-emerald-300/80 mt-1">{iliRating}</div>
        </div>
      </div>

      {/* Main IWA Matrix View */}
      <div className="glass-card p-6 mb-6">
        <div className="text-sm font-bold text-white mb-2 flex items-center justify-between">
          <span>Official IWA Water Balance Matrix Decomposition</span>
          <span className="text-xs text-blue-400 font-mono">Units: Million Litres / Day (MLD)</span>
        </div>
        <p className="text-xs text-blue-300/70 mb-5">
          Based on the International Water Association (IWA) and American Water Works Association (AWWA) standardized balance.
        </p>

        {/* Tree Grid Hierarchy */}
        <div className="grid grid-cols-12 gap-3 text-xs">
          {/* Level 1: System Input (3 cols) */}
          <div className="col-span-12 md:col-span-3 p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Level 1: System Input</div>
              <div className="text-lg font-black text-white mt-1">System Input Volume (SIV)</div>
              <p className="text-[11px] text-blue-300/80 mt-2">
                Total water delivered from treatment plants and transmission reservoirs into the urban distribution DMA.
              </p>
            </div>
            <div className="mt-6 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <span className="text-2xl font-black text-cyan-300">{siv.toFixed(1)}</span>
              <span className="text-xs text-cyan-400 ml-1">MLD (100%)</span>
            </div>
          </div>

          {/* Level 2: Authorized vs Losses (4 cols) */}
          <div className="col-span-12 md:col-span-4 space-y-3">
            {/* Authorized Consumption */}
            <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Level 2: Authorized</div>
                  <div className="text-sm font-bold text-white mt-0.5">Authorised Consumption</div>
                </div>
                <span className="text-sm font-black text-emerald-400">{authorizedConsumption.toFixed(1)} MLD</span>
              </div>
              <p className="text-[10px] text-blue-300/70 mt-1">
                Legitimate consumption by consumers, municipal facilities, and firefighting.
              </p>
            </div>

            {/* Water Losses */}
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Level 2: Losses</div>
                  <div className="text-sm font-bold text-white mt-0.5">Total Water Losses</div>
                </div>
                <span className="text-sm font-black text-rose-400">{(siv - authorizedConsumption).toFixed(1)} MLD</span>
              </div>
              <p className="text-[10px] text-rose-200/70 mt-1">
                The core target of AquaSentry — separating physical leaks from commercial errors.
              </p>
            </div>
          </div>

          {/* Level 3: Breakdown (5 cols) */}
          <div className="col-span-12 md:col-span-5 space-y-3">
            {/* Billed Authorised */}
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-white">Billed Authorised (Revenue Water)</div>
                <div className="text-[10px] text-emerald-400/80">Metered ({billedMetered} MLD) + Unmetered ({billedUnmetered} MLD)</div>
              </div>
              <span className="text-sm font-black text-emerald-400">{revenueWater.toFixed(1)} MLD</span>
            </div>

            {/* Unbilled Authorised */}
            <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/30 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-white">Unbilled Authorised Consumption</div>
                <div className="text-[10px] text-sky-400/80">Operational flushing, municipal tankers, public standposts</div>
              </div>
              <span className="text-sm font-black text-sky-300">{(unbilledMetered + unbilledUnmetered).toFixed(1)} MLD</span>
            </div>

            {/* Apparent Losses (Commercial) */}
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-white">Apparent Losses (Commercial / Billing)</div>
                <div className="text-[10px] text-amber-400/80">Meter errors ({meterErrors} MLD) + Theft/Unauthorised ({unauthorizedConsumption} MLD)</div>
              </div>
              <span className="text-sm font-black text-amber-400">{apparentLosses.toFixed(1)} MLD</span>
            </div>

            {/* Real Losses (Physical) */}
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/50 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-white">Real Losses (Physical Infrastructure)</div>
                <div className="text-[10px] text-rose-300">Mains leakage ({mainsLeakage.toFixed(1)} MLD) + Reservoir overflow ({storageOverflow} MLD)</div>
              </div>
              <span className="text-sm font-black text-rose-400">{realLosses.toFixed(1)} MLD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Audit Simulation Sliders */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 glass-card p-5 space-y-4">
          <div className="text-sm font-bold text-white mb-1">Adjust Municipal Baseline Inputs (MLD)</div>
          <p className="text-xs text-blue-400 mb-4">
            Test custom utility scenarios to dynamically recalculate NRW, financial risk, and physical loss benchmarks.
          </p>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-blue-200">System Input Volume (SIV)</span>
                <span className="text-cyan-400 font-mono font-bold">{siv} MLD</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                step="5"
                value={siv}
                onChange={(e) => setSiv(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-blue-200">Billed Metered Consumption</span>
                <span className="text-emerald-400 font-mono font-bold">{billedMetered} MLD</span>
              </div>
              <input
                type="range"
                min="30"
                max="120"
                step="1"
                value={billedMetered}
                onChange={(e) => setBilledMetered(parseFloat(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-blue-200">Customer Meter Inaccuracies (Under-registration)</span>
                <span className="text-amber-400 font-mono font-bold">{meterErrors} MLD</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={meterErrors}
                onChange={(e) => setMeterErrors(parseFloat(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-blue-200">Water Tariff Rate (INR per Kilolitre)</span>
                <span className="text-cyan-400 font-mono font-bold">₹{tariffPerKl.toFixed(2)}/KL</span>
              </div>
              <input
                type="range"
                min="4.0"
                max="25.0"
                step="0.5"
                value={tariffPerKl}
                onChange={(e) => setTariffPerKl(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Breakdown Visualizer Chart */}
        <div className="col-span-12 lg:col-span-5 glass-card p-5 flex flex-col justify-between">
          <div>
            <div className="text-sm font-bold text-white mb-1">Water Balance Stream Share</div>
            <p className="text-xs text-blue-400 mb-4">Volume distribution across revenue and loss components</p>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterBalanceData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: '#8bb8d4', fontSize: 10 }} unit=" MLD" />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#8bb8d4', fontSize: 10 }} width={100} />
                  <Tooltip contentStyle={{ background: '#031629', borderColor: 'rgba(0,212,255,0.2)', fontSize: 11 }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {waterBalanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs">
            <span className="text-cyan-300 font-bold">AquaSentry Insight: </span>
            <span className="text-blue-200">
              Of the {nonRevenueWater.toFixed(1)} MLD lost, {mainsLeakage.toFixed(1)} MLD (
              {((mainsLeakage / nonRevenueWater) * 100).toFixed(0)}%) is physical underground leakage recoverable via targeted acoustic repair.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
