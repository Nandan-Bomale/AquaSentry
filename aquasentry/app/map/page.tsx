'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { REALISTIC_PIPES, PipeSegment, Zone } from '@/components/PipelineMap';

const PipelineMap = dynamic(() => import('@/components/PipelineMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#020b18]">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-spin">⚙️</div>
        <div className="text-cyan-400 font-bold text-sm tracking-widest uppercase">
          Initializing Bangalore SCADA GIS Network...
        </div>
        <div className="text-xs text-blue-400/60 mt-1">Loading 450 km pipeline topology</div>
      </div>
    </div>
  ),
});

const ZONES_DATA: Zone[] = [
  { id: 'Z-001', name: 'Koramangala', lat: 12.9279, lng: 77.6271, households: 12400, nrw: 14.2, status: 'WARNING', supply: 1860000, pipes_km: 48.2 },
  { id: 'Z-002', name: 'Whitefield', lat: 12.9698, lng: 77.7499, households: 18700, nrw: 10.1, status: 'NORMAL', supply: 2805000, pipes_km: 72.5 },
  { id: 'Z-003', name: 'Jayanagar', lat: 12.9230, lng: 77.5922, households: 9800, nrw: 31.8, status: 'CRITICAL', supply: 1470000, pipes_km: 38.1 },
  { id: 'Z-004', name: 'Yelahanka', lat: 13.1004, lng: 77.5963, households: 15200, nrw: 22.4, status: 'WARNING', supply: 2280000, pipes_km: 61.8 },
  { id: 'Z-005', name: 'Hebbal', lat: 13.0352, lng: 77.5952, households: 11100, nrw: 28.6, status: 'CRITICAL', supply: 1665000, pipes_km: 44.3 },
  { id: 'Z-006', name: 'Electronic City', lat: 12.8458, lng: 77.6624, households: 22000, nrw: 9.4, status: 'NORMAL', supply: 3300000, pipes_km: 88.0 },
  { id: 'Z-007', name: 'Rajajinagar', lat: 12.9867, lng: 77.5533, households: 8900, nrw: 38.2, status: 'CRITICAL', supply: 1335000, pipes_km: 35.6 },
  { id: 'Z-008', name: 'Marathahalli', lat: 12.9591, lng: 77.6971, households: 16500, nrw: 13.7, status: 'WARNING', supply: 2475000, pipes_km: 66.0 },
];

export default function MapPage() {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedPipe, setSelectedPipe] = useState<PipeSegment | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showDmaBoundaries, setShowDmaBoundaries] = useState<boolean>(true);
  const [showFlowAnimation, setShowFlowAnimation] = useState<boolean>(true);
  const [showValves, setShowValves] = useState<boolean>(true);

  return (
    <div className="flex flex-col h-screen bg-[#020b18] overflow-hidden text-slate-100">
      {/* Top SCADA Control Header */}
      <div className="flex flex-wrap items-center justify-between px-6 py-3.5 border-b border-cyan-500/15 bg-[#031629]/95 backdrop-blur-md z-30 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-black text-white tracking-tight">Bangalore GIS Pipeline Command Map</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              450.8 KM TRANSMISSION GRID
            </span>
          </div>
          <p className="text-[11px] text-blue-300/70 mt-0.5">
            Real-time hydrodynamic network topology • Pressure gradients • Active acoustic leak beacons
          </p>
        </div>

        {/* Filter & Layer Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter Buttons */}
          <div className="flex rounded-xl p-1 bg-blue-950/60 border border-blue-900/50">
            {(['ALL', 'CRITICAL', 'WARNING', 'NORMAL'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  filterStatus === s
                    ? s === 'CRITICAL'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : s === 'WARNING'
                      ? 'bg-amber-500 text-black shadow-sm'
                      : s === 'NORMAL'
                      ? 'bg-emerald-500 text-black shadow-sm'
                      : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-sm'
                    : 'text-blue-300 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-cyan-500/20 hidden md:block" />

          {/* Layer Checkboxes */}
          <div className="flex items-center gap-4 text-xs text-blue-300 font-medium">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showDmaBoundaries}
                onChange={(e) => setShowDmaBoundaries(e.target.checked)}
                className="accent-cyan-400 rounded"
              />
              <span>DMA Polygons</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showFlowAnimation}
                onChange={(e) => setShowFlowAnimation(e.target.checked)}
                className="accent-cyan-400 rounded"
              />
              <span>Fluid Vectors</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showValves}
                onChange={(e) => setShowValves(e.target.checked)}
                className="accent-cyan-400 rounded"
              />
              <span>PRVs & Pumps</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Map Content + Overlay Panels */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Leaflet Map Canvas */}
        <div className="flex-1 relative">
          <PipelineMap
            zones={ZONES_DATA}
            filterStatus={filterStatus}
            showDmaBoundaries={showDmaBoundaries}
            showFlowAnimation={showFlowAnimation}
            showValves={showValves}
            onSelectZone={(z) => {
              setSelectedZone(z);
              setSelectedPipe(null);
            }}
            onSelectPipe={(p) => {
              setSelectedPipe(p);
              setSelectedZone(null);
            }}
          />

          {/* Floating SCADA Map Legend (Bottom-Left) */}
          <div className="absolute bottom-5 left-5 glass-card p-3.5 z-[1000] text-xs pointer-events-auto border border-cyan-500/25 bg-[#031629]/90 shadow-2xl backdrop-blur-md">
            <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>SCADA Network Legend</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-4 h-1.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
                <span className="text-blue-200">Critical Trunk (&gt;25% Loss Risk)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50"></span>
                <span className="text-blue-200">Main Distribution Line (Normal)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
                <span className="text-rose-400 font-semibold">Active Acoustic Leak Hotspot</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] border border-amber-500/30">
                  PRV
                </span>
                <span className="text-blue-200">Pressure Reducing Valve Station</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded border border-cyan-400 bg-cyan-400/20"></span>
                <span className="text-blue-200">District Metered Area (DMA)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Inspection & Telemetry Drawer (340px) */}
        <div className="w-88 border-l border-cyan-500/15 bg-[#031629]/95 backdrop-blur-xl flex flex-col z-20 shadow-2xl">
          {/* Header of Drawer */}
          <div className="p-4 border-b border-cyan-500/10 flex items-center justify-between">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              {selectedPipe ? 'ASSET TELEMETRY' : selectedZone ? 'DMA PROFILE' : 'ZONE SUMMARY'}
            </div>
            {(selectedPipe || selectedZone) && (
              <button
                onClick={() => {
                  setSelectedPipe(null);
                  setSelectedZone(null);
                }}
                className="text-xs text-blue-400 hover:text-white px-2 py-0.5 rounded bg-blue-950/60"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* 1. Pipe Segment Details if clicked */}
            {selectedPipe ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-blue-950/40 border border-cyan-500/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-cyan-300 font-bold">{selectedPipe.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedPipe.risk === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {selectedPipe.risk} RISK
                    </span>
                  </div>
                  <div className="font-bold text-white text-sm mt-1">{selectedPipe.name}</div>
                </div>

                {selectedPipe.hasLeak && (
                  <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 space-y-1">
                    <div className="text-rose-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <span>CRITICAL PIPE BURST DETECTED</span>
                    </div>
                    <div className="text-lg font-black text-white mt-1">
                      {selectedPipe.leakRateLpm} <span className="text-xs font-normal text-rose-400">L/min loss</span>
                    </div>
                    <p className="text-[11px] text-rose-200/80">
                      Minimum Night Flow analysis confirmed 3.1x baseline spike. Requires emergency intervention.
                    </p>
                  </div>
                )}

                {/* Specs */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Physical Specifications</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/40">
                      <span className="text-blue-400 block text-[10px]">Diameter</span>
                      <span className="text-white font-bold font-mono">Ø {selectedPipe.diameter} mm</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/40">
                      <span className="text-blue-400 block text-[10px]">Material</span>
                      <span className="text-white font-bold">{selectedPipe.material}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/40">
                      <span className="text-blue-400 block text-[10px]">Flow Rate</span>
                      <span className="text-cyan-400 font-bold font-mono">{selectedPipe.flowLps} L/s</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/40">
                      <span className="text-blue-400 block text-[10px]">Pressure</span>
                      <span className="text-cyan-400 font-bold font-mono">{selectedPipe.pressureBar} bar</span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Links */}
                <div className="space-y-2 pt-2">
                  <Link
                    href="/digital-twin"
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-center block hover:scale-[1.02] transition-transform shadow-lg shadow-cyan-500/20"
                  >
                    🔬 Inspect in 3D Digital Twin →
                  </Link>
                  <Link
                    href="/field-dispatch"
                    className="w-full py-2.5 px-3 rounded-xl bg-blue-950/60 border border-blue-800 text-cyan-300 font-bold text-center block hover:bg-blue-900/40 transition-colors"
                  >
                    👷 Dispatch Field Crew
                  </Link>
                </div>
              </div>
            ) : selectedZone ? (
              /* 2. Zone Profile */
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-blue-950/40 border border-cyan-500/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-cyan-300 font-bold">{selectedZone.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedZone.status === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : selectedZone.status === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {selectedZone.status}
                    </span>
                  </div>
                  <div className="font-bold text-white text-base mt-1">{selectedZone.name} DMA</div>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/40">
                    <span className="text-blue-400 block text-[10px]">NRW Loss</span>
                    <span
                      className="text-lg font-black font-mono"
                      style={{ color: selectedZone.nrw > 25 ? '#ff3366' : '#00ff88' }}
                    >
                      {selectedZone.nrw}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/40">
                    <span className="text-blue-400 block text-[10px]">Households</span>
                    <span className="text-lg font-black text-white font-mono">
                      {selectedZone.households.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/40">
                    <span className="text-blue-400 block text-[10px]">Daily Input</span>
                    <span className="text-sm font-bold text-cyan-400 font-mono">
                      {(selectedZone.supply / 1000000).toFixed(2)} MLD
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/40">
                    <span className="text-blue-400 block text-[10px]">Network Length</span>
                    <span className="text-sm font-bold text-white font-mono">{selectedZone.pipes_km} km</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Link
                    href="/priority"
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-center block hover:scale-[1.02] transition-transform shadow-lg shadow-cyan-500/20"
                  >
                    🎯 View Multi-Factor Priority Rank
                  </Link>
                  <Link
                    href="/simulation"
                    className="w-full py-2.5 px-3 rounded-xl bg-blue-950/60 border border-blue-800 text-cyan-300 font-bold text-center block hover:bg-blue-900/40 transition-colors"
                  >
                    🧪 Simulate PRV Pressure Reduction
                  </Link>
                </div>
              </div>
            ) : (
              /* 3. Default Overview List */
              <div className="space-y-3">
                <div className="text-[11px] text-blue-300/80">
                  Click any pipe corridor or zone pin to inspect physical telemetry.
                </div>
                <div className="space-y-2">
                  {ZONES_DATA.map((z) => (
                    <div
                      key={z.id}
                      onClick={() => setSelectedZone(z)}
                      className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white text-xs">{z.name}</div>
                        <div className="text-[10px] text-blue-400">{z.households.toLocaleString()} consumers</div>
                      </div>
                      <div className="text-right">
                        <div
                          className="font-black text-xs font-mono"
                          style={{ color: z.nrw > 25 ? '#ff3366' : z.nrw > 15 ? '#ff6b35' : '#00ff88' }}
                        >
                          {z.nrw}% NRW
                        </div>
                        <div className="text-[9px] text-blue-400/80">{(z.supply / 1000000).toFixed(1)} MLD</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
