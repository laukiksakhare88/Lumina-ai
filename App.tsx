
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { WaveBackground } from './components/WaveBackground';
import { Sidebar } from './components/Sidebar';
import { ModeSelector } from './components/ModeSelector';
import { MessageBubble } from './components/MessageBubble';
import { AppMode, Message, MemoryItem, Attachment, GroundingChunk } from './types';
import { LuminaEngine } from './services/geminiService';

const engine = new LuminaEngine();

const isInternalMessage = (text: string) => {
  const t = text.toLowerCase();
  return t.includes("action_input") || t.includes("tool") || t.includes("function_call") || t.includes("arguments");
};

const App: React.FC = () => {
  const [isWelcomeDone, setIsWelcomeDone] = useState(false);
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('lumina_user_name'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.STUDY);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [memory, setMemory] = useState<MemoryItem[]>([]);
  const [chatHistory, setChatHistory] = useState<{ id: string; title: string; messages: Message[] }[]>(() => {
    const saved = localStorage.getItem('lumina_chat_history_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem('lumina_chat_history_v2', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px'; 
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 240)}px`;
    }
  }, [input]);

  const handleWelcomeComplete = (name: string) => {
    setUserName(name);
    localStorage.setItem('lumina_user_name', name);
    setIsWelcomeDone(true);
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      const title = firstUserMsg 
        ? firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '')
        : 'Session ' + new Date().toLocaleTimeString();
      
      const newHistoryEntry = { id: Date.now().toString(), title, messages };
      setChatHistory(prev => [newHistoryEntry, ...prev]);
    }
    setMessages([]);
  };

  const handleSelectHistory = (id: string) => {
    if (messages.length > 0) {
      handleNewChat();
    }
    const chat = chatHistory.find(c => c.id === id);
    if (chat) {
      setMessages(chat.messages);
      setChatHistory(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setPendingAttachment({ data: base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditMessage = (index: number) => {
    const msg = messages[index];
    if (msg.role === 'user') {
      setInput(msg.content);
      setMessages(prev => prev.slice(0, index));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !pendingAttachment) || isThinking) return;

    const currentInput = input;
    const currentAttachment = pendingAttachment || undefined;
    const userMsg: Message = { role: 'user', content: currentInput, timestamp: Date.now(), attachment: currentAttachment };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setPendingAttachment(null);
    setIsThinking(true);

    let assistantContent = '';
    let accumulatedChunks: GroundingChunk[] = [];
    const tempAssistantMsg: Message = { role: 'assistant', content: '', timestamp: Date.now() };
    setMessages(prev => [...prev, tempAssistantMsg]);

    try {
      const stream = engine.streamResponse(activeMode, messages, currentInput, memory, { name: userName || 'User', email: '' }, currentAttachment);
      for await (const result of stream) {
        if (result.text) {
          if (isInternalMessage(result.text)) continue;
          assistantContent += result.text;
        }
        if (result.groundingChunks) {
          accumulatedChunks = [...accumulatedChunks, ...result.groundingChunks];
        }

        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { 
            ...newMessages[newMessages.length - 1], 
            content: assistantContent,
            groundingChunks: accumulatedChunks.length > 0 ? accumulatedChunks : undefined
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Submission Error:", error);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isWelcomeDone) return <WelcomeScreen onComplete={handleWelcomeComplete} existingName={userName} />;

  return (
    <div className="relative h-screen w-full flex flex-col bg-[#050506] text-white overflow-hidden selection:bg-[#00d2ff]/40 transition-colors duration-1000">
      <WaveBackground />
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1600px] h-[1000px] bg-[#00d2ff]/5 blur-[220px] rounded-full pointer-events-none z-0 animate-pulse duration-[10000ms] will-change-opacity" />
      
      <header className="fixed top-0 left-0 w-full z-40 h-24 flex items-center justify-between px-6 md:px-12 backdrop-blur-3xl border-b border-white/[0.03]">
        <div className="flex items-center space-x-6">
          <button onClick={() => setIsSidebarOpen(true)} className="p-4 hover:bg-white/5 rounded-2xl transition-all active:scale-90 group will-change-transform">
            <svg className="w-6 h-6 text-white/40 group-hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="h-8 w-[1px] bg-white/10" />
          <ModeSelector activeMode={activeMode} onModeChange={setActiveMode} />
        </div>
        <div className="flex items-center space-x-6">
           <button onClick={handleNewChat} className="p-3 text-white/30 hover:text-[#00d2ff] transition-all hover:scale-110 active:scale-90 group" title="New Chat">
             <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-700 will-change-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
           </button>
          <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 group hover:border-[#00d2ff]/30 transition-all cursor-default">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_12px_#00d2ff] animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 group-hover:text-[#00d2ff] transition-colors">V3.1.2</span>
          </div>
        </div>
      </header>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        memory={memory}
        onDeleteMemory={(id) => setMemory(m => m.filter(i => i.id !== id))}
        onUpdateMemory={(id, fact) => setMemory(prev => prev.map(m => m.id === id ? {...m, fact} : m))}
        activeMode={activeMode}
        onNewChat={handleNewChat}
        chatHistory={chatHistory.map(c => ({ id: c.id, title: c.title }))}
        onSelectHistory={handleSelectHistory}
        userName={userName || 'Guest'}
      />

      <main ref={scrollRef} className="flex-1 overflow-y-auto pt-32 pb-64 px-4 md:px-0 custom-scrollbar scroll-smooth relative z-10 will-change-scroll">
        <div className="max-w-4xl mx-auto flex flex-col">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-20 animate-in fade-in slide-in-from-bottom-12 duration-[1800ms] cubic-bezier(0.2, 0.8, 0.2, 1)">
              <div className="relative group flex flex-col items-center select-none cursor-default">
                <h2 className="text-8xl md:text-[14rem] font-black tracking-tighter text-center uppercase transition-all duration-[2500ms] bg-gradient-to-b from-[#00f2ff] via-[#00d2ff] to-[#00a2ff] bg-clip-text text-transparent opacity-95 group-hover:scale-[1.04] relative z-10 drop-shadow-[0_0_50px_rgba(0,210,255,0.6)] will-change-transform">LUMINA</h2>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none blur-[100px] opacity-20 group-hover:opacity-60 transition-all duration-[3000ms] will-change-opacity">
                   <h2 className="text-8xl md:text-[14rem] font-black text-[#00d2ff] tracking-tighter uppercase">LUMINA</h2>
                </div>
                <div className="mt-[-8px] md:mt-[-35px] opacity-[0.1] group-hover:opacity-[0.35] transition-all duration-[2500ms] relative z-20 will-change-opacity">
                  <span className="text-[10px] md:text-[11px] uppercase tracking-[1.4em] font-thin text-white whitespace-nowrap">Built by Laukik</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                {[
                  { label: "Visionary Logic", query: "Draft a concept for a sustainable mars colony.", icon: "🚀", color: "hover:border-[#00d2ff]/40 hover:bg-[#00d2ff]/[0.02]" },
                  { label: "Deep Expert", query: "Contrast quantum entanglement with classical theory.", icon: "🧬", color: "hover:border-[#a78bfa]/40 hover:bg-[#a78bfa]/[0.02]" },
                  { label: "Visual Hunt", query: "Find me direct images of minimalist architecture.", icon: "📸", color: "hover:border-[#fb7185]/40 hover:bg-[#fb7185]/[0.02]" },
                  { label: "Clarification", query: "Explain thermodynamic entropy for a beginner.", icon: "⚛️", color: "hover:border-[#00d2ff]/40 hover:bg-[#00d2ff]/[0.02]" }
                ].map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => setInput(item.query)} 
                    className={`group relative p-10 bg-white/[0.015] border border-white/[0.04] rounded-[64px] text-left ${item.color} transition-all duration-1000 backdrop-blur-3xl shadow-2xl active:scale-[0.98] overflow-hidden animate-in slide-in-from-bottom-12 duration-[1000ms] will-change-transform`}
                    style={{ animationDelay: `${i * 180}ms` }}
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-6xl group-hover:scale-125 group-hover:rotate-12 group-hover:opacity-10 transition-all duration-1000">{item.icon}</div>
                    <p className="text-[9px] uppercase tracking-[0.6em] text-white/30 mb-6 font-black group-hover:text-white transition-colors">{item.label}</p>
                    <p className="text-[20px] text-white/20 group-hover:text-white/90 transition-all leading-relaxed font-light">{item.query}</p>
                    <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#00d2ff]/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000" />
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, idx) => (
            <MessageBubble 
              key={msg.timestamp + idx} 
              message={msg} 
              isStreaming={isThinking && idx === messages.length - 1} 
              onEdit={() => handleEditMessage(idx)}
            />
          ))}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full p-6 md:p-10 bg-gradient-to-t from-[#050506] via-[#050506]/98 to-transparent pointer-events-none z-30">
        <div className="max-w-5xl mx-auto pointer-events-auto">
          <div className="flex flex-col space-y-4">
            {messages.length > 0 && input.length < 5 && !isThinking && (
              <div className="flex space-x-3 overflow-x-auto no-scrollbar animate-in slide-in-from-bottom-4 duration-700 pb-2 scroll-smooth px-4">
                {["Summarize", "Deep Dive", "Visualize", "Simplify", "Technical Evidence"].map((suggest, i) => (
                  <button key={i} onClick={() => setInput(suggest)} className="px-6 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-full text-[9px] font-black tracking-[0.3em] uppercase text-white/20 hover:text-white hover:bg-white/10 hover:border-[#00d2ff]/40 transition-all whitespace-nowrap active:scale-95 shadow-xl backdrop-blur-3xl will-change-transform">{suggest}</button>
                ))}
              </div>
            )}

            {pendingAttachment && (
              <div className="animate-in slide-in-from-bottom-12 zoom-in-95 duration-1000 px-4">
                <div className="relative inline-block group">
                  <img src={`data:${pendingAttachment.mimeType};base64,${pendingAttachment.data}`} className="h-32 w-32 object-cover rounded-[32px] border border-[#00d2ff]/30 shadow-2xl ring-4 ring-[#00d2ff]/5 transition-transform duration-700 group-hover:scale-105 will-change-transform" alt="Attachment" />
                  <button onClick={() => setPendingAttachment(null)} className="absolute -top-3 -right-3 bg-[#fb7185] text-white rounded-full p-2.5 shadow-2xl transform hover:scale-125 active:scale-90 transition-all ring-2 ring-[#050506] z-10"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              </div>
            )}

            <div className="relative group/footer px-2">
              <form onSubmit={handleSubmit} className={`relative flex items-center bg-[#0d0d0f]/95 border rounded-[32px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] transition-all duration-700 backdrop-blur-3xl p-1 ${isThinking ? 'border-white/5 opacity-60' : 'border-white/5 focus-within:border-[#00d2ff]/40 focus-within:ring-[8px] focus-within:ring-[#00d2ff]/5 focus-within:shadow-[0_0_120px_rgba(0,210,255,0.08)]'}`}>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
                <div className="flex items-center space-x-0.5 pl-1">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-white/20 hover:text-[#00d2ff] transition-all hover:scale-110 active:scale-90" title="Upload Media"><svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                  <button type="button" onClick={() => cameraInputRef.current?.click()} className="p-2.5 text-white/20 hover:text-[#fb7185] transition-all hover:scale-110 active:scale-90" title="Take Photo"><svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                </div>
                <textarea ref={textareaRef} rows={1} value={input} onKeyDown={handleKeyDown} onChange={(e) => setInput(e.target.value)} placeholder="Initiate cognitive stream..." className="flex-1 bg-transparent py-3 text-[17px] text-white outline-none placeholder:text-white/10 px-5 resize-none custom-scrollbar font-light leading-snug tracking-tight will-change-height" style={{ minHeight: '40px' }} />
                <button type="submit" disabled={(!input.trim() && !pendingAttachment) || isThinking} className={`m-1 p-4 rounded-[22px] transition-all duration-700 ${ (input.trim() || pendingAttachment) && !isThinking ? 'bg-white text-black scale-100 hover:scale-[1.03] active:scale-95 shadow-xl' : 'bg-white/5 text-white/5 scale-95 opacity-30 cursor-not-allowed'}`}>
                  {isThinking ? <div className="w-5 h-5 border-[3px] border-current border-t-transparent rounded-full animate-spin" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
                </button>
              </form>
              <div className="mt-4 flex flex-col items-center justify-center opacity-[0.05] hover:opacity-25 transition-opacity duration-[3000ms]">
                <p className="text-[8px] text-white uppercase tracking-[1.2em] font-black">LUMINA.AI • Secure Node</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
