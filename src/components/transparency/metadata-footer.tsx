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
      <motion.div 
        whileHover={{ y: -2 }}
        className="bg-[#F8F9FA] border-2 border-[#2D3748] rounded-xl shadow-[4px_4px_0_0_#2D3748] p-4 flex flex-col gap-2 transition-all"
      >
        <div className="flex items-center gap-2 text-xs font-black uppercase text-[#2D3748] tracking-widest border-b-2 border-[#2D3748] pb-2 mb-1">
          <div className="p-1 bg-[#FF6B6B] rounded-md border border-[#2D3748]"><Cpu size={14} className="text-white" /></div>
          Engine
        </div>
        <div className="font-mono text-sm font-bold text-[#2D3748] bg-white p-2 rounded border border-gray-200">{currentModel}</div>
      </motion.div>

      {/* Latency Block */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="bg-[#F8F9FA] border-2 border-[#2D3748] rounded-xl shadow-[4px_4px_0_0_#2D3748] p-4 flex flex-col gap-2 transition-all"
      >
        <div className="flex items-center gap-2 text-xs font-black uppercase text-[#2D3748] tracking-widest border-b-2 border-[#2D3748] pb-2 mb-1">
          <div className="p-1 bg-[#4ECDC4] rounded-md border border-[#2D3748]"><Clock size={14} className="text-white" /></div>
          Speed
        </div>
        <div className="font-mono text-3xl font-black text-[#2D3748] flex items-baseline gap-1 bg-white p-2 rounded border border-gray-200">
          {latencyMs !== undefined ? latencyMs : '---'}
          <span className="text-sm font-bold text-gray-400">ms</span>
        </div>
      </motion.div>

      {/* Tools Block */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="bg-[#F8F9FA] border-2 border-[#2D3748] rounded-xl shadow-[4px_4px_0_0_#2D3748] p-4 flex flex-col gap-2 transition-all"
      >
        <div className="flex items-center gap-2 text-xs font-black uppercase text-[#2D3748] tracking-widest border-b-2 border-[#2D3748] pb-2 mb-1">
          <div className="p-1 bg-[#FFE66D] rounded-md border border-[#2D3748]"><Wrench size={14} className="text-[#2D3748]" /></div>
          Active Tools
        </div>
        <div className="font-mono text-xs text-[#2D3748]">
          {toolsUsed && toolsUsed.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-1">
              {toolsUsed.map(t => (
                <span key={t} className="bg-[#FFE66D] px-2 py-1 border-2 border-[#2D3748] rounded-md font-bold text-[#2D3748] shadow-[2px_2px_0_0_#2D3748]">{t}</span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400 italic bg-white p-2 rounded border border-gray-200 block">No tools active</span>
          )}
        </div>
      </motion.div>

      {/* Safety Block */}
      <motion.div 
        whileHover={{ y: -2 }}
        className={`bg-[#F8F9FA] border-2 border-[#2D3748] rounded-xl shadow-[4px_4px_0_0_#2D3748] p-4 flex flex-col gap-2 transition-all`}
      >
        <div className="flex items-center gap-2 text-xs font-black uppercase text-[#2D3748] tracking-widest border-b-2 border-[#2D3748] pb-2 mb-1">
          <div className={`p-1 rounded-md border border-[#2D3748] ${safety?.passed === false ? 'bg-[#FF6B6B]' : 'bg-[#38E54D]'}`}>
            <Shield size={14} className="text-white" />
          </div>
          Safety Pipeline
        </div>
        <div className="font-mono text-sm font-bold mt-1 bg-white p-2 rounded border border-gray-200">
          {safety ? (
            safety.passed ? (
              <div className="flex items-center gap-2 text-[#2D3748]">
                <div className="w-2 h-2 rounded-full bg-[#38E54D] animate-pulse"></div>
                PASSED ({safety.layersPassed}/{safety.totalLayers})
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#FF6B6B]">
                <div className="w-2 h-2 rounded-full bg-[#FF6B6B] animate-ping"></div>
                BLOCKED ({safety.blockedAt})
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              Awaiting payload...
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
