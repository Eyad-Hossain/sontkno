"use client";

/**
 * ─── POST CARD COMPONENT ───
 * This component displays a single story/post with its author pseudonym, 
 * content (text or image), reactions, and comments.
 */

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ReportModal } from "./ReportModal";
import { addReaction } from "@/actions/reaction"; // Correctly import the reaction action

/**
 * Interface for comments attached to a post
 */
interface PostComment {
  id: string;
  content: string;
  flowerPseudonym: string;
  createdAt: Date;
}

/**
 * Props passed to the PostCard component
 */
interface PostCardProps {
  id: string;
  content: string;
  imageUrl?: string | null;
  flowerPseudonym: string;
  category?: string;
  tags?: string[];
  reactions: Record<string, number>;
  comments: PostComment[];
  createdAt: Date;
}

/**
 * HELPER: Calculates human-readable "time ago" string
 */
function calculateTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * HELPER: Generates a deterministic gradient color based on the pseudonym
 */
function getPseudonymGradient(name: string): string {
  const colorPalettes = [
    ["#4a7c59", "#d4a853"],   // moss + amber
    ["#7c4a6b", "#d4a853"],   // plum + amber
    ["#4a6b7c", "#a8c4a2"],   // slate + sage
    ["#7c6b4a", "#c4a2a8"],   // umber + rose
    ["#6b7c4a", "#d4a853"],   // olive + amber
  ];
  // Calculate index based on the sum of character codes
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colorPalettes.length;
  return `linear-gradient(135deg, ${colorPalettes[index][0]}, ${colorPalettes[index][1]})`;
}

/**
 * SUB-COMPONENT: Category Pill (e.g., "story", "confession")
 */
function PostCategoryPill({ category }: { category?: string }) {
  if (!category) return null;
  return (
    <span className="
      font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest
      px-2 py-0.5 rounded-sm
      bg-[var(--accent-moss)]/10 text-[var(--accent-moss)]
      border border-[var(--accent-moss)]/25
    ">
      {category}
    </span>
  );
}

/**
 * SUB-COMPONENT: Circular Avatar with Initials
 */
function UserAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const background = getPseudonymGradient(name);
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 select-none shadow-sm"
      style={{ width: size, height: size, background }}
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

/**
 * MAIN COMPONENT: PostCard
 */
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
  // --- STATE ---
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [hasUserLiked, setHasUserLiked] = useState(false);
  const [totalLikes, setTotalLikes] = useState(reactions.like || 0);
  const [areCommentsVisible, setAreCommentsVisible] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  
  // --- REFS ---
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * HANDLER: Toggles like state and calls server action
   */
  const handleLikeToggle = useCallback(async () => {
    // Optimistic UI update
    const previousLiked = hasUserLiked;
    setHasUserLiked(!previousLiked);
    setTotalLikes(prev => previousLiked ? prev - 1 : prev + 1);

    try {
      // Call server action (NoSQL atomic increment)
      if (!previousLiked) {
        await addReaction(id, "like");
      }
    } catch (error) {
      // Revert on error
      setHasUserLiked(previousLiked);
      setTotalLikes(prev => previousLiked ? prev + 1 : prev - 1);
      console.error("Failed to add reaction:", error);
    }
  }, [id, hasUserLiked]);

  /**
   * EFFECT: Handle clicks outside the options menu to close it
   */
  React.useEffect(() => {
    if (!isOptionsMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOptionsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOptionsMenuOpen]);

  return (
    <>
      <article className="
        group relative
        bg-[var(--surface)] border border-[var(--border)]
        rounded-2xl overflow-hidden
        hover:border-[var(--border-hover)] transition-all duration-300
        mb-6 shadow-sm hover:shadow-md
      ">
        {/* Decorative accent line */}
        <div className="
          absolute left-0 top-6 bottom-6 w-[2.5px] rounded-full
          bg-gradient-to-b from-transparent via-[var(--accent-moss)]/40 to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-500
        " />

        {/* ── HEADER ─────────────────────────────── */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <UserAvatar name={flowerPseudonym} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-['Cormorant_Garamond'] text-[16px] font-bold text-[var(--text-primary)] leading-tight">
                  {flowerPseudonym}
                </span>
                <PostCategoryPill category={category} />
              </div>
              <span className="font-['IBM_Plex_Mono'] text-[11px] text-[var(--text-muted)] tracking-tight">
                {calculateTimeAgo(createdAt)}
              </span>
            </div>
          </div>

          {/* Options Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsOptionsMenuOpen((v) => !v)}
              className="
                w-8 h-8 flex items-center justify-center rounded-full
                text-[var(--text-muted)] hover:text-[var(--text-primary)]
                hover:bg-[var(--surface-raised)] transition-all
                font-['IBM_Plex_Mono'] text-lg leading-none
              "
              aria-label="Post options"
            >
              ···
            </button>
            <AnimatePresence>
              {isOptionsMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="
                    absolute right-0 top-full mt-2 z-20
                    bg-[var(--surface)] border border-[var(--border)]
                    rounded-xl shadow-xl overflow-hidden w-44
                  "
                >
                  <button
                    onClick={() => { setIsOptionsMenuOpen(false); setIsReportModalOpen(true); }}
                    className="
                      w-full text-left px-4 py-3 text-sm
                      text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]
                      hover:text-red-400 transition-colors
                      font-['IBM_Plex_Mono'] flex items-center gap-2
                    "
                  >
                    <span>⚑</span> Report post
                  </button>
                  <button
                    className="
                      w-full text-left px-4 py-3 text-sm
                      text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]
                      transition-colors font-['IBM_Plex_Mono'] flex items-center gap-2
                    "
                  >
                    <span>✦</span> Save post
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── CONTENT ────────────────────────────── */}
        <div className="px-5 mb-4">
          {imageUrl ? (
            <div className="rounded-xl overflow-hidden border border-[var(--border)] aspect-video mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Story visual"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="
              px-6 py-8 rounded-xl
              bg-[var(--surface-raised)] border border-[var(--border)]
              relative overflow-hidden
            ">
              <span className="
                absolute top-2 left-4 font-['Cormorant_Garamond']
                text-6xl text-[var(--accent-moss)]/10 leading-none select-none
                pointer-events-none
              ">
                &quot;
              </span>
              <p className="
                font-['Lora'] text-[16px] leading-[1.8]
                text-[var(--text-primary)] relative z-10 italic
              ">
                {content}
              </p>
            </div>
          )}
          
          {/* Caption for image posts */}
          {imageUrl && (
            <p className="font-['Lora'] text-[15px] leading-relaxed text-[var(--text-secondary)]">
              {content}
            </p>
          )}
        </div>

        {/* Tag List */}
        {tags.length > 0 && (
          <div className="px-5 mb-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="
                  font-['IBM_Plex_Mono'] text-[10px] tracking-wide
                  px-2.5 py-1 rounded-full
                  bg-[var(--surface-raised)] text-[var(--text-muted)]
                  border border-[var(--border)] hover:border-[var(--accent-moss)]/50
                  transition-colors cursor-default
                "
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* ── ACTION BAR ─────────────────────────── */}
        <div className="
          flex items-center gap-2 px-5 py-4
          border-t border-[var(--border)] bg-[var(--surface-raised)]/30
        ">
          {/* Like Button */}
          <motion.button
            onClick={handleLikeToggle}
            whileTap={{ scale: 0.9 }}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm
              font-['IBM_Plex_Mono'] transition-all duration-300
              ${hasUserLiked
                ? "bg-[var(--accent-amber)] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"
              }
            `}
          >
            <motion.span
              animate={{ scale: hasUserLiked ? [1, 1.3, 1] : 1 }}
              className="text-base"
            >
              {hasUserLiked ? "♥" : "♡"}
            </motion.span>
            <span className="text-xs font-semibold">{totalLikes}</span>
          </motion.button>

          {/* Comment Toggle Button */}
          <button
            onClick={() => setAreCommentsVisible((v) => !v)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm
              font-['IBM_Plex_Mono'] transition-all duration-300
              ${areCommentsVisible
                ? "bg-[var(--accent-moss)] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"
              }
            `}
          >
            <span className="text-base">◎</span>
            <span className="text-xs font-semibold">{comments.length}</span>
          </button>

          <div className="flex-1" />

          {/* Bookmark Button */}
          <button
            className="
              w-9 h-9 rounded-full flex items-center justify-center
              text-[var(--text-muted)] hover:text-[var(--accent-amber)]
              hover:bg-[var(--surface-raised)] transition-all
              font-['IBM_Plex_Mono'] text-lg
            "
            aria-label="Save"
          >
            ◇
          </button>
        </div>

        {/* ── COMMENTS SECTION ───────────────────── */}
        <AnimatePresence>
          {areCommentsVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-[var(--surface-raised)]/10"
            >
              <div className="px-5 pb-5 pt-2 border-t border-[var(--border)]">
                {/* List of comments */}
                {comments.length > 0 ? (
                  <div className="mb-5 space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <UserAvatar name={comment.flowerPseudonym} size={28} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-['Cormorant_Garamond'] text-sm font-bold text-[var(--text-primary)]">
                              {comment.flowerPseudonym}
                            </span>
                            <span className="font-['IBM_Plex_Mono'] text-[10px] text-[var(--text-muted)]">
                              {calculateTimeAgo(comment.createdAt)}
                            </span>
                          </div>
                          <p className="font-['Lora'] text-sm text-[var(--text-secondary)] leading-relaxed mt-1">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-['Cormorant_Garamond'] italic text-sm text-[var(--text-muted)] py-4 text-center">
                    No voices in this thread yet — be the first to speak.
                  </p>
                )}

                {/* New Comment Input */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Contribute to the story..."
                    className="
                      flex-1 px-4 py-2.5 rounded-full text-sm
                      bg-[var(--surface)] border border-[var(--border)]
                      text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                      font-['IBM_Plex_Mono'] focus:outline-none
                      focus:border-[var(--accent-moss)] transition-all shadow-inner
                    "
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && commentText.trim()) {
                        // TODO: Implement createComment server action
                        setCommentText("");
                      }
                    }}
                  />
                  <button
                    disabled={!commentText.trim()}
                    className="
                      px-5 py-2.5 rounded-full text-xs font-bold font-['IBM_Plex_Mono']
                      bg-[var(--accent-moss)] text-white
                      disabled:opacity-40 hover:opacity-90 transition-all shadow-sm
                    "
                    onClick={() => {
                      if (commentText.trim()) {
                        setCommentText("");
                      }
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </article>

      {/* Report Modal Component */}
      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        postId={id} 
      />
    </>
  );
}