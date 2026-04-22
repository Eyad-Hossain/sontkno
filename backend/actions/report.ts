"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const REPORT_THRESHOLD = 3; // Auto-flag after this many reports

export async function submitReport(
  postId: string,
  reason: string,
  details?: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Create the anonymous report
  const report = await prisma.report.create({
    data: {
      postId,
      reason,
      details: details || null,
    },
  });

  // Run the moderation agent check
  await autoModeratePost(postId);

  return report;
}

async function autoModeratePost(postId: string) {
  const reportCount = await prisma.report.count({
    where: { postId },
  });

  if (reportCount >= REPORT_THRESHOLD) {
    // Auto-flag the post
    await prisma.post.update({
      where: { id: postId },
      data: { isFlagged: true },
    });

    // Log the moderation action
    await prisma.moderationAction.create({
      data: {
        postId,
        action: "flagged",
        reason: `Auto-flagged: ${reportCount} reports received (threshold: ${REPORT_THRESHOLD})`,
      },
    });
  }
}
