"use client";

/**
 * ─── CREATE POST MODAL COMPONENT ───
 * This component provides the UI for users to compose and submit new stories or confessions.
 * It handles client-side validation, tag management, and communicates with the backend `createPost` action.
 * A core feature is the visualization of the anonymous pseudonym assignment.
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPost } from "@/actions/post";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SubmitState = "idle" | "loading" | "success" | "under_review" | "error";

const CATEGORY_META: Record<string, { icon: string; desc: string; color: string }> = {
  confession: {
    icon: "◈",
    desc: "Something you need to get off your chest",
    color: "var(--accent-amber)",
  },
  story: {
    icon: "◉",
    desc: "An experience or narrative to share",
    color: "var(--accent-moss)",
  },
  opinion: {
    icon: "◐",
    desc: "A thought, take, or reflection",
    color: "#8b7fb8",
  },
};

function TagChip({ tag, onRemove }: { tag: string; onRemove: () => void }) {
  return (
    <motion.span
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="
        inline-flex items-center gap-1.5
        px-2.5 py-1 rounded-full text-xs
        bg-[var(--accent-moss)]/15 text-[var(--accent-moss)]
        border border-[var(--accent-moss)]/30
        font-['IBM_Plex_Mono'] tracking-tight
      "
    >
      #{tag}
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-[var(--text-primary)] transition-colors leading-none"
        aria-label={`Remove tag ${tag}`}
      >
        ×
      </button>
    </motion.span>
  );
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("confession");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Auto-resize textarea
  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 320) + "px";
  }

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    setMessage("");

    if (tag.length < 2) {
      setMessage("Tag must be at least 2 characters.");
      return;
    }
    if (tag.length > 30) {
      setMessage("Tag must be at most 30 characters.");
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(tag)) {
      setMessage("Tags can only contain letters, numbers, hyphens, underscores.");
      return;
    }
    if (tags.includes(tag)) {
      setTagInput("");
      return;
    }
    if (tags.length >= 5) {
      setMessage("Maximum 5 tags allowed.");
      return;
    }

    setTags((prev) => [...prev, tag]);
    setTagInput("");
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!content.trim() || submitState === "loading") return;

    setSubmitState("loading");
    setMessage("");

    try {
      const res = await createPost(content.trim(), category, tags, "default");

      if (res.success) {
        if (res.publicationStatus === "under_review") {
          setSubmitState("under_review");
          setMessage(res.message ?? "Your post is under review.");
        } else {
          setSubmitState("success");
          setMessage(res.message ?? "Post published.");
        }

        setTimeout(() => {
          resetAndClose();
        }, 2200);
      } else {
        setSubmitState("error");
        setMessage(res.message ?? "Your post could not be published.");
      }
    } catch (err) {
      setSubmitState("error");
      setMessage((err as Error).message || "Something went wrong.");
    }
  }

  function resetAndClose() {
    setContent("");
    setCategory("confession");
    setTags([]);
    setTagInput("");
    setSubmitState("idle");
    setMessage("");
    onClose();
  }

  const charPercent = Math.min((content.length / 2000) * 100, 100);
  const isNearLimit = content.length > 1700;
  const isOverLimit = content.length > 2000;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-[3px]"
            onClick={submitState !== "loading" ? resetAndClose : undefined}
          />

          {/* Modal */}
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="
              fixed inset-x-4 bottom-4 z-[70]
              sm:inset-auto sm:top-1/2 sm:left-1/2
              sm:-translate-x-1/2 sm:-translate-y-1/2
              sm:w-[560px]
              max-h-[90vh] overflow-y-auto
              bg-[var(--surface)] border border-[var(--border)]
              rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.55)]
            "
          >
            {/* ── Top chrome ──────────────────────── */}
            <div className="
              sticky top-0 z-10
              flex items-center justify-between
              px-5 py-4 border-b border-[var(--border)]
              bg-[var(--surface)]/95 backdrop-blur-md
            ">
              <button
                onClick={resetAndClose}
                disabled={submitState === "loading"}
                className="
                  w-7 h-7 flex items-center justify-center rounded-full
                  text-[var(--text-muted)] hover:text-[var(--text-primary)]
                  hover:bg-[var(--surface-raised)] transition-colors
                  disabled:opacity-40 font-['IBM_Plex_Mono'] text-sm
                "
                aria-label="Close"
              >
                ✕
              </button>

              <span className="
                font-['Cormorant_Garamond'] text-base font-semibold
                text-[var(--text-primary)] tracking-wide
              ">
                New {category}
              </span>

              <button
                onClick={handleSubmit}
                disabled={!content.trim() || isOverLimit || submitState === "loading"}
                className="
                  px-4 py-1.5 rounded-full text-sm font-['IBM_Plex_Mono'] font-medium
                  bg-[var(--accent-moss)] text-[var(--bg)]
                  hover:opacity-90 disabled:opacity-40
                  transition-opacity
                "
              >
                {submitState === "loading" ? "…" : "Publish"}
              </button>
            </div>

            <div className="px-5 pt-4 pb-5 flex flex-col gap-5">
              {/* ── Identity line ───────────────────── */}
              <div className="flex items-center gap-3">
                <div className="
                  w-9 h-9 rounded-full flex-shrink-0
                  bg-gradient-to-br from-[var(--accent-moss)] to-[var(--accent-amber)]
                  flex items-center justify-center
                  font-['Cormorant_Garamond'] text-white font-semibold text-sm
                ">
                  ?
                </div>
                <div>
                  <p className="font-['Cormorant_Garamond'] text-sm font-semibold text-[var(--text-primary)]">
                    A random flower name will be assigned
                  </p>
                  <p className="font-['IBM_Plex_Mono'] text-[10px] text-[var(--text-muted)] tracking-tight">
                    Your identity stays anonymous
                  </p>
                </div>
              </div>

              {/* ── Category selector ───────────────── */}
              <div>
                <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">
                  Post type
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(CATEGORY_META).map(([key, meta]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      className={`
                        flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl
                        border transition-all duration-200 text-center
                        ${category === key
                          ? "border-[var(--accent-moss)] bg-[var(--accent-moss)]/10"
                          : "border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--border-hover)]"
                        }
                      `}
                    >
                      <span
                        className="text-lg"
                        style={{ color: category === key ? meta.color : "var(--text-muted)" }}
                      >
                        {meta.icon}
                      </span>
                      <span className={`
                        font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest
                        ${category === key ? "text-[var(--accent-moss)]" : "text-[var(--text-muted)]"}
                      `}>
                        {key}
                      </span>
                      {category === key && (
                        <span className="font-['Lora'] text-[10px] italic text-[var(--text-muted)] leading-tight">
                          {meta.desc}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Content textarea ────────────────── */}
              <div className="
                relative rounded-xl border border-[var(--border)]
                bg-[var(--surface-raised)]
                focus-within:border-[var(--accent-moss)] transition-colors
              ">
                <span className="
                  absolute top-4 left-4 font-['Cormorant_Garamond']
                  text-5xl text-[var(--accent-moss)]/10 leading-none
                  select-none pointer-events-none
                ">
                  &quot;
                </span>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  placeholder={
                    category === "confession"
                      ? "What have you been carrying alone…"
                      : category === "story"
                        ? "Start your story here…"
                        : "What's on your mind…"
                  }
                  className="
                    w-full bg-transparent px-5 pt-5 pb-4
                    text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                    font-['Lora'] text-[15px] leading-[1.85]
                    outline-none resize-none min-h-[140px]
                  "
                  maxLength={2100}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
                  }}
                />

                {/* Character meter */}
                <div className="px-5 pb-3 flex items-center justify-between">
                  <div className="flex-1 h-[2px] rounded-full bg-[var(--border)] overflow-hidden mr-3">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${charPercent}%`,
                        background: isOverLimit
                          ? "#e05c4a"
                          : isNearLimit
                            ? "var(--accent-amber)"
                            : "var(--accent-moss)",
                      }}
                    />
                  </div>
                  <span className={`
                    font-['IBM_Plex_Mono'] text-[10px] tracking-tight
                    ${isOverLimit ? "text-[#e05c4a]" : "text-[var(--text-muted)]"}
                  `}>
                    {content.length}/2000
                  </span>
                </div>
              </div>

              {/* ── Tags ────────────────────────────── */}
              <div>
                <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">
                  Tags <span className="normal-case">({tags.length}/5)</span>
                </p>

                <div className="
                  flex flex-wrap gap-1.5 min-h-[36px]
                  px-3 py-2 rounded-xl
                  bg-[var(--surface-raised)] border border-[var(--border)]
                  focus-within:border-[var(--accent-moss)] transition-colors
                ">
                  <AnimatePresence mode="popLayout">
                    {tags.map((tag) => (
                      <TagChip
                        key={tag}
                        tag={tag}
                        onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))}
                      />
                    ))}
                  </AnimatePresence>

                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      setMessage("");
                    }}
                    onKeyDown={handleTagKeyDown}
                    placeholder={tags.length >= 5 ? "Max tags reached" : "Add tag, press Enter…"}
                    disabled={tags.length >= 5}
                    className="
                      flex-1 min-w-[120px] bg-transparent outline-none
                      text-xs font-['IBM_Plex_Mono'] text-[var(--text-primary)]
                      placeholder:text-[var(--text-muted)] disabled:opacity-0
                    "
                  />
                </div>
              </div>

              {/* ── Privacy notice ─────────────────── */}
              <div className="
                flex items-start gap-3 p-3.5 rounded-xl
                bg-[var(--accent-amber)]/8 border border-[var(--accent-amber)]/25
              ">
                <span className="text-[var(--accent-amber)] mt-0.5 flex-shrink-0 font-['IBM_Plex_Mono']">
                  ⚠
                </span>
                <p className="font-['IBM_Plex_Mono'] text-[11px] text-[var(--text-muted)] leading-relaxed tracking-tight">
                  Do not include real names, email addresses, student IDs, or phone numbers.
                  Posts with identifying information will be flagged or removed.
                </p>
              </div>

              {/* ── Status feedback ─────────────────── */}
              <AnimatePresence mode="wait">
                {submitState === "error" && message && (
                  <motion.div
                    key="err"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="
                      flex items-start gap-3 p-3.5 rounded-xl
                      bg-[#e05c4a]/10 border border-[#e05c4a]/30
                    "
                  >
                    <span className="text-[#e05c4a] flex-shrink-0 font-['IBM_Plex_Mono']">✕</span>
                    <p className="font-['IBM_Plex_Mono'] text-xs text-[#e05c4a] leading-relaxed">{message}</p>
                  </motion.div>
                )}

                {submitState === "under_review" && message && (
                  <motion.div
                    key="review"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="
                      flex items-start gap-3 p-3.5 rounded-xl
                      bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/35
                    "
                  >
                    <span className="text-[var(--accent-amber)] flex-shrink-0 font-['IBM_Plex_Mono'] mt-0.5">⏳</span>
                    <div>
                      <p className="font-['IBM_Plex_Mono'] text-xs font-medium text-[var(--accent-amber)] mb-0.5">
                        Under review
                      </p>
                      <p className="font-['IBM_Plex_Mono'] text-xs text-[var(--text-muted)] leading-relaxed">{message}</p>
                    </div>
                  </motion.div>
                )}

                {submitState === "success" && message && (
                  <motion.div
                    key="ok"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="
                      flex items-center gap-3 p-3.5 rounded-xl
                      bg-[var(--accent-moss)]/10 border border-[var(--accent-moss)]/35
                    "
                  >
                    <span className="text-[var(--accent-moss)] font-['IBM_Plex_Mono']">✦</span>
                    <p className="font-['IBM_Plex_Mono'] text-xs text-[var(--accent-moss)]">{message}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Keyboard hint */}
              <p className="
                text-center font-['IBM_Plex_Mono'] text-[10px]
                text-[var(--text-muted)] tracking-tight
              ">
                ⌘ + Enter to publish
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}