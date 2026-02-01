
import React, { useRef, useState, useEffect } from 'react';
import { AppMode } from '../types';

interface ModeSelectorProps {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ activeMode, onModeChange }) => {
  const modes = Object.values(AppMode);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  return (
    <div className="relative group">
      {/* Scroll Indicators (Fades) */}
      <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#050506] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#050506] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`} />

      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex overflow-x-auto no-scrollbar gap-2.5 p-1.5 bg-white/[0.02] rounded-[28px] border border-white/[0.05] backdrop-blur-3xl touch-pan-x active:cursor-grabbing cursor-grab select-none max-w-[calc(100vw-140px)] md:max-w-2xl scroll-smooth"
      >
        {modes.map((mode) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-500 whitespace-nowrap active:scale-90 ${
              activeMode === mode 
                ? 'bg-[#00d2ff] text-[#050506] shadow-[0_0_35px_rgba(0,210,255,0.4)] scale-100 ring-2 ring-white/20' 
                : 'text-white/25 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
};
