import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Thermometer, Dna, Fish, Droplets, Activity, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AiInsightsView = ({ setActiveTab }) => {
  const insights = [
    {
      id: 'ins-1',
      title: 'Ocean Temperature Anomaly',
      category: 'SST Warning',
      icon: Thermometer,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      confidence: '96%',
      explanation: 'Sustained +0.45°C thermal warming anomaly identified in Lakshadweep Sea corridor during recent satellite pass. Potential thermal stress on shallow staghorn coral reefs.',
      supportingData: 'NOAA AVHRR Telemetry | ARGO Float #2903341',
      targetTab: 'conditions'
    },
    {
      id: 'ins-2',
      title: 'Biodiversity Hotspot Surge',
      category: 'eDNA Genomics',
      icon: Dna,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      confidence: '92%',
      explanation: 'High concentration of Green Sea Turtle (Chelonia mydas) eDNA barcode sequences detected across Andaman reef sanctuaries following monsoon upwelling.',
      supportingData: 'OBIS Sequence #ATCG88921X | 142 Taxa Tracked',
      targetTab: 'biodiversity'
    },
    {
      id: 'ins-3',
      title: 'Fisheries Stock Shift',
      category: 'CMFRI Landings',
      icon: Fish,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      confidence: '89%',
      explanation: 'Indian Oil Sardine (Sardinella longiceps) catch volumes shifted 45 nautical miles northward along Maharashtra coastal shelf driven by ocean thermocline displacement.',
      supportingData: 'ICAR-CMFRI Landings Stream | 62,000 t Catch',
      targetTab: 'fisheries'
    },
    {
      id: 'ins-4',
      title: 'Salinity Stratification Pattern',
      category: 'CTD Hydrography',
      icon: Droplets,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      confidence: '95%',
      explanation: 'Sharp halocline boundary detected between 50m and 100m depth profiles in Northern Bay of Bengal following freshwater runoff.',
      supportingData: 'ARGO Float #2903348 | Salinity 34.8 PSU',
      targetTab: 'argo'
    },
    {
      id: 'ins-5',
      title: 'ARGO Observation Trend',
      category: 'Autonomous Array',
      icon: Activity,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      confidence: '98%',
      explanation: 'Deep profiling array cycle completion rate reached 100% across the Indian Ocean basin with zero sensor drift errors detected.',
      supportingData: '6 Active Profiling Arrays | INCOIS / CSIRO',
      targetTab: 'argo'
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          AI Ocean Insights
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Automated Anomaly Detection, Thermal Warnings & Predictive Marine Models.
        </p>
      </motion.div>

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insights.map((ins, idx) => {
          const Icon = ins.icon;
          return (
            <motion.div
              key={ins.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              whileHover={{ y: -3 }}
              className="glass-card p-6 rounded-2xl border border-slate-200/80 shadow-soft-blue flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl border ${ins.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex items-center space-x-1 text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                    <Sparkles className="w-3 h-3 text-sky-600" />
                    <span>Confidence: {ins.confidence}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{ins.category}</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{ins.title}</h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {ins.explanation}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-200/60">
                <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{ins.supportingData}</span>
                </div>

                <button
                  onClick={() => setActiveTab(ins.targetTab)}
                  className="w-full py-2 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center space-x-1.5 border border-slate-200"
                >
                  <span>Explore In-Depth Telemetry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
};
