import React from 'react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border border-[#c4c6cf] rounded-lg shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#e0e3e5] mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-[#00BFFF]">help</span>
            <h2 className="font-bold text-base text-[#001b3d]">Atlas Ocean Support &amp; Docs</h2>
          </div>
          <button onClick={onClose} className="text-[#74777f] hover:text-black">
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <p className="text-[#44474e] leading-relaxed">
            Need assistance integrating custom in-situ sensor networks, querying NetCDF datasets, or extending FloatChat multi-agent pipelines?
          </p>

          <div className="space-y-2 bg-[#f7f9fb] p-3 rounded border border-[#c4c6cf]">
            <div className="flex items-center gap-2 text-[#001b3d] font-semibold">
              <span className="material-symbols-outlined text-[16px] text-[#008ebe]">description</span>
              <span>API &amp; ERDDAP Documentation</span>
            </div>
            <p className="text-[#74777f] text-[11px]">
              Access full OpenAPI specifications and Python/R client libraries.
            </p>
          </div>

          <div className="space-y-2 bg-[#f7f9fb] p-3 rounded border border-[#c4c6cf]">
            <div className="flex items-center gap-2 text-[#001b3d] font-semibold">
              <span className="material-symbols-outlined text-[16px] text-[#008ebe]">mail</span>
              <span>Scientific Liaison Desk</span>
            </div>
            <p className="text-[#74777f] text-[11px] font-data-mono">
              support@project-atlas.ocean
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-[#e0e3e5]">
          <button
            onClick={onClose}
            className="w-full bg-[#001b3d] hover:bg-[#002d66] text-white py-2 rounded text-xs font-label-caps uppercase font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
