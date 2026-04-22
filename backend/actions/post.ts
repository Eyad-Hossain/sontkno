"use server";

import { prisma } from "@/lib/db";
import { getRandomFlower } from "@/lib/flowers";
import { auth } from "@/lib/auth";
import { moderatePost } from "@/lib/moderationService";
import { MODERATION_CONFIG, PostCategory } from "@/lib/moderationConfig";
import { revalidatePath } from "next/cache";

export interface CreatePostResponse {
  success: boolean;
  postId?: string;
  publicationStatus: "published" | "under_review" | "rejected";
  riskScore: number;
  message: string;
}

/**
 * Creates a new post with full moderation workflow
 * 
 * Flow:
 * 1. Validate user session
 * 2. Run moderation checks
 * 3. If safe (score < 40) → publish immediately
 * 4. If risky (40-70) → publish but queue for review
 * 5. If blocked (70+) → reject and queue for manual review
 */
export async function createPost(
  content: string,
  category: string,
  tags: string[] = [],
  groupId: string,
  imageUrl?: string
): Promise<CreatePostResponse> {
  // Validate session
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Validate category
  if (!MODERATION_CONFIG.CATEGORIES.includes(category as PostCategory)) {
    throw new Error("Invalid category");
  }

  // Validate content length
  if (!content.trim() || content.length > 2000) {
    throw new Error("Post must be between 1 and 2000 characters");
  }

  try {
    // Run moderation checks
    const moderation = moderatePost(content, category, tags);
    const flowerPseudonym = getRandomFlower();

    // Determine publication status based on risk score
    let publicationStatus: "published" | "under_review" | "rejected" = "published";
    if (moderation.riskScore >= MODERATION_CONFIG.BLOCK_THRESHOLD) {
      publicationStatus = "rejected";
    } else if (moderation.riskScore >= MODERATION_CONFIG.SOFT_FLAG_THRESHOLD) {
      publicationStatus = "under_review";
    }

    // Ensure group exists (or use a default)
    const activeGroupId = groupId === "default" 
      ? (await prisma.group.findFirst({ select: { id: true } }))?.id || (await prisma.group.create({ data: { name: "General" } })).id
      : groupId;

    // Create the post
    const post = await prisma.post.create({
      data: {
        content,
        category,
        tags: moderation.riskScore >= MODERATION_CONFIG.SOFT_FLAG_THRESHOLD ? [] : tags,
        imageUrl: imageUrl || null,
        flowerPseudonym,
        groupId: activeGroupId,
        publicationStatus,
        riskScore: moderation.riskScore,
        moderationReason: moderation.reasons.join("; "),
      },
    });

    // Queue for moderation if not safe
    if (publicationStatus === "under_review" || publicationStatus === "rejected") {
      await prisma.moderationQueue.create({
        data: {
          postId: post.id,
          content,
          category,
          tags: tags,
          riskScore: moderation.riskScore,
          moderationReason: moderation.reasons.join("; "),
          status: publicationStatus === "rejected" ? "pending" : "pending",
        },
      });
    }

    // Return response
    let message = "Post published successfully!";
    if (publicationStatus === "under_review") {
      message = "Your post has been submitted for review. It will be visible once approved.";
    } else if (publicationStatus === "rejected") {
      message = "Your post was not published as it contains identifying information. Please remove names, emails, or phone numbers and try again.";
    }

    // Invalidate the cache to show the new post
    revalidatePath("/");

    return {
      success: true,
      postId: post.id,
      publicationStatus,
      riskScore: moderation.riskScore,
      message,
    };
  } catch (error) {
    console.error("Post creation error:", error);
    throw error;
  }
}

export async function getPosts(groupId?: string) {
  const posts = await prisma.post.findMany({
    where: {
      AND: [
        groupId ? { groupId } : {},
        { publicationStatus: "published" }
      ]
    },
    include: {
      comments: {
        orderBy: { createdAt: "desc" },
        // Only select anonymous-safe fields
        select: {
          id: true,
          content: true,
          flowerPseudonym: true,
          createdAt: true,
        },
      },
      _count: {
        select: { reactions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Aggregate reaction counts by type for each post
  const postsWithReactions = await Promise.all(
    posts.map(async (post) => {
      const reactionCounts = await prisma.reaction.groupBy({
        by: ["type"],
        where: { postId: post.id },
        _count: { type: true },
      });

      const reactions: Record<string, number> = {};
      reactionCounts.forEach((r) => {
        reactions[r.type] = r._count.type;
      });

      return {
        ...post,
        reactions,
      };
    })
  );

  return postsWithReactions;
}

export async function getPostById(postId: string) {
  const post = await prisma.post.findUnique({
    where: { 
      id: postId,
      publicationStatus: "published"
    },
    include: {
      comments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          flowerPseudonym: true,
          createdAt: true,
        },
      },
    },
  });

  if (!post) return null;

  const reactionCounts = await prisma.reaction.groupBy({
    by: ["type"],
    where: { postId: post.id },
    _count: { type: true },
  });

  const reactions: Record<string, number> = {};
  reactionCounts.forEach((r) => {
    reactions[r.type] = r._count.type;
  });

  return { ...post, reactions };
}
