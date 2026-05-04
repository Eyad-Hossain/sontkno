"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitReport } from "@/actions/report";

const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or targeted bullying", glyph: "⚡" },
  { value: "doxxing", label: "Sharing personal information", glyph: "🔎" },
  { value: "spam", label: "Spam or repetitive flooding", glyph: "♻" },
  { value: "inappropriate", label: "Inappropriate or harmful content", glyph: "✕" },
  { value: "other", label: "Something else entirely", glyph: "…" },
] as const;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

export function ReportModal({ isOpen, onClose, postId }: ReportModalProps) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!reason) return;
    setLoading(true);
    try {
      await submitReport(postId, reason, details || undefined);
      setSubmitted(true);
    } catch {
      /* silently handle */
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setReason("");
    setDetails("");
    setSubmitted(false);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          {/* Panel — slides up from bottom on mobile, centered on desktop */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="
              fixed z-[70] bottom-0 left-0 right-0
              sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2
              sm:-translate-x-1/2 sm:-translate-y-1/2
              w-full sm:w-[420px]
              bg-[var(--surface)] border border-[var(--border)]
              rounded-t-2xl sm:rounded-2xl overflow-hidden
              shadow-[0_-8px_40px_rgba(0,0,0,0.4)] sm:shadow-[0_8px_40px_rgba(0,0,0,0.5)]
            "
          >
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <span className="font-['Cormorant_Garamond'] text-lg font-semibold text-[var(--text-primary)] tracking-wide">
                Report post
              </span>
              <button
                onClick={handleClose}
                className="
                  w-7 h-7 rounded-full flex items-center justify-center
                  text-[var(--text-muted)] hover:text-[var(--text-primary)]
                  hover:bg-[var(--surface-raised)] transition-colors text-sm
                "
              >
                ✕
              </button>
            </div>

            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-5 py-10 text-center"
                >
                  {/* Botanical checkmark */}
                  <div className="
                    w-16 h-16 mx-auto mb-5 rounded-full
                    bg-[var(--accent-moss)]/15 border border-[var(--accent-moss)]/40
                    flex items-center justify-center text-2xl
                  ">
                    ✦
                  </div>
                  <h3 className="
                    font-['Cormorant_Garamond'] text-xl font-semibold
                    text-[var(--text-primary)] mb-2
                  ">
                    Report received
                  </h3>
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-6 max-w-[280px] mx-auto">
                    Our moderation team will review this post against community guidelines.
                  </p>
                  <button
                    onClick={handleClose}
                    className="
                      w-full py-2.5 rounded-xl
                      bg-[var(--accent-moss)] text-[var(--bg)] font-['IBM_Plex_Mono'] text-sm font-medium
                      hover:opacity-90 transition-opacity
                    "
                  >
                    Close
                  </button>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Reason list */}
                  <div className="py-2">
                    {REPORT_REASONS.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setReason(r.value)}
                        className={`
                          w-full flex items-center gap-4 px-5 py-3.5
                          text-left transition-colors duration-150
                          border-b border-[var(--border)] last:border-0
                          ${reason === r.value
                            ? "bg-[var(--accent-moss)]/10 text-[var(--accent-moss)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
                          }
                        `}
                      >
                        <span className="text-base w-5 text-center opacity-70 font-['IBM_Plex_Mono']">
                          {r.glyph}
                        </span>
                        <span className="text-sm font-medium">{r.label}</span>
                        {reason === r.value && (
                          <span className="ml-auto text-[var(--accent-moss)] text-xs font-['IBM_Plex_Mono']">
                            ●
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Details + submit — only if a reason is selected */}
                  <AnimatePresence>
                    {reason && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-3 border-t border-[var(--border)]">
                          <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Additional context (optional)..."
                            rows={3}
                            className="
                              w-full px-3 py-2.5 rounded-lg text-sm
                              bg-[var(--surface-raised)] border border-[var(--border)]
                              text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                              focus:outline-none focus:border-[var(--accent-moss)]
                              resize-none font-['IBM_Plex_Mono'] transition-colors
                              mb-3
                            "
                          />
                          <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="
                              w-full py-2.5 rounded-xl font-['IBM_Plex_Mono'] text-sm font-medium
                              bg-[var(--accent-amber)] text-[var(--bg)]
                              hover:opacity-90 disabled:opacity-50
                              transition-opacity
                            "
                          >
                            {loading ? "Sending…" : "Submit report"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}