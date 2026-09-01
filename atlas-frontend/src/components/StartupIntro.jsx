import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Compass, Radio } from 'lucide-react';

export const StartupIntro = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const [scene, setScene] = useState(1); // Scenes 1 through 7
  const [statusChecks, setStatusChecks] = useState({ argo: false, marine: false, ai: false });

  // Handle Scene Timers (Total ~5.2 seconds)
  useEffect(() => {
    const t1 = setTimeout(() => setScene(2), 800);   // Scene 2: Ocean Currents (0.8s)
    const t2 = setTimeout(() => setScene(3), 1800);  // Scene 3: Data Convergence (1.8s)
    const t3 = setTimeout(() => setScene(4), 2700);  // Scene 4: Atlas Core (2.7s)
    const t4 = setTimeout(() => setScene(5), 3500);  // Scene 5: Logo Reveal (3.5s)
    const t5 = setTimeout(() => {
      setScene(6);                                   // Scene 6: Data Scan (4.2s)
      setTimeout(() => setStatusChecks(s => ({ ...s, argo: true })), 150);
      setTimeout(() => setStatusChecks(s => ({ ...s, marine: true })), 350);
      setTimeout(() => setStatusChecks(s => ({ ...s, ai: true })), 550);
    }, 4200);
    const t6 = setTimeout(() => setScene(7), 4700);  // Scene 7: Expansion Transition (4.7s)
    const t7 = setTimeout(() => { if (onComplete) onComplete(); }, 5300); // Done (5.3s)

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); clearTimeout(t7);
    };
  }, [onComplete]);

  // Scene 1 & 2: Canvas Particle Field & Flowing Vectors
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const isMobile = w < 768;
    const particleCount = isMobile ? 50 : 110;

    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2.5 + 1,
      speedX: Math.random() * 0.8 + 0.2,
      speedY: Math.sin(Math.random() * Math.PI) * 0.4,
      opacity: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.5 ? 'rgba(56, 189, 248, ' : 'rgba(14, 165, 233, '
    }));

    let step = 0;

    const draw = () => {
      step += 0.015;
      ctx.clearRect(0, 0, w, h);

      // Draw vector current curves
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 30) {
          const y = Math.sin(x * 0.003 + step + i * 1.5) * 35 + h * 0.4 + i * 50;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Draw particle flow
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += Math.sin(step + p.x * 0.005) * 0.6;

        if (p.x > w) p.x = 0;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.opacity + ')';
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.6, ease: 'easeInOut' } }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-white via-sky-50/40 to-slate-50 flex flex-col items-center justify-center overflow-hidden selection:bg-sky-100"
    >
      {/* 1. Canvas Particle Background */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-90" />

      {/* Scene 3: Converging Data Labels & Constellation Lines */}
      <AnimatePresence>
        {scene >= 3 && scene < 7 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10"
          >
            {/* SVG Constellation Lines connecting to Center */}
            <svg className="w-full h-full">
              <line x1="20%" y1="25%" x2="50%" y2="50%" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="80%" y1="25%" x2="50%" y2="50%" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="25%" y1="75%" x2="50%" y2="50%" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="75%" y1="75%" x2="50%" y2="50%" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" strokeDasharray="4,4" />
            </svg>

            {/* Floating Data Pills */}
            {[
              { label: 'ARGO', pos: 'top-[22%] left-[18%]' },
              { label: 'FISHERIES', pos: 'top-[22%] right-[18%]' },
              { label: 'eDNA', pos: 'bottom-[22%] left-[22%]' },
              { label: 'GIS', pos: 'bottom-[22%] right-[22%]' },
              { label: 'SCIENCE', pos: 'top-[48%] left-[12%]' },
            ].map((node, i) => (
              <motion.span
                key={node.label}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.8 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`absolute ${node.pos} px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/90 text-sky-700 border border-sky-200/80 shadow-sm`}
              >
                {node.label}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene 4, 5, 6: Atlas Intelligence Core & Logo Reveal */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4">
        
        {/* Core Geometry Visualization */}
        <div className="relative flex items-center justify-center mb-8">
          
          {/* Outer Orbital Ring 1 */}
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: scene >= 7 ? 3.5 : 1, rotate: 360 }}
            transition={{ 
              scale: scene >= 7 ? { duration: 0.6, ease: 'easeIn' } : { duration: 0.8 },
              rotate: { duration: 20, repeat: Infinity, ease: 'linear' }
            }}
            className="w-44 h-44 rounded-full border border-dashed border-sky-300/80 absolute"
          />

          {/* Inner Lat/Lon Arc Ring 2 */}
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: scene >= 7 ? 4 : 1, rotate: -360 }}
            transition={{ 
              scale: scene >= 7 ? { duration: 0.6, ease: 'easeIn' } : { duration: 0.8, delay: 0.1 },
              rotate: { duration: 15, repeat: Infinity, ease: 'linear' }
            }}
            className="w-32 h-32 rounded-full border border-sky-400/40 border-t-sky-600 absolute"
          />

          {/* Soft Aqua Glowing Sphere Center */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: scene >= 7 ? 6 : 1, opacity: scene >= 7 ? 0 : 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-400 via-cyan-300 to-teal-300 shadow-xl shadow-sky-300/50 flex items-center justify-center text-white relative z-10"
          >
            <Compass className="w-8 h-8 animate-pulse" />
          </motion.div>

          {/* Scene 6: Horizontal Laser Scan Line Sweep */}
          {scene === 6 && (
            <motion.div
              initial={{ top: '0%' }}
              animate={{ top: '100%' }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="absolute left-[-20px] right-[-20px] h-0.5 bg-gradient-to-r from-transparent via-sky-500 to-transparent shadow-md shadow-sky-400 z-30"
            />
          )}

        </div>

        {/* Scene 5: Scientific Logo Reveal */}
        <AnimatePresence>
          {scene >= 5 && (
            <div className="space-y-2 relative z-20">
              <motion.h1
                initial={{ opacity: 0, filter: 'blur(10px)', y: 15, letterSpacing: '0.1em' }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0, letterSpacing: '0.25em' }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="text-3xl md:text-5xl font-black text-slate-900 font-mono tracking-widest"
              >
                PROJECT ATLAS
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-widest"
              >
                UNIFIED OCEAN INTELLIGENCE PLATFORM
              </motion.p>
            </div>
          )}
        </AnimatePresence>

        {/* Scene 6: Sequential System Readiness Status Indicators */}
        {scene >= 6 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-4 mt-6 font-mono text-xs font-bold text-slate-600"
          >
            <div className={`flex items-center space-x-1.5 transition-opacity ${statusChecks.argo ? 'opacity-100 text-sky-700' : 'opacity-30'}`}>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>ARGO DATA</span>
            </div>
            <span>•</span>
            <div className={`flex items-center space-x-1.5 transition-opacity ${statusChecks.marine ? 'opacity-100 text-sky-700' : 'opacity-30'}`}>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>MARINE DATA</span>
            </div>
            <span>•</span>
            <div className={`flex items-center space-x-1.5 transition-opacity ${statusChecks.ai ? 'opacity-100 text-sky-700' : 'opacity-30'}`}>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI ENGINE</span>
            </div>
          </motion.div>
        )}

      </div>

      {/* Skip Button */}
      <button
        onClick={onComplete}
        className="absolute bottom-6 right-6 text-xs font-semibold text-slate-400 hover:text-sky-600 transition-colors uppercase tracking-wider z-30"
      >
        Skip Intro →
      </button>

    </motion.div>
  );
};
