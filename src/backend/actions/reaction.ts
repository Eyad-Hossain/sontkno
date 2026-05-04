"use server";

/**
 * ─── REACTION ACTIONS ───
 * Handles adding reactions (likes, loves, etc.) to posts.
 * Uses atomic increments to update counts directly on the post document.
 */

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * ADDING A REACTION TO A POST
 * 
 * 1. Checks for user session.
 * 2. Creates a separate reaction record for tracking.
 * 3. Atomically increments the specific count in the Post document.
 */
export async function addReaction(postId: string, reactionType: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized: Please log in to react.");

  // 1. Create the reaction record in the reactions collection
  const reaction = await prisma.reaction.create({
    data: {
      type: reactionType,
      postId,
    },
  });

  // 2. Atomically update the denormalized counts on the Post
  // We use [reactionType] to dynamically increment the correct field (e.g. 'like' or 'love')
  await prisma.post.update({
    where: { id: postId },
    data: {
      reactionCounts: {
        update: {
          [reactionType]: { increment: 1 }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
    }
  });

  return reaction;
}

/**
 * GETTING REACTION COUNTS FOR A POST
 * Fast read from the denormalized field on the post document.
 */
export async function getReactionCounts(postId: string): Promise<Record<string, number>> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { reactionCounts: true }
  });

  // Return counts or an empty object if the post isn't found
  if (!post || !post.reactionCounts) {
    return {
      like: 0,
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0
    };
  }

  return post.reactionCounts as unknown as Record<string, number>;
}
