/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab } from './types';
import { TopNav } from './components/Navigation/TopNav';
import { SideNav } from './components/Navigation/SideNav';
import { LandingView } from './components/Views/LandingView';
import { DashboardView } from './components/Views/DashboardView';
import { AnalyticsView } from './components/Views/AnalyticsView';
import { FloatChatView } from './components/Views/FloatChatView';
import { ExploreDataView } from './components/Views/ExploreDataView';
import { InteractiveMapView } from './components/Views/InteractiveMapView';
import { SourcesView } from './components/Views/SourcesView';
import { AboutView } from './components/Views/AboutView';
import { KnowledgeSyncModal } from './components/Modals/KnowledgeSyncModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { SupportModal } from './components/Modals/SupportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isSyncingGlobal, setIsSyncingGlobal] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState<string>('');

  const handleGlobalSync = () => {
    setIsSyncModalOpen(true);
  };

  const handleSearchSubmit = (query: string) => {
    setChatInitialQuery(query);
    setActiveTab('floatchat');
  };

  const handleQueryDatasetInChat = (datasetTitle: string) => {
    setChatInitialQuery(`Analyze spatial coverage and latest observations for: ${datasetTitle}`);
    setActiveTab('floatchat');
  };

  const isLanding = activeTab === 'landing';

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb] text-[#191c1e] selection:bg-[#00BFFF] selection:text-[#001b3d]">
      {/* Modals */}
      <KnowledgeSyncModal
        isOpen={isSyncModalOpen}
        onOpenChat={() => { setIsSyncModalOpen(false); setActiveTab('floatchat'); }}
        onClose={() => {
          setIsSyncModalOpen(false);
          setIsSyncingGlobal(false);
        }}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />

      {isLanding ? (
        /* Landing Page Layout (Full Width with its dedicated top nav) */
        <div className="flex-1 flex flex-col">
          <TopNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenMobileMenu={() => setIsMobileNavOpen(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            onSyncClick={handleGlobalSync}
            isSyncing={isSyncingGlobal}
          />
          <main className="flex-1 flex flex-col">
            <LandingView
              setActiveTab={setActiveTab}
              onExploreDataClick={() => setActiveTab('explore')}
              onAskAtlasClick={() => setActiveTab('floatchat')}
            />
          </main>
          {/* Landing Footer */}
          <footer className="bg-[#001b3d] text-white border-t border-[#00285a] py-8 px-4 md:px-8">
            <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00BFFF] text-[20px]">public</span>
                <span className="font-bold tracking-tight">Project Atlas — Ocean Intelligence</span>
              </div>
              <div className="flex items-center gap-6 font-label-caps text-[#9fc2fe]">
                <button onClick={() => setActiveTab('explore')} className="hover:text-white transition-colors">
                  Data Catalog
                </button>
                <button onClick={() => setActiveTab('dashboard')} className="hover:text-white transition-colors">
                  Telemetry Dashboard
                </button>
                <button onClick={() => setActiveTab('sources')} className="hover:text-white transition-colors">
                  Pipelines
                </button>
                <button onClick={() => setActiveTab('about')} className="hover:text-white transition-colors">
                  Architecture
                </button>
              </div>
              <div className="font-data-mono text-[#74777f]">
                © {new Date().getFullYear()} Project Atlas. Open Ocean Science.
              </div>
            </div>
          </footer>
        </div>
      ) : (
        /* In-App Full Application Layout (Sidebar + Top Bar + Content View) */
        <div className="flex h-screen w-screen overflow-hidden">
          {/* Side Navigation Bar */}
          <SideNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSyncClick={handleGlobalSync}
            onSettingsClick={() => setIsSettingsModalOpen(true)}
            onSupportClick={() => setIsSupportModalOpen(true)}
            isOpenMobile={isMobileNavOpen}
            onCloseMobile={() => setIsMobileNavOpen(false)}
            isSyncing={isSyncingGlobal}
          />

          {/* Main Application Area */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#f7f9fb]">
            <TopNav
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onOpenMobileMenu={() => setIsMobileNavOpen(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearchSubmit={handleSearchSubmit}
              onSyncClick={handleGlobalSync}
              isSyncing={isSyncingGlobal}
            />

            {/* View Canvas with motion transitions */}
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="flex-1 flex flex-col h-full overflow-hidden"
                >
                  {activeTab === 'dashboard' && (
                    <DashboardView
                      setActiveTab={setActiveTab}
                      onGenerateReport={() => setActiveTab('analytics')}
                    />
                  )}

                  {activeTab === 'floatchat' && (
                    <FloatChatView
                      setActiveTab={setActiveTab}
                      initialQuery={chatInitialQuery}
                    />
                  )}

                  {activeTab === 'explore' && (
                    <ExploreDataView
                      setActiveTab={setActiveTab}
                      onQueryDatasetInChat={handleQueryDatasetInChat}
                    />
                  )}

                  {activeTab === 'analytics' && (
                    <AnalyticsView setActiveTab={setActiveTab} />
                  )}

                  {activeTab === 'map' && (
                    <InteractiveMapView setActiveTab={setActiveTab} />
                  )}

                  {activeTab === 'sources' && (
                    <SourcesView
                      setActiveTab={setActiveTab}
                      onSyncClick={handleGlobalSync}
                    />
                  )}

                  {activeTab === 'about' && (
                    <AboutView setActiveTab={setActiveTab} />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
