"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

// Custom SVG icons — no lucide generics
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" fill="currentColor" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
        <line
          key={i}
          x1="8" y1="1.5" x2="8" y2="3"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          transform={`rotate(${deg} 8 8)`}
        />
      ))}
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M13 8.5A5.5 5.5 0 017.5 3a5.5 5.5 0 100 11A5.5 5.5 0 0013 8.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-full bg-[var(--surface-raised)]" />;
  }

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="
        relative w-8 h-8 rounded-full
        bg-[var(--surface-raised)] border border-[var(--border)]
        hover:border-[var(--accent-moss)] transition-colors duration-200
        flex items-center justify-center overflow-hidden
      "
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="text-[var(--accent-amber)] absolute"
          >
            <MoonIcon />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 30, opacity: 0, scale: 0.7 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -30, opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="text-[var(--accent-amber)] absolute"
          >
            <SunIcon />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}