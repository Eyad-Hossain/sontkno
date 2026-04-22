"use server";

import { prisma } from "@/lib/db";
import { getRandomFlower } from "@/lib/flowers";
import { auth } from "@/lib/auth";

export async function createComment(postId: string, content: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Each comment gets its own random flower pseudonym
  const flowerPseudonym = getRandomFlower();

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
