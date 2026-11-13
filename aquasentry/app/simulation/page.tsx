'use client';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';

export default function SimulationPage() {
  const [activeScenario, setActiveScenario] = useState<'prv' | 'pipe_replacement' | 'acoustic_ami' | 'combined'>('prv');
  const [prvTargetBar, setPrvTargetBar] = useState<number>(1.8); // Target night pressure
  const [replacedKm, setReplacedKm] = useState<number>(8.5); // Pipe km replaced
  const [amiCoveragePct, setAmiCoveragePct] = useState<number>(65);

  // Generate 24-hour diurnal hydraulic curve
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const simulationData = hours.map((hour) => {
    // Normal municipal diurnal pattern: high morning peak (6-9am), evening peak (6-9pm), lowest at night (2-4am)
    const isNight = hour >= 1 && hour <= 5;
    const isPeak = (hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 21);

    // Baseline pressure (bar)
    const baselinePressure = isNight ? 3.4 : isPeak ? 2.1 : 2.7;

    // Baseline leakage flow rate (Lps)
    // Leakage increases exponentially with pressure: Q = c * P^1.15
    const baselineLeakLps = 18.5 * Math.pow(baselinePressure / 2.5, 1.15);

    // Calculate Scenario impact
    let simulatedPressure = baselinePressure;
    let simulatedLeakLps = baselineLeakLps;

    if (activeScenario === 'prv' || activeScenario === 'combined') {
      if (isNight) {
        simulatedPressure = prvTargetBar;
        simulatedLeakLps = baselineLeakLps * Math.pow(prvTargetBar / baselinePressure, 1.15);
      }
    }

    if (activeScenario === 'pipe_replacement' || activeScenario === 'combined') {
      // Direct physical reduction proportional to km replaced
      const reductionFactor = 1 - (replacedKm / 50) * 0.45;
      simulatedLeakLps *= reductionFactor;
    }

    if (activeScenario === 'acoustic_ami' || activeScenario === 'combined') {
      // Faster detection reduces average run-time of burst leaks by 50%
      simulatedLeakLps *= 1 - (amiCoveragePct / 100) * 0.22;
    }

    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      baselinePressure: parseFloat(baselinePressure.toFixed(2)),
      simulatedPressure: parseFloat(simulatedPressure.toFixed(2)),
      baselineLeakLps: parseFloat(baselineLeakLps.toFixed(1)),
      simulatedLeakLps: parseFloat(simulatedLeakLps.toFixed(1)),
      waterSavedLps: parseFloat(Math.max(0, baselineLeakLps - simulatedLeakLps).toFixed(1)),
    };
  });

  // Aggregate 24-hr metrics
  const totalBaselineLeakL = simulationData.reduce((acc, curr) => acc + curr.baselineLeakLps * 3600, 0);
  const totalSimulatedLeakL = simulationData.reduce((acc, curr) => acc + curr.simulatedLeakLps * 3600, 0);
  const dailyWaterSavedML = (totalBaselineLeakL - totalSimulatedLeakL) / 1000000;
  const annualWaterSavedML = dailyWaterSavedML * 365;

  // Financial & Environmental benefits
  const tariffPerKl = 8.5; // INR
  const annualFinancialSavingsLakh = (annualWaterSavedML * 1000 * tariffPerKl) / 100000;
  // Energy saved: pumping 1 ML of water in Bangalore requires ~450 kWh of electricity (Cauvery lift)
  const annualEnergySavedMWh = (annualWaterSavedML * 450) / 1000;
  // Carbon offset: ~0.82 kg CO2 per kWh in Indian grid
  const co2OffsetTonnes = (annualEnergySavedMWh * 1000 * 0.82) / 1000;

  return (
    <div className="p-6 min-h-screen" style={{ background: 'linear-gradient(135deg, #020b18, #031629)' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-cyan-500/10 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight">Hydraulic Sandbox & What-If Simulator</h1>
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
              style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}
            >
              FAVAD HYDRAULIC MODELING
            </span>
          </div>
          <p className="text-xs text-blue-300/80 mt-1">
            Simulate pressure management, trunk pipe rehabilitation, and AMI acoustic sensor deployment on 24-hour diurnal curves.
          </p>
        </div>

        {/* Quick Scenario Selector Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'prv', label: '1. Night PRV Modulation', icon: '🎛️' },
            { id: 'pipe_replacement', label: '2. Trunk Main Rehab', icon: '🛠️' },
            { id: 'acoustic_ami', label: '3. Acoustic AMI Rollout', icon: '📡' },
            { id: 'combined', label: '4. Combined Intervention', icon: '⚡' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveScenario(s.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeScenario === s.id
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                  : 'bg-blue-950/40 text-blue-300 border border-blue-900/40 hover:bg-blue-900/30'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="text-[10px] font-semibold text-blue-400 uppercase">Simulated Water Saved</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {dailyWaterSavedML.toFixed(2)} <span className="text-xs font-normal">ML/day</span>
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">{annualWaterSavedML.toFixed(1)} ML / year</div>
        </div>

        <div className="glass-card p-4">
          <div className="text-[10px] font-semibold text-blue-400 uppercase">Annual Financial Savings</div>
          <div className="text-2xl font-black text-cyan-400 mt-1">
            ₹{annualFinancialSavingsLakh.toFixed(1)} <span className="text-xs font-normal">Lakh</span>
          </div>
          <div className="text-[10px] text-cyan-300/80 mt-0.5">Recurring OPEX recovery</div>
        </div>

        <div className="glass-card p-4">
          <div className="text-[10px] font-semibold text-blue-400 uppercase">Pumping Energy Conserved</div>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {annualEnergySavedMWh.toFixed(1)} <span className="text-xs font-normal">MWh</span>
          </div>
          <div className="text-[10px] text-amber-300/80 mt-0.5">Avoided head lift loss</div>
        </div>

        <div className="glass-card p-4">
          <div className="text-[10px] font-semibold text-blue-400 uppercase">Carbon Emission Avoided</div>
          <div className="text-2xl font-black text-emerald-300 mt-1">
            {co2OffsetTonnes.toFixed(1)} <span className="text-xs font-normal">Tons CO₂</span>
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">ESG / Clean Water Index</div>
        </div>
      </div>

      {/* Main Charts & Controls Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Controls Panel (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="glass-card p-5 space-y-4">
            <div className="text-xs font-bold text-cyan-400 tracking-wider">SCENARIO TUNING CONTROLS</div>

            {/* PRV Target Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-200">Night Pressure Target (01:00 - 05:00)</span>
                <span className="text-cyan-400 font-mono font-bold">{prvTargetBar.toFixed(2)} bar</span>
              </div>
              <input
                type="range"
                min="1.2"
                max="3.0"
                step="0.1"
                value={prvTargetBar}
                onChange={(e) => setPrvTargetBar(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <p className="text-[10px] text-blue-400/70 mt-1">
                Lowering excess night pressure from 3.4 to {prvTargetBar} bar prevents micro-fissure expansion.
              </p>
            </div>

            {/* Pipe Replacement Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-200">Replaced Trunk Pipe Length</span>
                <span className="text-emerald-400 font-mono font-bold">{replacedKm.toFixed(1)} km</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="30.0"
                step="0.5"
                value={replacedKm}
                onChange={(e) => setReplacedKm(parseFloat(e.target.value))}
                className="w-full accent-emerald-400"
              />
              <p className="text-[10px] text-blue-400/70 mt-1">
                Replacing aged Asbestos/Cast-Iron segments (P-103, P-104) with modern Ductile Iron.
              </p>
            </div>

            {/* AMI Acoustic Sensor Coverage Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-200">Acoustic Smart AMI Sensor Coverage</span>
                <span className="text-amber-400 font-mono font-bold">{amiCoveragePct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={amiCoveragePct}
                onChange={(e) => setAmiCoveragePct(parseInt(e.target.value))}
                className="w-full accent-amber-400"
              />
              <p className="text-[10px] text-blue-400/70 mt-1">
                Accelerates Mean Time To Detect (MTTD) from 18 days to 4.2 hours.
              </p>
            </div>
          </div>

          {/* Theoretical Model Reference */}
          <div className="glass-card p-4 text-xs space-y-2">
            <div className="font-bold text-cyan-300">Physics & Mathematical Engine:</div>
            <div className="font-mono text-[11px] p-2 rounded-lg bg-blue-950/60 border border-blue-900/50 text-blue-200">
              Q_leak = C × (P)^N1
            </div>
            <p className="text-[10px] text-blue-300/80 leading-relaxed">
              Implemented using the standard FAVAD (Fixed and Variable Area Discharges) exponent N1 = 1.15 for mixed urban networks.
            </p>
          </div>
        </div>

        {/* 24-Hour Diurnal Curves (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-5">
          {/* Leakage Rate Comparison */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">24-Hour Network Leakage Flow Rate (L/s)</h3>
                <p className="text-xs text-blue-400">Baseline unmanaged leakage vs Optimized scenario</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Baseline Loss
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Simulated Loss
                </span>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulationData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="baseLeakGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff3366" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="simLeakGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff88" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00ff88" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.08)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: '#8bb8d4', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#8bb8d4', fontSize: 10 }} unit=" L/s" />
                  <Tooltip contentStyle={{ background: '#031629', borderColor: 'rgba(0,212,255,0.2)', fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="baselineLeakLps"
                    stroke="#ff3366"
                    strokeWidth={2}
                    fill="url(#baseLeakGrad)"
                    name="Baseline Leakage"
                  />
                  <Area
                    type="monotone"
                    dataKey="simulatedLeakLps"
                    stroke="#00ff88"
                    strokeWidth={2.5}
                    fill="url(#simLeakGrad)"
                    name="Optimized Leakage"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pressure Profile Curve */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                System Pressure Profile (Bar) Across Diurnal Cycle
              </h4>
              <span className="text-xs text-cyan-400 font-mono">Nighttime Reduction: 3.4 → {prvTargetBar} bar</span>
            </div>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulationData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.08)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: '#8bb8d4', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#8bb8d4', fontSize: 9 }} unit=" bar" domain={[1.0, 4.0]} />
                  <Tooltip contentStyle={{ background: '#031629', borderColor: 'rgba(0,212,255,0.2)', fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="baselinePressure"
                    stroke="#ff6b35"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    name="Baseline Pressure"
                  />
                  <Line
                    type="monotone"
                    dataKey="simulatedPressure"
                    stroke="#00d4ff"
                    strokeWidth={2}
                    dot={false}
                    name="PRV Modulated Pressure"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
