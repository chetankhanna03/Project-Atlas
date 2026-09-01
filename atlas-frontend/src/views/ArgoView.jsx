import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, MapPin, Compass, Thermometer, Droplets, ShieldCheck, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { apiService } from '../services/api';
import { OceanMap } from '../components/OceanMap';
import { SkeletonCard } from '../components/SkeletonLoader';

export const ArgoView = () => {
  const [floats, setFloats] = useState([]);
  const [selectedFloat, setSelectedFloat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFloats = async () => {
      setLoading(true);
      try {
        const res = await apiService.getArgoFloats();
        setFloats(res);
        if (res.length > 0) setSelectedFloat(res[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFloats();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-sky-500/30 glow-teal"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Activity className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">ARGO Global Ocean Observing Array</h1>
            <p className="text-xs md:text-sm text-ocean-300">Autonomous Profiling Floats - Depth, Temperature & Salinity CTD Data</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-abyss-950/80 px-4 py-2.5 rounded-2xl border border-sky-500/30">
          <div className="w-3 h-3 rounded-full bg-biolum-cyan animate-ping"></div>
          <span className="text-xs font-mono font-bold text-sky-400">ACTIVE INDIAN OCEAN ARRAY</span>
        </div>
      </motion.div>

      {/* Main Grid: Float Selector & Profile Plots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Float List */}
        <div className="space-y-4">
          <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
            <Compass className="w-5 h-5 text-sky-400" />
            <span>Active Profiling Floats</span>
          </h3>

          {loading ? (
            <SkeletonCard />
          ) : (
            <div className="space-y-3">
              {floats.map((float) => {
                const isSelected = selectedFloat?.platform_id === float.platform_id;
                return (
                  <motion.div
                    key={float.platform_id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedFloat(float)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'glass-panel border-sky-400 shadow-xl bg-sky-500/10 glow-cyan' 
                        : 'glass-panel border-ocean-500/20 hover:border-sky-500/40 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">Float #{float.platform_id}</h4>
                          <p className="text-xs text-ocean-300">{float.institution}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-sky-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>

                    <div className="mt-3 pt-2 border-t border-ocean-500/20 grid grid-cols-2 gap-2 text-[11px] font-mono text-ocean-200">
                      <div>Lat: {float.latitude}°N</div>
                      <div>Lon: {float.longitude}°E</div>
                      <div>Cycle: #{float.cycle_number}</div>
                      <div className="text-emerald-400 flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{float.status}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Vertical Depth Profile Charts */}
        <div className="lg:col-span-2 space-y-6">
          
          {selectedFloat && (
            <>
              {/* Profile Card Header */}
              <div className="glass-panel p-5 rounded-3xl border border-sky-500/30 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-white">
                    CTD Depth Profile: Float #{selectedFloat.platform_id}
                  </h3>
                  <p className="text-xs text-ocean-300">
                    Cycle #{selectedFloat.cycle_number} | Last Profile Transmitted: {selectedFloat.last_updated}
                  </p>
                </div>

                <div className="flex items-center space-x-4 text-xs font-mono">
                  <div className="flex items-center space-x-1 text-sky-400">
                    <Thermometer className="w-4 h-4" />
                    <span>Surface: {selectedFloat.profiles?.[0]?.temperature}°C</span>
                  </div>
                  <div className="flex items-center space-x-1 text-teal-400">
                    <Droplets className="w-4 h-4" />
                    <span>Salinity: {selectedFloat.profiles?.[0]?.salinity} PSU</span>
                  </div>
                </div>
              </div>

              {/* Temperature & Salinity Plots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Temperature vs Depth Plot */}
                <div className="glass-panel p-5 rounded-3xl border border-ocean-500/30 space-y-3">
                  <h4 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <Thermometer className="w-4 h-4 text-sky-400" />
                    <span>Temperature (°C) vs Depth (m)</span>
                  </h4>

                  <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedFloat.profiles} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="temperature" type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} domain={['dataMin - 1', 'dataMax + 1']} />
                        <YAxis dataKey="depth" reversed stroke="#94a3b8" tick={{ fontSize: 11 }} label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#040b17', borderColor: '#38bdf8', borderRadius: '12px', color: '#fff' }} />
                        <Line type="monotone" dataKey="temperature" stroke="#00f2fe" strokeWidth={3} dot={{ r: 4, fill: '#00f2fe' }} isAnimationActive={true} animationDuration={1000} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Salinity vs Depth Plot */}
                <div className="glass-panel p-5 rounded-3xl border border-ocean-500/30 space-y-3">
                  <h4 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <Droplets className="w-4 h-4 text-teal-400" />
                    <span>Salinity (PSU) vs Depth (m)</span>
                  </h4>

                  <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedFloat.profiles} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="salinity" type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                        <YAxis dataKey="depth" reversed stroke="#94a3b8" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#040b17', borderColor: '#00ffc4', borderRadius: '12px', color: '#fff' }} />
                        <Line type="monotone" dataKey="salinity" stroke="#00ffc4" strokeWidth={3} dot={{ r: 4, fill: '#00ffc4' }} isAnimationActive={true} animationDuration={1000} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Map Position */}
              <div className="glass-panel p-4 rounded-3xl border border-ocean-500/30">
                <h4 className="text-sm font-extrabold text-white mb-3 flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  <span>Float Trajectory Location</span>
                </h4>
                <OceanMap
                  center={[selectedFloat.latitude, selectedFloat.longitude]}
                  zoom={7}
                  radiusKm={0}
                  argoData={[selectedFloat]}
                  activeLayers={['argo']}
                />
              </div>
            </>
          )}

        </div>

      </div>

    </div>
  );
};
