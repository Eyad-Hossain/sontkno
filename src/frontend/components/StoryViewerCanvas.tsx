"use client";

import { motion } from "framer-motion";
import { RetroWindow } from "./RetroWindow";
import { FolderIcon } from "./FolderIcon";
import { HeaderAuth } from "./HeaderAuth";

export function StoryViewerCanvas({ session }: { session: unknown }) {
  return (
    <div className="relative w-full min-h-screen overflow-hidden p-8 flex flex-col items-center bg-[#f0f0f0]">
      {/* Subtle background noise/grid if needed, but #f0f0f0 is close */}
      
      {/* Background Auth / Navigation */}
      <div className="absolute top-4 right-4 z-50">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <HeaderAuth session={session as any} />
      </div>

      {/* Main Titles - Stacked and bold per screenshot */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mt-20 mb-16 space-y-[-12px]"
      >
        <h1 className="text-[72px] font-black tracking-tighter leading-none font-sans text-black">
          Social
        </h1>
        <h1 className="text-[72px] font-black tracking-tighter leading-none font-sans text-black">
          Stories
        </h1>
      </motion.div>

      {/* Canvas Area with Windows and Folders */}
      <div className="relative w-full max-w-4xl h-[500px] flex justify-center items-start">
        
        {/* 'stories' folder icon on the left */}
        <div className="absolute left-[10%] top-[40px] z-30">
          <FolderIcon label="stories" color="fill-pastel-pink" className="scale-125" />
        </div>

        {/* Main Text Window (Centered/Right) */}
        <RetroWindow
          title="Social Stories"
          headerColor="bg-gray-200"
          className="left-[40%] top-0 w-[420px] z-20"
        >
          <div className="font-sans text-[15px] leading-[1.6] text-black pr-2">
            Discover a beautiful book-style story viewer that transforms how you experience social stories. Flip through pages with an elegant pastel aesthetic, featuring soft pinks, lavenders, mint greens, and peach tones for a truly immersive reading experience.
          </div>
          <div className="mt-6 flex justify-end">
            <span className="text-3xl text-gray-400">⌵</span>
          </div>
        </RetroWindow>

        {/* Secondary Window (Behind and Left) */}
        <RetroWindow
          title="img088.jpg"
          headerColor="bg-gray-200"
          className="left-[15%] top-[140px] w-[380px] z-10"
        >
          <div className="w-full h-48 border border-gray-200 rounded p-4 flex flex-col items-center justify-center bg-white relative">
             <div className="w-24 h-24 bg-blue-50/50 rounded flex items-center justify-center">
                <FolderIcon label="niche_lifestyle" color="fill-blue-200" className="w-12 opacity-50" />
             </div>
             
             {/* Bottom toolbar inside window per screenshot */}
             <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4 text-gray-600">
                <span className="text-lg cursor-pointer hover:text-black">🔍</span>
                <span className="text-lg cursor-pointer hover:text-black">🔎</span>
                <span className="text-lg cursor-pointer hover:text-black">←</span>
                <span className="text-lg cursor-pointer hover:text-black">→</span>
                <span className="text-lg cursor-pointer hover:text-black">↻</span>
                <span className="text-lg cursor-pointer hover:text-black">↺</span>
             </div>
          </div>
        </RetroWindow>

      </div>

      {/* Script Text Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-10 left-10 pointer-events-none"
      >
        <span className="font-script text-6xl text-black/5">
          Story Viewer
        </span>
      </motion.div>
    </div>
  );
}
