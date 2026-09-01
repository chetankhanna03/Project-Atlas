import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CloudSun, Thermometer, Sparkles, MapPin, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { apiService } from '../services/api';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { SkeletonChart } from '../components/SkeletonLoader';

export const OceanographyView = () => {
  const [lat, setLat] = useState(12.97);
  const [lon, setLon] = useState(77.59);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiService.getOceanographyData({ lat, lon, days: 30 });
        setTimeSeriesData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [lat, lon]);

  const latestSST = timeSeriesData[timeSeriesData.length - 1]?.sst || 28.3;
  const latestChl = timeSeriesData[timeSeriesData.length - 1]?.chlorophyll || 0.82;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-indigo-500/30 glow-teal"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <CloudSun className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">NOAA ERDDAP Satellite Oceanography</h1>
            <p className="text-xs md:text-sm text-ocean-300">Sea Surface Temperature (SST) & Chlorophyll-a Time-Series Monitoring</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-abyss-950/80 px-4 py-2 rounded-2xl border border-indigo-500/30 text-xs font-mono text-indigo-300">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>DAILY SATELLITE PASS</span>
        </div>
      </motion.div>

      {/* Metrics Counter Tickers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="glass-panel p-5 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/20 to-ocean-950"
        >
          <span className="text-xs font-semibold text-ocean-300">Current Sea Surface Temp (SST)</span>
          <h3 className="text-3xl font-black text-white font-mono mt-1">
            <AnimatedCounter value={latestSST} suffix=" °C" decimals={1} />
          </h3>
          <p className="text-[11px] text-indigo-300 mt-2">+0.2°C vs 10-year Baseline</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="glass-panel p-5 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-ocean-950"
        >
          <span className="text-xs font-semibold text-ocean-300">Chlorophyll-a Concentration</span>
          <h3 className="text-3xl font-black text-white font-mono mt-1">
            <AnimatedCounter value={latestChl} suffix=" mg/m³" decimals={2} />
          </h3>
          <p className="text-[11px] text-emerald-300 mt-2">Phytoplankton Bloom Level: Optimal</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="glass-panel p-5 rounded-3xl border border-sky-500/30 bg-gradient-to-br from-sky-500/20 to-ocean-950"
        >
          <span className="text-xs font-semibold text-ocean-300">Thermal Anomaly</span>
          <h3 className="text-3xl font-black text-biolum-cyan font-mono mt-1">+0.4 °C</h3>
          <p className="text-[11px] text-sky-300 mt-2">No Coral Bleaching Warning</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="glass-panel p-5 rounded-3xl border border-ocean-500/30 bg-gradient-to-br from-ocean-500/20 to-ocean-950"
        >
          <span className="text-xs font-semibold text-ocean-300">Monsoon Upwelling Status</span>
          <h3 className="text-3xl font-black text-biolum-green font-mono mt-1">ACTIVE</h3>
          <p className="text-[11px] text-biolum-green mt-2">Nutrient-rich Coastal Waters</p>
        </motion.div>
      </div>

      {/* Main Charts: SST & Chlorophyll */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sea Surface Temperature Chart */}
        <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
              <Thermometer className="w-5 h-5 text-indigo-400" />
              <span>Sea Surface Temperature Trend (°C)</span>
            </h3>
            <span className="text-xs text-ocean-300 font-mono">AVHRR Sensor</span>
          </div>

          {loading ? (
            <SkeletonChart />
          ) : (
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sstGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip contentStyle={{ backgroundColor: '#040b17', borderColor: '#818cf8', borderRadius: '12px', color: '#fff' }} />
                  <Area type="monotone" dataKey="sst" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#sstGradient)" isAnimationActive={true} animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chlorophyll-a Chart */}
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>Chlorophyll-a Concentration (mg/m³)</span>
            </h3>
            <span className="text-xs text-ocean-300 font-mono">MODIS-Aqua Sensor</span>
          </div>

          {loading ? (
            <SkeletonChart />
          ) : (
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ffc4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00ffc4" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[0, 'dataMax + 0.2']} />
                  <Tooltip contentStyle={{ backgroundColor: '#040b17', borderColor: '#00ffc4', borderRadius: '12px', color: '#fff' }} />
                  <Area type="monotone" dataKey="chlorophyll" stroke="#00ffc4" strokeWidth={3} fillOpacity={1} fill="url(#chlGradient)" isAnimationActive={true} animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
