'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Database, Bot, Zap, LineChart, Cpu } from 'lucide-react';
import { useHasMounted } from '@/hooks/useHasMounted';

const floatingElements = [
  { id: 1, icon: <Bot className="w-6 h-6 text-cyber-cyan" />, text: "AI Model Deployed", top: "15%", left: "10%", delay: 0, duration: 8 },
  { id: 2, icon: <Database className="w-6 h-6 text-ai-violet" />, text: "Data Pipeline Synced", top: "70%", left: "5%", delay: 1, duration: 9 },
  { id: 3, icon: <LineChart className="w-6 h-6 text-emerald-success" />, text: "ROI +124%", top: "20%", left: "75%", delay: 2, duration: 7 },
  { id: 4, icon: <ShieldAlert className="w-6 h-6 text-warning-amber" />, text: "Governance Active", top: "65%", left: "85%", delay: 0.5, duration: 8.5 },
  { id: 5, icon: <Zap className="w-6 h-6 text-electric-blue" />, text: "Automation Live", top: "45%", left: "80%", delay: 1.5, duration: 7.5 },
  { id: 6, icon: <Cpu className="w-6 h-6 text-cyber-cyan" />, text: "Compute Optimized", top: "85%", left: "40%", delay: 2.5, duration: 9.5 }
];

export const FloatingWindows = () => {
  const isMounted = useHasMounted();

  if (!isMounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {floatingElements.map((el) => (
        <motion.div
          key={el.id}
          initial={{ y: 0, opacity: 0 }}
          animate={{ 
            y: [0, -30, 0],
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            y: {
              duration: el.duration,
              repeat: Infinity,
              ease: "easeInOut"
            },
            opacity: {
              duration: el.duration * 2,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.2, 0.8, 1]
            },
            delay: el.delay
          }}
          className="absolute hidden md:flex items-center gap-3 p-3 bg-card/60 backdrop-blur-xl border border-card-border rounded-xl shadow-lg"
          style={{ top: el.top, left: el.left }}
        >
          <div className="w-10 h-10 rounded-full bg-glass-panel flex items-center justify-center border border-card-border">
            {el.icon}
          </div>
          <span className="text-sm font-semibold text-foreground whitespace-nowrap pr-2">
            {el.text}
          </span>
        </motion.div>
      ))}
      
      {/* Additional Abstract Geometric Shapes */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] right-[-5%] w-96 h-96 border border-cyber-cyan/10 rounded-full border-dashed"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] border border-ai-violet/10 rounded-full border-dashed"
      />
    </div>
  );
};
