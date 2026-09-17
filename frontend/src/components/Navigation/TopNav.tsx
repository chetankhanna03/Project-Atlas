import React, { useState } from 'react';
import { ActiveTab } from '../../types';

interface TopNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMobileMenu: () => void;
  onSearchSubmit?: (query: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSyncClick: () => void;
  isSyncing?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMobileMenu,
  onSearchSubmit,
  searchQuery,
  setSearchQuery,
  onSyncClick,
  isSyncing
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = [
    { id: '1', title: 'Anomalous SST Spike (+1.4°C)', source: 'NOAA Reef Watch Sector 7', time: '12m ago', unread: true },
    { id: '2', title: 'Argo Float #2904102 Transmitted', source: 'Bay of Bengal Deep Profile', time: '34m ago', unread: true },
    { id: '3', title: 'Knowledge Graph Re-indexed', source: 'Copernicus / GFW Node', time: '2h ago', unread: false }
  ];

  // Landing view navbar
  if (activeTab === 'landing') {
    return (
      <nav className="bg-white/95 backdrop-blur-md border-b border-[#c4c6cf] sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-4 md:px-8 h-16 max-w-[1440px] mx-auto">
          {/* Brand */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => setActiveTab('landing')}
          >
            <span className="material-symbols-outlined text-[#00BFFF] text-[24px]">public</span>
            <span className="font-bold text-[20px] text-[#001b3d] tracking-tight">Atlas</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex gap-8 items-center h-full">
            <button
              onClick={() => setActiveTab('explore')}
              className="text-[#44474e] font-medium hover:text-[#001b3d] transition-colors text-[14px]"
            >
              Explore
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className="text-[#44474e] font-medium hover:text-[#001b3d] transition-colors text-[14px]"
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className="text-[#44474e] font-medium hover:text-[#001b3d] transition-colors text-[14px]"
            >
              About
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onSyncClick}
              disabled={isSyncing}
              aria-label="sync"
              className="p-2 text-[#44474e] hover:text-[#001b3d] hover:bg-[#eceef0] rounded-full transition-colors"
              title="Sync Knowledge Graph"
            >
              <span className={`material-symbols-outlined text-[20px] ${isSyncing ? 'animate-spin text-[#00BFFF]' : ''}`}>
                sync
              </span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="notifications"
                className="p-2 text-[#44474e] hover:text-[#001b3d] hover:bg-[#eceef0] rounded-full transition-colors relative"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#c4c6cf] rounded shadow-lg p-3 z-50">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#e0e3e5]">
                    <span className="font-label-caps text-[11px] text-[#001b3d] uppercase tracking-wider">Telemetry Alerts</span>
                    <span className="font-data-mono text-[10px] text-[#44474e]">2 New</span>
                  </div>
                  <div className="space-y-2">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-2 rounded text-[12px] ${n.unread ? 'bg-[#f2f4f6]' : ''}`}>
                        <div className="font-medium text-[#001b3d]">{n.title}</div>
                        <div className="text-[11px] text-[#44474e] flex justify-between mt-0.5">
                          <span>{n.source}</span>
                          <span className="font-data-mono">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div 
              onClick={() => setActiveTab('dashboard')}
              className="w-8 h-8 rounded-full bg-[#e0e3e5] overflow-hidden border border-[#c4c6cf] cursor-pointer hover:ring-2 hover:ring-[#00BFFF] transition-all"
              title="Open Dashboard"
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmIj2ZiH67u8v_mV3SBtGZEVVz3xR4p-xwPaYBZAGjXMDxzW04giYkZuLn9YJT6M6n3kG783F308ovaUX6OgMt3FYPIwJoGXQa3ncUVEkg5zhK_MTWXj3AYQPHyjJFuLRKKnBbOAFon3MeHkmFSZ4nrGDF1bE2n6zLAJdr5df9EhMxBNTGWryt1Q0CKgaxvK2gfmG76suwns2vYJHZlInR_sNHGgqvlOH1IuACwd8eMz8Q3wtqmXcx0A"
                alt="Scientist Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // In-App header bar for Dashboard, Analytics, Explore, FloatChat, etc.
  return (
    <header className="bg-white border-b border-[#c4c6cf] sticky top-0 z-30 h-16 shrink-0 flex items-center px-4 md:px-8 justify-between">
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        {/* Mobile Menu Trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden text-[#44474e] p-2 rounded hover:bg-[#e0e3e5]"
          aria-label="Open Navigation Menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Global Search Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (onSearchSubmit && searchQuery.trim()) {
              onSearchSubmit(searchQuery);
            }
          }}
          className="relative w-full max-w-xl"
        >
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#74777f] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ask Atlas anything about the ocean..."
            className="w-full bg-white border border-[#c4c6cf] rounded py-2 pl-9 pr-4 text-[13px] font-normal text-[#191c1e] placeholder:text-[#74777f] focus:outline-none focus:border-[#00BFFF] focus:ring-1 focus:ring-[#00BFFF] transition-colors"
          />
        </form>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSyncClick}
          disabled={isSyncing}
          className="text-[#44474e] hover:text-[#001b3d] p-2 rounded hover:bg-[#e0e3e5] transition-colors"
          title="Synchronize Live Sensor Streams"
        >
          <span className={`material-symbols-outlined text-[20px] ${isSyncing ? 'animate-spin text-[#00BFFF]' : ''}`}>
            sync
          </span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-[#44474e] hover:text-[#001b3d] p-2 rounded hover:bg-[#e0e3e5] transition-colors relative"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#c4c6cf] rounded shadow-lg p-3 z-50">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#e0e3e5]">
                <span className="font-label-caps text-[11px] text-[#001b3d] uppercase tracking-wider">System Alerts</span>
                <span className="font-data-mono text-[10px] text-[#00BFFF]">Real-Time</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {notifications.map(n => (
                  <div key={n.id} className="p-2 rounded text-[12px] hover:bg-[#f2f4f6] transition-colors border-b border-[#f2f4f6] last:border-0">
                    <div className="font-medium text-[#001b3d]">{n.title}</div>
                    <div className="text-[11px] text-[#44474e] flex justify-between mt-1">
                      <span>{n.source}</span>
                      <span className="font-data-mono">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-8 h-8 rounded-full bg-[#001b3d] text-white flex items-center justify-center shrink-0 border border-[#c4c6cf] overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#00BFFF] transition-all"
        >
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLsYMyAOBO25QdCkSr9q9zP4SXFQ41jB5cwnxn4401pINs6swH-f4JVtCJvvozL6a_0NsjjajYopXQ8TKg6ZivsbrdqINcBJuafNBdBy3LECBqttRjapHMpRZXo1K7njkYf0EqMpVW-Jw1Ezp__DIutz09l6aGGG35Sw55Vt4GMCc-2YtdSzSRByI8bZjf2CSG6qPiJVYInoHWFhhaHwOBFuCwLc_4Kmczif36ugvprzImpX9D7jPiKA"
            alt="User Profile"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
};
