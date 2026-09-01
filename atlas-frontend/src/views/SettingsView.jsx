import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Radio, Map, Bell, ShieldCheck } from 'lucide-react';

export const SettingsView = () => {
  const [apiUrl, setApiUrl] = useState('http://127.0.0.1:8000');
  const [refreshInterval, setRefreshInterval] = useState('30');
  const [tileProvider, setTileProvider] = useState('carto-voyager');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Platform Settings
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Configure API endpoints, GIS map tile providers, and background refresh intervals.
        </p>
      </motion.div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="glass-card p-6 rounded-2xl border border-slate-200/90 shadow-soft-blue space-y-6">
        
        {/* API Endpoint */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-sky-600" />
            <span>FastAPI Server Base URL</span>
          </label>
          <input 
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Refresh Rate */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Telemetry Refresh Interval
          </label>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-sky-500"
          >
            <option value="10">Every 10 seconds (High frequency)</option>
            <option value="30">Every 30 seconds (Recommended)</option>
            <option value="60">Every 60 seconds (Standard)</option>
          </select>
        </div>

        {/* GIS Tile Provider */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Map className="w-3.5 h-3.5 text-sky-600" />
            <span>GIS Map Tile Provider</span>
          </label>
          <select
            value={tileProvider}
            onChange={(e) => setTileProvider(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-sky-500"
          >
            <option value="carto-voyager">CARTO Voyager Scientific (Light)</option>
            <option value="osm">OpenStreetMap Light Standard</option>
            <option value="carto-positron">CARTO Positron Clean White</option>
          </select>
        </div>

        {/* Save Button */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          {saved && (
            <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Settings Saved Successfully!</span>
            </span>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 transition-colors ml-auto flex items-center space-x-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>

      </form>

    </div>
  );
};
