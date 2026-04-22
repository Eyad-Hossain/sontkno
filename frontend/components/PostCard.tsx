"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ReportModal } from "./ReportModal";

interface Comment {
  id: string;
  content: string;
  flowerPseudonym: string;
  createdAt: Date;
}

interface PostCardProps {
  id: string;
  content: string;
  imageUrl?: string | null;
  flowerPseudonym: string;
  category?: string;
  tags?: string[];
  reactions: Record<string, number>;
  comments: Comment[];
  createdAt: Date;
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Deterministic color from pseudonym string
function pseudonymColor(name: string): string {
  const colors = [
    ["#4a7c59", "#d4a853"],   // moss + amber
    ["#7c4a6b", "#d4a853"],   // plum + amber
    ["#4a6b7c", "#a8c4a2"],   // slate + sage
    ["#7c6b4a", "#c4a2a8"],   // umber + rose
    ["#6b7c4a", "#d4a853"],   // olive + amber
  ];
  const i = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return `linear-gradient(135deg, ${colors[i][0]}, ${colors[i][1]})`;
}

function CategoryPill({ category }: { category?: string }) {
  if (!category) return null;
  const labels: Record<string, string> = {
    confession: "confession",
    story: "story",
    opinion: "opinion",
  };
  return (
    <span className="
      font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest
      px-2 py-0.5 rounded-sm
      bg-[var(--accent-moss)]/10 text-[var(--accent-moss)]
      border border-[var(--accent-moss)]/25
    ">
      {labels[category] ?? category}
    </span>
  );
}

// Decorative SVG bloom for the avatar
function BloomAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const bg = pseudonymColor(name);
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 select-none"
      style={{ width: size, height: size, background: bg }}
    >
      <span
        className="text-white font-['Cormorant_Garamond'] font-semibold leading-none"
        style={{ fontSize: size * 0.35 }}
      >
        {initials}
      </span>
    </div>
  );
}

export function PostCard({
  id,
  content,
  imageUrl,
  flowerPseudonym,
  category,
  tags = [],
  reactions,
  comments,
  createdAt,
}: PostCardProps) {
  const [showReport, setShowReport] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(reactions.like || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLike = useCallback(() => {
    setLiked((prev) => {
      setLikeCount((c) => (prev ? Math.max(0, c - 1) : c + 1));
      return !prev;
    });
    // TODO: wire up addReaction() server action
  }, []);

  // Close menu on outside click
  React.useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <>
      <article className="
        group relative
        bg-[var(--surface)] border border-[var(--border)]
        rounded-2xl overflow-hidden
        hover:border-[var(--border-hover)] transition-colors duration-300
        mb-4
      ">
        {/* Subtle left accent line */}
        <div className="
          absolute left-0 top-6 bottom-6 w-[2px] rounded-full
          bg-gradient-to-b from-transparent via-[var(--accent-moss)]/30 to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-500
        " />

        {/* ── Header ─────────────────────────────── */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <BloomAvatar name={flowerPseudonym} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-['Cormorant_Garamond'] text-[15px] font-semibold text-[var(--text-primary)] leading-tight">
                  {flowerPseudonym}
                </span>
                <CategoryPill category={category} />
              </div>
              <span className="font-['IBM_Plex_Mono'] text-[11px] text-[var(--text-muted)] tracking-tight">
                {timeAgo(new Date(createdAt))}
              </span>
            </div>
          </div>

          {/* Context menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="
                w-7 h-7 flex items-center justify-center rounded-full
                text-[var(--text-muted)] hover:text-[var(--text-primary)]
                hover:bg-[var(--surface-raised)] transition-colors
                font-['IBM_Plex_Mono'] text-base leading-none
              "
              aria-label="Post options"
            >
              ···
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="
                    absolute right-0 top-full mt-1 z-20
                    bg-[var(--surface)] border border-[var(--border)]
                    rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.35)]
                    overflow-hidden w-40
                  "
                >
                  <button
                    onClick={() => { setMenuOpen(false); setShowReport(true); }}
                    className="
                      w-full text-left px-4 py-2.5 text-sm
                      text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]
                      hover:text-[var(--accent-amber)] transition-colors
                      font-['IBM_Plex_Mono'] tracking-tight
                    "
                  >
                    ⚑ Report post
                  </button>
                  <button
                    className="
                      w-full text-left px-4 py-2.5 text-sm
                      text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]
                      transition-colors font-['IBM_Plex_Mono'] tracking-tight
                    "
                  >
                    ✦ Save post
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Content ────────────────────────────── */}
        {imageUrl ? (
          <div className="mx-5 mb-4 rounded-xl overflow-hidden border border-[var(--border)] aspect-video">
            <img
              src={imageUrl}
              alt="Post image"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="
            mx-5 mb-4 px-5 py-6 rounded-xl
            bg-[var(--surface-raised)] border border-[var(--border)]
            relative overflow-hidden
          ">
            {/* Decorative quotation */}
            <span className="
              absolute top-2 left-4 font-['Cormorant_Garamond']
              text-5xl text-[var(--accent-moss)]/15 leading-none select-none
              pointer-events-none
            ">
              "
            </span>
            <p className="
              font-['Lora'] text-[15px] leading-[1.8]
              text-[var(--text-primary)] relative z-10
            ">
              {content}
            </p>
          </div>
        )}

        {/* Image caption */}
        {imageUrl && (
          <p className="px-5 mb-3 font-['Lora'] text-sm leading-relaxed text-[var(--text-secondary)]">
            {content}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="px-5 mb-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="
                  font-['IBM_Plex_Mono'] text-[10px] tracking-wide
                  px-2 py-0.5 rounded-full
                  bg-[var(--surface-raised)] text-[var(--text-muted)]
                  border border-[var(--border)]
                "
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* ── Action bar ─────────────────────────── */}
        <div className="
          flex items-center gap-1 px-4 pb-4
          border-t border-[var(--border)] pt-3 mt-1
        ">
          {/* Like */}
          <motion.button
            onClick={handleLike}
            whileTap={{ scale: 0.85 }}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm
              font-['IBM_Plex_Mono'] transition-colors duration-200
              ${liked
                ? "bg-[var(--accent-amber)]/15 text-[var(--accent-amber)]"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-secondary)]"
              }
            `}
            aria-label={liked ? "Unlike" : "Like"}
          >
            <motion.span
              animate={{ scale: liked ? [1, 1.4, 1] : 1 }}
              transition={{ duration: 0.3 }}
              className="text-base"
            >
              {liked ? "♥" : "♡"}
            </motion.span>
            <span className="text-xs tracking-tight">{likeCount}</span>
          </motion.button>

          {/* Comments */}
          <button
            onClick={() => setShowComments((v) => !v)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm
              font-['IBM_Plex_Mono'] transition-colors duration-200
              ${showComments
                ? "bg-[var(--accent-moss)]/15 text-[var(--accent-moss)]"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-secondary)]"
              }
            `}
            aria-label="Toggle comments"
          >
            <span className="text-base">◎</span>
            <span className="text-xs tracking-tight">{comments.length}</span>
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bookmark */}
          <button
            className="
              px-3 py-1.5 rounded-xl
              text-[var(--text-muted)] hover:text-[var(--accent-amber)]
              hover:bg-[var(--surface-raised)] transition-colors
              font-['IBM_Plex_Mono'] text-base
            "
            aria-label="Save"
          >
            ◇
          </button>
        </div>

        {/* ── Comments section ───────────────────── */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 pt-1 border-t border-[var(--border)]">
                {/* Existing comments */}
                {comments.length > 0 && (
                  <div className="mb-3 space-y-3">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-2.5">
                        <BloomAvatar name={c.flowerPseudonym} size={24} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-['Cormorant_Garamond'] text-sm font-semibold text-[var(--text-primary)]">
                              {c.flowerPseudonym}
                            </span>
                            <span className="font-['IBM_Plex_Mono'] text-[10px] text-[var(--text-muted)]">
                              {timeAgo(new Date(c.createdAt))}
                            </span>
                          </div>
                          <p className="font-['Lora'] text-sm text-[var(--text-secondary)] leading-relaxed mt-0.5">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {comments.length === 0 && (
                  <p className="font-['Cormorant_Garamond'] italic text-sm text-[var(--text-muted)] mb-3">
                    No voices yet — be the first.
                  </p>
                )}

                {/* Comment input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Leave a reply..."
                    className="
                      flex-1 px-3 py-2 rounded-xl text-sm
                      bg-[var(--surface-raised)] border border-[var(--border)]
                      text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                      font-['IBM_Plex_Mono'] focus:outline-none
                      focus:border-[var(--accent-moss)] transition-colors
                    "
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && commentInput.trim()) {
                        // TODO: wire up addComment server action
                        setCommentInput("");
                      }
                    }}
                  />
                  <button
                    disabled={!commentInput.trim()}
                    className="
                      px-3 py-2 rounded-xl text-xs font-['IBM_Plex_Mono'] font-medium
                      bg-[var(--accent-moss)] text-[var(--bg)]
                      disabled:opacity-40 hover:opacity-90 transition-opacity
                    "
                    onClick={() => {
                      if (commentInput.trim()) {
                        // TODO: wire up addComment server action
                        setCommentInput("");
                      }
                    }}
                  >
                    Post
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </article>

      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} postId={id} />
    </>
  );
}