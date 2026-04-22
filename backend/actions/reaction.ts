"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function addReaction(postId: string, type: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Simply insert a reaction row. No user ID attached.
  const reaction = await prisma.reaction.create({
    data: {
      type,
      postId,
    },
  });

  return reaction;
}

export async function getReactionCounts(
  postId: string
): Promise<Record<string, number>> {
  const counts = await prisma.reaction.groupBy({
    by: ["type"],
    where: { postId },
    _count: { type: true },
  });

  const result: Record<string, number> = {};
  counts.forEach((c) => {
    result[c.type] = c._count.type;
  });

  return result;
}
