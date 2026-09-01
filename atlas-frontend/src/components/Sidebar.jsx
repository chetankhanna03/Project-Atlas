import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, 
  Waves, 
  Activity, 
  Fish, 
  Dna, 
  Map, 
  BookOpen, 
  Bot, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'conditions', label: 'Ocean Conditions', icon: Waves },
    { id: 'argo', label: 'ARGO Floats', icon: Activity },
    { id: 'fisheries', label: 'Fisheries', icon: Fish },
    { id: 'biodiversity', label: 'Biodiversity', icon: Dna },
    { id: 'gis', label: 'GIS Explorer', icon: Map },
    { id: 'research', label: 'Scientific Research', icon: BookOpen },
    { id: 'floatchat', label: 'FloatChat AI', icon: Bot, badge: 'AI' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside 
      className={`fixed left-0 top-14 bottom-0 z-30 bg-white border-r border-slate-200/90 transition-all duration-300 flex flex-col justify-between shadow-sm ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Menu List */}
      <div className="py-4 px-2 overflow-y-auto space-y-1 no-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive 
                  ? 'bg-sky-50 text-sky-700 font-bold border-r-4 border-sky-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
              
              {sidebarOpen && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-100 text-sky-700 uppercase">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-white border border-slate-200/60 transition-all"
        >
          {sidebarOpen ? (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Navigation</span>
            </>
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
};
