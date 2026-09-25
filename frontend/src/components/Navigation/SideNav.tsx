import React from 'react';
import { ActiveTab } from '../../types';

interface SideNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onSyncClick: () => void;
  onSettingsClick: () => void;
  onSupportClick: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isSyncing?: boolean;
}

export const SideNav: React.FC<SideNavProps> = ({
  activeTab,
  setActiveTab,
  onSyncClick,
  onSettingsClick,
  onSupportClick,
  isOpenMobile,
  onCloseMobile,
  isSyncing
}) => {
  const navItems: Array<{ id: ActiveTab; label: string; icon: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'floatchat', label: 'FloatChat', icon: 'forum' },
    { id: 'analytics', label: 'Analytics', icon: 'insights' },
    { id: 'map', label: 'Map', icon: 'map' },
    { id: 'sources', label: 'Sources', icon: 'source' },
    { id: 'about', label: 'About Atlas', icon: 'info' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <nav
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#f2f4f6] border-r border-[#c4c6cf] 
          flex-col py-6 px-4 shrink-0 transition-transform duration-200 ease-in-out
          ${isOpenMobile ? 'flex' : 'hidden md:flex'}
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div 
          className="flex items-center gap-3 mb-8 px-2 cursor-pointer group"
          onClick={() => { setActiveTab('landing'); onCloseMobile?.(); }}
          title="Go to Home"
        >
          <div className="w-10 h-10 rounded bg-[#001b3d] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#00285a] transition-colors">
            <span className="material-symbols-outlined fill text-[22px] text-[#00BFFF]">public</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[18px] text-[#001b3d] tracking-tight leading-tight">Project Atlas</span>
            <span className="font-label-caps text-[10px] text-[#44474e] uppercase tracking-wider">Ocean Intelligence</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  setActiveTab(item.id);
                  onCloseMobile?.();
                }}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-left transition-all duration-150 group
                  ${isActive 
                    ? 'bg-[#9fc2fe] text-[#001b3d] font-bold shadow-xs' 
                    : 'text-[#44474e] hover:bg-[#e0e3e5] hover:text-[#001b3d] font-medium'
                  }
                `}
              >
                <span 
                  className={`material-symbols-outlined text-[20px] transition-colors ${
                    isActive ? 'text-[#001b3d] fill' : 'text-[#44474e] group-hover:text-[#001b3d]'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="font-label-caps text-[12px] tracking-wide uppercase">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Button & Bottom Links */}
        <div className="mt-auto pt-4 flex flex-col gap-3 border-t border-[#c4c6cf]">
          <button
            onClick={onSyncClick}
            disabled={isSyncing}
            className={`
              w-full bg-[#001b3d] hover:bg-[#002d66] text-white py-2.5 px-3 rounded 
              font-label-caps text-[11px] tracking-wider uppercase flex items-center justify-center gap-2 
              transition-all shadow-xs active:scale-[0.98] cursor-pointer
              ${isSyncing ? 'opacity-80' : ''}
            `}
          >
            <span className={`material-symbols-outlined text-[16px] text-[#00BFFF] ${isSyncing ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{isSyncing ? 'Loading...' : 'Knowledge library'}</span>
          </button>

          <div className="flex flex-col gap-0.5">
            <button
              onClick={onSettingsClick}
              className="flex items-center gap-3 px-3 py-2 text-[#44474e] hover:bg-[#e0e3e5] hover:text-[#001b3d] rounded text-left transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
              <span className="font-label-caps text-[11px] uppercase tracking-wider">Settings</span>
            </button>
            <button
              onClick={onSupportClick}
              className="flex items-center gap-3 px-3 py-2 text-[#44474e] hover:bg-[#e0e3e5] hover:text-[#001b3d] rounded text-left transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">help</span>
              <span className="font-label-caps text-[11px] uppercase tracking-wider">Support</span>
            </button>
          </div>

          {/* User Profile Mini Badge */}
          <div className="flex items-center gap-2.5 px-2 pt-2 border-t border-[#e0e3e5]">
            <div className="w-8 h-8 rounded bg-[#001b3d] overflow-hidden border border-[#c4c6cf] shrink-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmkwNtsl9tlOSuCy4f4oq0g1w99N16gFC3wrjzY1LAhl1HA_x5rcVVxNE18JP0zunD1e43550Fq_A3aGubsn8ZYOgvVhv66rYsQuKeL3mGxzQb-WJ7g5IpD0us9qDxjzXprjya2VlcZI7cO_-KbXVxJyKtGViw4vbsCNekS1uVDUh9C_2PEQKPGrUzSmD-ANUkJcnAcCvyQ8dPNHoZY6uUEl_p0JVWPwRKi7S8Of_ZhEojvRCpw_vUJA"
                alt="Atlas Agent"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-caps text-[11px] text-[#001b3d] truncate">Atlas Intelligence</span>
              <span className="font-data-mono text-[10px] text-[#44474e]">Local workspace</span>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
