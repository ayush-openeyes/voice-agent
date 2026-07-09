'use client';

// ============================================================
// Metadata Footer — Model info, latency, tools, safety status
// ============================================================

import { motion } from 'framer-motion';
import { SafetyInfo } from '@/types';
import { Shield, Clock, Cpu, Wrench } from 'lucide-react';

interface MetadataFooterProps {
  model?: string;
  latencyMs?: number;
  toolsUsed?: string[];
  safety?: SafetyInfo;
}

export function MetadataFooter({ model, latencyMs, toolsUsed, safety }: MetadataFooterProps) {
  const currentModel = model || 'llama-3.3-70b-versatile';

  return (
    <motion.div
      className="flex flex-col p-4 gap-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Model Info Block */}
      <div className="bg-white border-2 border-[#2D3748] rounded-md shadow-[4px_4px_0_0_#2D3748] p-3 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-black uppercase text-[#2D3748] tracking-widest border-b-2 border-[#2D3748] pb-1 mb-1">
          <Cpu size={14} className="text-[#FF6B6B]" />
          Engine
        </div>
        <div className="font-mono text-sm text-[#4A5568]">{currentModel}</div>
      </div>

      {/* Latency Block */}
      <div className="bg-white border-2 border-[#2D3748] rounded-md shadow-[4px_4px_0_0_#2D3748] p-3 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-black uppercase text-[#2D3748] tracking-widest border-b-2 border-[#2D3748] pb-1 mb-1">
          <Clock size={14} className="text-[#4ECDC4]" />
          Latency
        </div>
        <div className="font-mono text-xl font-bold text-[#2D3748]">
          {latencyMs !== undefined ? `${latencyMs}ms` : '---'}
        </div>
      </div>

      {/* Tools Block */}
      <div className="bg-white border-2 border-[#2D3748] rounded-md shadow-[4px_4px_0_0_#2D3748] p-3 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-black uppercase text-[#2D3748] tracking-widest border-b-2 border-[#2D3748] pb-1 mb-1">
          <Wrench size={14} className="text-[#FFE66D]" />
          Active Tools
        </div>
        <div className="font-mono text-xs text-[#4A5568]">
          {toolsUsed && toolsUsed.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-1">
              {toolsUsed.map(t => (
                <span key={t} className="bg-[#FFE66D] px-2 py-1 border border-[#2D3748] rounded font-bold text-[#2D3748]">{t}</span>
              ))}
            </div>
          ) : (
            'None'
          )}
        </div>
      </div>

      {/* Safety Block */}
      <div className={`bg-white border-2 border-[#2D3748] rounded-md shadow-[4px_4px_0_0_#2D3748] p-3 flex flex-col gap-1`}>
        <div className="flex items-center gap-2 text-xs font-black uppercase text-[#2D3748] tracking-widest border-b-2 border-[#2D3748] pb-1 mb-1">
          <Shield size={14} className={safety?.passed === false ? "text-[#FF6B6B]" : "text-[#38E54D]"} />
          Safety Check
        </div>
        <div className="font-mono text-sm font-bold mt-1">
          {safety ? (
            safety.passed ? (
              <span className="text-[#38E54D] bg-[#38E54D]/10 px-2 py-1 rounded">✓ PASSED ({safety.layersPassed}/{safety.totalLayers})</span>
            ) : (
              <span className="text-[#FF6B6B] bg-[#FF6B6B]/10 px-2 py-1 rounded">✗ BLOCKED ({safety.blockedAt})</span>
            )
          ) : (
            <span className="text-[#A0AEC0]">Pending...</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
