"use server";

/**
 * ─── REPORTING ACTIONS ───
 * This module handles user-submitted reports for inappropriate content.
 * It also triggers auto-moderation workflows if a story exceeds the report threshold.
 */

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// Number of reports required before a post is automatically flagged for review
const REPORT_THRESHOLD = 3;

/**
 * Submits a report for a specific post.
 * Triggers an auto-moderation check after the report is logged.
 * 
 * @param postId - ID of the reported post
 * @param reason - Categorized reason for the report
 * @param details - Optional additional context provided by the user
 */
export async function submitReport(
  postId: string,
  reason: string,
  details?: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized: You must be logged in to report.");

  // Create an anonymous report record
  const report = await prisma.report.create({
    data: {
      postId,
      reason,
      details: details || null,
    },
  });

  // Run the background auto-moderation check
  await autoModeratePost(postId);

  return report;
}

/**
 * Checks if a post has exceeded the report threshold.
 * If exceeded, the post is flagged for administrator review.
 * 
 * @param postId - ID of the post to evaluate
 */
async function autoModeratePost(postId: string) {
  const reportCount = await prisma.report.count({
    where: { postId },
  });

  if (reportCount >= REPORT_THRESHOLD) {
    // Auto-flag the post to hide/restrict it pending review
    await prisma.post.update({
      where: { id: postId },
      data: { isFlagged: true },
    });

    // Log the automated moderation action
    await prisma.moderationAction.create({
      data: {
        postId,
        action: "flagged",
        reason: `Auto-flagged: ${reportCount} reports received (threshold: ${REPORT_THRESHOLD})`,
      },
    });
  }
}
