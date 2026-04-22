import { NewsFeed } from "@/components/NewsFeed";
import { HeaderAuth } from "@/components/HeaderAuth";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black">
      {/* Sticky Top Navigation Bar */}
      <nav className="fixed top-0 inset-x-0 h-14 bg-white dark:bg-black border-b border-slate-300 dark:border-white/10 z-50 flex items-center">
        <div className="w-full max-w-[470px] mx-auto px-4 flex items-center justify-between">
          <h1 className="text-xl font-serif italic font-bold text-slate-900 dark:text-white">
            Bloom
          </h1>
          <HeaderAuth session={session} />
        </div>
      </nav>

      {/* Main Feed Container */}
      <div className="pt-14 w-full max-w-[470px] mx-auto pb-20">
        <NewsFeed />
      </div>
    </main>
  );
}