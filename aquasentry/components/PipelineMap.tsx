'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type Zone = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  households: number;
  nrw: number;
  status: string;
  supply: number;
  pipes_km: number;
};

export type PipeSegment = {
  id: string;
  name: string;
  from: string;
  to: string;
  waypoints: [number, number][]; // Multi-point polyline following actual roads
  diameter: number;
  material: string;
  age: number;
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  flowLps: number;
  pressureBar: number;
  hasLeak: boolean;
  leakRateLpm?: number;
};

interface Props {
  zones: Zone[];
  filterStatus: string;
  showDmaBoundaries: boolean;
  showFlowAnimation: boolean;
  showValves: boolean;
  onSelectZone: (z: Zone | null) => void;
  onSelectPipe: (p: PipeSegment | null) => void;
}

// REALISTIC BANGALORE CORRIDOR PIPE NETWORKS (Follows Outer Ring Rd, Hosur Rd, Bellary Rd, Old Madras Rd)
export const REALISTIC_PIPES: PipeSegment[] = [
  {
    id: 'P-101',
    name: 'Koramangala – Marathahalli Outer Ring Trunk',
    from: 'Z-001',
    to: 'Z-008',
    waypoints: [
      [12.9279, 77.6271], // Koramangala
      [12.9345, 77.6521], // HSR Layout Link
      [12.9421, 77.6782], // Bellandur Junction
      [12.9591, 77.6971], // Marathahalli
    ],
    diameter: 450,
    material: 'Ductile Iron',
    age: 12,
    risk: 'LOW',
    flowLps: 34.2,
    pressureBar: 3.1,
    hasLeak: false,
  },
  {
    id: 'P-102',
    name: 'Marathahalli – Whitefield Tech Feeder',
    from: 'Z-008',
    to: 'Z-002',
    waypoints: [
      [12.9591, 77.6971], // Marathahalli
      [12.9642, 77.7183], // Kundalahalli Gate
      [12.9678, 77.7345], // ITPL Main Rd
      [12.9698, 77.7499], // Whitefield
    ],
    diameter: 350,
    material: 'HDPE',
    age: 7,
    risk: 'LOW',
    flowLps: 26.8,
    pressureBar: 2.9,
    hasLeak: false,
  },
  {
    id: 'P-103',
    name: 'Jayanagar – Koramangala South Corridor (CRITICAL LEAK)',
    from: 'Z-003',
    to: 'Z-001',
    waypoints: [
      [12.9230, 77.5922], // Jayanagar 4th Block
      [12.9248, 77.6045], // South End Circle
      [12.9261, 77.6158], // Dairy Circle Link
      [12.9279, 77.6271], // Koramangala
    ],
    diameter: 200,
    material: 'Asbestos Cement (AC)',
    age: 58,
    risk: 'CRITICAL',
    flowLps: 15.4,
    pressureBar: 2.1,
    hasLeak: true,
    leakRateLpm: 480,
  },
  {
    id: 'P-104',
    name: 'Rajajinagar – West Bangalore Distribution (CRITICAL LEAK)',
    from: 'Z-007',
    to: 'Z-003',
    waypoints: [
      [12.9867, 77.5533], // Rajajinagar
      [12.9682, 77.5621], // Magadi Road Junction
      [12.9491, 77.5742], // Chamarajpet
      [12.9230, 77.5922], // Jayanagar
    ],
    diameter: 150,
    material: 'Pit Cast Iron',
    age: 35,
    risk: 'CRITICAL',
    flowLps: 11.2,
    pressureBar: 1.9,
    hasLeak: true,
    leakRateLpm: 380,
  },
  {
    id: 'P-105',
    name: 'Hesaraghatta Reservoir – Hebbal North Trunk',
    from: 'RESERVOIR',
    to: 'Z-005',
    waypoints: [
      [13.0500, 77.6200], // Reservoir
      [13.0421, 77.6085], // Sahakar Nagar
      [13.0352, 77.5952], // Hebbal Flyover
    ],
    diameter: 600,
    material: 'Mild Steel / Ductile Iron',
    age: 14,
    risk: 'LOW',
    flowLps: 58.6,
    pressureBar: 3.6,
    hasLeak: false,
  },
  {
    id: 'P-106',
    name: 'Hebbal – Yelahanka Northern Feeder',
    from: 'Z-005',
    to: 'Z-004',
    waypoints: [
      [13.0352, 77.5952], // Hebbal
      [13.0642, 77.5955], // Kodigehalli
      [13.0821, 77.5960], // Jakkur
      [13.1004, 77.5963], // Yelahanka
    ],
    diameter: 300,
    material: 'Cast Iron',
    age: 29,
    risk: 'MEDIUM',
    flowLps: 21.5,
    pressureBar: 2.7,
    hasLeak: false,
  },
  {
    id: 'P-107',
    name: 'Koramangala – Electronic City Expressway Main',
    from: 'Z-001',
    to: 'Z-006',
    waypoints: [
      [12.9279, 77.6271], // Koramangala
      [12.9085, 77.6395], // Bommanahalli
      [12.8752, 77.6512], // Kudlu Gate
      [12.8458, 77.6624], // Electronic City
    ],
    diameter: 400,
    material: 'HDPE / DI',
    age: 6,
    risk: 'LOW',
    flowLps: 42.1,
    pressureBar: 3.8,
    hasLeak: false,
  },
  {
    id: 'P-108',
    name: 'Hebbal – Rajajinagar Western Cross-Link',
    from: 'Z-005',
    to: 'Z-007',
    waypoints: [
      [13.0352, 77.5952], // Hebbal
      [13.0125, 77.5742], // Yeshwanthpur Junction
      [12.9867, 77.5533], // Rajajinagar
    ],
    diameter: 250,
    material: 'Cast Iron',
    age: 26,
    risk: 'HIGH',
    flowLps: 18.2,
    pressureBar: 2.3,
    hasLeak: false,
  },
];

// REALISTIC DISTRICT METERED AREA (DMA) POLYGONS
const DMA_BOUNDARIES: Record<string, [number, number][]> = {
  'Z-001': [ // Koramangala
    [12.940, 77.615], [12.942, 77.638], [12.920, 77.645], [12.915, 77.620], [12.925, 77.610]
  ],
  'Z-002': [ // Whitefield
    [12.982, 77.735], [12.985, 77.765], [12.955, 77.770], [12.952, 77.738]
  ],
  'Z-003': [ // Jayanagar
    [12.935, 77.580], [12.936, 77.605], [12.910, 77.608], [12.908, 77.582]
  ],
  'Z-004': [ // Yelahanka
    [13.115, 77.580], [13.118, 77.612], [13.085, 77.615], [13.082, 77.585]
  ],
  'Z-005': [ // Hebbal
    [13.050, 77.580], [13.052, 77.612], [13.020, 77.615], [13.018, 77.582]
  ],
  'Z-006': [ // Electronic City
    [12.860, 77.650], [12.862, 77.680], [12.830, 77.682], [12.828, 77.652]
  ],
  'Z-007': [ // Rajajinagar
    [13.000, 77.540], [13.002, 77.568], [12.970, 77.570], [12.968, 77.542]
  ],
  'Z-008': [ // Marathahalli
    [12.972, 77.685], [12.975, 77.712], [12.945, 77.715], [12.942, 77.688]
  ],
};

// PUMPING & PRV CONTROL ASSETS
const CONTROL_ASSETS = [
  { id: 'PRV-1', name: 'Dairy Circle PRV Station', lat: 12.9261, lng: 77.6158, type: 'PRV', pressureIn: 3.4, pressureOut: 2.1 },
  { id: 'PRV-2', name: 'Magadi Rd Pressure Governor', lat: 12.9682, lng: 77.5621, type: 'PRV', pressureIn: 3.1, pressureOut: 1.9 },
  { id: 'PS-1',  name: 'Yeshwanthpur Booster Station', lat: 13.0125, lng: 77.5742, type: 'PUMP', flowLps: 85.0 },
  { id: 'PS-2',  name: 'Bellandur Lift Pump Station', lat: 12.9421, lng: 77.6782, type: 'PUMP', flowLps: 110.0 },
];

export default function PipelineMap({
  zones,
  filterStatus,
  showDmaBoundaries,
  showFlowAnimation,
  showValves,
  onSelectZone,
  onSelectPipe,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map with ESRI Dark Canvas Tile (Clean, No Watermark, No API Key Required)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered on Central Bangalore with ideal zoom level
    const map = L.map(mapContainerRef.current, {
      center: [12.9716, 77.615],
      zoom: 11.5,
      zoomControl: false,
      attributionControl: true,
    });

    // Custom sleek zoom control in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // ESRI Dark Gray Canvas: High-tech, dark, professional SCADA GIS basemap
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16,
        minZoom: 10,
      }
    ).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Network Overlays whenever filters or props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. DMA BOUNDARIES (Clean subtle polygon highlights - not 40km overlapping discs!)
    if (showDmaBoundaries) {
      zones.forEach((z) => {
        if (filterStatus !== 'ALL' && z.status !== filterStatus) return;

        const coords = DMA_BOUNDARIES[z.id];
        if (!coords) return;

        const color = z.status === 'CRITICAL' ? '#ff3366' : z.status === 'WARNING' ? '#ff6b35' : '#00ff88';

        const polygon = L.polygon(coords, {
          color: color,
          weight: 1.5,
          opacity: 0.75,
          fillColor: color,
          fillOpacity: z.status === 'CRITICAL' ? 0.14 : 0.06,
          dashArray: z.status === 'CRITICAL' ? '4, 4' : undefined,
        });

        polygon.on('click', () => onSelectZone(z));
        polygon.bindTooltip(
          `<b>${z.name} DMA</b><br>NRW: ${z.nrw}% • ${z.households.toLocaleString()} connections`,
          { className: 'scada-tooltip', sticky: true }
        );

        polygon.addTo(group);
      });
    }

    // 2. REALISTIC TRANSMISSION & DISTRIBUTION PIPES
    REALISTIC_PIPES.forEach((pipe) => {
      const isCritical = pipe.risk === 'CRITICAL';
      const isHigh = pipe.risk === 'HIGH';
      const pipeColor = isCritical ? '#ff3366' : isHigh ? '#ff6b35' : pipe.risk === 'MEDIUM' ? '#ffd700' : '#00d4ff';

      // Outer metallic pipe sleeve
      const outerSleeve = L.polyline(pipe.waypoints, {
        color: '#081c2f',
        weight: pipe.diameter > 400 ? 9 : pipe.diameter > 250 ? 7 : 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      });
      outerSleeve.addTo(group);

      // Inner fluid core with neon glow
      const fluidCore = L.polyline(pipe.waypoints, {
        color: pipeColor,
        weight: pipe.diameter > 400 ? 4.5 : pipe.diameter > 250 ? 3.5 : 2.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });
      fluidCore.addTo(group);

      // Flow direction moving pulse if enabled
      if (showFlowAnimation) {
        const flowPulse = L.polyline(pipe.waypoints, {
          color: '#ffffff',
          weight: 1.5,
          opacity: 0.6,
          dashArray: '6, 14',
          className: 'pipe-flow-pulse',
        });
        flowPulse.addTo(group);
      }

      // Interaction
      fluidCore.on('click', () => onSelectPipe(pipe));
      fluidCore.on('mouseover', () => {
        fluidCore.setStyle({ weight: 6, opacity: 1 });
      });
      fluidCore.on('mouseout', () => {
        fluidCore.setStyle({
          weight: pipe.diameter > 400 ? 4.5 : pipe.diameter > 250 ? 3.5 : 2.5,
          opacity: 0.95,
        });
      });

      fluidCore.bindTooltip(
        `<div style="font-family:Inter,sans-serif;padding:2px">
          <div style="font-weight:800;color:${pipeColor};font-size:11px">${pipe.id}: ${pipe.name}</div>
          <div style="color:#c8e0f0;font-size:10px;margin-top:2px">
            Ø${pipe.diameter}mm ${pipe.material} • <b>${pipe.flowLps} L/s</b> @ ${pipe.pressureBar} bar
          </div>
          ${pipe.hasLeak ? `<div style="color:#ff3366;font-weight:bold;font-size:10px;margin-top:2px">⚠️ Confirmed Burst: ${pipe.leakRateLpm} L/min Loss</div>` : ''}
        </div>`,
        { className: 'scada-tooltip', sticky: true }
      );

      // 3. ACTIVE LEAK HOTSPOT RADAR BEACONS
      if (pipe.hasLeak) {
        // Place beacon near the center waypoint
        const leakPt = pipe.waypoints[Math.floor(pipe.waypoints.length / 2)];

        const leakIcon = L.divIcon({
          className: '',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-10 h-10 rounded-full bg-rose-500/30 animate-ping"></div>
              <div class="absolute w-6 h-6 rounded-full bg-rose-500/50 animate-pulse"></div>
              <div class="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-lg flex items-center justify-center">
                <span style="font-size:7px;color:white;font-weight:900">!</span>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const leakMarker = L.marker(leakPt, { icon: leakIcon }).addTo(group);
        leakMarker.on('click', () => onSelectPipe(pipe));
        leakMarker.bindTooltip(
          `<div style="color:#ff3366;font-weight:900;font-size:11px">⚠️ UNRESOLVED PIPE BURST (${pipe.id})</div>
           <div style="font-size:10px;color:white">Loss Rate: <b>${pipe.leakRateLpm} L/min</b></div>
           <div style="font-size:9px;color:#8bb8d4">Click to inspect in 3D Digital Twin</div>`,
          { className: 'scada-tooltip' }
        );
      }
    });

    // 4. RESERVOIR NODE (Hesaraghatta)
    const reservoirIcon = L.divIcon({
      className: '',
      html: `
        <div style="
          background: rgba(3, 22, 41, 0.9);
          border: 1.5px solid #00d4ff;
          border-radius: 8px;
          padding: 3px 8px;
          display: flex;
          align-items: center;
          gap: 5px;
          box-shadow: 0 0 14px rgba(0,212,255,0.4);
          white-space: nowrap;
        ">
          <span style="font-size:13px">🏛️</span>
          <div>
            <div style="font-size:9px;font-weight:900;color:#00d4ff;letter-spacing:0.5px">HESARAGHATTA RESERVOIR</div>
            <div style="font-size:8px;color:#8bb8d4">CAPACITY: 450 ML • HEAD: 4.2 BAR</div>
          </div>
        </div>
      `,
      iconAnchor: [80, 16],
    });
    L.marker([13.0500, 77.6200], { icon: reservoirIcon }).addTo(group);

    // 5. CONTROL ASSETS (PRVs and Pumps)
    if (showValves) {
      CONTROL_ASSETS.forEach((ca) => {
        const isPrv = ca.type === 'PRV';
        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              background: rgba(2, 11, 24, 0.88);
              border: 1px solid ${isPrv ? '#ffd700' : '#00ff88'};
              border-radius: 6px;
              padding: 2px 5px;
              font-family: monospace;
              font-size: 8px;
              font-weight: bold;
              color: ${isPrv ? '#ffd700' : '#00ff88'};
              box-shadow: 0 0 8px ${isPrv ? 'rgba(255,215,0,0.3)' : 'rgba(0,255,136,0.3)'};
              white-space: nowrap;
            ">
              ${isPrv ? '⚙️ PRV' : '⚡ PUMP'} ${ca.id}
            </div>
          `,
          iconAnchor: [30, 10],
        });
        const marker = L.marker([ca.lat, ca.lng], { icon }).addTo(group);
        marker.bindTooltip(
          `<b>${ca.name}</b><br>${isPrv ? `Modulation: ${ca.pressureIn} → ${ca.pressureOut} bar` : `Rating: ${ca.flowLps} L/s`}`,
          { className: 'scada-tooltip' }
        );
      });
    }

    // 6. ZONE NODES (Clean, compact, futuristic pins)
    zones.forEach((z) => {
      if (filterStatus !== 'ALL' && z.status !== filterStatus) return;

      const isCritical = z.status === 'CRITICAL';
      const color = isCritical ? '#ff3366' : z.status === 'WARNING' ? '#ff6b35' : '#00ff88';

      const zoneIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            background: rgba(4, 25, 46, 0.92);
            border: 1.5px solid ${color};
            border-radius: 10px;
            padding: 3px 8px;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 0 12px ${color}50;
            cursor: pointer;
            white-space: nowrap;
          ">
            <span style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: ${color};
              box-shadow: 0 0 6px ${color};
              display: inline-block;
            "></span>
            <div>
              <div style="font-size:10px;font-weight:900;color:#ffffff;line-height:1.2">${z.name}</div>
              <div style="font-size:8px;font-weight:700;color:${color};line-height:1">NRW: ${z.nrw}%</div>
            </div>
          </div>
        `,
        iconAnchor: [45, 15],
      });

      const marker = L.marker([z.lat, z.lng], { icon: zoneIcon }).addTo(group);
      marker.on('click', () => onSelectZone(z));
    });
  }, [zones, filterStatus, showDmaBoundaries, showFlowAnimation, showValves, onSelectZone, onSelectPipe]);

  return (
    <div className="relative w-full h-full bg-[#020b18]">
      <div ref={mapContainerRef} className="w-full h-full" style={{ background: '#040d1a' }} />

      {/* Global CSS for Leaflet Tooltips & Flow Pulse */}
      <style jsx global>{`
        .scada-tooltip {
          background: rgba(3, 22, 41, 0.95) !important;
          border: 1px solid rgba(0, 212, 255, 0.4) !important;
          color: #e8f4fd !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
          font-family: 'Inter', sans-serif !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
        }
        .scada-tooltip::before {
          border-top-color: rgba(3, 22, 41, 0.95) !important;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -40;
          }
        }
        .pipe-flow-pulse {
          animation: dash 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
