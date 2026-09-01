import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, ExternalLink, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { apiService } from '../services/api';

export const ScientificResearchView = () => {
  const [query, setQuery] = useState('');
  const [papers, setPapers] = useState([]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const res = await apiService.queryScientificRAG(query);
    setPapers(res);
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Scientific Research & Literature RAG
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Search peer-reviewed marine journals, oceanographic bulletins, and genomic studies.
          </p>
        </div>
      </motion.div>

      {/* Scientific Search Bar */}
      <form onSubmit={handleSearch} className="glass-card p-4 rounded-2xl border border-slate-200/80 flex gap-3 shadow-soft-blue">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search literature (e.g. warming trends, eDNA coral sequencing, CMFRI landings)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500"
          />
        </div>
        <button type="submit" className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors">
          Search Literature
        </button>
      </form>

      {/* Research Paper Cards */}
      <div className="space-y-4">
        {papers.map((paper, idx) => (
          <motion.div
            key={paper.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.08 }}
            className="glass-card p-6 rounded-2xl border border-slate-200/80 space-y-3 shadow-sm hover:border-sky-300 transition-all"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>RAG Relevance: {paper.relevanceScore}</span>
              </span>

              <span className="text-xs text-slate-400 font-mono">DOI: {paper.doi}</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 leading-snug">{paper.title}</h3>
            
            <p className="text-xs text-slate-500 font-medium">
              Authors: <strong className="text-slate-700">{paper.authors}</strong> | {paper.journal}
            </p>

            <p className="text-xs text-slate-600 leading-relaxed font-sans pt-1">
              {paper.abstract}
            </p>

            <div className="pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <span className="font-mono">Source: <strong>{paper.source}</strong> ({paper.date})</span>
              
              <span className="text-sky-600 font-semibold flex items-center space-x-1">
                <span>Indexed Citation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
};
