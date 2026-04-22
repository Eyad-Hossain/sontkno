"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// ─── Existing Functions ───

export async function getFlaggedPosts() {
  const session = await auth();
  if (
    !session?.user ||
    (session.user as Record<string, unknown>).role !== "admin"
  ) {
    throw new Error("Unauthorized");
  }

  return prisma.post.findMany({
    where: { isFlagged: true, isRemoved: false },
    include: {
      reports: {
        select: { id: true, reason: true, details: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { reports: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function removePost(postId: string) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user as Record<string, unknown>).role !== "admin"
  ) {
    throw new Error("Unauthorized");
  }

  await prisma.post.update({
    where: { id: postId },
    data: { isRemoved: true },
  });

  await prisma.moderationAction.create({
    data: {
      postId,
      action: "removed",
      reason: "Removed by admin after review",
    },
  });
}

// ─── NEW: Pre-Publication Moderation Queue ───

/**
 * Get all posts in moderation queue
 */
export async function getModerationQueue(limit: number = 20, offset: number = 0) {
  const session = await auth();

  if (!session?.user || (session.user as Record<string, unknown>).role !== "admin") {
    throw new Error("Unauthorized");
  }

  const queue = await prisma.moderationQueue.findMany({
    where: { status: "pending" },
    include: {
      post: {
        select: {
          id: true,
          content: true,
          category: true,
          riskScore: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  const total = await prisma.moderationQueue.count({
    where: { status: "pending" },
  });

  return { queue, total };
}

/**
 * Approve a post from moderation queue
 */
export async function approveModerationPost(postId: string) {
  const session = await auth();

  if (!session?.user || (session.user as Record<string, unknown>).role !== "admin") {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) throw new Error("User not found");

  // Update post to published
  await prisma.post.update({
    where: { id: postId },
    data: {
      publicationStatus: "published",
    },
  });

  // Update queue
  await prisma.moderationQueue.update({
    where: { postId },
    data: {
      status: "approved",
      reviewedAt: new Date(),
      reviewedBy: user.id,
    },
  });

  return { success: true, message: "Post approved and published" };
}

/**
 * Reject a post from moderation queue
 */
export async function rejectModerationPost(postId: string, reason: string) {
  const session = await auth();

  if (!session?.user || (session.user as Record<string, unknown>).role !== "admin") {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) throw new Error("User not found");

  // Update post status
  await prisma.post.update({
    where: { id: postId },
    data: {
      publicationStatus: "rejected",
      isRemoved: true,
      moderationReason: reason,
    },
  });

  // Update queue
  await prisma.moderationQueue.update({
    where: { postId },
    data: {
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy: user.id,
      moderationReason: reason,
    },
  });

  return { success: true, message: "Post rejected" };
}

/**
 * Get moderation statistics
 */
export async function getModerationStats() {
  const session = await auth();

  if (!session?.user || (session.user as Record<string, unknown>).role !== "admin") {
    throw new Error("Unauthorized");
  }

  const totalPosts = await prisma.post.count();
  const pendingReview = await prisma.moderationQueue.count({
    where: { status: "pending" },
  });
  const flaggedPosts = await prisma.post.count({
    where: { isFlagged: true },
  });
  const removedPosts = await prisma.post.count({
    where: { isRemoved: true },
  });

  // Get average risk score
  const avgRiskResult = await prisma.post.aggregate({
    _avg: {
      riskScore: true,
    },
  });

  return {
    totalPosts,
    pendingReview,
    flaggedPosts,
    removedPosts,
    averageRiskScore: Math.round((avgRiskResult._avg.riskScore || 0) * 10) / 10,
  };
}

export async function dismissReports(postId: string) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user as Record<string, unknown>).role !== "admin"
  ) {
    throw new Error("Unauthorized");
  }

  await prisma.post.update({
    where: { id: postId },
    data: { isFlagged: false },
  });

  await prisma.moderationAction.create({
    data: {
      postId,
      action: "dismissed",
      reason: "Reports dismissed by admin",
    },
  });
}
