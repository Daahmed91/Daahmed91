"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  content: string;
  contentType?: string;
}

export default function CopyPreview({ content, contentType }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse numbered list items
  const lines = content.split("\n").filter((l) => l.trim());

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
        <span className="text-xs text-purple-400 font-medium">
          {contentType || "Copy"}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy all"}
        </button>
      </div>
      <div className="p-4 space-y-3">
        {lines.map((line, i) => (
          <div
            key={i}
            className="group relative p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <p className="text-sm text-gray-200 leading-relaxed">{line}</p>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(line);
              }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/20"
            >
              <Copy size={10} className="text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
