import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Mail, Lock, User, Briefcase, ArrowRight, ShieldCheck } from 'lucide-react';

export const AuthView = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: 'A. K. Singh',
    email: 'ak.singh@ocean-intelligence.org',
    password: '••••••••',
    role: 'Chief Oceanographic Researcher'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    
    // Pass authenticated user object to parent
    onLogin({
      name: formData.name,
      email: formData.email,
      role: formData.role || 'Marine Intelligence User',
      initials: formData.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    });
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden select-none"
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 40%, #e0f2fe 100%)' }}
    >
      {/* Background Ocean Vector Graphics */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-sky-200/50 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-teal-200/40 rounded-full blur-3xl" />
      </div>

      {/* Main Glass Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl border border-sky-100 p-8 shadow-2xl shadow-sky-200/50 z-10 relative"
      >
        
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-sky-300/40">
            <Compass className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-black text-slate-900 font-mono tracking-wider">
            PROJECT ATLAS
          </h1>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">
            UNIFIED OCEAN INTELLIGENCE PLATFORM
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 font-semibold text-xs text-slate-600">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`py-2 rounded-lg transition-all ${!isSignUp ? 'bg-white text-sky-700 shadow-sm font-bold' : 'hover:text-slate-900'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`py-2 rounded-lg transition-all ${isSignUp ? 'bg-white text-sky-700 shadow-sm font-bold' : 'hover:text-slate-900'}`}
          >
            Create Account
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isSignUp && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  required={isSignUp}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500"
                />
              </div>
            </motion.div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@ocean-intelligence.org"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Research Discipline / Role</label>
            <div className="relative">
              <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500"
              >
                <option value="Chief Oceanographic Researcher">Chief Oceanographic Researcher</option>
                <option value="Fisheries Policy Analyst">Fisheries Policy Analyst</option>
                <option value="eDNA Molecular Scientist">eDNA Molecular Scientist</option>
                <option value="GIS Marine Specialist">GIS Marine Specialist</option>
                <option value="Research Scholar / Student">Research Scholar / Student</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 text-white font-bold text-xs hover:from-sky-500 hover:to-sky-400 shadow-md shadow-sky-300/50 transition-all flex items-center justify-center space-x-2 mt-2"
          >
            <span>{isSignUp ? 'Create Account & Initialize Atlas' : 'Sign In & Initialize Atlas'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>INCOIS • CMFRI • OBIS • NOAA Authenticated Access</span>
        </div>

      </motion.div>
    </div>
  );
};
