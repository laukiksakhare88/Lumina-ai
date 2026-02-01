
import React, { useState } from 'react';
import { MemoryItem, AppMode } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  memory: MemoryItem[];
  onDeleteMemory: (id: string) => void;
  onUpdateMemory: (id: string, newFact: string) => void;
  activeMode: AppMode;
  onNewChat: () => void;
  chatHistory: { id: string; title: string }[];
  onSelectHistory: (id: string) => void;
  userName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  memory, 
  onDeleteMemory, 
  onUpdateMemory, 
  activeMode,
  onNewChat,
  chatHistory,
  onSelectHistory,
  userName
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempFact, setTempFact] = useState('');

  const startEditing = (item: MemoryItem) => {
    setEditingId(item.id);
    setTempFact(item.fact);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setTempFact('');
  };

  const saveEditing = (id: string) => {
    if (tempFact.trim()) {
      onUpdateMemory(id, tempFact.trim());
    }
    setEditingId(null);
    setTempFact('');
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-xl z-[40] transition-opacity duration-700 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed left-0 top-0 h-full w-[360px] bg-[#080809] border-r border-white/5 z-[50] transition-transform duration-1000 cubic-bezier(0.16, 1, 0.3, 1) transform shadow-[30px_0_120px_rgba(0,0,0,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 flex flex-col h-full">
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-14">
            <h2 className="text-3xl font-black tracking-tighter text-white select-none transition-all hover:scale-105 cursor-default group">
              LUMINA<span className="text-[#6aa8ff] drop-shadow-[0_0_12px_rgba(106,168,255,0.7)] group-hover:drop-shadow-[0_0_20px_rgba(106,168,255,1)] transition-all">.AI</span>
            </h2>
            <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-3xl transition-all group active:scale-90">
              <svg className="w-6 h-6 text-white/20 group-hover:text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Profile Section */}
          <div className="mb-12 p-8 bg-white/[0.03] rounded-[40px] border border-white/5 flex items-center space-x-6 group hover:bg-white/[0.05] transition-all duration-700 cursor-default shadow-2xl">
            <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#6aa8ff] via-[#a78bfa] to-[#fb7185] flex items-center justify-center text-black font-black text-2xl shadow-xl transition-transform group-hover:scale-110 group-hover:rotate-6">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col truncate">
              <p className="text-[17px] font-black text-white/90 truncate tracking-tight mb-0.5">{userName}</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#6aa8ff] font-black opacity-60">Verified Core</p>
            </div>
          </div>

          {/* New Chat Action */}
          <button 
            onClick={() => { onNewChat(); onClose(); }}
            className="w-full flex items-center justify-center space-x-5 py-6 mb-12 bg-[#6aa8ff] text-black rounded-[32px] hover:scale-[1.04] active:scale-95 transition-all shadow-[0_20px_50px_rgba(106,168,255,0.25)] group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            <svg className="w-6 h-6 font-bold group-hover:rotate-180 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            <span className="text-[13px] uppercase tracking-[0.3em] font-black">New Conversation</span>
          </button>

          {/* Navigation Sections */}
          <div className="flex-1 overflow-hidden flex flex-col space-y-16 no-scrollbar">
            {/* Previous Chats History */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-6 mb-6">
                <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em]">Session Logs</h3>
                <span className="text-[10px] bg-white/5 px-3 py-1.5 rounded-full text-white/40 font-bold">{chatHistory.length}</span>
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar px-1">
                {chatHistory.length === 0 ? (
                  <div className="px-6 py-10 rounded-[40px] bg-white/[0.01] border border-dashed border-white/5 flex flex-col items-center opacity-30">
                    <p className="text-[13px] text-center italic font-light">History banks empty.</p>
                  </div>
                ) : (
                  chatHistory.map(chat => (
                    <button 
                      key={chat.id} 
                      onClick={() => { onSelectHistory(chat.id); onClose(); }}
                      className="w-full text-left px-6 py-5 rounded-[28px] hover:bg-white/[0.04] text-[15px] text-white/30 hover:text-white transition-all truncate border border-transparent hover:border-white/10 group flex items-center justify-between"
                    >
                      <span className="truncate pr-4">{chat.title}</span>
                      <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 flex-shrink-0 text-[#6aa8ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Cognitive Memory */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-6 px-6">
                <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em]">Core Memory</h3>
                <span className="text-[10px] bg-white/5 px-3 py-1.5 rounded-full text-white/40 font-bold">{memory.length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-5 px-1 pr-4 custom-scrollbar">
                {memory.map((item) => (
                  <div key={item.id} className="group relative bg-white/[0.02] p-7 rounded-[36px] border border-white/[0.04] hover:border-white/10 transition-all duration-700">
                    {editingId === item.id ? (
                      <div className="space-y-5">
                        <textarea
                          autoFocus
                          value={tempFact}
                          onChange={(e) => setTempFact(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-3xl p-5 text-[15px] text-white outline-none focus:border-[#6aa8ff]/50 resize-none transition-all"
                        />
                        <div className="flex items-center justify-end space-x-4">
                          <button onClick={cancelEditing} className="text-[11px] uppercase font-black text-white/30 hover:text-white/60 tracking-widest transition-colors">Discard</button>
                          <button onClick={() => saveEditing(item.id)} className="px-7 py-3 bg-[#6aa8ff]/10 text-[#6aa8ff] rounded-2xl text-[11px] uppercase font-black tracking-widest hover:bg-[#6aa8ff]/20 transition-all">Update</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-[9px] uppercase tracking-[0.4em] text-[#6aa8ff] font-black block mb-3 opacity-60">{item.category}</span>
                        <p className="text-[15px] text-white/40 leading-relaxed truncate group-hover:whitespace-normal transition-all duration-500">{item.fact}</p>
                        <div className="absolute top-6 right-6 flex space-x-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                          <button onClick={() => startEditing(item)} className="p-3 hover:bg-white/5 rounded-2xl text-white/20 hover:text-white/80 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => onDeleteMemory(item.id)} className="p-3 hover:bg-red-500/5 rounded-2xl text-white/20 hover:text-red-400 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
