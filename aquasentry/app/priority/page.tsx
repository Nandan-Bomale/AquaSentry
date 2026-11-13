'use client';
import { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

const PRIORITY_DATA = [
  {
    rank: 1, investigation_id: 'INV-2024100', zone: 'Rajajinagar', zone_id: 'Z-007',
    priority: 'CRITICAL', total_score: 78.4,
    scores: { vol_loss: 24.2, infra_risk: 23.1, vulnerability: 14.0, anomaly: 12.1, urgency: 15.0 },
    loss_type: 'Physical Leak', loss_confidence: 0.78,
    avg_loss_pct: 38.2, daily_loss_L: 510270, daily_revenue_loss: 15808, annual_revenue_loss: 5769920,
    repair_cost: 280000, payback_days: 17.7,
    recommended_action: 'Emergency inspection of main trunk line — Pipe P-104',
    households: 8900, vulnerability_level: 'High',
    pipe_age: 35, pipe_material: 'Cast Iron',
    assigned_team: 'Team Alpha', created_at: '12 min ago',
    lat: 12.9867, lng: 77.5533,
  },
  {
    rank: 2, investigation_id: 'INV-2024101', zone: 'Jayanagar', zone_id: 'Z-003',
    priority: 'CRITICAL', total_score: 71.9,
    scores: { vol_loss: 20.8, infra_risk: 21.8, vulnerability: 12.0, anomaly: 11.0, urgency: 13.3 },
    loss_type: 'Physical Leak', loss_confidence: 0.76,
    avg_loss_pct: 31.8, daily_loss_L: 467460, daily_revenue_loss: 14487, annual_revenue_loss: 5287755,
    repair_cost: 320000, payback_days: 22.1,
    recommended_action: 'Inspect Asbestos cement pipe segment — replace urgently',
    households: 9800, vulnerability_level: 'High',
    pipe_age: 58, pipe_material: 'Asbestos',
    assigned_team: 'Team Bravo', created_at: '35 min ago',
    lat: 12.9230, lng: 77.5922,
  },
  {
    rank: 3, investigation_id: 'INV-2024102', zone: 'Hebbal', zone_id: 'Z-005',
    priority: 'HIGH', total_score: 62.3,
    scores: { vol_loss: 19.1, infra_risk: 15.6, vulnerability: 10.0, anomaly: 10.4, urgency: 7.2 },
    loss_type: 'Meter Fault', loss_confidence: 0.72,
    avg_loss_pct: 28.6, daily_loss_L: 476190, daily_revenue_loss: 14760, annual_revenue_loss: 5387400,
    repair_cost: 95000, payback_days: 6.4,
    recommended_action: 'Audit cluster of 15 faulty meters — billing gap 41,000 L/day',
    households: 11100, vulnerability_level: 'Medium',
    pipe_age: 15, pipe_material: 'Ductile Iron',
    assigned_team: 'Team Charlie', created_at: '2 hr ago',
    lat: 13.0352, lng: 77.5952,
  },
  {
    rank: 4, investigation_id: 'INV-2024103', zone: 'Yelahanka', zone_id: 'Z-004',
    priority: 'HIGH', total_score: 55.7,
    scores: { vol_loss: 17.2, infra_risk: 12.5, vulnerability: 8.0, anomaly: 10.0, urgency: 8.0 },
    loss_type: 'Mixed (Leak + Meter)', loss_confidence: 0.65,
    avg_loss_pct: 22.4, daily_loss_L: 511200, daily_revenue_loss: 15847, annual_revenue_loss: 5784155,
    repair_cost: 180000, payback_days: 11.4,
    recommended_action: 'Zone-level investigation — split physical and apparent loss',
    households: 15200, vulnerability_level: 'Medium',
    pipe_age: 8, pipe_material: 'HDPE',
    assigned_team: 'Team Delta', created_at: '6 hr ago',
    lat: 13.1004, lng: 77.5963,
  },
  {
    rank: 5, investigation_id: 'INV-2024104', zone: 'Koramangala', zone_id: 'Z-001',
    priority: 'MEDIUM', total_score: 41.2,
    scores: { vol_loss: 10.4, infra_risk: 14.8, vulnerability: 6.0, anomaly: 7.0, urgency: 3.0 },
    loss_type: 'Data Gap / Delay', loss_confidence: 0.88,
    avg_loss_pct: 14.2, daily_loss_L: 264120, daily_revenue_loss: 8188, annual_revenue_loss: 2988620,
    repair_cost: 45000, payback_days: 5.5,
    recommended_action: 'Resolve meter data feed — 14 delayed reads >48hr',
    households: 12400, vulnerability_level: 'Low',
    pipe_age: 12, pipe_material: 'PVC',
    assigned_team: 'Team Echo', created_at: '18 hr ago',
    lat: 12.9279, lng: 77.6271,
  },
  {
    rank: 6, investigation_id: 'INV-2024105', zone: 'Marathahalli', zone_id: 'Z-008',
    priority: 'MEDIUM', total_score: 37.6,
    scores: { vol_loss: 9.5, infra_risk: 10.1, vulnerability: 6.0, anomaly: 7.0, urgency: 5.0 },
    loss_type: 'Service Leak (Customer)', loss_confidence: 0.61,
    avg_loss_pct: 13.7, daily_loss_L: 339075, daily_revenue_loss: 10512, annual_revenue_loss: 3836880,
    repair_cost: 65000, payback_days: 6.2,
    recommended_action: 'Field survey — complaint cluster in 2km radius',
    households: 16500, vulnerability_level: 'Low',
    pipe_age: 29, pipe_material: 'Cast Iron',
    assigned_team: 'Team Foxtrot', created_at: '1 day ago',
    lat: 12.9591, lng: 77.6971,
  },
];

const SCORE_LABELS = {
  vol_loss: 'Volume Loss',
  infra_risk: 'Infrastructure Risk',
  vulnerability: 'Community Vuln.',
  anomaly: 'Anomaly Confidence',
  urgency: 'Urgency',
};

function ScoreRadar({ scores }: { scores: Record<string, number> }) {
  const data = Object.entries(scores).map(([key, val]) => ({
    subject: SCORE_LABELS[key as keyof typeof SCORE_LABELS] || key,
    value: val,
    max: key === 'vol_loss' || key === 'infra_risk' ? 25 : key === 'vulnerability' ? 20 : 15,
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="rgba(0,212,255,0.15)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#8bb8d4', fontSize: 9 }} />
        <Radar dataKey="value" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.2} strokeWidth={2} />
        <Tooltip contentStyle={{ background: '#031629', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 8, color: '#e8f4fd', fontSize: 12 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export default function PriorityPage() {
  const [selected, setSelected] = useState<typeof PRIORITY_DATA[0] | null>(null);
  const [view, setView] = useState<'list' | 'detail'>('list');

  const selectItem = (item: typeof PRIORITY_DATA[0]) => {
    setSelected(item);
    setView('detail');
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: 'linear-gradient(135deg, #020b18, #031629)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Repair Prioritisation</h1>
          <p className="text-sm text-blue-400 mt-0.5">AI-ranked work orders · Multi-factor scoring engine · Human-in-the-loop approval</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('list')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === 'list' ? 'text-black' : 'text-blue-300'}`}
            style={{ background: view === 'list' ? 'linear-gradient(135deg,#00d4ff,#0080ff)' : 'rgba(0,128,255,0.1)', border: '1px solid rgba(0,128,255,0.2)' }}>
            📋 Work Order List
          </button>
          {selected && (
            <button onClick={() => setView('detail')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === 'detail' ? 'text-black' : 'text-blue-300'}`}
              style={{ background: view === 'detail' ? 'linear-gradient(135deg,#00d4ff,#0080ff)' : 'rgba(0,128,255,0.1)', border: '1px solid rgba(0,128,255,0.2)' }}>
              🔍 Investigation Detail
            </button>
          )}
        </div>
      </div>

      {/* Scoring formula */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs font-bold text-cyan-400 tracking-widest">PRIORITY SCORE =</span>
          {[
            { label: 'Volume Loss', weight: '25pts', color: '#ff3366' },
            { label: '+  Infrastructure Risk', weight: '25pts', color: '#ff6b35' },
            { label: '+  Community Vulnerability', weight: '20pts', color: '#ffd700' },
            { label: '+  Anomaly Confidence', weight: '15pts', color: '#00d4ff' },
            { label: '+  Urgency', weight: '15pts', color: '#00ff88' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-1.5">
              <span className="text-xs text-blue-300">{f.label}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${f.color}20`, color: f.color }}>max {f.weight}</span>
            </div>
          ))}
          <span className="text-xs font-bold text-cyan-400 ml-2">= max 100 pts</span>
        </div>
      </div>

      {view === 'list' && (
        <div className="space-y-3">
          {PRIORITY_DATA.map(item => {
            const pColor = item.priority === 'CRITICAL' ? '#ff3366' : item.priority === 'HIGH' ? '#ff6b35' : '#ffd700';
            return (
              <div key={item.investigation_id}
                className="glass-card p-5 cursor-pointer transition-all hover:border-cyan-500/40 hover:shadow-lg"
                style={{ borderColor: `${pColor}25` }}
                onClick={() => selectItem(item)}>
                <div className="flex items-start gap-5">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-black text-xl"
                    style={{ background: `${pColor}15`, border: `2px solid ${pColor}60`, color: pColor, boxShadow: `0 0 15px ${pColor}30` }}>
                    #{item.rank}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-black text-blue-100 text-base">{item.zone}</span>
                      <span className={item.priority === 'CRITICAL' ? 'badge-critical' : item.priority === 'HIGH' ? 'badge-high' : 'badge-medium'}>
                        {item.priority}
                      </span>
                      <span className="text-xs text-blue-400 font-mono">{item.investigation_id}</span>
                      <span className="ml-auto text-xs text-blue-500">{item.created_at}</span>
                    </div>
                    <p className="text-sm text-blue-300 mb-3">🔧 {item.recommended_action}</p>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { label: 'Avg NRW', value: `${item.avg_loss_pct}%`, color: pColor },
                        { label: 'Daily Loss', value: `${(item.daily_loss_L / 1000).toFixed(0)} KL`, color: '#ff6b35' },
                        { label: 'Revenue Risk', value: `₹${item.daily_revenue_loss.toLocaleString()}/day`, color: '#ff6b35' },
                        { label: 'Repair Cost', value: `₹${(item.repair_cost / 1000).toFixed(0)}K`, color: '#ffd700' },
                        { label: 'Payback', value: `${item.payback_days.toFixed(0)} days`, color: '#00ff88' },
                        { label: 'Loss Type', value: item.loss_type, color: '#00d4ff' },
                        { label: 'Assigned', value: item.assigned_team, color: '#8bb8d4' },
                      ].map(stat => (
                        <div key={stat.label} className="text-center">
                          <div className="text-xs font-bold" style={{ color: stat.color }}>{stat.value}</div>
                          <div className="text-xs text-blue-500 mt-0.5">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Score ring */}
                  <div className="flex-shrink-0 relative w-20 h-20">
                    <svg width="80" height="80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke={`${pColor}20`} strokeWidth="6" />
                      <circle cx="40" cy="40" r="34" fill="none" stroke={pColor}
                        strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 34 * item.total_score / 100} ${2 * Math.PI * 34}`}
                        strokeDashoffset={2 * Math.PI * 34 * 0.25}
                        transform="rotate(-90 40 40)"
                        style={{ filter: `drop-shadow(0 0 6px ${pColor})` }}
                      />
                      <text x="40" y="38" textAnchor="middle" fill={pColor} fontSize="14" fontWeight="800">{item.total_score}</text>
                      <text x="40" y="52" textAnchor="middle" fill="#8bb8d4" fontSize="8">/ 100</text>
                    </svg>
                  </div>
                </div>

                {/* Score breakdown bar */}
                <div className="flex h-2 rounded-full overflow-hidden mt-4 gap-0.5">
                  {Object.entries(item.scores).map(([key, val], i) => {
                    const colors = ['#ff3366', '#ff6b35', '#ffd700', '#00d4ff', '#00ff88'];
                    const maxes = [25, 25, 20, 15, 15];
                    return (
                      <div key={key} className="rounded-full" style={{ flex: val, background: colors[i], opacity: 0.8 }} />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-blue-500 mt-1">
                  {Object.keys(item.scores).map((k, i) => (
                    <span key={k}>{SCORE_LABELS[k as keyof typeof SCORE_LABELS]?.split(' ')[0]}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'detail' && selected && (
        <div className="grid grid-cols-12 gap-5">
          {/* Back button + header */}
          <div className="col-span-12 flex items-center gap-4">
            <button onClick={() => setView('list')} className="text-sm text-cyan-400 hover:text-cyan-300 font-semibold">← Back to List</button>
            <h2 className="text-xl font-black text-white">{selected.zone} · {selected.investigation_id}</h2>
            <span className={selected.priority === 'CRITICAL' ? 'badge-critical' : selected.priority === 'HIGH' ? 'badge-high' : 'badge-medium'}>
              {selected.priority}
            </span>
          </div>

          {/* Score breakdown radar */}
          <div className="col-span-12 lg:col-span-5 glass-card p-5">
            <h3 className="font-bold text-blue-100 mb-2">Score Breakdown Radar</h3>
            <p className="text-xs text-blue-400 mb-4">Multi-factor prioritisation weights</p>
            <ScoreRadar scores={selected.scores} />
            <div className="mt-3 space-y-2">
              {Object.entries(selected.scores).map(([key, val], i) => {
                const colors = ['#ff3366', '#ff6b35', '#ffd700', '#00d4ff', '#00ff88'];
                const maxes = [25, 25, 20, 15, 15];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-blue-400 w-36">{SCORE_LABELS[key as keyof typeof SCORE_LABELS]}</span>
                    <div className="flex-1 progress-bar h-2">
                      <div className="progress-fill h-2" style={{ width: `${val / maxes[i] * 100}%`, background: colors[i] }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: colors[i] }}>{val}</span>
                  </div>
                );
              })}
              <div className="border-t pt-2" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
                <div className="flex justify-between font-black">
                  <span className="text-cyan-400 text-sm">TOTAL SCORE</span>
                  <span className="text-white text-lg">{selected.total_score} / 100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Zone details */}
          <div className="col-span-12 lg:col-span-7 space-y-4">
            {/* Recommended Action */}
            <div className="glass-card p-5" style={{ border: `1px solid ${selected.priority === 'CRITICAL' ? 'rgba(255,51,102,0.4)' : 'rgba(255,107,53,0.4)'}` }}>
              <div className="text-xs font-bold text-cyan-400 tracking-widest mb-2">RECOMMENDED ACTION</div>
              <p className="text-blue-100 font-semibold">🔧 {selected.recommended_action}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-xs text-blue-400">Assigned: <span className="text-white font-semibold">{selected.assigned_team}</span></span>
                <span className="text-xs text-blue-400">Loss Type: <span className="text-cyan-300 font-semibold">{selected.loss_type}</span></span>
                <span className="text-xs text-blue-400">Confidence: <span className="text-green-400 font-semibold">{(selected.loss_confidence * 100).toFixed(0)}%</span></span>
              </div>
            </div>

            {/* Financial impact */}
            <div className="glass-card p-5">
              <h3 className="font-bold text-blue-100 mb-3">Financial Impact Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Daily Revenue Loss', value: `₹${selected.daily_revenue_loss.toLocaleString()}`, color: '#ff3366', sub: `at ₹8.50/KL tariff` },
                  { label: 'Annual Revenue Loss', value: `₹${(selected.annual_revenue_loss / 100000).toFixed(1)}L`, color: '#ff6b35', sub: 'If not addressed' },
                  { label: 'Est. Repair Cost', value: `₹${(selected.repair_cost / 1000).toFixed(0)}K`, color: '#ffd700', sub: 'Including field work' },
                  { label: 'Payback Period', value: `${selected.payback_days.toFixed(0)} days`, color: '#00ff88', sub: 'Revenue recovery' },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-xl" style={{ background: `${item.color}0a`, border: `1px solid ${item.color}25` }}>
                    <div className="text-xl font-black" style={{ color: item.color }}>{item.value}</div>
                    <div className="text-xs font-semibold text-blue-100 mt-0.5">{item.label}</div>
                    <div className="text-xs text-blue-400 mt-0.5">{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Infrastructure details */}
            <div className="glass-card p-5">
              <h3 className="font-bold text-blue-100 mb-3">Infrastructure Details</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Households Affected', value: selected.households.toLocaleString(), color: '#00d4ff' },
                  { label: 'Avg NRW', value: `${selected.avg_loss_pct}%`, color: selected.avg_loss_pct > 25 ? '#ff3366' : '#ff6b35' },
                  { label: 'Daily Loss', value: `${(selected.daily_loss_L / 1000).toFixed(0)} KL`, color: '#ff6b35' },
                  { label: 'Pipe Age', value: `${selected.pipe_age} yrs`, color: selected.pipe_age > 40 ? '#ff3366' : selected.pipe_age > 20 ? '#ff6b35' : '#00ff88' },
                  { label: 'Pipe Material', value: selected.pipe_material, color: selected.pipe_material === 'Asbestos' ? '#ff3366' : '#8bb8d4' },
                  { label: 'Vulnerability', value: selected.vulnerability_level, color: selected.vulnerability_level === 'High' ? '#ff3366' : selected.vulnerability_level === 'Medium' ? '#ffd700' : '#00ff88' },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(0,128,255,0.07)', border: '1px solid rgba(0,128,255,0.15)' }}>
                    <div className="text-base font-black" style={{ color: item.color }}>{item.value}</div>
                    <div className="text-xs text-blue-400 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-xl font-bold text-sm text-black"
                style={{ background: 'linear-gradient(135deg,#00d4ff,#0080ff)', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}>
                ✓ Approve Field Investigation
              </button>
              <button className="flex-1 py-3 rounded-xl font-bold text-sm text-orange-300"
                style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.4)' }}>
                📋 Assign to Team
              </button>
              <button className="px-4 py-3 rounded-xl font-bold text-sm text-blue-300"
                style={{ background: 'rgba(0,128,255,0.1)', border: '1px solid rgba(0,128,255,0.3)' }}>
                📄 Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
