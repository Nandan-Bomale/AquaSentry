'use client';
import { useState } from 'react';

interface WorkOrder {
  id: string;
  zone: string;
  segmentId: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  assignedTeam: string;
  leadEngineer: string;
  status: 'DISPATCHED' | 'ON_SITE_SURVEY' | 'EXCAVATING' | 'REPAIR_VERIFIED';
  reportedLeakLpm: number;
  reportedAt: string;
  gpsCoords: string;
  defectCategory: string;
  pipeMaterial: string;
  soilType: string;
}

const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-2024-881',
    zone: 'Rajajinagar (Ward 42)',
    segmentId: 'P-104',
    priority: 'CRITICAL',
    assignedTeam: 'Team Alpha (Fast Response)',
    leadEngineer: 'Suresh Kumar, Assistant Executive Engineer',
    status: 'ON_SITE_SURVEY',
    reportedLeakLpm: 380,
    reportedAt: '45 mins ago',
    gpsCoords: '12.9867° N, 77.5533° E',
    defectCategory: 'Circumferential Fracture',
    pipeMaterial: 'Pit Cast Iron (150mm)',
    soilType: 'Red Loam with Sandy Silt',
  },
  {
    id: 'WO-2024-882',
    zone: 'Jayanagar 4th Block',
    segmentId: 'P-103',
    priority: 'CRITICAL',
    assignedTeam: 'Team Bravo (Acoustic Specialists)',
    leadEngineer: 'Ananya Sharma, Senior Hydrologist',
    status: 'EXCAVATING',
    reportedLeakLpm: 480,
    reportedAt: '2 hours ago',
    gpsCoords: '12.9230° N, 77.5922° E',
    defectCategory: 'Asbestos Cement Rupture',
    pipeMaterial: 'Asbestos Cement (200mm)',
    soilType: 'Clayey Fill',
  },
  {
    id: 'WO-2024-883',
    zone: 'Hebbal Kempapura',
    segmentId: 'P-106',
    priority: 'HIGH',
    assignedTeam: 'Team Charlie (Smart Meter Unit)',
    leadEngineer: 'Rohan Patil, Meter Tech Lead',
    status: 'DISPATCHED',
    reportedLeakLpm: 120,
    reportedAt: '3 hours ago',
    gpsCoords: '13.0352° N, 77.5952° E',
    defectCategory: 'Cluster Zero-Read Anomaly',
    pipeMaterial: 'HDPE Service Saddles',
    soilType: 'Compacted Gravel',
  },
  {
    id: 'WO-2024-884',
    zone: 'Yelahanka Satellite Town',
    segmentId: 'P-105',
    priority: 'MEDIUM',
    assignedTeam: 'Team Delta (General Maintenance)',
    leadEngineer: 'Kavitha Rao, Field Supervisor',
    status: 'DISPATCHED',
    reportedLeakLpm: 95,
    reportedAt: '5 hours ago',
    gpsCoords: '13.1004° N, 77.5963° E',
    defectCategory: 'Valve Gland Packing Leak',
    pipeMaterial: 'Ductile Iron (350mm)',
    soilType: 'Laterite Soil',
  },
];

export default function FieldDispatchPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder>(INITIAL_WORK_ORDERS[0]);

  // Form states for field verification
  const [confirmedLossLpm, setConfirmedLossLpm] = useState<number>(365);
  const [acousticReadingDb, setAcousticReadingDb] = useState<number>(64);
  const [depthOfCoverM, setDepthOfCoverM] = useState<number>(1.4);
  const [isRepaired, setIsRepaired] = useState<boolean>(false);
  const [feedbackNotes, setFeedbackNotes] = useState<string>(
    'Hydrophone detected 340 Hz frequency spike. Excavation revealed longitudinal crack at collar joint. Stainless steel repair clamp installed.'
  );

  const handleVerifyRepair = () => {
    setIsRepaired(true);
    setWorkOrders((prev) =>
      prev.map((wo) =>
        wo.id === selectedOrder.id ? { ...wo, status: 'REPAIR_VERIFIED' as const } : wo
      )
    );
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: 'linear-gradient(135deg, #020b18, #031629)' }}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-cyan-500/10 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight">Field Crew Dispatch & Ground Verification</h1>
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
              style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}
            >
              HUMAN-IN-THE-LOOP ACTIVE LEARNING
            </span>
          </div>
          <p className="text-xs text-blue-300/80 mt-1">
            Dispatch GPS-tracked maintenance squads • Record acoustic verification metrics • Close the AI feedback loop.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>4 Field Squads Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Active Work Order Roster (5 cols) */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="text-xs font-bold text-cyan-400 tracking-wider">ACTIVE DISPATCH TICKETS</div>

          <div className="space-y-3">
            {workOrders.map((wo) => {
              const isSelected = selectedOrder.id === wo.id;
              const isVerified = wo.status === 'REPAIR_VERIFIED';
              return (
                <div
                  key={wo.id}
                  onClick={() => {
                    setSelectedOrder(wo);
                    setIsRepaired(wo.status === 'REPAIR_VERIFIED');
                  }}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/15'
                      : 'border-blue-900/40 bg-blue-950/20 hover:border-blue-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold font-mono text-cyan-300">{wo.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isVerified
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : wo.priority === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {isVerified ? 'VERIFIED & CLOSED' : wo.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-white mb-1">{wo.zone}</div>
                  <div className="text-xs text-blue-300/80 mb-2.5">
                    {wo.defectCategory} • Segment {wo.segmentId}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-blue-400 border-t border-blue-900/40 pt-2">
                    <span>{wo.assignedTeam.split('(')[0]}</span>
                    <span className="text-rose-400 font-bold">{wo.reportedLeakLpm} L/min</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Field Verification & Active Learning Terminal (7 cols) */}
        <div className="col-span-12 lg:col-span-7 space-y-5">
          <div className="glass-card p-6">
            <div className="flex items-start justify-between mb-4 border-b border-cyan-500/15 pb-4">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                  GROUND VERIFICATION TERMINAL
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">{selectedOrder.zone}</h3>
                <div className="text-xs text-blue-300/80 mt-1 flex items-center gap-3">
                  <span>📍 GPS: {selectedOrder.gpsCoords}</span>
                  <span>•</span>
                  <span>Lead: {selectedOrder.leadEngineer.split(',')[0]}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-blue-400">Model Predicted Loss:</span>
                <div className="text-xl font-black text-rose-400 mt-0.5">{selectedOrder.reportedLeakLpm} L/min</div>
              </div>
            </div>

            {/* Field Measurement Form */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Ground Inspection Telemetry Input
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Measured Loss */}
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/50">
                  <div className="text-[10px] text-blue-400 uppercase font-semibold">Field Verified Loss</div>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      value={confirmedLossLpm}
                      onChange={(e) => setConfirmedLossLpm(parseInt(e.target.value) || 0)}
                      className="w-20 bg-blue-900/40 border border-cyan-500/40 rounded px-2 py-0.5 text-white font-bold text-sm"
                    />
                    <span className="text-xs text-blue-300">L/min</span>
                  </div>
                  <div className="text-[9px] text-emerald-400 mt-1">
                    96.1% model concordance
                  </div>
                </div>

                {/* Acoustic Sound Level */}
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/50">
                  <div className="text-[10px] text-blue-400 uppercase font-semibold">Acoustic Intensity</div>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      value={acousticReadingDb}
                      onChange={(e) => setAcousticReadingDb(parseInt(e.target.value) || 0)}
                      className="w-20 bg-blue-900/40 border border-cyan-500/40 rounded px-2 py-0.5 text-white font-bold text-sm"
                    />
                    <span className="text-xs text-blue-300">dBμV</span>
                  </div>
                  <div className="text-[9px] text-blue-400 mt-1">Peak @ 340 Hz</div>
                </div>

                {/* Depth */}
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/50">
                  <div className="text-[10px] text-blue-400 uppercase font-semibold">Excavation Depth</div>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      step="0.1"
                      value={depthOfCoverM}
                      onChange={(e) => setDepthOfCoverM(parseFloat(e.target.value) || 0)}
                      className="w-20 bg-blue-900/40 border border-cyan-500/40 rounded px-2 py-0.5 text-white font-bold text-sm"
                    />
                    <span className="text-xs text-blue-300">meters</span>
                  </div>
                  <div className="text-[9px] text-blue-400 mt-1">{selectedOrder.soilType}</div>
                </div>
              </div>

              {/* Engineering Log Notes */}
              <div>
                <label className="text-xs text-blue-300 font-medium block mb-1">
                  Field Engineer Action Log & Defect Characterization:
                </label>
                <textarea
                  rows={3}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="w-full rounded-xl bg-blue-950/50 border border-blue-900/60 p-3 text-xs text-blue-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Active Learning Feedback Notice */}
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-2.5 text-xs text-blue-300">
                <span className="text-base">🧠</span>
                <div>
                  <span className="text-cyan-300 font-bold">Active Learning Feedback: </span>
                  Submitting this verification immediately updates the Isolation Forest confidence weights and retrains the loss classification matrix for {selectedOrder.zone}.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleVerifyRepair}
                  disabled={isRepaired}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    isRepaired
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black hover:scale-[1.02] shadow-lg shadow-cyan-500/20'
                  }`}
                >
                  <span>{isRepaired ? '✓' : '⚡'}</span>
                  <span>
                    {isRepaired
                      ? 'REPAIR VERIFIED & LOGGED TO ML PIPELINE'
                      : 'CONFIRM PHYSICAL REPAIR & LOG RECOVERED WATER'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
