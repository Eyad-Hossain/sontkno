"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CreatePostModal } from "@/components/CreatePostModal";

interface HeaderAuthProps {
  session: {
    user?: { id?: string; email?: string | null; role?: string };
  } | null;
}

// Inline write icon — no lucide dependency for header icons
function WriteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2.5l2.5 2.5L5 15.5H2.5V13L13 2.5z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5L2 4v4.5c0 3 2.5 5.5 6 6 3.5-.5 6-3 6-6V4L8 1.5z" />
      <path d="M5.5 8l2 2 3-3" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" />
      <path d="M10.5 10.5L13.5 8l-3-2.5" />
      <line x1="6" y1="8" x2="13.5" y2="8" />
    </svg>
  );
}

export function HeaderAuth({ session }: HeaderAuthProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (session?.user) {
    return (
      <>
        <div className="flex items-center gap-1">
          <ThemeToggle />

          {/* Write button — botanical pill style */}
          <button
            onClick={() => setIsCreateOpen(true)}
            aria-label="Create post"
            className="
              flex items-center gap-2 ml-1
              pl-2.5 pr-3.5 py-1.5
              rounded-full border border-[var(--accent-moss)]/50
              bg-[var(--accent-moss)]/10 text-[var(--accent-moss)]
              hover:bg-[var(--accent-moss)]/20 hover:border-[var(--accent-moss)]
              transition-all duration-200
              font-['IBM_Plex_Mono'] text-xs font-medium tracking-tight
            "
          >
            <WriteIcon />
            <span className="hidden sm:inline">Write</span>
          </button>

          {/* Admin badge */}
          {session.user.role === "admin" && (
            <Link
              href="/admin"
              aria-label="Admin panel"
              className="
                flex items-center gap-1.5 ml-1
                px-2.5 py-1.5 rounded-full
                border border-[var(--accent-amber)]/40
                bg-[var(--accent-amber)]/8 text-[var(--accent-amber)]
                hover:bg-[var(--accent-amber)]/15
                transition-all duration-200
                font-['IBM_Plex_Mono'] text-xs font-medium tracking-tight
              "
            >
              <ShieldIcon />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* Sign out — minimal icon only */}
          <button
            onClick={() => signOut()}
            aria-label="Sign out"
            className="
              w-8 h-8 ml-0.5 flex items-center justify-center rounded-full
              text-[var(--text-muted)] hover:text-[var(--text-primary)]
              hover:bg-[var(--surface-raised)] border border-transparent
              hover:border-[var(--border)] transition-all duration-200
            "
          >
            <SignOutIcon />
          </button>
        </div>

        <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      </>
    );
  }

  // ── Unauthenticated ──
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <Link
        href="/login"
        className="
          px-3.5 py-1.5 rounded-full text-sm font-['IBM_Plex_Mono'] font-medium
          text-[var(--text-secondary)] border border-[var(--border)]
          hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]
          transition-all duration-200
        "
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className="
          px-3.5 py-1.5 rounded-full text-sm font-['IBM_Plex_Mono'] font-medium
          bg-[var(--accent-moss)] text-[var(--bg)]
          hover:opacity-90 transition-opacity
        "
      >
        Join Bloom
      </Link>
    </div>
  );
}