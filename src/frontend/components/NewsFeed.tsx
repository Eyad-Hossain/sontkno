"use client";

/**
 * ─── NEWS FEED COMPONENT ───
 * Displays a chronological stream of posts (stories, confessions, opinions) on the Bloom platform.
 * Includes infinite scrolling capabilities, loading skeletons, and an empty state visualization.
 */

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { PostCard } from "./PostCard";

interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  flowerPseudonym: string;
  category?: string;
  tags?: string[];
  reactions: Record<string, number>;
  comments: {
    id: string;
    content: string;
    flowerPseudonym: string;
    createdAt: Date;
  }[];
  createdAt: Date;
}

// Skeleton loader for a single post
function PostSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="
        bg-[var(--surface)] border border-[var(--border)]
        rounded-2xl overflow-hidden mb-4
      "
    >
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div className="w-9 h-9 rounded-full bg-[var(--surface-raised)] animate-pulse" />
        <div className="flex-1">
          <div className="h-3.5 w-28 bg-[var(--surface-raised)] rounded-full animate-pulse mb-1.5" />
          <div className="h-2.5 w-16 bg-[var(--surface-raised)] rounded-full animate-pulse opacity-60" />
        </div>
      </div>
      <div className="mx-5 mb-4 px-5 py-6 rounded-xl bg-[var(--surface-raised)] space-y-2.5">
        <div className="h-3 w-full bg-[var(--border)] rounded-full animate-pulse" />
        <div className="h-3 w-5/6 bg-[var(--border)] rounded-full animate-pulse" />
        <div className="h-3 w-4/5 bg-[var(--border)] rounded-full animate-pulse" />
        <div className="h-3 w-3/4 bg-[var(--border)] rounded-full animate-pulse opacity-60" />
      </div>
      <div className="px-5 pb-4 pt-3 border-t border-[var(--border)] flex gap-2">
        <div className="h-7 w-16 bg-[var(--surface-raised)] rounded-xl animate-pulse" />
        <div className="h-7 w-12 bg-[var(--surface-raised)] rounded-xl animate-pulse" />
      </div>
    </motion.div>
  );
}

// Empty state — no posts yet
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex flex-col items-center text-center py-20 px-6"
    >
      {/* Decorative botanical glyph */}
      <div className="
        w-20 h-20 rounded-full mb-6 flex items-center justify-center
        bg-gradient-to-br from-[var(--accent-moss)]/15 to-[var(--accent-amber)]/10
        border border-[var(--accent-moss)]/20
        text-3xl text-[var(--accent-moss)]
      ">
        ✦
      </div>
      <h3 className="
        font-['Cormorant_Garamond'] text-2xl font-semibold
        text-[var(--text-primary)] mb-2
      ">
        The garden is quiet
      </h3>
      <p className="
        font-['Lora'] italic text-[var(--text-muted)] text-base
        leading-relaxed max-w-[280px]
      ">
        No confessions have bloomed yet. Be the first voice.
      </p>
    </motion.div>
  );
}

// "Load more" sentinel for infinite scroll (intersection observer)
function LoadMoreSentinel({ onVisible }: { onVisible: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onVisible(); },
      { rootMargin: "200px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onVisible]);

  return <div ref={ref} className="h-px" />;
}

// ── Props ──────────────────────────────────────────────────
interface NewsFeedProps {
  initialPosts?: Post[];
  // In a real app you'd pass a server action or SWR key
}

// Mock data — richer than original
const MOCK_POSTS: Post[] = [
  {
    id: "post-1",
    content:
      "The spire didn't reflect light; it seemed to consume it. As we approached the base, the air plummeted to freezing, and the whispers began threading directly into our minds like silver wire, promising answers we never knew we needed.",
    imageUrl: null,
    flowerPseudonym: "Midnight Dahlia",
    category: "story",
    tags: ["surreal", "mystery"],
    reactions: { like: 42 },
    comments: [
      { id: "c1", content: "This gave me chills. The imagery is so vivid.", flowerPseudonym: "Ghost Jasmine", createdAt: new Date(Date.now() - 3_600_000) },
      { id: "c2", content: "More please — I can't stop thinking about this.", flowerPseudonym: "Solar Sunflower", createdAt: new Date(Date.now() - 7_200_000) },
    ],
    createdAt: new Date(Date.now() - 14_400_000),
  },
  {
    id: "post-2",
    content:
      "I handed in work I didn't write. Not AI — I copied notes from a study group and passed them off as my own lab analysis. The grade meant I kept my scholarship. I've thought about it every day since.",
    imageUrl: null,
    flowerPseudonym: "Pale Anemone",
    category: "confession",
    tags: ["academia", "guilt"],
    reactions: { like: 138 },
    comments: [
      { id: "c3", content: "I did something similar in my first year. The weight never fully lifts.", flowerPseudonym: "Fog Lily", createdAt: new Date(Date.now() - 900_000) },
    ],
    createdAt: new Date(Date.now() - 28_800_000),
  },
  {
    id: "post-3",
    content:
      "We collectively pretend that 'networking' is something other than performing a version of yourself that you find slightly embarrassing, for people who are too busy to care. It always works anyway — which is somehow worse.",
    imageUrl: null,
    flowerPseudonym: "Iron Peony",
    category: "opinion",
    tags: ["work", "performance"],
    reactions: { like: 91 },
    comments: [],
    createdAt: new Date(Date.now() - 43_200_000),
  },
  {
    id: "post-4",
    content:
      "Cyberspace fractured at 03:00 cycle. Data streams poured out like glittering hyper-colored rain across the visual cortex of anyone plugged in. I reached out to catch the phantom code — it burned cold against my fingertips.",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80",
    flowerPseudonym: "Neon Rose",
    category: "story",
    tags: ["scifi", "digital"],
    reactions: { like: 89 },
    comments: [
      { id: "c4", content: "The neon aesthetic is perfect. I can taste the rain.", flowerPseudonym: "Crystal Orchid", createdAt: new Date(Date.now() - 1_800_000) },
    ],
    createdAt: new Date(Date.now() - 57_600_000),
  },
];

export function NewsFeed({ initialPosts }: NewsFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts ?? []);
  const [loading, setLoading] = useState(!initialPosts);
  const [hasMore, setHasMore] = useState(true);

  // Simulate initial load
  useEffect(() => {
    if (initialPosts) return;
    const t = setTimeout(() => {
      setPosts(MOCK_POSTS);
      setLoading(false);
    }, 900);
    return () => clearTimeout(t);
  }, [initialPosts]);

  // Simulate pagination
  const loadMore = React.useCallback(() => {
    if (!hasMore || loading) return;
    // In a real app: fetch next page from server
    setHasMore(false); // mock: only one page
  }, [hasMore, loading]);

  // ── Loading skeletons ────────────────────────────────────
  if (loading) {
    return (
      <div>
        <PostSkeleton delay={0} />
        <PostSkeleton delay={0.08} />
        <PostSkeleton delay={0.16} />
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────
  if (posts.length === 0) {
    return <EmptyState />;
  }

  // ── Feed ─────────────────────────────────────────────────
  return (
    <div>
      {posts.map((post, i) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" }}
        >
          <PostCard
            id={post.id}
            content={post.content}
            imageUrl={post.imageUrl}
            flowerPseudonym={post.flowerPseudonym}
            category={post.category}
            tags={post.tags}
            reactions={post.reactions}
            comments={post.comments}
            createdAt={post.createdAt}
          />
        </motion.div>
      ))}

      {/* Infinite scroll trigger */}
      {hasMore && <LoadMoreSentinel onVisible={loadMore} />}

      {/* End of feed marker */}
      {!hasMore && posts.length > 0 && (
        <div className="py-10 text-center">
          <span className="font-['Cormorant_Garamond'] italic text-[var(--text-muted)] text-sm">
            — end of feed —
          </span>
        </div>
      )}
    </div>
  );
}