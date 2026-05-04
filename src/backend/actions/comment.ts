"use server";

/**
 * ─── COMMENT ACTIONS ───
 * This module handles the creation of comments on stories/confessions.
 * It enforces Bloom's privacy-first approach by using random flower pseudonyms.
 */

import { prisma } from "@/lib/db";
import { getRandomFlower } from "@/lib/flowers";
import { auth } from "@/lib/auth";

/**
 * Creates a new comment under a specific post.
 * Assigns an anonymous flower pseudonym to the commenter.
 * 
 * @param postId - The ID of the post being commented on.
 * @param content - The text content of the comment.
 */
export async function createComment(postId: string, content: string) {
  // Validate session for gating purposes (identity is never linked to the comment)
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized: You must be logged in to comment.");

  // Each comment receives a unique, random flower pseudonym
  const flowerPseudonym = getRandomFlower();

  // Persist the comment to the database
  const comment = await prisma.comment.create({
    data: {
      content,
      flowerPseudonym,
      postId,
    },
    select: {
      id: true,
      content: true,
      flowerPseudonym: true,
      createdAt: true,
    },
  });

  return comment;
}
