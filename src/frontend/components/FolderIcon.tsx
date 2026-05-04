"use client";

import { motion } from "framer-motion";

interface FolderIconProps {
  label: string;
  color?: string;
  onClick?: () => void;
  className?: string;
}

export function FolderIcon({
  label,
  color = "fill-pastel-pink",
  onClick,
  className = "",
}: FolderIconProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 cursor-pointer w-20 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`w-12 h-12 ${color} drop-shadow-sm`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
      </svg>
      <span className="text-[10px] font-bold uppercase tracking-tighter text-center leading-none">
        {label}
      </span>
    </motion.div>
  );
}
