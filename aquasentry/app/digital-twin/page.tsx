'use client';
import { useEffect, useRef, useState } from 'react';

interface PipeModel {
  id: string;
  name: string;
  material: string;
  diameterMm: number;
  nominalThicknessMm: number;
  ageYears: number;
  basePressureBar: number;
  flowMps: number;
  defaultDefect: 'none' | 'pinhole' | 'crack' | 'joint';
  zone: string;
}

const PIPE_OPTIONS: PipeModel[] = [
  {
    id: 'P-103',
    name: 'Jayanagar Trunk Main (Segment P-103)',
    material: 'Asbestos Cement (AC)',
    diameterMm: 200,
    nominalThicknessMm: 14.5,
    ageYears: 58,
    basePressureBar: 2.1,
    flowMps: 1.45,
    defaultDefect: 'crack',
    zone: 'Zone 3 (Jayanagar)',
  },
  {
    id: 'P-104',
    name: 'Rajajinagar Feed Line (Segment P-104)',
    material: 'Pit Cast Iron (CI)',
    diameterMm: 150,
    nominalThicknessMm: 12.0,
    ageYears: 35,
    basePressureBar: 1.9,
    flowMps: 1.15,
    defaultDefect: 'pinhole',
    zone: 'Zone 7 (Rajajinagar)',
  },
  {
    id: 'P-101',
    name: 'Koramangala-Whitefield Interlink (P-101)',
    material: 'Grey Cast Iron',
    diameterMm: 300,
    nominalThicknessMm: 16.0,
    ageYears: 42,
    basePressureBar: 2.8,
    flowMps: 1.82,
    defaultDefect: 'joint',
    zone: 'Zone 1 (Koramangala)',
  },
  {
    id: 'P-105',
    name: 'Hebbal Distribution Feeder (P-105)',
    material: 'Ductile Iron (DI)',
    diameterMm: 350,
    nominalThicknessMm: 13.5,
    ageYears: 15,
    basePressureBar: 3.4,
    flowMps: 2.1,
    defaultDefect: 'none',
    zone: 'Zone 5 (Hebbal)',
  },
];

export default function DigitalTwinPage() {
  const [selectedPipe, setSelectedPipe] = useState<PipeModel>(PIPE_OPTIONS[0]);
  const [pressure, setPressure] = useState<number>(PIPE_OPTIONS[0].basePressureBar);
  const [flowVelocity, setFlowVelocity] = useState<number>(PIPE_OPTIONS[0].flowMps);
  const [defectType, setDefectType] = useState<'none' | 'pinhole' | 'crack' | 'joint'>(PIPE_OPTIONS[0].defaultDefect);
  const [corrosionPct, setCorrosionPct] = useState<number>(55);
  const [audioListening, setAudioListening] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  // Update parameters when selected pipe changes
  useEffect(() => {
    setPressure(selectedPipe.basePressureBar);
    setFlowVelocity(selectedPipe.flowMps);
    setDefectType(selectedPipe.defaultDefect);
    setCorrosionPct(selectedPipe.ageYears > 50 ? 68 : selectedPipe.ageYears > 30 ? 45 : 15);
  }, [selectedPipe]);

  // Web Audio acoustic synthesis for leak listening
  useEffect(() => {
    if (audioListening && defectType !== 'none') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        // White noise buffer for water rushing sound + bandpass filter for leak resonance
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        // Leaks emit around 300-800Hz depending on pressure and diameter
        filter.frequency.value = 320 + pressure * 70;
        filter.Q.value = 4.0;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.25;

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        whiteNoise.start();

        audioSourceRef.current = { osc: whiteNoise as any, gain: gainNode };
      } catch (e) {
        console.error('Audio initialization error:', e);
      }
    } else {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [audioListening, defectType, pressure]);

  // Main Canvas Fluid & Structural Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    // Particle flow system inside the pipe lumen
    interface FlowParticle {
      x: number;
      yRatio: number; // 0 (top wall) to 1 (bottom wall)
      size: number;
      opacity: number;
      speedMult: number;
    }

    const particles: FlowParticle[] = Array.from({ length: 90 }, () => ({
      x: Math.random() * 800,
      yRatio: Math.random(),
      size: Math.random() * 2.5 + 1.2,
      opacity: Math.random() * 0.6 + 0.3,
      speedMult: Math.random() * 0.4 + 0.8,
    }));

    // Spray particles if leak exists
    interface SprayParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
    }
    const sprayParticles: SprayParticle[] = [];

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      // Pipe geometry in canvas coordinates
      const pipeTop = h * 0.3;
      const pipeBottom = h * 0.7;
      const pipeHeight = pipeBottom - pipeTop;
      const wallThickness = 22;

      // Outer background / soil environment
      const soilGrad = ctx.createLinearGradient(0, 0, 0, h);
      soilGrad.addColorStop(0, '#040d1a');
      soilGrad.addColorStop(0.3, '#06162a');
      soilGrad.addColorStop(0.7, '#06162a');
      soilGrad.addColorStop(1, '#040d1a');
      ctx.fillStyle = soilGrad;
      ctx.fillRect(0, 0, w, h);

      // Soil strata texture lines
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let y = 20; y < h; y += 35) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y + Math.sin(y + tick * 0.02) * 4);
        ctx.stroke();
      }

      // --- 1. Pipe Outer Wall (Metallic / Cement casing) ---
      const outerWallColor =
        selectedPipe.material.includes('Asbestos')
          ? '#5a6d7c'
          : selectedPipe.material.includes('Ductile')
          ? '#2c4b63'
          : '#3d4f5d';

      // Top Wall
      const topWallGrad = ctx.createLinearGradient(0, pipeTop - wallThickness, 0, pipeTop);
      topWallGrad.addColorStop(0, '#101e2c');
      topWallGrad.addColorStop(0.5, outerWallColor);
      topWallGrad.addColorStop(1, '#0b1622');
      ctx.fillStyle = topWallGrad;
      ctx.fillRect(0, pipeTop - wallThickness, w, wallThickness);

      // Bottom Wall
      const botWallGrad = ctx.createLinearGradient(0, pipeBottom, 0, pipeBottom + wallThickness);
      botWallGrad.addColorStop(0, '#0b1622');
      botWallGrad.addColorStop(0.5, outerWallColor);
      botWallGrad.addColorStop(1, '#101e2c');
      ctx.fillStyle = botWallGrad;
      ctx.fillRect(0, pipeBottom, w, wallThickness);

      // --- 2. Corrosion / Tuberculation internal crust ---
      const corrosionHeight = (corrosionPct / 100) * 9;
      if (corrosionHeight > 0) {
        ctx.fillStyle = selectedPipe.material.includes('Asbestos') ? '#7d7053' : '#7a3e21';
        // Top encrustation
        ctx.beginPath();
        ctx.moveTo(0, pipeTop);
        for (let x = 0; x <= w; x += 15) {
          const rough = Math.sin(x * 0.05 + 1) * Math.cos(x * 0.1) * corrosionHeight;
          ctx.lineTo(x, pipeTop + Math.max(1, rough + corrosionHeight * 0.7));
        }
        ctx.lineTo(w, pipeTop);
        ctx.closePath();
        ctx.fill();

        // Bottom encrustation
        ctx.beginPath();
        ctx.moveTo(0, pipeBottom);
        for (let x = 0; x <= w; x += 15) {
          const rough = Math.cos(x * 0.06 + 2) * Math.sin(x * 0.08) * corrosionHeight;
          ctx.lineTo(x, pipeBottom - Math.max(1, rough + corrosionHeight * 0.7));
        }
        ctx.lineTo(w, pipeBottom);
        ctx.closePath();
        ctx.fill();
      }

      // --- 3. Internal Fluid Lumen (Water flow stream) ---
      const waterGrad = ctx.createLinearGradient(0, pipeTop, 0, pipeBottom);
      waterGrad.addColorStop(0, 'rgba(0, 140, 255, 0.65)');
      waterGrad.addColorStop(0.5, 'rgba(0, 212, 255, 0.85)');
      waterGrad.addColorStop(1, 'rgba(0, 100, 220, 0.65)');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, pipeTop, w, pipeHeight);

      // Fluid streamline velocity vectors (Parabolic flow profile)
      ctx.lineWidth = 1.2;
      for (let r = 0.15; r <= 0.85; r += 0.18) {
        const streamY = pipeTop + pipeHeight * r;
        // Hagen-Poiseuille parabolic profile: faster in center (r=0.5)
        const centerFactor = 1 - 4 * Math.pow(r - 0.5, 2);
        const streamSpeed = flowVelocity * 1.8 * centerFactor;

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 + centerFactor * 0.25})`;
        ctx.beginPath();
        const offset = (tick * streamSpeed * 3) % 40;
        ctx.setLineDash([18, 22]);
        ctx.lineDashOffset = -offset;
        ctx.moveTo(0, streamY);
        ctx.lineTo(w, streamY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // --- 4. Flow Particles ---
      particles.forEach((p) => {
        const centerFactor = 1 - 4 * Math.pow(p.yRatio - 0.5, 2);
        const speed = flowVelocity * 3.5 * (0.4 + centerFactor * 0.9) * p.speedMult;
        p.x += speed;
        if (p.x > w) p.x = 0;

        const py = pipeTop + p.yRatio * pipeHeight;
        ctx.beginPath();
        ctx.arc(p.x, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 245, 255, ${p.opacity * (0.4 + centerFactor * 0.6)})`;
        ctx.fill();
      });

      // --- 5. Defect & Leakage Physics (if defect active) ---
      if (defectType !== 'none') {
        const defectX = w * 0.52;
        const defectY = pipeTop; // top wall rupture

        // Defect hole graphic
        ctx.fillStyle = '#ff1744';
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 12;

        if (defectType === 'pinhole') {
          ctx.beginPath();
          ctx.arc(defectX, defectY, 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (defectType === 'crack') {
          ctx.beginPath();
          ctx.ellipse(defectX, defectY - 2, 24, 5, -0.15, 0, Math.PI * 2);
          ctx.fill();
        } else if (defectType === 'joint') {
          ctx.fillRect(defectX - 8, defectY - wallThickness, 16, wallThickness + 4);
        }
        ctx.shadowBlur = 0;

        // Acoustic Radiation Concentric Waves (Piezo Sensor Visualization)
        const waveCount = 4;
        for (let i = 0; i < waveCount; i++) {
          const waveRadius = ((tick * 1.8 + (i * 120) / waveCount) % 110) + 10;
          const alpha = Math.max(0, 1 - waveRadius / 110) * 0.65;
          ctx.strokeStyle = `rgba(255, 51, 102, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(defectX, defectY, waveRadius, Math.PI, 2 * Math.PI);
          ctx.stroke();
        }

        // High-pressure escaping water jet spray
        const sprayIntensity = pressure * 1.4;
        for (let s = 0; s < 4; s++) {
          sprayParticles.push({
            x: defectX + (Math.random() - 0.5) * 8,
            y: defectY - 2,
            vx: (Math.random() - 0.5) * (sprayIntensity * 2.2),
            vy: -(Math.random() * (sprayIntensity * 4.5) + 3),
            life: 0,
            maxLife: Math.random() * 25 + 15,
          });
        }
      }

      // Update and draw spray particles
      for (let i = sprayParticles.length - 1; i >= 0; i--) {
        const sp = sprayParticles[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.18; // gravity pull
        sp.life++;

        const progress = sp.life / sp.maxLife;
        const alpha = Math.max(0, 1 - progress);

        ctx.fillStyle = `rgba(180, 240, 255, ${alpha * 0.75})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, Math.max(1, 3.5 * (1 - progress)), 0, Math.PI * 2);
        ctx.fill();

        if (sp.life >= sp.maxLife) {
          sprayParticles.splice(i, 1);
        }
      }

      // --- 6. Non-Destructive Testing (NDT) Measurement Overlay HUD ---
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
      ctx.setLineDash([4, 4]);
      // Centerline
      ctx.beginPath();
      ctx.moveTo(10, h * 0.5);
      ctx.lineTo(w - 10, h * 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      // Flow direction arrow
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.moveTo(w - 30, h * 0.5);
      ctx.lineTo(w - 45, h * 0.5 - 8);
      ctx.lineTo(w - 45, h * 0.5 + 8);
      ctx.closePath();
      ctx.fill();

      // HUD Text
      ctx.fillStyle = '#8bb8d4';
      ctx.font = '10px Inter, monospace';
      ctx.fillText(`Ø ${selectedPipe.diameterMm}mm • ${selectedPipe.material}`, 20, pipeTop - wallThickness - 10);
      ctx.fillText(`PRESSURE: ${pressure.toFixed(2)} bar`, 20, pipeBottom + wallThickness + 22);
      ctx.fillText(`VELOCITY: ${flowVelocity.toFixed(2)} m/s`, 180, pipeBottom + wallThickness + 22);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [selectedPipe, pressure, flowVelocity, defectType, corrosionPct]);

  // FFT Acoustic Spectrum Canvas Loop
  useEffect(() => {
    const canvas = fftCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const renderFFT = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      // Draw grid
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const bars = 36;
      const barWidth = (w - 20) / bars;
      const leakActive = defectType !== 'none';
      const peakBin = 14; // ~320Hz peak

      for (let i = 0; i < bars; i++) {
        let barHeight = 0;
        if (leakActive) {
          // Bell curve centered on peakBin
          const dist = Math.abs(i - peakBin);
          const bell = Math.exp(-Math.pow(dist / 3.8, 2));
          const noise = (Math.random() - 0.5) * 8;
          barHeight = (bell * (h * 0.78) + Math.random() * 12 + noise) * (pressure / 2.5);
        } else {
          // Low ambient baseline noise
          barHeight = Math.random() * 14 + 4;
        }

        const x = 10 + i * barWidth;
        const y = h - Math.max(3, barHeight);

        const barColor =
          i >= peakBin - 2 && i <= peakBin + 2 && leakActive
            ? '#ff3366'
            : leakActive
            ? '#00d4ff'
            : '#4a8fa8';

        ctx.fillStyle = barColor;
        ctx.fillRect(x, y, barWidth - 2, Math.max(3, barHeight));
      }

      animId = requestAnimationFrame(renderFFT);
    };

    renderFFT();
    return () => cancelAnimationFrame(animId);
  }, [defectType, pressure]);

  // Hydraulic Calculations
  const areaSqM = Math.PI * Math.pow(selectedPipe.diameterMm / 2000, 2);
  const flowRateLps = flowVelocity * areaSqM * 1000;
  // Reynolds number: Re = (rho * v * D) / mu  (water at 20C: rho=1000, mu=0.001 -> Re = v * D * 1e6)
  const reynoldsNumber = Math.round(flowVelocity * (selectedPipe.diameterMm / 1000) * 1e6);
  // Estimated leak rate using Torricelli: Q = Cd * A * sqrt(2 * g * H)
  const headM = pressure * 10.197; // 1 bar = 10.197 m head
  const defectAreaSqMm = defectType === 'none' ? 0 : defectType === 'pinhole' ? 12 : defectType === 'crack' ? 75 : 120;
  const leakRateLpm =
    defectType === 'none'
      ? 0
      : Math.round(0.62 * (defectAreaSqMm * 1e-6) * Math.sqrt(2 * 9.81 * headM) * 1000 * 60);

  const residualThicknessMm = Math.max(2.1, selectedPipe.nominalThicknessMm * (1 - corrosionPct / 100));

  return (
    <div className="p-6 min-h-screen" style={{ background: 'linear-gradient(135deg, #020b18, #031629)' }}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-cyan-500/10 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight">3D Pipe Digital Twin & Acoustic Inspector</h1>
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
              style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}
            >
              SCADA HYDROPHYSICS ENGINE
            </span>
          </div>
          <p className="text-xs text-blue-300/80 mt-1">
            Real-time hydrodynamic flow cross-section, ultrasonic pipe wall degradation, and hydrophone acoustic FFT spectrum.
          </p>
        </div>

        {/* Audio Listening Stick Button */}
        <button
          onClick={() => setAudioListening(!audioListening)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            audioListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20'
          }`}
        >
          <span>{audioListening ? '🔊' : '🎧'}</span>
          <span>{audioListening ? 'Mute Acoustic Hydrophone' : 'Listen via Acoustic Stick (Web Audio)'}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Pipe Selector & Hydraulic Controls (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          {/* Pipe Selection Card */}
          <div className="glass-card p-5">
            <div className="text-xs font-bold text-cyan-400 tracking-wider mb-3">SELECT PHYSICAL PIPELINE ASSET</div>
            <div className="space-y-2">
              {PIPE_OPTIONS.map((pipe) => {
                const isSelected = selectedPipe.id === pipe.id;
                return (
                  <div
                    key={pipe.id}
                    onClick={() => setSelectedPipe(pipe)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/10'
                        : 'border-blue-900/40 bg-blue-950/20 hover:border-blue-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{pipe.id}</span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{
                          background: pipe.ageYears > 50 ? 'rgba(255,51,102,0.15)' : 'rgba(0,255,136,0.15)',
                          color: pipe.ageYears > 50 ? '#ff3366' : '#00ff88',
                        }}
                      >
                        {pipe.ageYears} yrs old
                      </span>
                    </div>
                    <div className="text-xs text-blue-200 font-medium truncate">{pipe.name}</div>
                    <div className="flex items-center justify-between text-[11px] text-blue-400/80 mt-2">
                      <span>{pipe.material}</span>
                      <span>Ø {pipe.diameterMm} mm</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Simulation Parameters */}
          <div className="glass-card p-5 space-y-4">
            <div className="text-xs font-bold text-cyan-400 tracking-wider">HYDRAULIC & STRUCTURAL CONTROLS</div>

            {/* Pressure Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-200">System Pressure</span>
                <span className="text-cyan-400 font-mono">{pressure.toFixed(2)} bar</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={pressure}
                onChange={(e) => setPressure(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-blue-950 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-blue-400/60 mt-0.5">
                <span>0.5 bar (Low)</span>
                <span>5.0 bar (Surge)</span>
              </div>
            </div>

            {/* Flow Velocity Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-200">Bulk Velocity</span>
                <span className="text-cyan-400 font-mono">{flowVelocity.toFixed(2)} m/s</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.5"
                step="0.05"
                value={flowVelocity}
                onChange={(e) => setFlowVelocity(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-blue-950 rounded-lg cursor-pointer"
              />
            </div>

            {/* Corrosion Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-200">Internal Encrustation / Corrosion</span>
                <span className="text-orange-400 font-mono">{corrosionPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="1"
                value={corrosionPct}
                onChange={(e) => setCorrosionPct(parseInt(e.target.value))}
                className="w-full accent-orange-400 h-1.5 bg-blue-950 rounded-lg cursor-pointer"
              />
            </div>

            {/* Defect Selector */}
            <div>
              <div className="text-xs font-semibold text-blue-200 mb-2">Simulate Structural Defect Orifice</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', label: 'Intact (No Leak)' },
                  { id: 'pinhole', label: 'Pinhole Orifice' },
                  { id: 'crack', label: 'Longitudinal Crack' },
                  { id: 'joint', label: 'Blown Bell Joint' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDefectType(d.id as any)}
                    className={`py-2 px-2.5 rounded-lg text-[11px] font-bold text-center transition-all ${
                      defectType === d.id
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                        : 'bg-blue-950/40 text-blue-400 border border-blue-900/40 hover:bg-blue-900/30'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Canvas + Live Diagnostics (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-5">
          {/* Canvas Box */}
          <div className="glass-card p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-white">Cross-Sectional Hydrodynamic Streamline Simulation</h3>
                <p className="text-xs text-blue-400 mt-0.5">
                  Laminar boundary layer profile with parabolic Poiseuille distribution • Orifice escaping jet dynamics
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  defectType === 'none'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                }`}
              >
                {defectType === 'none' ? '● HYDRAULICALLY SEALED' : `⚠️ ACTIVE LEAK: ${defectType.toUpperCase()}`}
              </span>
            </div>

            {/* The Main 2D Canvas */}
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl bg-[#040d1a]">
              <canvas ref={canvasRef} width={820} height={340} className="w-full h-auto block" />

              {/* Water droplet live overlay badge */}
              {defectType !== 'none' && (
                <div
                  className="absolute top-4 left-4 p-3 rounded-xl"
                  style={{ background: 'rgba(2,11,24,0.85)', border: '1px solid rgba(255,51,102,0.4)' }}
                >
                  <div className="text-[10px] text-rose-400 font-bold uppercase">Measured Leakage Orifice</div>
                  <div className="text-xl font-black text-white mt-0.5">{leakRateLpm} <span className="text-xs text-rose-400">L/min</span></div>
                  <div className="text-[10px] text-blue-300 mt-1">
                    {(leakRateLpm * 60 * 24 / 1000).toFixed(1)} KL/day Loss Exposure
                  </div>
                </div>
              )}
            </div>

            {/* Ultrasonic Wall Thickness & Hydrodynamics Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-center">
                <div className="text-[10px] text-blue-400 uppercase font-semibold">Bulk Flow Rate</div>
                <div className="text-lg font-black text-cyan-400 mt-0.5">{flowRateLps.toFixed(1)} <span className="text-xs">L/s</span></div>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-center">
                <div className="text-[10px] text-blue-400 uppercase font-semibold">Reynolds Number (Re)</div>
                <div className="text-lg font-black text-emerald-400 mt-0.5">{reynoldsNumber.toLocaleString()}</div>
                <div className="text-[9px] text-emerald-500/80">Turbulent Regime</div>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-center">
                <div className="text-[10px] text-blue-400 uppercase font-semibold">Ultrasonic Wall NDT</div>
                <div
                  className="text-lg font-black mt-0.5"
                  style={{ color: residualThicknessMm < 7 ? '#ff3366' : '#ffd700' }}
                >
                  {residualThicknessMm.toFixed(1)} <span className="text-xs">mm</span>
                </div>
                <div className="text-[9px] text-blue-400">Orig: {selectedPipe.nominalThicknessMm}mm</div>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-center">
                <div className="text-[10px] text-blue-400 uppercase font-semibold">Hydrophone Energy</div>
                <div
                  className="text-lg font-black mt-0.5"
                  style={{ color: defectType === 'none' ? '#00ff88' : '#ff3366' }}
                >
                  {defectType === 'none' ? '14 dBμV' : '68 dBμV'}
                </div>
                <div className="text-[9px] text-blue-400">{defectType === 'none' ? 'Normal Quiet' : 'Peak Acoustic Rush'}</div>
              </div>
            </div>
          </div>

          {/* Acoustic FFT Frequency Spectrum Analyzer */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Piezoelectric Acoustic Spectral FFT Analyzer (10 Hz – 2000 Hz)</h4>
                <p className="text-xs text-blue-400 mt-0.5">
                  Narrowband leak acoustic fingerprinting — identifies underground bursts through soil attenuation.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Peak: {defectType === 'none' ? 'None (Ambient)' : '340 Hz (P-Wave Resonance)'}</span>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-cyan-500/20 bg-[#020b18]">
              <canvas ref={fftCanvasRef} width={820} height={120} className="w-full h-auto block" />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-blue-400/60 mt-2 px-2">
              <span>50 Hz (Mains Hum)</span>
              <span>250 Hz</span>
              <span className="text-rose-400 font-bold">320-450 Hz (Pipe Leak Peak)</span>
              <span>1000 Hz</span>
              <span>2000 Hz (Cavitation)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
