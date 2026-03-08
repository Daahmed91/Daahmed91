"use client";
import Link from "next/link";
import { Palette } from "lucide-react";
import ChatInterface from "@/components/chat/ChatInterface";
import ImageModelSelector from "@/components/settings/ImageModelSelector";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-[var(--background)]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-sm">
            ✦
          </div>
          <span className="font-semibold text-sm">BrandMind</span>
          <span className="text-xs text-gray-600 hidden sm:inline">AI Designer</span>
        </div>

        <div className="flex items-center gap-2">
          <ImageModelSelector />
          <Link
            href="/brand"
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-[var(--border)] text-gray-400 hover:text-white hover:border-purple-500/50 hover:bg-purple-500/10 transition-colors"
          >
            <Palette size={13} />
            Brand Setup
          </Link>
        </div>
      </header>

      {/* Chat */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-3xl mx-auto h-full">
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}
