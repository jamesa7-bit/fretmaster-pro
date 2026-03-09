'use client';

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

export interface InfoSection {
  heading: string;
  content: string;
}

interface InfoTooltipProps {
  title: string;
  sections: InfoSection[];
}

export default function InfoTooltip({ title, sections }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1 rounded-full text-white/20 hover:text-[#16a34a] transition-colors"
        aria-label={`About ${title}`}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-[8px] bg-[#0A0A0A]/70 animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[#111] border border-white/10 rounded-[16px] p-6 max-w-[380px] w-full shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#16a34a] mb-1">About this tool</div>
                <h3 className="text-lg font-extrabold tracking-tight">{title}</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-white/30 hover:text-white transition-colors shrink-0 mt-0.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {sections.map((s, i) => (
                <div key={i}>
                  <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#16a34a]/70 mb-1.5">
                    {s.heading}
                  </div>
                  <p className="text-sm text-white/55 leading-relaxed">{s.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
