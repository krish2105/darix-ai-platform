'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Generates random points for the neural network
const generateNodes = (count: number) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * 100, // percentage
    y: Math.random() * 100, // percentage
    size: Math.random() * 3 + 1,
  }));
};

export const NeuralNetwork = () => {
  const [nodes, setNodes] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const [links, setLinks] = useState<{ source: number; target: number }[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const newNodes = generateNodes(25);
    setNodes(newNodes);

    // Create connections for nearby nodes
    const newLinks: { source: number; target: number }[] = [];
    for (let i = 0; i < newNodes.length; i++) {
      for (let j = i + 1; j < newNodes.length; j++) {
        const dx = newNodes[i].x - newNodes[j].x;
        const dy = newNodes[i].y - newNodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Connect if they are reasonably close
        if (distance < 25 && Math.random() > 0.3) {
          newLinks.push({ source: i, target: j });
        }
      }
    }
    setLinks(newLinks);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
      <svg className="w-full h-full" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
          </linearGradient>
          <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Links */}
        {links.map((link, i) => {
          const source = nodes[link.source];
          const target = nodes[link.target];
          if (!source || !target) return null;
          return (
            <motion.line
              key={`link-${i}`}
              x1={`${source.x}%`}
              y1={`${source.y}%`}
              x2={`${target.x}%`}
              y2={`${target.y}%`}
              stroke="url(#neural-gradient)"
              strokeWidth="1.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1, 1, 0],
                opacity: [0, 0.4, 0.4, 0] 
              }}
              transition={{
                duration: Math.random() * 5 + 4,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 3
              }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(node => (
          <g key={`node-${node.id}`}>
            {/* Inner Core */}
            <circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={node.size}
              fill="#22d3ee"
            />
            {/* Outer animated glow */}
            <motion.circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={node.size * 3}
              fill="url(#node-glow)"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{
                duration: Math.random() * 2 + 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};
