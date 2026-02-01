
import React, { useState, useEffect, useMemo, memo } from 'react';
import { Message, GroundingChunk } from '../types';
import { ThinkingIndicator } from './ThinkingIndicator';

interface AIBlockProps {
  heading?: string;
  content: string;
  isStreaming: boolean;
  blockIndex: number;
  groundingChunks?: GroundingChunk[];
}

const AIBlock = memo(({ heading, content, isStreaming, blockIndex, groundingChunks }: AIBlockProps) => {
  const [headingVisible, setHeadingVisible] = useState(false);
  const [paragraphStarted, setParagraphStarted] = useState(false);
  const [displayedWordsCount, setDisplayedWordsCount] = useState(0);
  
  const cleanText = useMemo(() => {
    return content.replace(/[*$\[\]{}]/g, '').trim();
  }, [content]);

  const allWords = useMemo(() => cleanText.split(/\s+/).filter(w => w.length > 0), [cleanText]);

  useEffect(() => {
    const timer = setTimeout(() => setHeadingVisible(true), blockIndex * 150);
    return () => clearTimeout(timer);
  }, [blockIndex]);

  useEffect(() => {
    if (headingVisible) {
      const timer = setTimeout(() => setParagraphStarted(true), 400);
      return () => clearTimeout(timer);
    }
  }, [headingVisible]);

  useEffect(() => {
    if (!paragraphStarted) return;
    if (displayedWordsCount < allWords.length) {
      const timer = setTimeout(() => setDisplayedWordsCount(prev => prev + 1), 10);
      return () => clearTimeout(timer);
    }
  }, [paragraphStarted, displayedWordsCount, allWords.length]);

  const allTyped = displayedWordsCount >= allWords.length;

  return (
    <div className={`mb-16 last:mb-0 group/block animate-in fade-in duration-1000 will-change-opacity`}>
      {heading && (
        <h3 className={`font-medium transition-all duration-1000 ease-out transform will-change-transform text-[36px] text-white/95 mb-10 font-extralight tracking-tight ${headingVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {heading.replace(/^###\s*/, '')}
        </h3>
      )}
      <div className={`${paragraphStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-1000 ease-out will-change-transform`}>
        {cleanText && (
          <div className="text-[21px] leading-[1.8] text-white/70 font-light mb-12 tracking-tight">
            {allWords.slice(0, displayedWordsCount).join(" ")}
            {isStreaming && !allTyped && <span className="inline-block w-[3px] h-5 bg-[#6aa8ff]/80 ml-1 align-middle animate-pulse" />}
          </div>
        )}

        {allTyped && groundingChunks && groundingChunks.length > 0 && (
          <div className="mt-12 pt-12 border-t border-white/5 animate-in slide-in-from-bottom-6 duration-700">
            <h4 className="text-[11px] uppercase tracking-[0.5em] text-[#6aa8ff] mb-10 font-black flex items-center gap-6 before:h-[1px] before:w-16 before:bg-[#6aa8ff]/30">Verified Sources</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {groundingChunks.filter(c => c.web || c.maps).map((chunk, idx) => {
                const link = chunk.web || chunk.maps;
                if (!link) return null;
                const isMaps = !!chunk.maps;
                return (
                  <a key={link.uri + idx} href={link.uri} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between px-10 py-8 rounded-[40px] transition-all border group/link hover:scale-[1.03] backdrop-blur-3xl shadow-2xl will-change-transform bg-white/5 border-white/10 hover:border-white/20`}>
                    <div className="flex flex-col truncate">
                      <span className="text-[10px] uppercase tracking-[0.2em] opacity-30 font-black mb-2 group-hover/link:opacity-60 transition-opacity">{isMaps ? 'MAPS' : 'WEB'}</span>
                      <span className="text-[18px] font-medium truncate pr-4 text-white/80 transition-colors group-hover/link:text-white">{link.title || 'View Source'}</span>
                    </div>
                    <svg className="w-6 h-6 opacity-20 group-hover/link:opacity-100 transition-all transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export const MessageBubble = memo(({ message, isStreaming, onEdit }: { message: Message; isStreaming?: boolean; onEdit?: () => void }) => {
  const isAssistant = message.role === 'assistant';
  const showThinking = isAssistant && isStreaming && !message.content;

  const blocks = useMemo(() => {
    if (!isAssistant) return [];
    return message.content.split(/(?=###)/).filter(s => s.trim().length > 0).map(section => {
      const lines = section.trim().split('\n');
      const firstLine = lines[0].trim();
      if (firstLine.startsWith('###')) {
        return { heading: firstLine, content: lines.slice(1).join('\n') };
      }
      return { heading: undefined, content: section.trim() };
    });
  }, [message.content, isAssistant]);

  return (
    <div className={`flex w-full mb-32 group/msg ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[96%] md:max-w-[88%] ${isAssistant ? 'text-left' : 'text-right'}`}>
        {!isAssistant && (
          <div className="flex flex-col items-end space-y-8 animate-in slide-in-from-right-8 fade-in duration-700 will-change-transform">
            {message.attachment && (
              <div className="relative group rounded-[56px] overflow-hidden border border-white/10 shadow-2xl max-w-[480px] ring-1 ring-white/20 will-change-transform">
                <img src={`data:${message.attachment.mimeType};base64,${message.attachment.data}`} className="w-full h-auto object-cover transition-transform duration-[1200ms] group-hover:scale-110" alt="User input" />
              </div>
            )}
            {message.content && (
              <div className="inline-block px-12 py-9 bg-white/[0.08] rounded-[56px] rounded-tr-none border border-white/10 backdrop-blur-3xl text-[22px] text-white/95 shadow-2xl font-light leading-relaxed tracking-tight relative group/user-bubble will-change-transform">
                {message.content}
              </div>
            )}
          </div>
        )}
        
        {isAssistant && (
          <div className="pl-4 md:pl-10 relative">
            {showThinking ? <ThinkingIndicator /> : (
              <div className="space-y-10">
                {blocks.map((block, i) => (
                  <AIBlock 
                    key={message.timestamp + i} 
                    heading={block.heading} 
                    content={block.content} 
                    blockIndex={i} 
                    isStreaming={!!isStreaming && i === blocks.length - 1} 
                    groundingChunks={i === blocks.length - 1 ? message.groundingChunks : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
