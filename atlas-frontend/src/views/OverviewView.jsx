import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Fish, Dna, BookOpen, Waves, ArrowUpRight, Compass } from 'lucide-react';
import { AnimatedCounter } from '../components/AnimatedCounter';

export const OverviewView = ({ setActiveTab }) => {
  return (
    <div className="space-y-6 pb-12">
      
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Ocean Intelligence Overview
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Explore oceanographic, fisheries and biodiversity insights through one unified platform.
        </p>
      </motion.div>

      {/* 4 Soft Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* ARGO Profiles */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => setActiveTab('argo')}
          className="glass-card p-5 rounded-2xl border border-slate-200/80 cursor-pointer shadow-soft-blue transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center space-x-1">
              <span>+14.2%</span>
            </span>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">ARGO Profiles</p>
            <h3 className="text-3xl font-black text-slate-900 font-mono mt-0.5">
              <AnimatedCounter value={6} suffix="+" />
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Deep CTD arrays active</p>
          </div>
        </motion.div>

        {/* Fisheries Records */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => setActiveTab('fisheries')}
          className="glass-card p-5 rounded-2xl border border-slate-200/80 cursor-pointer shadow-soft-teal transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Fish className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Live Stream
            </span>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Fisheries Records</p>
            <h3 className="text-3xl font-black text-slate-900 font-mono mt-0.5">Live</h3>
            <p className="text-[11px] text-slate-500 mt-1">ICAR-CMFRI Landings Data</p>
          </div>
        </motion.div>

        {/* Biodiversity Observations */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => setActiveTab('biodiversity')}
          className="glass-card p-5 rounded-2xl border border-slate-200/80 cursor-pointer shadow-soft-blue transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Dna className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              OBIS / GBIF
            </span>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Biodiversity Observations</p>
            <h3 className="text-3xl font-black text-slate-900 font-mono mt-0.5">Live</h3>
            <p className="text-[11px] text-slate-500 mt-1">eDNA & Species Occurrences</p>
          </div>
        </motion.div>

        {/* Scientific Sources */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => setActiveTab('research')}
          className="glass-card p-5 rounded-2xl border border-slate-200/80 cursor-pointer shadow-soft-teal transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              WoRMS / NOAA
            </span>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Scientific Sources</p>
            <h3 className="text-3xl font-black text-slate-900 font-mono mt-0.5">Connected</h3>
            <p className="text-[11px] text-slate-500 mt-1">RAG Literature Knowledge Base</p>
          </div>
        </motion.div>

      </div>

      {/* Overview Analytics Banner & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Telemetry Summary */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
              <Waves className="w-4 h-4 text-sky-600" />
              <span>Real-Time Oceanographic Baseline Summary</span>
            </h3>
            <button 
              onClick={() => setActiveTab('gis')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
            >
              <span>Explore GIS Explorer</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Avg Sea Temperature</span>
              <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">28.4 °C</p>
              <span className="text-[10px] text-sky-600 font-medium">+0.4°C seasonal anomaly</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Mean Salinity</span>
              <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">35.1 PSU</p>
              <span className="text-[10px] text-slate-500 font-medium">Optimal oceanic range</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Chlorophyll-a</span>
              <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">0.82 mg/m³</p>
              <span className="text-[10px] text-emerald-600 font-medium">Active phytoplankton bloom</span>
            </div>
          </div>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center space-x-2">
              <Compass className="w-4 h-4 text-sky-600" />
              <span>Platform Quick Actions</span>
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('floatchat')}
                className="w-full p-3 rounded-xl bg-sky-50 hover:bg-sky-100/80 text-sky-800 text-xs font-semibold flex items-center justify-between border border-sky-200/80 transition-all"
              >
                <span>Ask FloatChat AI Assistant</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-sky-600" />
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 text-center">
            <span className="text-[11px] text-slate-400">Synchronized across INCOIS, NOAA & WoRMS</span>
          </div>
        </div>

      </div>

    </div>
  );
};
