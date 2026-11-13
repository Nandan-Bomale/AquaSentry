'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes simulating an underground sensor mesh network
    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }

    const colors = ['#00d4ff', '#0080ff', '#00ff88', '#38bdf8'];
    const nodes: Node[] = Array.from({ length: 75 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2.5 + 1.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep dark gradient backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#020b18');
      bgGrad.addColorStop(0.5, '#031629');
      bgGrad.addColorStop(1, '#020914');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle engineering grid
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw mesh interconnections
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 125) {
            const alpha = (1 - dist / 125) * 0.18;
            ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Update and draw nodes
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-slate-100 flex flex-col justify-between">
      {/* Background Interactive Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Top Navbar */}
      <header className="relative z-20 flex items-center justify-between px-8 py-5 border-b border-cyan-500/10 bg-[#020b18]/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.5 7 4 9.5 4 14a8 8 0 0016 0c0-4.5-4.5-7-8-12z" fill="white" />
              <path d="M12 10c-2 3-4 4.5-4 7a4 4 0 008 0c0-2.5-2-4-4-7z" fill="rgba(0,0,0,0.3)" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              Aqua<span className="text-cyan-400">Sentry</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                MANTHAN 2.0
              </span>
            </div>
            <div className="text-[10px] text-blue-400/80 font-mono tracking-widest uppercase">
              AI Water SCADA & Infrastructure Intelligence
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-blue-300/80 hidden md:block">
            Challenge 06: <span className="text-white font-semibold">The Water Loss No One Can See</span>
          </span>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-lg shadow-cyan-400/20 hover:scale-105 transition-all"
          >
            Launch Command Center →
          </Link>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-12 max-w-5xl mx-auto w-full">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>BANGALORE DMA TELEMETRY ONLINE • ISOLATION FOREST ML ACTIVE</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight mb-4">
          Every Drop <br />
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
            Accounted For.
          </span>
        </h1>

        <p className="text-base md:text-lg text-blue-200/90 max-w-2xl mx-auto leading-relaxed mb-8">
          Enterprise water intelligence platform turning invisible underground pipeline loss into explainable,
          financially viable, and socially equitable municipal repair actions.
        </p>

        {/* 4 Core Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-10">
          {[
            { label: 'Unaccounted NRW', val: '22.4%', color: '#ff6b35', sub: 'Detected via Night Flow' },
            { label: 'Water Loss Exposure', val: '22.4 MLD', color: '#ff3366', sub: 'Physical + Apparent' },
            { label: 'AI Detection Precision', val: '82%', color: '#00d4ff', sub: 'Isolation Forest Model' },
            { label: 'Verified Recovered', val: '₹39.4L', color: '#00ff88', sub: '12.7 ML Water Saved' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-card p-4 rounded-2xl border border-cyan-500/20 bg-[#031629]/80 backdrop-blur-md shadow-xl text-center"
            >
              <div className="text-2xl md:text-3xl font-black" style={{ color: stat.color }}>
                {stat.val}
              </div>
              <div className="text-xs font-bold text-white mt-1 uppercase tracking-wider">{stat.label}</div>
              <div className="text-[10px] text-blue-400/80 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-black shadow-xl shadow-cyan-500/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <span>🌊</span>
            <span>Open SCADA Operations Dashboard</span>
          </Link>

          <Link
            href="/map"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm bg-blue-950/70 border border-cyan-500/40 text-cyan-300 hover:bg-blue-900/40 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <span>🗺️</span>
            <span>Explore GIS Pipeline Map</span>
          </Link>

          <Link
            href="/digital-twin"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm bg-blue-950/70 border border-cyan-500/40 text-cyan-300 hover:bg-blue-900/40 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <span>🔬</span>
            <span>3D Pipe Digital Twin</span>
          </Link>
        </div>

        {/* Feature Badges with Clear Spacing */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl">
          {[
            '⚖️ IWA Standard Water Balance',
            '🌲 Isolation Forest ML Anomaly Detection',
            '💧 Minimum Night Flow (MNF) Analysis',
            '🎯 Equity-Weighted Repair Prioritisation',
            '👷 Human-in-the-Loop Field Dispatch',
            '🧪 FAVAD Hydraulic Sandbox',
            '📡 Ultrasonic & Acoustic NDT Inspection',
          ].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-cyan-950/40 border border-cyan-500/25 text-blue-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-4 border-t border-cyan-500/10 text-center text-xs text-blue-400/60 bg-[#020b18]/60 backdrop-blur-sm">
        AquaSentry Intelligent Water System • Bangalore Municipal Water Grid • MANTHAN 2.0 Challenge 06
      </footer>
    </div>
  );
}
