import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthView } from './views/AuthView';
import { AtlasIntro } from './components/AtlasIntro';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { OverviewView } from './views/OverviewView';
import { OceanConditionsView } from './views/OceanConditionsView';
import { ArgoFloatsView } from './views/ArgoFloatsView';
import { FisheriesIntelView } from './views/FisheriesIntelView';
import { BiodiversityIntelView } from './views/BiodiversityIntelView';
import { GisExplorerView } from './views/GisExplorerView';
import { ScientificResearchView } from './views/ScientificResearchView';
import { FloatChatView } from './views/FloatChatView';
import { SettingsView } from './views/SettingsView';

// Main Dashboard Component
function MainDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-sky-100 selection:text-sky-900">
      {/* Top Navbar */}
      <Navbar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Dashboard Layout */}
      <div className="flex pt-0 relative min-h-[calc(100vh-3.5rem)]">
        
        {/* Collapsible Left Sidebar */}
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Content Area */}
        <main 
          className={`flex-1 transition-all duration-300 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto ${
            sidebarOpen ? 'md:ml-64' : 'md:ml-16'
          }`}
        >
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <OverviewView setActiveTab={setActiveTab} />
              </motion.div>
            )}

            {activeTab === 'conditions' && (
              <motion.div key="conditions" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <OceanConditionsView />
              </motion.div>
            )}

            {activeTab === 'argo' && (
              <motion.div key="argo" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <ArgoFloatsView setActiveTab={setActiveTab} />
              </motion.div>
            )}

            {activeTab === 'fisheries' && (
              <motion.div key="fisheries" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <FisheriesIntelView />
              </motion.div>
            )}

            {activeTab === 'biodiversity' && (
              <motion.div key="biodiversity" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <BiodiversityIntelView />
              </motion.div>
            )}

            {activeTab === 'gis' && (
              <motion.div key="gis" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <GisExplorerView />
              </motion.div>
            )}

            {activeTab === 'research' && (
              <motion.div key="research" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <ScientificResearchView />
              </motion.div>
            )}

            {activeTab === 'floatchat' && (
              <motion.div key="floatchat" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <FloatChatView />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <SettingsView />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}

export function App() {
  const [user, setUser] = useState(null);
  const [showIntro, setShowIntro] = useState(false);

  // 1. If not authenticated, show Login & Sign Up view first
  if (!user) {
    return (
      <AuthView 
        onLogin={(loggedInUser) => {
          setUser(loggedInUser);
          setShowIntro(true); // Trigger 9-stage intro animation after login
        }} 
      />
    );
  }

  // 2. If user logged in and intro is active, play intro sequence
  if (showIntro) {
    return <AtlasIntro onComplete={() => setShowIntro(false)} />;
  }

  // 3. Render Main Dashboard with authenticated user data
  return (
    <MainDashboard 
      user={user} 
      onLogout={() => {
        setUser(null);
        setShowIntro(false);
      }} 
    />
  );
}

export default App;
