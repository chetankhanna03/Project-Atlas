import React, { useState, useEffect } from 'react';

interface KnowledgeSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KnowledgeSyncModal: React.FC<KnowledgeSyncModalProps> = ({ isOpen, onClose }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initiating handshake with NOAA ERDDAP server...');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setIsComplete(false);
      return;
    }

    const steps = [
      { p: 18, msg: 'Ingesting Copernicus L4 SST grid tiles (0.05°)...' },
      { p: 42, msg: 'Synchronizing 4,028 active ARGO profiling float profiles...' },
      { p: 68, msg: 'Matching AIS vessel trajectories with Global Fishing Watch...' },
      { p: 89, msg: 'Re-indexing knowledge graph embeddings & vector stores...' },
      { p: 100, msg: 'Knowledge Graph Synchronized. Latency: 8ms.' },
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setProgress(steps[stepIdx].p);
        setCurrentStep(steps[stepIdx].msg);
        if (steps[stepIdx].p === 100) {
          setIsComplete(true);
        }
        stepIdx++;
      } else {
        clearInterval(interval);
      }
    }, 700);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border border-[#c4c6cf] rounded-lg shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#e0e3e5] mb-4">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-[22px] text-[#00BFFF] ${!isComplete ? 'animate-spin' : ''}`}>
              sync
            </span>
            <h2 className="font-bold text-base text-[#001b3d]">Knowledge Graph Synchronization</h2>
          </div>
          {isComplete && (
            <button onClick={onClose} className="text-[#74777f] hover:text-black">
              ✕
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="w-full bg-[#e0e3e5] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#001b3d] h-full transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between text-xs font-data-mono">
            <span className="text-[#74777f]">{progress}% Complete</span>
            <span className="text-[#00BFFF] font-bold">
              {isComplete ? 'ALL PIPELINES LIVE' : 'SYNCING...'}
            </span>
          </div>

          <div className="p-3 bg-[#f7f9fb] rounded border border-[#c4c6cf] text-xs font-data-mono text-[#001b3d] min-h-[48px] flex items-center">
            {currentStep}
          </div>

          {isComplete ? (
            <button
              onClick={onClose}
              className="w-full bg-[#001b3d] hover:bg-[#002d66] text-white py-2.5 rounded font-label-caps text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          ) : (
            <div className="text-center text-[11px] text-[#74777f]">
              Processing multi-agent vector embeddings...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
