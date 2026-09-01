import React from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Droplets, ArrowDown, Globe, Waves } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const OceanConditionsView = () => {
  const timeSeriesData = [
    { date: 'Jan 2026', temp: 27.2, salinity: 34.8, depthAvg: 1850, coverage: 94.2 },
    { date: 'Feb 2026', temp: 27.8, salinity: 34.9, depthAvg: 1860, coverage: 94.5 },
    { date: 'Mar 2026', temp: 28.6, salinity: 35.1, depthAvg: 1840, coverage: 94.8 },
    { date: 'Apr 2026', temp: 29.5, salinity: 35.3, depthAvg: 1855, coverage: 95.1 },
    { date: 'May 2026', temp: 30.1, salinity: 35.4, depthAvg: 1870, coverage: 95.0 },
    { date: 'Jun 2026', temp: 28.9, salinity: 35.2, depthAvg: 1865, coverage: 94.7 },
    { date: 'Jul 2026', temp: 27.9, salinity: 35.0, depthAvg: 1850, coverage: 94.4 },
    { date: 'Aug 2026', temp: 28.4, salinity: 35.1, depthAvg: 1860, coverage: 94.9 },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Ocean Conditions
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Monitoring Sea Temperature, Salinity, Bathymetric Depth & Spatial Coverage.
        </p>
      </motion.div>

      {/* 4 Condition Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="glass-card p-5 rounded-2xl border border-slate-200/80">
          <div className="flex items-center space-x-2 text-sky-600 mb-2">
            <Thermometer className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sea Temperature</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-mono">28.4 °C</h3>
          <p className="text-[11px] text-sky-600 font-medium mt-1">Normal thermal range</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/80">
          <div className="flex items-center space-x-2 text-teal-600 mb-2">
            <Droplets className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Salinity Index</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-mono">35.1 PSU</h3>
          <p className="text-[11px] text-teal-600 font-medium mt-1">Stable salinity ratio</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/80">
          <div className="flex items-center space-x-2 text-indigo-600 mb-2">
            <ArrowDown className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mean Profile Depth</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-mono">1,860 m</h3>
          <p className="text-[11px] text-indigo-600 font-medium mt-1">Full CTD column</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/80">
          <div className="flex items-center space-x-2 text-cyan-600 mb-2">
            <Globe className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ocean Coverage</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-mono">94.9 %</h3>
          <p className="text-[11px] text-cyan-600 font-medium mt-1">Indian Ocean Basin</p>
        </div>

      </div>

      {/* 2 Clean Recharts Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sea Temperature Trend */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200/80 space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <Thermometer className="w-4 h-4 text-sky-600" />
            <span>Sea Surface Temperature (°C)</span>
          </h3>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempLightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: '#1e293b' }} />
                <Area type="monotone" dataKey="temp" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#tempLightGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Salinity Trend */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200/80 space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <Droplets className="w-4 h-4 text-teal-600" />
            <span>Salinity Trend (PSU)</span>
          </h3>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[34, 36]} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: '#1e293b' }} />
                <Line type="monotone" dataKey="salinity" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4, fill: '#0d9488' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
