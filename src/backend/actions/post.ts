"use server";

/**
 * ─── POST ACTIONS ───
 * This file contains all server-side logic for creating and fetching posts.
 * It uses Prisma to interact with the MongoDB database.
 */

import { prisma } from "@/lib/db";
import { getRandomFlower } from "@/lib/flowers";
import { auth } from "@/lib/auth";
import { moderatePost } from "@/lib/moderationService";
import { MODERATION_CONFIG, PostCategory } from "@/lib/moderationConfig";
import { revalidatePath } from "next/cache";

/**
 * Response interface for post creation
 */
export interface CreatePostResponse {
  success: boolean;
  postId?: string;
  publicationStatus: "published" | "under_review" | "rejected";
  riskScore: number;
  message: string;
}

/**
 * CREATING A NEW POST
 * 
 * 1. Validates the user session.
 * 2. Runs the content through a moderation filter.
 * 3. Assigns an anonymous flower pseudonym.
 * 4. Saves the post to MongoDB with initial reaction counts.
 * 5. Queues risky posts for admin review.
 */
export async function createPost(
  content: string,
  category: string,
  tags: string[] = [],
  groupId: string,
  imageUrl?: string
): Promise<CreatePostResponse> {
  // Check if user is logged in
  const session = await auth();
  if (!session?.user) {
    throw new Error("You must be logged in to post.");
  }

  // Validate post category
  if (!MODERATION_CONFIG.CATEGORIES.includes(category as PostCategory)) {
    throw new Error("Invalid post category selected.");
  }

  // Validate content length (1 to 2000 characters)
  if (!content.trim() || content.length > 2000) {
    throw new Error("Post content must be between 1 and 2000 characters.");
  }

  try {
    // Run automated moderation checks
    const moderation = moderatePost(content, category, tags);
    
    // Assign a unique flower name for anonymity
    const flowerPseudonym = getRandomFlower();

    // Determine status based on moderation risk score
    let publicationStatus: "published" | "under_review" | "rejected" = "published";
    if (moderation.riskScore >= MODERATION_CONFIG.BLOCK_THRESHOLD) {
      publicationStatus = "rejected";
    } else if (moderation.riskScore >= MODERATION_CONFIG.SOFT_FLAG_THRESHOLD) {
      publicationStatus = "under_review";
    }

    // Get the target group (defaults to "General" if not specified)
    const activeGroupId = groupId === "default" 
      ? (await prisma.group.findFirst({ select: { id: true } }))?.id || (await prisma.group.create({ data: { name: "General" } })).id
      : groupId;

    // Save the post to the database
    const newPost = await prisma.post.create({
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
        // Initialize reaction counts as zeros
        reactionCounts: {
          set: {
            like: 0,
            love: 0,
            haha: 0,
            wow: 0,
            sad: 0,
            angry: 0
          }
        },
      },
    });

    // If the post is risky or rejected, add it to the moderation queue for manual review
    if (publicationStatus === "under_review" || publicationStatus === "rejected") {
      await prisma.moderationQueue.create({
        data: {
          postId: newPost.id,
          content,
          category,
          tags: tags,
          riskScore: moderation.riskScore,
          moderationReason: moderation.reasons.join("; "),
          status: "pending",
        },
      });
    }

    // Prepare user-friendly feedback message
    let feedbackMessage = "Post published successfully!";
    if (publicationStatus === "under_review") {
      feedbackMessage = "Your post is under review and will be visible once approved.";
    } else if (publicationStatus === "rejected") {
      feedbackMessage = "Post rejected due to privacy concerns (e.g. personal info). Please edit and try again.";
    }

    // Refresh the page data to show the new post
    revalidatePath("/");

    return {
      success: true,
      postId: newPost.id,
      publicationStatus,
      riskScore: moderation.riskScore,
      message: feedbackMessage,
    };
  } catch (error) {
    console.error("Error creating post:", error);
    throw new Error("Failed to create post. Please try again later.");
  }
}

/**
 * FETCHING POSTS FOR THE FEED
 * 
 * Fetches all published posts, including their comments.
 * Reactions are pulled from the denormalized 'reactionCounts' field for speed.
 */
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
        select: {
          id: true,
          content: true,
          flowerPseudonym: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Format the data for the frontend
  return posts.map(post => ({
    ...post,
    reactions: post.reactionCounts || {
      like: 0,
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0
    },
  }));
}

/**
 * FETCHING A SINGLE POST BY ID
 */
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

  return { 
    ...post, 
    reactions: post.reactionCounts || {
      like: 0,
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0
    }
  };
}
