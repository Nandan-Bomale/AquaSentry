'use client';
import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Legend
} from 'recharts';

function genMonthly() {
  const months = ['Jun 25', 'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25'];
  const baseNRW = [27.8, 26.5, 25.1, 23.8, 22.4, 22.4];
  return months.map((month, i) => ({
    month,
    nrw_pct: baseNRW[i] + (Math.random() - 0.5) * 0.5,
    supply_ML: parseFloat((95 + Math.random() * 4).toFixed(1)),
    billed_ML: parseFloat((95 * (1 - baseNRW[i] / 100) + Math.random() * 2).toFixed(1)),
    water_recovered_ML: parseFloat((i * 1.3 + 0.8 + Math.random() * 0.4).toFixed(1)),
    revenue_saved_lakh: parseFloat(((i * 1.3 + 0.8) * 8.5 / 100000 * 30000).toFixed(1)),
    interventions: 3 + i * 1.5 + Math.floor(Math.random() * 3),
    mean_response_hours: parseFloat((42 - i * 3.5 + (Math.random() - 0.5) * 2).toFixed(1)),
    complaints_resolved: 10 + i * 5 + Math.floor(Math.random() * 10),
  }));
}

const MONTHLY = genMonthly();

const ZONE_RECOVERY = [
  { zone: 'Rajajinagar', recovered: 3.2, potential: 5.1, color: '#ff3366' },
  { zone: 'Jayanagar', recovered: 2.8, potential: 4.6, color: '#ff6b35' },
  { zone: 'Hebbal', recovered: 2.1, potential: 4.0, color: '#ffd700' },
  { zone: 'Yelahanka', recovered: 1.8, potential: 3.8, color: '#00d4ff' },
  { zone: 'Koramangala', recovered: 1.4, potential: 2.4, color: '#00ff88' },
  { zone: 'Marathahalli', recovered: 1.4, potential: 2.5, color: '#8bb8d4' },
];

const INTERVENTION_TYPES = [
  { type: 'Pipe Repair', count: 12, water_recovered_ML: 5.4, avg_days: 4.2, color: '#ff3366' },
  { type: 'Meter Replacement', count: 18, water_recovered_ML: 3.1, avg_days: 1.8, color: '#ffd700' },
  { type: 'Data Correction', count: 11, water_recovered_ML: 2.8, avg_days: 0.5, color: '#00d4ff' },
  { type: 'Illegal Connection', count: 6, water_recovered_ML: 1.4, avg_days: 3.0, color: '#ff6b35' },
];

export default function ImpactPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="p-6 min-h-screen" style={{ background: 'linear-gradient(135deg, #020b18, #031629)' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">Impact Analytics</h1>
        <p className="text-sm text-blue-400 mt-0.5">Tracking water recovered, revenue saved and community outcomes · Jun–Nov 2025</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Water Recovered', value: '12.7', unit: 'ML', color: '#00ff88', sub: 'This period' },
          { label: 'Revenue Saved', value: '₹39.4', unit: 'L', color: '#00d4ff', sub: 'INR Lakhs' },
          { label: 'Total Interventions', value: '47', unit: '', color: '#ffd700', sub: 'Field actions' },
          { label: 'NRW Reduction', value: '5.4', unit: 'pts', color: '#ff3366', sub: '27.8% → 22.4%' },
          { label: 'Avg Response Time', value: '18.4', unit: 'hrs', color: '#ff6b35', sub: 'Was 42 hrs' },
          { label: 'Vulnerable Zones', value: '3', unit: '', color: '#00d4ff', sub: 'Addressed' },
        ].map(m => (
          <div key={m.label} className="glass-card p-4 text-center">
            <div className="text-xl font-black" style={{ color: m.color }}>
              {m.value}<span className="text-sm font-medium ml-1" style={{ color: `${m.color}99` }}>{m.unit}</span>
            </div>
            <div className="text-xs font-semibold text-blue-100 mt-1">{m.label}</div>
            <div className="text-xs text-blue-500 mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* NRW Trend */}
        <div className="col-span-12 lg:col-span-8 glass-card p-5">
          <h2 className="font-bold text-blue-100 mb-1">NRW Reduction Trend</h2>
          <p className="text-xs text-blue-400 mb-4">Monthly NRW % vs water recovered (ML) · 6-month window</p>
          {mounted && (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={MONTHLY} margin={{ top: 5, right: 15, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="gNRW" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff3366" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#4a8fa8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#4a8fa8', fontSize: 11 }} tickLine={false} axisLine={false} unit="%" domain={[20, 32]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#4a8fa8', fontSize: 11 }} tickLine={false} axisLine={false} unit=" ML" />
                <Tooltip contentStyle={{ background: '#031629', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 8, color: '#e8f4fd' }} />
                <Area yAxisId="left" type="monotone" dataKey="nrw_pct" stroke="#ff3366" fill="url(#gNRW)" strokeWidth={2.5} name="NRW %" />
                <Bar yAxisId="right" dataKey="water_recovered_ML" fill="#00ff88" fillOpacity={0.7} name="Water Recovered (ML)" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Response Time */}
        <div className="col-span-12 lg:col-span-4 glass-card p-5">
          <h2 className="font-bold text-blue-100 mb-1">Response Time Improvement</h2>
          <p className="text-xs text-blue-400 mb-4">Mean hours from alert to inspection</p>
          {mounted && (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={MONTHLY} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                <defs>
                  <linearGradient id="gResp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#4a8fa8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4a8fa8', fontSize: 10 }} tickLine={false} axisLine={false} unit=" hr" />
                <Tooltip contentStyle={{ background: '#031629', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 8, color: '#e8f4fd' }} />
                <Area type="monotone" dataKey="mean_response_hours" stroke="#00d4ff" fill="url(#gResp)" strokeWidth={2} name="Avg Response (hrs)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div className="mt-3 p-3 rounded-xl text-center" style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}>
            <div className="text-xl font-black text-green-400">42 hrs → 18.4 hrs</div>
            <div className="text-xs text-blue-400 mt-1">56% improvement in response time</div>
          </div>
        </div>

        {/* Zone Recovery */}
        <div className="col-span-12 lg:col-span-6 glass-card p-5">
          <h2 className="font-bold text-blue-100 mb-1">Water Recovery by Zone</h2>
          <p className="text-xs text-blue-400 mb-4">Recovered vs estimated remaining potential (ML)</p>
          <div className="space-y-3">
            {ZONE_RECOVERY.map(item => (
              <div key={item.zone}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-blue-100">{item.zone}</span>
                  <span>
                    <span className="font-bold" style={{ color: item.color }}>{item.recovered} ML</span>
                    <span className="text-blue-500"> / {item.potential} ML target</span>
                  </span>
                </div>
                <div className="relative h-4 rounded-full overflow-hidden" style={{ background: 'rgba(0,128,255,0.08)', border: '1px solid rgba(0,128,255,0.15)' }}>
                  {/* Potential bar */}
                  <div className="absolute inset-0 rounded-full" style={{ background: `${item.color}20` }} />
                  {/* Recovered bar */}
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${item.recovered / item.potential * 100}%`, background: `linear-gradient(90deg, ${item.color}80, ${item.color})`, boxShadow: `0 0 8px ${item.color}60` }} />
                  {/* Label */}
                  <div className="absolute right-2 top-0 bottom-0 flex items-center text-xs font-bold" style={{ color: item.color }}>
                    {(item.recovered / item.potential * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intervention Types */}
        <div className="col-span-12 lg:col-span-6 glass-card p-5">
          <h2 className="font-bold text-blue-100 mb-1">Intervention Breakdown</h2>
          <p className="text-xs text-blue-400 mb-4">By type — count, water recovered, avg time</p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th><th>Count</th><th>Recovered</th><th>Avg Days</th>
              </tr>
            </thead>
            <tbody>
              {INTERVENTION_TYPES.map(item => (
                <tr key={item.type}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="font-semibold text-blue-100">{item.type}</span>
                    </div>
                  </td>
                  <td><span className="font-bold" style={{ color: item.color }}>{item.count}</span></td>
                  <td><span className="font-bold text-green-400">{item.water_recovered_ML} ML</span></td>
                  <td><span className="text-blue-200">{item.avg_days} days</span></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Revenue savings chart */}
          <div className="mt-4">
            <div className="text-xs text-blue-400 mb-2">Monthly Revenue Saved (₹ Lakhs)</div>
            {mounted && (
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={MONTHLY} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#4a8fa8', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#4a8fa8', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#031629', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 8, color: '#e8f4fd', fontSize: 11 }} />
                  <Bar dataKey="revenue_saved_lakh" name="Revenue Saved (₹L)" fill="#00d4ff" fillOpacity={0.8} radius={[4, 4, 0, 0]}
                    style={{ filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.4))' }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Social / Equity impact */}
        <div className="col-span-12 glass-card p-5">
          <h2 className="font-bold text-blue-100 mb-4">Community & Equity Impact</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Vulnerable Zones Prioritised', value: '3 of 3', desc: 'Rajajinagar, Jayanagar, Hebbal — high vulnerability scores included in top 3 priorities', color: '#ff6b35', icon: '🏘️' },
              { title: 'Low-Complaint Areas Covered', value: '5 zones', desc: 'AquaSentry surface hidden losses in areas without active customer complaints', color: '#ffd700', icon: '📢' },
              { title: 'Households Served Fairer', value: '28,700', desc: 'Households in high-vulnerability zones now have equal investigation priority', color: '#00d4ff', icon: '👥' },
              { title: 'Response Time Equity', value: '+56%', desc: 'Historically underserved areas now receive faster response times vs complaint-led model', color: '#00ff88', icon: '⚖️' },
            ].map(item => (
              <div key={item.title} className="p-4 rounded-xl" style={{ background: `${item.color}0a`, border: `1px solid ${item.color}20` }}>
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-base font-black" style={{ color: item.color }}>{item.value}</div>
                <div className="text-xs font-semibold text-blue-100 mt-1 mb-2">{item.title}</div>
                <div className="text-xs text-blue-400 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
