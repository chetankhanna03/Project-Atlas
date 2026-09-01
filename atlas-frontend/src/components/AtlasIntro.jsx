import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Anchor, Fish, Dna, Satellite, Map, Brain, Compass } from 'lucide-react';

// ─── CANVAS OCEAN RENDERER ───────────────────────────────────────────────────
function useOceanCanvas(canvasRef, stage) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const isMobile = w < 768;
    const cx = w / 2;
    const cy = h / 2;
    let t = 0;

    // ── Ocean Particles (microscopic plankton-like) ──
    const pCount = isMobile ? 60 : 140;
    const particles = Array.from({ length: pCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 3 + 0.5,          // depth layer for parallax
      r: Math.random() * 2 + 0.8,
      vx: (Math.random() - 0.3) * 0.6,
      vy: (Math.random() - 0.5) * 0.3,
      hue: 190 + Math.random() * 30,        // aqua-cyan range
      alpha: Math.random() * 0.4 + 0.15,
    }));

    // ── ARGO Float Objects ──
    const argoFloats = [
      { x: w * 0.25, y: h * 0.35, depth: 0, targetDepth: 500, phase: 0, id: '7901136' },
      { x: w * 0.6,  y: h * 0.28, depth: 0, targetDepth: 800, phase: 0.5, id: '2903348' },
      { x: w * 0.78, y: h * 0.55, depth: 0, targetDepth: 300, phase: 1.0, id: '6901840' },
      { x: w * 0.4,  y: h * 0.65, depth: 0, targetDepth: 600, phase: 1.5, id: '4901722' },
    ];

    // ── Fisheries Vessels ──
    const vessels = [
      { x: w * 0.2,  y: h * 0.5,  tx: w * 0.35, ty: h * 0.42, progress: 0 },
      { x: w * 0.55, y: h * 0.7,  tx: w * 0.7,  ty: h * 0.6,  progress: 0 },
      { x: w * 0.75, y: h * 0.35, tx: w * 0.85, ty: h * 0.45, progress: 0 },
    ];

    // ── Biodiversity Points ──
    const bioPoints = [
      { x: w * 0.3,  y: h * 0.4,  type: 'coral',    pulse: 0 },
      { x: w * 0.5,  y: h * 0.55, type: 'fish',     pulse: 0.5 },
      { x: w * 0.65, y: h * 0.35, type: 'plankton', pulse: 1.0 },
      { x: w * 0.45, y: h * 0.7,  type: 'turtle',   pulse: 1.5 },
      { x: w * 0.7,  y: h * 0.6,  type: 'whale',    pulse: 2.0 },
    ];

    // ── Convergence lines target center ──
    const convSources = [
      { label: 'ARGO',         x: w * 0.1,  y: h * 0.15, color: '#0284c7' },
      { label: 'FISHERIES',    x: w * 0.9,  y: h * 0.2,  color: '#d97706' },
      { label: 'BIODIVERSITY', x: w * 0.08, y: h * 0.8,  color: '#059669' },
      { label: 'SATELLITE',    x: w * 0.92, y: h * 0.75, color: '#7c3aed' },
      { label: 'GIS',          x: w * 0.5,  y: h * 0.95, color: '#0d9488' },
      { label: 'SCIENCE',      x: w * 0.5,  y: h * 0.05, color: '#6366f1' },
    ];

    // ── Rendering Helper Functions ──
    function drawBathymetryGrid() {
      ctx.strokeStyle = 'rgba(148, 196, 216, 0.12)';
      ctx.lineWidth = 0.6;
      // Lat lines
      for (let i = 0; i < 14; i++) {
        const y = (h / 14) * i + Math.sin(t * 0.5 + i) * 3;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // Lon lines
      for (let i = 0; i < 20; i++) {
        const x = (w / 20) * i + Math.cos(t * 0.4 + i) * 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    }

    function drawOceanCurrents() {
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(14, 165, 233, ${0.06 + i * 0.015})`;
        ctx.lineWidth = 1.2 + i * 0.3;
        const yBase = h * 0.2 + i * (h * 0.1);
        for (let x = 0; x <= w; x += 8) {
          const y = yBase
            + Math.sin(x * 0.004 + t * 0.8 + i * 0.8) * 25
            + Math.sin(x * 0.002 + t * 0.4 + i * 1.2) * 15;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    function drawBathymetryContours() {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.lineWidth = 1;
      for (let ring = 1; ring < 6; ring++) {
        ctx.beginPath();
        for (let angle = 0; angle <= Math.PI * 2; angle += 0.05) {
          const r = ring * 60 + Math.sin(angle * 3 + t) * 10;
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r;
          if (angle === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    function drawCoastlines() {
      ctx.strokeStyle = 'rgba(100, 130, 150, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const coastY = h * 0.15;
      for (let x = 0; x < w; x += 6) {
        const y = coastY + Math.sin(x * 0.008 + t * 0.3) * 12 + Math.sin(x * 0.015) * 8;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    function drawParticles() {
      particles.forEach(p => {
        const parallaxMul = p.z / 3;
        p.x += p.vx * parallaxMul + Math.sin(t * 0.5 + p.y * 0.005) * 0.3 * parallaxMul;
        p.y += p.vy * parallaxMul + Math.cos(t * 0.3 + p.x * 0.004) * 0.2 * parallaxMul;
        if (p.x > w + 10) p.x = -10;
        if (p.x < -10) p.x = w + 10;
        if (p.y > h + 10) p.y = -10;
        if (p.y < -10) p.y = h + 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * parallaxMul, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 60%, 70%, ${p.alpha * parallaxMul})`;
        ctx.fill();
      });
    }

    function drawArgoFloats(stageRef) {
      if (stageRef < 2) return;
      const argoAlpha = Math.min((stageRef - 2) * 1.5, 1);
      argoFloats.forEach((af) => {
        af.depth = Math.abs(Math.sin(t * 0.4 + af.phase)) * af.targetDepth;
        const depthVis = af.depth / 1000 * 60;
        // Trajectory line
        ctx.strokeStyle = `rgba(2, 132, 199, ${0.3 * argoAlpha})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(af.x, af.y);
        ctx.lineTo(af.x, af.y + depthVis);
        ctx.stroke();
        ctx.setLineDash([]);
        // Float marker
        ctx.beginPath();
        ctx.arc(af.x, af.y + depthVis, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(2, 132, 199, ${0.9 * argoAlpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * argoAlpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        // Pulse ring
        const pulseR = 6 + Math.sin(t * 3 + af.phase) * 6;
        ctx.beginPath();
        ctx.arc(af.x, af.y + depthVis, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${(0.5 - (pulseR - 6) / 12) * argoAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        // Surface marker
        ctx.beginPath();
        ctx.arc(af.x, af.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${0.6 * argoAlpha})`;
        ctx.fill();
      });
    }

    function drawFisheriesActivity(stageRef) {
      if (stageRef < 3) return;
      const fishAlpha = Math.min((stageRef - 3) * 1.5, 1);
      // Fishing zones (subtle filled polygons)
      ctx.fillStyle = `rgba(217, 119, 6, ${0.04 * fishAlpha})`;
      ctx.strokeStyle = `rgba(217, 119, 6, ${0.15 * fishAlpha})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.ellipse(w * 0.3, h * 0.5, 80, 50, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(w * 0.7, h * 0.55, 60, 40, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      // Vessels with trails
      vessels.forEach((v) => {
        v.progress = Math.min(v.progress + 0.004, 1);
        const px = v.x + (v.tx - v.x) * v.progress;
        const py = v.y + (v.ty - v.y) * v.progress;
        // Trail
        ctx.strokeStyle = `rgba(217, 119, 6, ${0.2 * fishAlpha})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(v.x, v.y);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.setLineDash([]);
        // Vessel marker (triangle)
        ctx.fillStyle = `rgba(217, 119, 6, ${0.85 * fishAlpha})`;
        ctx.beginPath();
        ctx.moveTo(px, py - 5);
        ctx.lineTo(px - 4, py + 4);
        ctx.lineTo(px + 4, py + 4);
        ctx.closePath();
        ctx.fill();
      });
      // Species distribution dots
      for (let i = 0; i < 15; i++) {
        const sx = w * 0.15 + Math.sin(i * 2.3 + t * 0.2) * w * 0.35 + w * 0.15;
        const sy = h * 0.3 + Math.cos(i * 1.7 + t * 0.15) * h * 0.25 + h * 0.05;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${0.35 * fishAlpha})`;
        ctx.fill();
      }
    }

    function drawBiodiversity(stageRef) {
      if (stageRef < 4) return;
      const bioAlpha = Math.min((stageRef - 4) * 1.5, 1);
      bioPoints.forEach((bp) => {
        const pulse = Math.sin(t * 2.5 + bp.pulse) * 0.4 + 0.6;
        // Hotspot glow
        const grad = ctx.createRadialGradient(bp.x, bp.y, 0, bp.x, bp.y, 25);
        grad.addColorStop(0, `rgba(5, 150, 105, ${0.2 * bioAlpha * pulse})`);
        grad.addColorStop(1, `rgba(5, 150, 105, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, 25, 0, Math.PI * 2);
        ctx.fill();
        // Core dot
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(5, 150, 105, ${0.9 * bioAlpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * bioAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      // DNA strand fragments
      if (stageRef >= 4) {
        ctx.strokeStyle = `rgba(16, 185, 129, ${0.12 * bioAlpha})`;
        ctx.lineWidth = 1.5;
        for (let strand = 0; strand < 2; strand++) {
          const baseX = cx + (strand === 0 ? -35 : 35);
          ctx.beginPath();
          for (let y = cy - 80; y < cy + 80; y += 4) {
            const x = baseX + Math.sin(y * 0.06 + t * 2 + strand * Math.PI) * 18;
            if (y === cy - 80) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        // Cross-links
        for (let i = 0; i < 8; i++) {
          const y = cy - 70 + i * 20;
          const x1 = cx - 35 + Math.sin(y * 0.06 + t * 2) * 18;
          const x2 = cx + 35 + Math.sin(y * 0.06 + t * 2 + Math.PI) * 18;
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.08 * bioAlpha})`;
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.stroke();
        }
      }
    }

    function drawSatelliteGIS(stageRef) {
      if (stageRef < 5) return;
      const gisAlpha = Math.min((stageRef - 5) * 1.5, 1);
      // Satellite orbit arcs
      ctx.strokeStyle = `rgba(124, 58, 237, ${0.1 * gisAlpha})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, w * 0.4, h * 0.15, -0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, w * 0.35, h * 0.2, 0.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Satellite marker
      const satAngle = t * 0.5;
      const satX = cx + Math.cos(satAngle) * w * 0.4;
      const satY = cy + Math.sin(satAngle) * h * 0.15;
      ctx.fillStyle = `rgba(124, 58, 237, ${0.8 * gisAlpha})`;
      ctx.fillRect(satX - 4, satY - 2, 8, 4);
      ctx.fillRect(satX - 10, satY - 1, 20, 2);
      // Coverage beam
      ctx.strokeStyle = `rgba(124, 58, 237, ${0.08 * gisAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(satX, satY);
      ctx.lineTo(satX - 30, satY + 80);
      ctx.moveTo(satX, satY);
      ctx.lineTo(satX + 30, satY + 80);
      ctx.stroke();
    }

    function drawConvergence(stageRef) {
      if (stageRef < 6) return;
      const convProgress = Math.min((stageRef - 6) * 1.2, 1);
      convSources.forEach((src) => {
        const dx = cx - src.x;
        const dy = cy - src.y;
        const endX = src.x + dx * convProgress;
        const endY = src.y + dy * convProgress;
        // Traveling line
        ctx.strokeStyle = src.color + '40';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);
        // Data node at tip
        ctx.beginPath();
        ctx.arc(endX, endY, 4, 0, Math.PI * 2);
        ctx.fillStyle = src.color + 'cc';
        ctx.fill();
        // Label
        ctx.font = '600 9px monospace';
        ctx.fillStyle = src.color + '99';
        ctx.fillText(src.label, src.x + 8, src.y + 3);
      });
    }

    function drawAtlasCore(stageRef) {
      if (stageRef < 7) return;
      const coreAlpha = Math.min((stageRef - 7) * 1.5, 1);
      // Outer ring with data nodes
      ctx.strokeStyle = `rgba(2, 132, 199, ${0.25 * coreAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 55, 0, Math.PI * 2);
      ctx.stroke();
      // Rotating lat arc
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.3);
      ctx.strokeStyle = `rgba(14, 165, 233, ${0.35 * coreAlpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 45, 20, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      // Counter-rotating lon arc
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-t * 0.25 + 1.2);
      ctx.strokeStyle = `rgba(13, 148, 136, ${0.3 * coreAlpha})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 35, 42, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      // Inner rotating ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.5);
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.2 * coreAlpha})`;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      // Central soft glow
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
      coreGrad.addColorStop(0, `rgba(56, 189, 248, ${0.18 * coreAlpha})`);
      coreGrad.addColorStop(0.5, `rgba(14, 165, 233, ${0.06 * coreAlpha})`);
      coreGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fill();
      // Small orbital data nodes
      for (let i = 0; i < 8; i++) {
        const nodeAngle = (Math.PI * 2 / 8) * i + t * 0.6;
        const nx = cx + Math.cos(nodeAngle) * 48;
        const ny = cy + Math.sin(nodeAngle) * 48;
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${0.7 * coreAlpha})`;
        ctx.fill();
      }
    }

    // ── Main Render Loop ──
    const currentStageRef = { value: 1 };

    const render = () => {
      t += 0.012;
      ctx.clearRect(0, 0, w, h);

      const s = currentStageRef.value;

      // Always draw base ocean layer
      drawBathymetryGrid();
      drawOceanCurrents();
      drawCoastlines();
      if (s >= 1) drawBathymetryContours();
      drawParticles();

      // Stage-specific layers
      drawArgoFloats(s);
      drawFisheriesActivity(s);
      drawBiodiversity(s);
      drawSatelliteGIS(s);
      drawConvergence(s);
      drawAtlasCore(s);

      animId = requestAnimationFrame(render);
    };

    render();

    // Expose stage updater
    canvas._updateStage = (newStage) => {
      currentStageRef.value = newStage;
    };

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Update canvas stage when React stage changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && canvas._updateStage) {
      canvas._updateStage(stage);
    }
  }, [stage]);
}

// ─── MAIN ATLAS INTRO COMPONENT ──────────────────────────────────────────────
export const AtlasIntro = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const [stage, setStage] = useState(1);
  const [statusChecks, setStatusChecks] = useState([]);
  const [showTagline, setShowTagline] = useState(false);

  useOceanCanvas(canvasRef, stage);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mql.matches) {
      if (onComplete) onComplete();
      return;
    }

    // Scene timeline
    const timers = [
      setTimeout(() => setStage(2), 1200),    // ARGO Floats
      setTimeout(() => setStage(3), 2400),    // Fisheries
      setTimeout(() => setStage(4), 3600),    // Biodiversity/eDNA
      setTimeout(() => setStage(5), 4800),    // Satellite/GIS
      setTimeout(() => setStage(6), 5800),    // Data Convergence
      setTimeout(() => setStage(7), 6800),    // Atlas Core
      setTimeout(() => setStage(8), 7800),    // Logo Reveal
      setTimeout(() => setShowTagline(true), 8200),
      setTimeout(() => {                      // Status checks
        setStatusChecks(['argo']);
        setTimeout(() => setStatusChecks(p => [...p, 'marine']), 200);
        setTimeout(() => setStatusChecks(p => [...p, 'ai']), 400);
      }, 8400),
      setTimeout(() => setStage(9), 8800),    // Transition
      setTimeout(() => { if (onComplete) onComplete(); }, 9400),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // GIS layer labels for Scene 5
  const gisLayers = ['OCEANOGRAPHY', 'ARGO', 'FISHERIES', 'BIODIVERSITY', 'SATELLITE', 'GIS'];

  return (
    <div
      className="fixed inset-0 z-[9999] w-screen h-screen overflow-hidden select-none"
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 40%, #e0f2fe 100%)' }}
    >
      {/* Full-screen Canvas — Ocean, ARGO, Fisheries, Bio, GIS, Convergence, Core */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* ── Scene 2: ARGO Telemetry Data Panel ── */}
      <AnimatePresence>
        {stage >= 2 && stage < 6 && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.6 }}
            className="absolute top-[30%] right-[6%] z-20"
          >
            <div className="bg-white/90 backdrop-blur-sm border border-sky-200 rounded-xl p-4 shadow-lg shadow-sky-100/50 space-y-2 w-56">
              <div className="flex items-center space-x-2 pb-2 border-b border-sky-100">
                <Anchor className="w-4 h-4 text-sky-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">ARGO Float Profile</span>
              </div>
              <div className="font-mono text-[11px] space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Float ID</span>
                  <span className="font-bold text-sky-800">7901136</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Temperature</span>
                  <span className="font-bold text-sky-700">28.4 °C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Salinity</span>
                  <span className="font-bold text-teal-700">35.2 PSU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Depth</span>
                  <span className="font-bold text-indigo-700">500 m</span>
                </div>
              </div>
              {/* Mini depth visualization bar */}
              <div className="pt-2 border-t border-sky-100">
                <div className="h-1.5 w-full bg-sky-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '50%' }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-1 text-right font-mono">CTD Profile Active</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scene 3: Fisheries Label ── */}
      <AnimatePresence>
        {stage >= 3 && stage < 6 && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-[28%] left-[5%] z-20"
          >
            <div className="bg-white/90 backdrop-blur-sm border border-amber-200 rounded-xl p-3.5 shadow-lg shadow-amber-100/40 w-52">
              <div className="flex items-center space-x-2 mb-2">
                <Fish className="w-4 h-4 text-amber-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Fisheries Intelligence</span>
              </div>
              <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-500 pt-1 border-t border-amber-100">
                <span>VESSELS</span>
                <span className="text-amber-400">+</span>
                <span>CATCH DATA</span>
                <span className="text-amber-400">+</span>
                <span>HABITAT</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scene 4: Biodiversity / eDNA Labels ── */}
      <AnimatePresence>
        {stage >= 4 && stage < 6 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-[15%] right-[8%] z-20"
          >
            <div className="bg-white/90 backdrop-blur-sm border border-emerald-200 rounded-xl p-3.5 shadow-lg shadow-emerald-100/40 space-y-2 w-48">
              <div className="flex items-center space-x-2">
                <Dna className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">eDNA Sequencing</span>
              </div>
              <div className="space-y-1 text-[10px] font-mono text-slate-500 pt-1 border-t border-emerald-100">
                {['eDNA SAMPLE', 'SPECIES DETECTED', 'BIODIVERSITY HOTSPOT'].map((label, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className="flex items-center space-x-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scene 5: GIS Layer Activation Sequence ── */}
      <AnimatePresence>
        {stage >= 5 && stage < 7 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="absolute top-[8%] left-1/2 -translate-x-1/2 z-20"
          >
            <div className="flex items-center space-x-2">
              {gisLayers.map((layer, i) => (
                <motion.span
                  key={layer}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.12 }}
                  className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 text-[9px] font-mono font-bold text-slate-600 shadow-sm"
                >
                  {layer}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scene 8: Project Atlas Logo Reveal ── */}
      <AnimatePresence>
        {stage >= 8 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none"
          >
            {/* Soft radial backdrop to ensure text readability */}
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(240,249,255,0.85) 0%, rgba(240,249,255,0.4) 50%, transparent 80%)',
              }}
            />

            <div className="relative z-10 text-center space-y-3">
              {/* Atlas Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
                className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-sky-300/40 mb-2"
              >
                <Compass className="w-7 h-7" />
              </motion.div>

              {/* Main Title */}
              <motion.h1
                initial={{ opacity: 0, filter: 'blur(12px)', y: 20, letterSpacing: '0em' }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0, letterSpacing: '0.2em' }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="text-3xl md:text-5xl font-black text-slate-900 font-mono tracking-widest"
              >
                PROJECT ATLAS
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-[0.25em]"
              >
                UNIFIED OCEAN INTELLIGENCE PLATFORM
              </motion.p>

              {/* Tagline */}
              <AnimatePresence>
                {showTagline && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 0.7, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-xs text-slate-400 italic font-medium pt-1"
                  >
                    Connecting Ocean Data. Discovering Marine Intelligence.
                  </motion.p>
                )}
              </AnimatePresence>

              {/* System Status Checks */}
              {statusChecks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center space-x-5 pt-4 font-mono text-[11px] font-bold"
                >
                  {[
                    { key: 'argo', label: 'ARGO DATA' },
                    { key: 'marine', label: 'MARINE DATA' },
                    { key: 'ai', label: 'AI ENGINE' },
                  ].map((item) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={statusChecks.includes(item.key)
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0.25, scale: 0.9 }
                      }
                      transition={{ duration: 0.3 }}
                      className="flex items-center space-x-1.5 text-slate-600"
                    >
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        statusChecks.includes(item.key)
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-slate-100 text-slate-300'
                      }`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{item.label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scene 9: Radial Expansion Transition Overlay ── */}
      <AnimatePresence>
        {stage >= 9 && (
          <motion.div
            initial={{
              clipPath: 'circle(0% at 50% 50%)',
              opacity: 1,
            }}
            animate={{
              clipPath: 'circle(150% at 50% 50%)',
              opacity: 1,
            }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[10000] bg-slate-50"
          />
        )}
      </AnimatePresence>

      {/* ── Skip Intro Button ── */}
      <button
        onClick={onComplete}
        className="fixed bottom-5 right-6 z-[10001] text-xs font-semibold text-slate-400 hover:text-sky-600 transition-colors uppercase tracking-wider"
      >
        Skip Intro →
      </button>

      {/* ── Stage Progress Indicator (subtle bottom bar) ── */}
      <div className="fixed bottom-0 left-0 right-0 h-0.5 bg-slate-200/50 z-[9999]">
        <motion.div
          animate={{ width: `${Math.min((stage / 9) * 100, 100)}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-sky-400 to-teal-400"
        />
      </div>
    </div>
  );
};
