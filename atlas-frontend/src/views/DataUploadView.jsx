import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';

export const DataUploadView = () => {
  const [datasetType, setDatasetType] = useState('argo');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiService.uploadDataset(datasetType, formData);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Dataset Ingestion Portal
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Upload oceanographic CTD files, fisheries landing logs, or eDNA sequencing CSV/Excel datasets.
        </p>
      </motion.div>

      {/* Upload Settings & Form */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200/90 shadow-soft-blue space-y-6">
        
        {/* Dataset Type Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Target Marine Dataset Type:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'argo', label: 'ARGO Telemetry' },
              { id: 'fisheries', label: 'Fisheries Landings' },
              { id: 'biodiversity', label: 'Biodiversity eDNA' },
              { id: 'other', label: 'Other Marine GIS' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDatasetType(t.id)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  datasetType === t.id 
                    ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-sm' 
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-sky-200 hover:border-sky-400 bg-sky-50/40 rounded-2xl p-8 text-center space-y-3 transition-colors cursor-pointer relative"
        >
          <input 
            type="file"
            accept=".csv,.json,.xlsx,.xls"
            onChange={handleFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />

          <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-sky-100 mx-auto flex items-center justify-center text-sky-600">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800">
              {file ? file.name : 'Upload Dataset'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Drag and drop your marine dataset here or click to browse files
            </p>
          </div>

          <span className="inline-block text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200">
            Supported Formats: CSV, JSON, Excel (.xlsx)
          </span>
        </div>

        {/* Submit Upload */}
        <button
          onClick={handleUploadSubmit}
          disabled={!file || uploading}
          className="w-full py-3 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 transition-colors disabled:opacity-40 shadow-sm flex items-center justify-center space-x-2"
        >
          {uploading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <UploadCloud className="w-4 h-4" />
          )}
          <span>{uploading ? 'VALIDATING & INGESTING DATASET...' : 'START DATASET INGESTION'}</span>
        </button>

        {/* Upload Status Confirmation Results */}
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <h4 className="font-bold text-sm">Dataset Ingestion Complete!</h4>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-white p-3 rounded-xl border border-emerald-100">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Records Ingested</span>
                <strong className="text-emerald-700 text-sm">{result.recordsDetected}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Validation Errors</span>
                <strong className="text-slate-800 text-sm">{result.errors}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Target Collection</span>
                <strong className="text-sky-700 uppercase text-xs">{result.type}</strong>
              </div>
            </div>

            <p className="text-xs font-medium text-emerald-800">{result.message}</p>
          </motion.div>
        )}

      </div>

    </div>
  );
};
