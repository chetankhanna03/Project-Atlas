import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, User, ShieldCheck, Globe } from 'lucide-react';
import { apiService } from '../services/api';

export const FloatChatView = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Namaste! I am FloatChat, your AI Ocean Intelligence Assistant. Ask me anything about ARGO floats, fisheries, eDNA biodiversity, or oceanography in English or Hinglish.',
      language: 'english',
      intent: 'GENERAL_CONVERSATION',
      time: 'Just now'
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [promptCategory, setPromptCategory] = useState('hinglish'); // 'hinglish' | 'english'
  const messagesEndRef = useRef(null);

  const hinglishPrompts = [
    "Arabian Sea me temperature kitna hai?",
    "Arabian Sea ke paas kaunse ARGO floats active hain?",
    "bhai ARGO float kya hota hai?",
    "Arabian Sea mein biodiversity hotspots kaha hain?",
    "temperature aur salinity ka relation samjha",
    "ye data simple language me explain karo"
  ];

  const englishPrompts = [
    "What is the current temperature in the Arabian Sea?",
    "Show active ARGO floats near Kerala coast",
    "What is an ARGO float?",
    "Where are biodiversity hotspots in the Indian Ocean?",
    "Explain the relationship between temperature and salinity",
    "Show me fisheries catch data near Mumbai"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      const res = await apiService.queryFloatChat(query);
      
      const assistantMsg = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: res.answer || res.response,
        language: res.language || 'english',
        intent: res.intent || 'DATA_QUERY',
        dataset: res.dataset || 'ARGO',
        card: res.card,
        data: res.data,
        sources: res.sources,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-4 pb-8 max-w-4xl mx-auto">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-1">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-700 mb-1">
          <Globe className="w-3.5 h-3.5 text-sky-600" />
          <span>ENGLISH & HINGLISH AI OCEAN ASSISTANT</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">FloatChat AI</h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Ask oceanographic, fisheries and biodiversity questions in English or Hinglish.
        </p>
      </motion.div>

      {/* Main Chat Panel */}
      <div className="glass-card rounded-2xl border border-slate-200/90 shadow-soft-blue flex flex-col h-[520px] overflow-hidden">
        
        {/* Messages List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex space-x-3 max-w-2xl ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    msg.sender === 'user' 
                      ? 'bg-sky-600 text-white shadow-sm' 
                      : 'bg-gradient-to-tr from-sky-100 to-sky-200 border border-sky-300 text-sky-800'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Bubble */}
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed space-y-3 ${
                    msg.sender === 'user' 
                      ? 'bg-sky-600 text-white rounded-tr-none' 
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none shadow-sm'
                  }`}>
                    
                    {/* Metadata Header for Assistant Messages */}
                    {msg.sender === 'assistant' && msg.intent && (
                      <div className="flex items-center space-x-2 border-b border-slate-200/60 pb-1.5 font-mono text-[10px] text-slate-500">
                        <span className="uppercase font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                          {msg.language}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-600">{msg.intent}</span>
                        {msg.dataset && (
                          <>
                            <span>•</span>
                            <span className="text-teal-700 font-bold">{msg.dataset}</span>
                          </>
                        )}
                      </div>
                    )}

                    <p className="font-sans font-medium text-sm">{msg.text}</p>

                    {/* Rich Data Card inside Assistant Response */}
                    {msg.card && (
                      <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2 text-slate-800">
                        <div className="flex items-center justify-between font-bold text-sky-700">
                          <span>{msg.card.title}</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 pt-1 border-t border-slate-100">
                          {msg.card.temp && <div>Temp: <strong>{msg.card.temp}</strong></div>}
                          {msg.card.salinity && <div>Salinity: <strong>{msg.card.salinity}</strong></div>}
                          {msg.card.floatId && <div>Float ID: <strong>#{msg.card.floatId}</strong></div>}
                          {msg.card.sst && <div>SST: <strong>{msg.card.sst}</strong></div>}
                        </div>
                      </div>
                    )}

                    {/* Evidence Citations */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                        <span>Sources:</span>
                        {msg.sources.map((c, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

                    <span className="block text-[10px] opacity-70 text-right font-mono pt-1">{msg.time}</span>
                  </div>

                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-mono p-2">
              <Bot className="w-4 h-4 animate-bounce text-sky-600" />
              <span>FloatChat AI processing ocean telemetry...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Pills Categorized into English & Hinglish */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 space-y-2">
          
          {/* Category Tabs */}
          <div className="flex items-center space-x-2 text-[11px] font-bold">
            <span className="text-slate-400">Suggested Prompts:</span>
            <button
              onClick={() => setPromptCategory('hinglish')}
              className={`px-2.5 py-0.5 rounded-lg border transition-all ${
                promptCategory === 'hinglish' 
                  ? 'bg-sky-600 text-white border-sky-600' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
              }`}
            >
              Hinglish
            </button>
            <button
              onClick={() => setPromptCategory('english')}
              className={`px-2.5 py-0.5 rounded-lg border transition-all ${
                promptCategory === 'english' 
                  ? 'bg-sky-600 text-white border-sky-600' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
              }`}
            >
              English
            </button>
          </div>

          {/* Prompt Pills */}
          <div className="flex flex-wrap gap-2">
            {(promptCategory === 'hinglish' ? hinglishPrompts : englishPrompts).map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-xl bg-white border border-slate-200/90 text-[11px] font-medium text-slate-600 hover:text-sky-700 hover:border-sky-300 transition-all truncate max-w-xs"
              >
                {prompt}
              </button>
            ))}
          </div>

        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3 bg-white border-t border-slate-200 flex gap-2">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              promptCategory === 'hinglish'
                ? "Poochho: Arabian Sea me temperature kitna hai? / bhai ARGO float kya hota hai?..."
                : "Ask: What is the temperature in the Arabian Sea? / What is an ARGO float?..."
            }
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-4 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 transition-colors disabled:opacity-40 flex items-center space-x-1"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>

    </div>
  );
};
