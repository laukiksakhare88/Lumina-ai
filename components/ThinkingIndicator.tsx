
import React, { useState, useEffect } from 'react';

export const ThinkingIndicator: React.FC = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 800); // Calm speed
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center text-white/30 text-[13px] font-light tracking-wide animate-in fade-in duration-1000">
      <span>Thinking{dots}</span>
    </div>
  );
};
