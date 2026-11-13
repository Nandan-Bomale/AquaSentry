'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const METER_DATA = [
  { zone: 'Koramangala', zone_id: 'Z-001', total: 12400, active: 11380, faulty: 320, delayed: 480, no_read: 220, completeness: 91.8, avg_lag: 8.2 },
  { zone: 'Whitefield',  zone_id: 'Z-002', total: 18700, active: 17842, faulty: 215, delayed: 420, no_read: 223, completeness: 95.4, avg_lag: 5.1 },
  { zone: 'Jayanagar',   zone_id: 'Z-003', total: 9800,  active: 8428, faulty: 580, delayed: 620, no_read: 172, completeness: 86.0, avg_lag: 24.5 },
  { zone: 'Yelahanka',   zone_id: 'Z-004', total: 15200, active: 14136, faulty: 420, delayed: 418, no_read: 226, completeness: 93.0, avg_lag: 9.8 },
  { zone: 'Hebbal',      zone_id: 'Z-005', total: 11100, active: 9435, faulty: 920, delayed: 530, no_read: 215, completeness: 85.0, avg_lag: 32.1 },
  { zone: 'Electronic City', zone_id: 'Z-006', total: 22000, active: 21384, faulty: 180, delayed: 310, no_read: 126, completeness: 97.2, avg_lag: 3.4 },
  { zone: 'Rajajinagar', zone_id: 'Z-007', total: 8900,  active: 7210, faulty: 820, delayed: 680, no_read: 190, completeness: 81.0, avg_lag: 41.2 },
  { zone: 'Marathahalli',zone_id: 'Z-008', total: 16500, active: 15510, faulty: 380, delayed: 420, no_read: 190, completeness: 94.0, avg_lag: 7.6 },
];

const TOTAL_METERS = METER_DATA.reduce((s, z) => s + z.total, 0);
const TOTAL_ACTIVE = METER_DATA.reduce((s, z) => s + z.active, 0);
const TOTAL_FAULTY = METER_DATA.reduce((s, z) => s + z.faulty, 0);
const TOTAL_DELAYED = METER_DATA.reduce((s, z) => s + z.delayed, 0);

const DATA_ISSUES = [
  { issue: 'Zero Reads > 7 days', count: 1240, zones_affected: 4, severity: 'HIGH', action: 'Field inspection required' },
  { issue: 'Delayed Reads > 48hr', count: 2878, zones_affected: 8, severity: 'MEDIUM', action: 'Check data pipeline' },
  { issue: 'Stuck Counter (same reading 3+ days)', count: 468, zones_affected: 5, severity: 'HIGH', action: 'Meter replacement' },
  { issue: 'Implausible Spike (>5× avg)', count: 142, zones_affected: 3, severity: 'MEDIUM', action: 'Field validation' },
  { issue: 'Missing Monthly Reads', count: 820, zones_affected: 6, severity: 'LOW', action: 'Manual data entry' },
  { issue: 'Billing Mismatch > 10%', count: 318, zones_affected: 4, severity: 'HIGH', action: 'Reconciliation audit' },
];

export default function DataQualityPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedZone, setSelectedZone] = useState(METER_DATA[0]);
  useEffect(() => setMounted(true), []);

  const pieData = [
    { name: 'Active', value: TOTAL_ACTIVE, color: '#00ff88' },
    { name: 'Faulty', value: TOTAL_FAULTY, color: '#ff3366' },
    { name: 'Delayed', value: TOTAL_DELAYED, color: '#ffd700' },
    { name: 'No Read 30d', value: METER_DATA.reduce((s, z) => s + z.no_read, 0), color: '#ff6b35' },
  ];

  return (
    <div className="p-6 min-h-screen" style={{ background: 'linear-gradient(135deg, #020b18, #031629)' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">Data Quality & Meter Health</h1>
        <p className="text-sm text-blue-400 mt-0.5">Monitoring meter completeness, data pipeline integrity and billing reconciliation</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Meters', value: TOTAL_METERS.toLocaleString(), color: '#00d4ff', sub: 'Network-wide' },
          { label: 'Active & Reporting', value: TOTAL_ACTIVE.toLocaleString(), color: '#00ff88', sub: `${(TOTAL_ACTIVE / TOTAL_METERS * 100).toFixed(1)}% completeness` },
          { label: 'Faulty Meters', value: TOTAL_FAULTY.toLocaleString(), color: '#ff3366', sub: `${(TOTAL_FAULTY / TOTAL_METERS * 100).toFixed(1)}% of total` },
          { label: 'Delayed Reads', value: TOTAL_DELAYED.toLocaleString(), color: '#ffd700', sub: '>48hr behind' },
        ].map(m => (
          <div key={m.label} className="glass-card p-4 text-center">
            <div className="text-2xl font-black" style={{ color: m.color }}>{m.value}</div>
            <div className="text-xs font-semibold text-blue-100 mt-1">{m.label}</div>
            <div className="text-xs text-blue-500 mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Meter status donut */}
        <div className="col-span-12 lg:col-span-4 glass-card p-5">
          <h2 className="font-bold text-blue-100 mb-1">Network-wide Meter Status</h2>
          <p className="text-xs text-blue-400 mb-3">All 8 zones combined</p>
          {mounted && (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" style={{ filter: `drop-shadow(0 0 5px ${entry.color}50)` }} />)}
                </Pie>
                <Tooltip formatter={(v: any) => v.toLocaleString()} contentStyle={{ background: '#031629', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 8, color: '#e8f4fd' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-2 mt-2">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs text-blue-300">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold" style={{ color: item.color }}>{item.value.toLocaleString()}</span>
                  <span className="text-xs text-blue-500 ml-1">({(item.value / TOTAL_METERS * 100).toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone completeness bar chart */}
        <div className="col-span-12 lg:col-span-8 glass-card p-5">
          <h2 className="font-bold text-blue-100 mb-1">Meter Completeness by Zone</h2>
          <p className="text-xs text-blue-400 mb-4">% of meters actively reporting readings (30-day window)</p>
          {mounted && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={METER_DATA} margin={{ top: 5, right: 5, bottom: 0, left: -10 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" vertical={false} />
                <XAxis dataKey="zone" tick={{ fill: '#4a8fa8', fontSize: 10 }}
                  tickFormatter={(v) => v.split(' ')[0]} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4a8fa8', fontSize: 10 }} tickLine={false} axisLine={false} unit="%" domain={[75, 100]} />
                <Tooltip contentStyle={{ background: '#031629', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 8, color: '#e8f4fd' }}
                  formatter={(v: any) => `${v}%`} />
                <Bar dataKey="completeness" name="Completeness %" radius={[6, 6, 0, 0]}>
                  {METER_DATA.map((entry, i) => (
                    <Cell key={i}
                      fill={entry.completeness > 93 ? '#00ff88' : entry.completeness > 85 ? '#ffd700' : '#ff3366'}
                      style={{ filter: `drop-shadow(0 0 5px ${entry.completeness > 93 ? '#00ff88' : entry.completeness > 85 ? '#ffd700' : '#ff3366'}60)` }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Zone meter table */}
        <div className="col-span-12 lg:col-span-8 glass-card p-5">
          <h2 className="font-bold text-blue-100 mb-4">Zone-level Meter Breakdown</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Zone</th><th>Total</th><th>Active</th><th>Faulty</th><th>Delayed</th><th>Completeness</th><th>Avg Lag</th>
              </tr>
            </thead>
            <tbody>
              {METER_DATA.map(zone => (
                <tr key={zone.zone_id} className="cursor-pointer" onClick={() => setSelectedZone(zone)}>
                  <td><span className="font-semibold text-blue-100">{zone.zone}</span></td>
                  <td><span className="text-blue-200">{zone.total.toLocaleString()}</span></td>
                  <td><span className="font-bold text-green-400">{zone.active.toLocaleString()}</span></td>
                  <td><span className={`font-bold ${zone.faulty > 500 ? 'text-red-400' : 'text-orange-400'}`}>{zone.faulty.toLocaleString()}</span></td>
                  <td><span className="text-yellow-400">{zone.delayed.toLocaleString()}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="progress-bar flex-1 h-2">
                        <div className="progress-fill h-2" style={{
                          width: `${zone.completeness}%`,
                          background: zone.completeness > 93 ? '#00ff88' : zone.completeness > 85 ? '#ffd700' : '#ff3366'
                        }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: zone.completeness > 93 ? '#00ff88' : zone.completeness > 85 ? '#ffd700' : '#ff3366' }}>
                        {zone.completeness}%
                      </span>
                    </div>
                  </td>
                  <td><span className={`font-mono text-xs ${zone.avg_lag > 24 ? 'text-red-400' : zone.avg_lag > 12 ? 'text-orange-400' : 'text-blue-200'}`}>
                    {zone.avg_lag}hr
                  </span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Data issues */}
        <div className="col-span-12 lg:col-span-4 glass-card p-5">
          <h2 className="font-bold text-blue-100 mb-4">Data Quality Issues</h2>
          <div className="space-y-3">
            {DATA_ISSUES.map(issue => {
              const sc = issue.severity === 'HIGH' ? '#ff3366' : issue.severity === 'MEDIUM' ? '#ffd700' : '#00d4ff';
              return (
                <div key={issue.issue} className="p-3 rounded-xl transition-all"
                  style={{ background: `${sc}08`, border: `1px solid ${sc}25` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: sc }}>{issue.issue}</span>
                    <span className={issue.severity === 'HIGH' ? 'badge-critical' : issue.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'}>
                      {issue.severity}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-blue-400">Affected: <span className="font-bold text-blue-200">{issue.count.toLocaleString()} meters</span></span>
                    <span className="text-blue-500">{issue.zones_affected} zones</span>
                  </div>
                  <div className="text-xs text-blue-400 mt-1.5">→ {issue.action}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Avg Read Lag chart */}
        <div className="col-span-12 glass-card p-5">
          <h2 className="font-bold text-blue-100 mb-1">Average Meter Read Lag by Zone</h2>
          <p className="text-xs text-blue-400 mb-4">Hours from meter read to system ingestion · Target: &lt;6 hrs</p>
          {mounted && (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={METER_DATA} margin={{ top: 5, right: 5, bottom: 0, left: -10 }} barSize={40} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#4a8fa8', fontSize: 10 }} tickLine={false} axisLine={false} unit=" hr" />
                <YAxis type="category" dataKey="zone" tick={{ fill: '#4a8fa8', fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={v => v.split(' ')[0]} width={80} />
                <Tooltip contentStyle={{ background: '#031629', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 8, color: '#e8f4fd' }}
                  formatter={(v: any) => `${v} hours`} />
                <Bar dataKey="avg_lag" name="Avg Read Lag" radius={[0, 4, 4, 0]}>
                  {METER_DATA.map((entry, i) => (
                    <Cell key={i}
                      fill={entry.avg_lag > 24 ? '#ff3366' : entry.avg_lag > 12 ? '#ffd700' : '#00ff88'}
                      style={{ filter: `drop-shadow(0 0 5px ${entry.avg_lag > 24 ? '#ff336640' : entry.avg_lag > 12 ? '#ffd70040' : '#00ff8840'})` }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
