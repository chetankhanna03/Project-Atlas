import React, { useState } from 'react';
import { INITIAL_CHAT_MESSAGES } from '../../data/oceanData';
import { ChatMessage, ActiveTab } from '../../types';

interface FloatChatViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  initialQuery?: string;
}

export const FloatChatView: React.FC<FloatChatViewProps> = ({ setActiveTab, initialQuery }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [inputVal, setInputVal] = useState(initialQuery || '');
  const [isThinking, setIsThinking] = useState(false);

  const presetQueries = [
    'Show Category 4 heatwaves in Indian Ocean',
    'Compare Salinity in Bay of Bengal vs Arabian Sea',
    'Predict tuna biomass migration under +1.5°C warming',
    'Inspect ARGO float 2904102 dissolved oxygen profiles',
  ];

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputVal;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + ' UTC',
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsThinking(true);

    setTimeout(() => {
      let responseContent = `Cross-referencing multi-sensor satellite data (NOAA/Copernicus) and ARGO profiling array for "${query}":\n\n`;
      let inlineMetric = {
        title: 'Query Correlation Index',
        value: '+1.4σ Dev',
        confidence: '91% (Multi-source validated)',
        source: 'Copernicus & ARGO Network',
      };

      if (query.toLowerCase().includes('heatwave') || query.toLowerCase().includes('warm')) {
        responseContent += `Elevated Marine Heatwave conditions detected in targeted sectors. Surface thermal anomalies peak at +2.1°C above climatological baseline (1991-2020).\n\nKey Impacts:\n1. Accelerated stratification limiting vertical nutrient replenishment.\n2. Chlorophyll-a concentrations depressed by 18%.\n3. Biomass displacement toward deeper sub-thermocline bands.`;
        inlineMetric = {
          title: 'Peak SST Anomaly',
          value: '+2.1°C',
          confidence: '95% (NOAA Coral Reef Watch)',
          source: 'NOAA CRW / Copernicus',
        };
      } else if (query.toLowerCase().includes('salinity')) {
        responseContent += `Salinity contrast analysis confirms Bay of Bengal is substantially fresher (32.8-33.5 PSU) due to heavy monsoonal river discharge (Ganges-Brahmaputra), whereas the Arabian Sea maintains high salinity (35.5-36.8 PSU) driven by high evaporation rates and limited continental runoff.`;
        inlineMetric = {
          title: 'Salinity Delta (AS - BoB)',
          value: '+3.2 PSU',
          confidence: '98% (SMAP / ARGO Array)',
          source: 'NASA JPL PO.DAAC',
        };
      } else if (query.toLowerCase().includes('tuna') || query.toLowerCase().includes('biomass') || query.toLowerCase().includes('fish')) {
        responseContent += `Predictive habitat envelope models indicate yellowfin and skipjack tuna stocks will shift 120-180 nautical miles south-southeast over the next 18 months under continued +1.5°C thermal forcing, affecting regional artisanal fleet catch efficiency by ~28%.`;
        inlineMetric = {
          title: 'Predicted CPUE Shift',
          value: '-28% yield',
          confidence: '88% (FAO / ICES Hindcast)',
          source: 'GFW & ICES Marine Science',
        };
      } else {
        responseContent += `Telemetry retrieved from 4 active ARGO profiling floats and 3 ESA Copernicus L4 grid products. The oceanic parameters in this sector demonstrate high seasonal stability with slight positive anomalies in surface heat flux.`;
      }

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + ' UTC',
        content: responseContent,
        agentChain: ['Planner Agent', 'Ocean Data RAG', 'Biomass Predictor'],
        inlineData: inlineMetric,
        actions: [
          { label: 'View on Map', icon: 'map', actionType: 'map' },
          { label: 'Show Sources', icon: 'source', actionType: 'sources' },
          { label: 'Analyze Trend', icon: 'trending_up', actionType: 'analytics' },
        ],
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsThinking(false);
    }, 1100);
  };

  const handleActionClick = (actionType: 'map' | 'sources' | 'analytics' | 'export') => {
    if (actionType === 'map') setActiveTab('map');
    else if (actionType === 'sources') setActiveTab('sources');
    else if (actionType === 'analytics') setActiveTab('analytics');
    else {
      alert('Report snapshot exported to workspace.');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f7f9fb]">
      {/* Top FloatChat Header */}
      <div className="bg-white border-b border-[#c4c6cf] px-4 md:px-8 py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00BFFF] text-[22px]">forum</span>
            <h1 className="font-bold text-lg text-[#001b3d] tracking-tight">
              FloatChat Intelligence Interface
            </h1>
          </div>
          <p className="text-[12px] text-[#44474e]">
            Natural Language Retrieval across Multi-Source Oceanographic Telemetry &amp; Literature
          </p>
        </div>

        {/* Multi-Agent Execution Pipeline Badge */}
        <div className="flex items-center gap-2 bg-[#f2f4f6] px-3 py-1.5 rounded border border-[#c4c6cf]">
          <span className="font-label-caps text-[10px] text-[#44474e] uppercase">Agent Pipeline:</span>
          <div className="flex items-center gap-1.5 text-[11px] font-data-mono text-[#001b3d]">
            <span className="bg-white px-1.5 py-0.5 rounded border border-[#c4c6cf]">Planner</span>
            <span className="text-[#74777f]">→</span>
            <span className="bg-white px-1.5 py-0.5 rounded border border-[#c4c6cf] text-[#008ebe]">Ocean RAG</span>
            <span className="text-[#74777f]">→</span>
            <span className="bg-white px-1.5 py-0.5 rounded border border-[#c4c6cf] text-[#006633]">Fisheries Model</span>
          </div>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 md:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-9 h-9 rounded-full bg-[#001b3d] text-white flex items-center justify-center shrink-0 border border-[#00BFFF] shadow-xs mt-1">
                    <span className="material-symbols-outlined text-[18px] text-[#00BFFF]">
                      smart_toy
                    </span>
                  </div>
                )}

                <div className={`flex flex-col max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Timestamp & Sender */}
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="font-label-caps text-[10px] text-[#74777f] uppercase">
                      {isUser ? 'Lead Oceanographer' : 'Atlas AI Marine Assistant'}
                    </span>
                    <span className="font-data-mono text-[10px] text-[#74777f]">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Bubble Content */}
                  <div
                    className={`p-4 md:p-5 rounded shadow-xs text-xs md:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#001b3d] text-white rounded-tr-none'
                        : 'bg-white border border-[#c4c6cf] text-[#191c1e] rounded-tl-none'
                    }`}
                  >
                    {/* Agent chain tags */}
                    {msg.agentChain && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-3 pb-2 border-b border-[#e0e3e5]">
                        <span className="font-label-caps text-[9px] text-[#74777f] uppercase">
                          Execution Path:
                        </span>
                        {msg.agentChain.map((agent, i) => (
                          <span
                            key={i}
                            className="font-data-mono text-[10px] bg-[#f2f4f6] text-[#001b3d] px-1.5 py-0.5 rounded border border-[#e0e3e5]"
                          >
                            {agent}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="whitespace-pre-line">{msg.content}</div>

                    {/* Inline Data Card */}
                    {msg.inlineData && (
                      <div className="mt-4 p-3 bg-[#f7f9fb] border border-[#00BFFF] rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <div className="font-label-caps text-[10px] text-[#44474e] uppercase">
                            {msg.inlineData.title}
                          </div>
                          <div className="text-xl font-bold text-[#001b3d] font-data-mono">
                            {msg.inlineData.value}
                          </div>
                        </div>
                        <div className="text-right sm:text-right text-[11px] font-data-mono text-[#008ebe]">
                          {msg.inlineData.confidence}
                        </div>
                      </div>
                    )}

                    {/* Interactive Action Pills */}
                    {msg.actions && (
                      <div className="mt-4 pt-3 border-t border-[#e0e3e5] flex flex-wrap gap-2">
                        {msg.actions.map((act, i) => (
                          <button
                            key={i}
                            onClick={() => handleActionClick(act.actionType)}
                            className="inline-flex items-center gap-1.5 bg-[#f2f4f6] hover:bg-[#001b3d] hover:text-white text-[#001b3d] border border-[#c4c6cf] px-3 py-1.5 rounded font-label-caps text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">{act.icon}</span>
                            <span>{act.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-full bg-[#001b3d] overflow-hidden border border-[#c4c6cf] shrink-0 mt-1">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmIj2ZiH67u8v_mV3SBtGZEVVz3xR4p-xwPaYBZAGjXMDxzW04giYkZuLn9YJT6M6n3kG783F308ovaUX6OgMt3FYPIwJoGXQa3ncUVEkg5zhK_MTWXj3AYQPHyjJFuLRKKnBbOAFon3MeHkmFSZ4nrGDF1bE2n6zLAJdr5df9EhMxBNTGWryt1Q0CKgaxvK2gfmG76suwns2vYJHZlInR_sNHGgqvlOH1IuACwd8eMz8Q3wtqmXcx0A"
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            );
          })}

          {isThinking && (
            <div className="flex gap-3 items-center">
              <div className="w-9 h-9 rounded-full bg-[#001b3d] text-white flex items-center justify-center shrink-0 border border-[#00BFFF]">
                <span className="material-symbols-outlined text-[18px] text-[#00BFFF] animate-spin">
                  sync
                </span>
              </div>
              <div className="bg-white border border-[#c4c6cf] rounded px-4 py-3 text-xs text-[#44474e] flex items-center gap-2 shadow-xs">
                <span className="font-data-mono">Synthesizing ARGO Telemetry &amp; RAG Knowledge Graph...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preset Query Chips & Input Box */}
      <div className="bg-white border-t border-[#c4c6cf] p-4 md:p-6 shrink-0">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Query Suggestion Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="font-label-caps text-[10px] text-[#74777f] uppercase whitespace-nowrap">
              Suggested:
            </span>
            {presetQueries.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="whitespace-nowrap text-xs bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#001b3d] border border-[#c4c6cf] px-3 py-1 rounded-full transition-colors font-medium cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask about SST anomalies, chlorophyll levels, fishing effort, or ARGO float telemetry..."
                className="w-full bg-[#f7f9fb] border border-[#c4c6cf] rounded py-3 pl-4 pr-12 text-sm text-[#191c1e] placeholder:text-[#74777f] focus:outline-none focus:border-[#00BFFF] focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setMessages(INITIAL_CHAT_MESSAGES)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74777f] hover:text-[#001b3d] text-[18px]"
                title="Reset Chat"
              >
                <span className="material-symbols-outlined">restart_alt</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={!inputVal.trim()}
              className={`bg-[#001b3d] text-white p-3 rounded flex items-center justify-center hover:bg-[#002d66] transition-colors shadow-xs active:scale-[0.98] cursor-pointer ${
                !inputVal.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Send Message"
            >
              <span className="material-symbols-outlined text-[20px] text-[#00BFFF]">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
