'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceDot, Label
} from 'recharts';

// Generate realistic time series with anomalies
function generateZoneData(zoneId: string, baseLoss: number, hasLeakEvent: boolean) {
  const result = [];
  for (let i = 0; i < 90; i++) {
    const date = new Date(); date.setDate(date.getDate() - 89 + i);
    const seasonal = 1 + 0.08 * Math.sin(2 * Math.PI * i / 365);
    const weekly = date.getDay() < 5 ? 1.05 : 0.9;
    const noise = (Math.random() - 0.5) * 5;
    let loss = baseLoss * seasonal * weekly + noise;
    let nightFlow = 0.8 + Math.random() * 0.4;
    let isAnomaly = false;

    if (hasLeakEvent && i >= 55 && i <= 58) {
      loss = baseLoss * 2.4 + noise;
      nightFlow = 3.2 + Math.random() * 0.5;
      isAnomaly = true;
    } else if (!hasLeakEvent && i >= 70 && i <= 72) {
      loss = baseLoss * 1.6 + noise;
      nightFlow = 1.8 + Math.random() * 0.3;
      isAnomaly = true;
    }

    const supply = 180000 + Math.random() * 20000;
    result.push({
      day: i + 1,
      date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      loss_pct: parseFloat(Math.max(5, Math.min(55, loss)).toFixed(1)),
      night_flow: parseFloat(nightFlow.toFixed(2)),
      supply: parseFloat((supply / 1000).toFixed(1)),
      billed: parseFloat((supply * (1 - Math.max(5, Math.min(55, loss)) / 100) / 1000).toFixed(1)),
      pressure: parseFloat((2.5 + Math.random() * 0.5 - (isAnomaly ? 0.4 : 0)).toFixed(2)),
      anomaly: isAnomaly,
      anomaly_score: isAnomaly ? parseFloat((-0.65 - Math.random() * 0.2).toFixed(3)) : parseFloat((-0.1 + Math.random() * 0.08).toFixed(3)),
    });
  }
  return result;
}

const ZONES = [
  { id: 'Z-003', name: 'Jayanagar', baseLoss: 18, hasLeak: true, anomalyCount: 4, precision: 0.82, recall: 0.79 },
  { id: 'Z-007', name: 'Rajajinagar', baseLoss: 22, hasLeak: true, anomalyCount: 6, precision: 0.78, recall: 0.83 },
  { id: 'Z-005', name: 'Hebbal', baseLoss: 15, hasLeak: false, anomalyCount: 3, precision: 0.85, recall: 0.72 },
  { id: 'Z-004', name: 'Yelahanka', baseLoss: 12, hasLeak: false, anomalyCount: 2, precision: 0.80, recall: 0.76 },
];

const LOSS_TYPES = [
  { type: 'Physical Leak', icon: '💧', color: '#ff3366', description: 'Pipe burst or crack — abnormal night flow >2× baseline', confidence: 78 },
  { type: 'Meter Fault', icon: '📡', color: '#ffd700', description: 'Zero/stale reads from cluster of meters in same street', confidence: 72 },
  { type: 'Unauthorised Use', icon: '🚰', color: '#ff6b35', description: 'Elevated day use without billing increase', confidence: 65 },
  { type: 'Data Delay', icon: '📋', color: '#00d4ff', description: 'Reads >48hr delayed — NRW appears inflated artificially', confidence: 88 },
];

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload.anomaly) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="rgba(255,51,102,0.2)" stroke="#ff3366" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={4} fill="#ff3366" />
    </g>
  );
};

const AnomalyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="glass-card p-3 text-xs" style={{ minWidth: 180 }}>
      <div className="font-bold text-cyan-300 mb-2">{d?.date}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4 mb-1" style={{ color: p.color }}>
          <span>{p.name}:</span><span className="font-bold">{p.value}{p.name.includes('Loss') ? '%' : p.name.includes('Flow') ? ' L/s' : ''}</span>
        </div>
      ))}
      {d?.anomaly && (
        <div className="mt-2 pt-2 border-t border-red-500/30">
          <span className="badge-critical">ANOMALY DETECTED</span>
          <div className="mt-1 text-red-300">Score: {d?.anomaly_score}</div>
        </div>
      )}
    </div>
  );
};

export default function AnomalyPage() {
  const [selectedZone, setSelectedZone] = useState(ZONES[0]);
  const [data, setData] = useState<ReturnType<typeof generateZoneData>>([]);
  const [viewMode, setViewMode] = useState<'loss' | 'flow' | 'scatter'>('loss');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setData(generateZoneData(selectedZone.id, selectedZone.baseLoss, selectedZone.hasLeak));
  }, [selectedZone]);

  const anomalyDays = data.filter(d => d.anomaly);
  const normalDays = data.filter(d => !d.anomaly);

  return (
    <div className="p-6 min-h-screen" style={{ background: 'linear-gradient(135deg, #020b18, #031629)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">AI Anomaly Detection</h1>
          <p className="text-sm text-blue-400 mt-0.5">Isolation Forest · 90-day rolling window · Multi-variate signals</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <span className="text-xs text-blue-400">Model:</span>
          <span className="text-xs font-bold text-cyan-300">Isolation Forest</span>
          <span className="text-xs text-blue-400 ml-2">Contamination: 10%</span>
        </div>
      </div>

      {/* Zone selector */}
      <div className="flex gap-3 mb-6">
        {ZONES.map(z => (
          <button key={z.id} onClick={() => setSelectedZone(z)}
            className={`flex-1 p-4 rounded-xl transition-all ${selectedZone.id === z.id ? 'gradient-border' : 'glass-card'}`}
            style={selectedZone.id === z.id ? { background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.4)' } : {}}>
            <div className="text-sm font-bold text-blue-100 mb-1">{z.name}</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-400">{z.anomalyCount} anomalies</span>
              <span className="text-xs font-semibold text-orange-400">{z.baseLoss + 10}% avg NRW</span>
            </div>
          </button>
        ))}
      </div>

      {/* Model metrics */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Days Analysed', value: '90', color: '#00d4ff' },
          { label: 'Anomalies Detected', value: String(selectedZone.anomalyCount), color: '#ff3366' },
          { label: 'Anomaly Rate', value: `${(selectedZone.anomalyCount / 90 * 100).toFixed(1)}%`, color: '#ff6b35' },
          { label: 'Precision', value: `${(selectedZone.precision * 100).toFixed(0)}%`, color: '#00ff88' },
          { label: 'Recall', value: `${(selectedZone.recall * 100).toFixed(0)}%`, color: '#ffd700' },
        ].map(m => (
          <div key={m.label} className="glass-card p-4 text-center">
            <div className="text-2xl font-black" style={{ color: m.color }}>{m.value}</div>
            <div className="text-xs text-blue-400 mt-1 uppercase tracking-wide">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="glass-card p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-blue-100">{selectedZone.name} — Anomaly Time Series</h2>
            <p className="text-xs text-blue-400 mt-0.5">Red circles = AI-flagged anomaly days</p>
          </div>
          <div className="flex gap-2">
            {(['loss', 'flow', 'scatter'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === mode ? 'text-black' : 'text-blue-300'}`}
                style={{ background: viewMode === mode ? 'linear-gradient(135deg,#00d4ff,#0080ff)' : 'rgba(0,128,255,0.1)', border: '1px solid rgba(0,128,255,0.2)' }}>
                {mode === 'loss' ? '📉 NRW Loss' : mode === 'flow' ? '🌊 Night Flow' : '🔵 Scatter'}
              </button>
            ))}
          </div>
        </div>

        {mounted && viewMode === 'loss' && (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="gLoss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff3366" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#4a8fa8', fontSize: 10 }} tickLine={false} axisLine={false} interval={9} />
              <YAxis tick={{ fill: '#4a8fa8', fontSize: 10 }} tickLine={false} axisLine={false} unit="%" domain={[0, 55]} />
              <Tooltip content={<AnomalyTooltip />} />
              <ReferenceLine y={25} stroke="#ff3366" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.7}>
                <Label value="Alert Threshold (25%)" fill="#ff3366" fontSize={10} position="insideTopRight" />
              </ReferenceLine>
              <Area type="monotone" dataKey="loss_pct" stroke="#ff6b35" strokeWidth={2} fill="url(#gLoss)" name="NRW Loss" dot={<CustomDot />} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {mounted && viewMode === 'flow' && (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="gFlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#4a8fa8', fontSize: 10 }} tickLine={false} axisLine={false} interval={9} />
              <YAxis tick={{ fill: '#4a8fa8', fontSize: 10 }} tickLine={false} axisLine={false} unit=" L/s" />
              <Tooltip content={<AnomalyTooltip />} />
              <ReferenceLine y={1.5} stroke="#ff6b35" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.7}>
                <Label value="Baseline Threshold" fill="#ff6b35" fontSize={10} position="insideTopRight" />
              </ReferenceLine>
              <Area type="monotone" dataKey="night_flow" stroke="#00d4ff" strokeWidth={2} fill="url(#gFlow)" name="Night Flow" dot={<CustomDot />} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {mounted && viewMode === 'scatter' && (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" />
              <XAxis dataKey="night_flow" name="Night Flow (L/s)" tick={{ fill: '#4a8fa8', fontSize: 10 }} tickLine={false} axisLine={false} label={{ value: 'Night Flow (L/s)', fill: '#4a8fa8', fontSize: 11, position: 'insideBottom', offset: -2 }} />
              <YAxis dataKey="loss_pct" name="NRW Loss %" tick={{ fill: '#4a8fa8', fontSize: 10 }} tickLine={false} axisLine={false} label={{ value: 'NRW %', fill: '#4a8fa8', fontSize: 11, angle: -90, position: 'insideLeft' }} />
              <Tooltip cursor={{ fill: 'rgba(0,212,255,0.05)' }} content={<AnomalyTooltip />} />
              <Scatter name="Normal" data={normalDays} fill="#00d4ff" fillOpacity={0.6} r={3} />
              <Scatter name="Anomaly" data={anomalyDays} fill="#ff3366" fillOpacity={1} r={6} shape={(props: any) => (
                <circle cx={props.cx} cy={props.cy} r={6} fill="#ff3366" stroke="#ff666680" strokeWidth={2} style={{ filter: 'drop-shadow(0 0 6px #ff3366)' }} />
              )} />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Loss Classification */}
        <div className="col-span-12 lg:col-span-7 glass-card p-5">
          <h2 className="font-bold text-blue-100 mb-1">Loss Classification Engine</h2>
          <p className="text-xs text-blue-400 mb-4">Rule-based + supervised model classification of anomaly cause</p>
          <div className="space-y-3">
            {LOSS_TYPES.map(item => (
              <div key={item.type} className="p-4 rounded-xl transition-all hover:border-opacity-100"
                style={{ background: `${item.color}0a`, border: `1px solid ${item.color}25` }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-semibold text-sm" style={{ color: item.color }}>{item.type}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black" style={{ color: item.color }}>{item.confidence}%</div>
                    <div className="text-xs text-blue-400">confidence</div>
                  </div>
                </div>
                <p className="text-xs text-blue-300 mb-2">{item.description}</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${item.confidence}%`, background: `linear-gradient(90deg, ${item.color}80, ${item.color})` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anomaly Feed */}
        <div className="col-span-12 lg:col-span-5 glass-card p-5">
          <h2 className="font-bold text-blue-100 mb-1">Detected Anomalies</h2>
          <p className="text-xs text-blue-400 mb-4">Last 90 days · {selectedZone.name}</p>
          <div className="space-y-3">
            {anomalyDays.slice(0, 5).map((d, i) => (
              <div key={i} className="p-3 rounded-xl alert-critical">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-red-300">Day {d.day} · {d.date}</span>
                  <span className="badge-critical">ANOMALY</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-blue-400">NRW Loss:</span><span className="text-red-400 font-bold">{d.loss_pct}%</span>
                  <span className="text-blue-400">Night Flow:</span><span className="text-red-400 font-bold">{d.night_flow} L/s</span>
                  <span className="text-blue-400">Pressure:</span><span className="text-blue-200">{d.pressure} bar</span>
                  <span className="text-blue-400">IF Score:</span><span className="font-mono text-red-300">{d.anomaly_score}</span>
                </div>
              </div>
            ))}
            {anomalyDays.length === 0 && (
              <div className="text-center py-8 text-blue-400">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-sm">No anomalies detected in this zone</div>
              </div>
            )}
          </div>

          {/* Model info */}
          <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(0,128,255,0.07)', border: '1px solid rgba(0,128,255,0.15)' }}>
            <div className="text-xs font-bold text-cyan-400 mb-2">MODEL DETAILS</div>
            <div className="space-y-1">
              {[
                ['Algorithm', 'Isolation Forest'],
                ['Features', '5 variables'],
                ['Trees', '100 estimators'],
                ['Contamination', '10%'],
                ['Scaler', 'StandardScaler'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-blue-400">{k}</span>
                  <span className="text-blue-200 font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
