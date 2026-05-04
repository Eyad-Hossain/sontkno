/**
 * ─── BLOOM MAIN ENTRY POINT ───
 * This is the root page for the Bloom platform.
 * It authenticates the user session and renders the primary StoryViewerCanvas.
 */

import { auth } from "@/lib/auth";
import { StoryViewerCanvas } from "@/components/StoryViewerCanvas";

export default async function Home() {
  // Fetch session server-side to pass initial auth state to the canvas
  const session = await auth();
  
  return (
    <main className="min-h-screen bg-background transition-colors overflow-x-hidden">
      <StoryViewerCanvas session={session} />
    </main>
  );
}