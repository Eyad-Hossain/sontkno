"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Trash2, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

// In production, this fetches from getFlaggedPosts() server action.
const MOCK_FLAGGED = [
  {
    id: "flagged-1",
    content: "This is a flagged post that received multiple complaints from the community.",
    flowerPseudonym: "Toxic Ivy",
    createdAt: new Date(Date.now() - 3600000),
    _count: { reports: 5 },
    reports: [
      { id: "r1", reason: "harassment", details: "Contains targeted language", createdAt: new Date(Date.now() - 1800000) },
      { id: "r2", reason: "inappropriate", details: null, createdAt: new Date(Date.now() - 2400000) },
    ],
  },
  {
    id: "flagged-2",
    content: "Another flagged post for spam.",
    flowerPseudonym: "Iron Weed",
    createdAt: new Date(Date.now() - 86400000),
    _count: { reports: 3 },
    reports: [
      { id: "r4", reason: "spam", details: "Repeatedly posting the same content", createdAt: new Date(Date.now() - 50000000) },
    ],
  },
];

export default function AdminPage() {
  const [posts, setPosts] = useState(MOCK_FLAGGED);

  function handleRemove(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function handleDismiss(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black">
      <nav className="fixed top-0 inset-x-0 h-14 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-white/10 z-50 flex items-center">
        <div className="w-full max-w-2xl mx-auto px-4 flex items-center gap-4">
          <Link href="/" className="p-1 hover:opacity-50">
            <ArrowLeft className="w-6 h-6 text-slate-900 dark:text-slate-100" />
          </Link>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Moderation
          </h1>
        </div>
      </nav>

      <div className="pt-20 w-full max-w-2xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-3 mb-6 p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-lg">
          <ShieldAlert className="w-5 h-5 text-orange-500" />
          <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">
            {posts.length} flagged posts require your review.
          </p>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {posts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Queue is empty!</p>
              </motion.div>
            ) : (
              posts.map((post) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm"
                >
                  <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{post.flowerPseudonym}</p>
                        <p className="text-xs text-red-500 font-medium">{post._count.reports} reports</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 uppercase font-bold tracking-wider">Flagged</span>
                  </div>

                  <div className="p-4 bg-slate-50/50 dark:bg-black/20">
                    <p className="text-sm text-slate-800 dark:text-slate-200 italic">"{post.content}"</p>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="space-y-2">
                        {post.reports.map((r) => (
                            <div key={r.id} className="text-xs flex flex-col gap-0.5 border-l-2 border-slate-200 dark:border-white/10 pl-3 py-1">
                                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase leading-none">{r.reason}</span>
                                {r.details && <span className="text-slate-500">{r.details}</span>}
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 flex gap-2">
                        <button
                            onClick={() => handleRemove(post.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Remove Post
                        </button>
                        <button
                            onClick={() => handleDismiss(post.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold border border-slate-200 dark:border-white/10 transition-colors"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Dismiss
                        </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
