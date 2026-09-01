import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  Search, 
  Bell, 
  Radio, 
  Menu, 
  LogOut,
  ChevronDown
} from 'lucide-react';

export const Navbar = ({ sidebarOpen, setSidebarOpen, searchQuery, setSearchQuery, user, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass-nav px-4 lg:px-6 py-2.5 transition-all select-none">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left Section: Sidebar Toggle & Brand */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 transition-colors"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 text-white shadow-md shadow-sky-200">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 font-mono">
                  PROJECT ATLAS
                </span>
                <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  SCIENTIFIC v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Unified Ocean Intelligence</p>
            </div>
          </div>
        </div>

        {/* Center Section: Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ARGO floats, species, telemetry, publications..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-medium focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right Section: Telemetry Status, Notifications, User Profile */}
        <div className="flex items-center space-x-3">
          
          {/* Telemetry Status */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-mono text-emerald-700">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="font-semibold text-[11px]">API CONNECTED</span>
          </div>

          {/* Notifications Icon */}
          <div className="relative">
            <button className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500 ring-2 ring-white"></span>
          </div>

          {/* Logged-in User Profile Avatar Dropdown */}
          <div className="relative pl-2 border-l border-slate-200">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-100/80 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-teal-400 text-white font-black text-xs shadow-md shadow-sky-200 flex items-center justify-center shrink-0">
                {user?.initials || 'US'}
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-bold text-slate-800 leading-none">{user?.name || 'A. K. Singh'}</p>
                <p className="text-[10px] text-slate-500 truncate max-w-[130px]">{user?.role || 'Researcher'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {/* Logout Dropdown Menu */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 space-y-1"
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800">{user?.name || 'A. K. Singh'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email || 'ak.singh@ocean.org'}</p>
                  </div>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </header>
  );
};
