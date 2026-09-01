import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dna, ShieldAlert, Sparkles, MapPin, Calendar } from 'lucide-react';
import { apiService } from '../services/api';

export const BiodiversityIntelView = () => {
  const [biodiversity, setBiodiversity] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await apiService.getBiodiversity();
      setBiodiversity(res);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Molecular Biodiversity & eDNA
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          OBIS / GBIF Genomic Occurrences, Environmental DNA Sequences & Habitat Hotspots.
        </p>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 rounded-2xl border border-slate-200/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Species Detected</span>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">142 Taxa</h3>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">High taxonomic diversity</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">eDNA Samples</span>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">84 Sequences</h3>
          <p className="text-[11px] text-sky-600 font-medium mt-1">16S rRNA / COI Markers</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Biodiversity Hotspots</span>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">4 Key Reefs</h3>
          <p className="text-[11px] text-teal-600 font-medium mt-1">Protected Atoll Clusters</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Sampling</span>
          <h3 className="text-xl font-bold text-slate-900 font-mono mt-1">Aug 25, 2026</h3>
          <p className="text-[11px] text-slate-500 mt-1">OBIS Data Ingestion</p>
        </div>
      </div>

      {/* Species Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {biodiversity.map((bio) => (
          <motion.div 
            key={bio.id}
            whileHover={{ y: -3 }}
            className="glass-card p-6 rounded-2xl border border-slate-200/80 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {bio.hotspot}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {bio.status}
                </span>
              </div>

              <h4 className="text-lg font-bold text-slate-900 italic pt-1">{bio.scientificName}</h4>
              <p className="text-xs font-semibold text-sky-700">{bio.commonName}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">eDNA Sequence Barcode</span>
                <strong className="text-slate-800">{bio.ednaSequence}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Observation Date</span>
                <strong className="text-slate-800">{bio.date}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Latitude</span>
                <span className="text-slate-600">{bio.lat}°N</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Longitude</span>
                <span className="text-slate-600">{bio.lon}°E</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
};
