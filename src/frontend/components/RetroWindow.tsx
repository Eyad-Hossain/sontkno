"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface RetroWindowProps {
  title: string;
  children: ReactNode;
  headerColor?: string;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initial?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  animate?: any;
}

export function RetroWindow({
  title,
  children,
  headerColor = "bg-pastel-purple",
  className = "",
  initial = { opacity: 0, y: 20 },
  animate = { opacity: 1, y: 0 },
}: RetroWindowProps) {
  return (
    <motion.div
      initial={initial}
      animate={animate}
      drag
      dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
      whileDrag={{ scale: 1.02, zIndex: 50 }}
      className={`retro-window absolute ${className}`}
    >
      <div className={`retro-window-header ${headerColor}`}>
        <span className="text-xs uppercase tracking-wider">{title}</span>
        <div className="retro-window-controls">
          <div className="retro-control-btn" />
          <div className="retro-control-btn" />
          <div className="retro-control-btn flex items-center justify-center text-[8px] leading-none">
            ✕
          </div>
        </div>
      </div>
      <div className="p-4 bg-white dark:bg-zinc-900 text-sm">
        {children}
      </div>
    </motion.div>
  );
}
