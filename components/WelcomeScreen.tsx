
import React, { useEffect, useState } from 'react';

interface WelcomeScreenProps {
  onComplete: (name: string) => void;
  existingName: string | null;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete, existingName }) => {
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(!existingName);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim() || existingName) {
      onComplete(userName.trim() || existingName || 'User');
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center text-white overflow-hidden transition-opacity duration-[2000ms] ${mounted ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: '#050506' }}
    >
      <div className="relative z-10 flex flex-col items-center text-center px-6 mb-20 animate-in fade-in zoom-in duration-[1500ms]">
        <h1 className="text-4xl md:text-7xl font-light tracking-tight leading-none mb-6 opacity-80 select-none">
          {existingName ? `Welcome back, ${existingName}, to` : 'Welcome to'}
        </h1>
        <h1 className="text-6xl md:text-9xl font-medium tracking-tighter leading-none select-none relative group">
          the <span className="text-[#6aa8ff] drop-shadow-[0_0_40px_rgba(106,168,255,0.7)] group-hover:drop-shadow-[0_0_60px_rgba(106,168,255,1)] transition-all duration-1000 animate-pulse">Lumina</span> era
        </h1>
      </div>

      {/* Animated Wave Strands - Matching the visual from the requested image */}
      <div className="absolute bottom-1/4 left-0 w-full h-40 flex items-center justify-center pointer-events-none overflow-hidden">
        <svg className="w-full h-full scale-110 opacity-60" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <defs>
            <linearGradient id="strand-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#6aa8ff" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="strand-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="strand-3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <g>
            <path className="animate-wave-slow" d="M0,60 Q360,20 720,60 T1440,60" fill="none" stroke="url(#strand-1)" strokeWidth="2.5" />
            <path className="animate-wave-medium" d="M0,60 Q360,100 720,60 T1440,60" fill="none" stroke="url(#strand-2)" strokeWidth="2.5" />
            <path className="animate-wave-fast" d="M0,60 Q360,40 720,60 T1440,60" fill="none" stroke="url(#strand-3)" strokeWidth="2.5" />
          </g>
        </svg>
      </div>

      <div className="relative z-20 mt-12 w-full max-w-sm px-8 flex flex-col items-center">
        {isFirstTime ? (
          <form onSubmit={handleSubmit} className="w-full space-y-6 animate-in slide-in-from-bottom-8 duration-700">
            <input 
              autoFocus
              type="text"
              placeholder="Who are you?"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[32px] px-8 py-5 text-xl text-center outline-none focus:border-[#6aa8ff]/50 focus:ring-8 focus:ring-[#6aa8ff]/5 transition-all placeholder:text-white/20 font-light"
            />
            <button
              type="submit"
              disabled={!userName.trim()}
              className="w-full py-5 bg-white text-black font-black tracking-[0.3em] text-[11px] uppercase rounded-full transition-all duration-700 hover:scale-[1.05] active:scale-95 disabled:opacity-20 shadow-2xl hover:shadow-[#6aa8ff]/20"
            >
              Enter The Era
            </button>
          </form>
        ) : (
          <button
            onClick={() => onComplete(existingName || 'User')}
            className="group relative px-20 py-6 bg-white text-black font-black tracking-[0.4em] text-[12px] uppercase rounded-full transition-all duration-1000 hover:scale-110 active:scale-95 shadow-[0_20px_80px_-10px_rgba(106,168,255,0.4)] animate-in slide-in-from-bottom-8 duration-1000"
          >
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 bg-white/40 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
          </button>
        )}
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scaleX(1.05); opacity: 0.8; }
        }
        .animate-wave-slow { animation: wave 12s infinite ease-in-out; }
        .animate-wave-medium { animation: wave 9s infinite ease-in-out; }
        .animate-wave-fast { animation: wave 6s infinite ease-in-out; }
      `}</style>
    </div>
  );
};
